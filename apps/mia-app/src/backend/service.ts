import * as models from './models'
export * as models from './models'

import { database } from './db'
import { api_t, OpenAIClient } from '../api'
import { Collection, Model, Q } from '@nozbe/watermelondb'
import { IStreamHandler, Result } from '../types'

// Consts
export const Constants = {
  SettingsKey: '_settings',
  DefaultUserId: '_user',

  NopBotId: '_nop',
  NopBotTemplateId: '_nop',
  PredefinedBotIds: new Set(['_chatgpt', '_dalle', '_nop']),
  PredefinedBotTemplateIds: new Set(['_openai-chat', '_openai-image', '_nop']),

  BotTemplateOpenaiChat: '_openai-chat',
  BotTemplateOpenaiImage: '_openai-image',
} as const

class NotFoundError extends Error {}

export function getDefaultSettings(): models.Settings {
  return {
    apiSettings: {
      openaiApiEndpoint: 'https://api.openai.com',
      openaiApiKey: '',
    },
    chatDefaultSettings: {
      defaultBotName: 'chatgpt',
    },
  }
}

export type GetLoading<T> = {
  loading: boolean
  error?: Error | undefined
  value?: T | undefined
}

export type ListFilters = {
  orderBy?: string
  order?: 'asc' | 'desc'
  pageSize?: number
  currentPage?: number // starts from 1
}

export function ListFiltersToString(f: ListFilters) {
  return JSON.stringify(f)
}

export function ListFiltersFromString(s: string) {
  return JSON.parse(s) as ListFilters
}

export function createDefaultListPage<T>(filters: ListFilters): ListPage<T> {
  const { currentPage = 1, pageSize = 20 } = filters

  return {
    currentPage,
    pageSize,
    total: 0,
    data: [],
    loading: true,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type ListPage<T> = {
  data: T[]
  total: number
  currentPage: number
  pageSize: number
  loading: boolean
}

import type { Character, Chat, ChatMessageMeta, ChatMeta } from './models'
import { IBotService, MessageReply } from './bots'
import { extractBotNamePrefix } from '../utils'
import { createBotService } from './bots/factory'
export type { Character, Chat, ChatMessageMeta as ChatMessage, ChatMeta }

interface MessageStreamCallbacks {
  onMessageUpdated: (messageId: string) => void
  onChatUpdated: (chatId: string) => void
}

function convertToOpenAIMessage(message: models.ChatMessage): {
  content: string
  role: api_t.ChatCompletionMessage['role']
} {
  const convertRole = (
    senderType: models.ChatMessage['senderType']
  ): api_t.ChatCompletionMessage['role'] => {
    if (senderType === 'bot') {
      return 'assistant'
    } else if (senderType === 'user') {
      return 'user'
    } else {
      return 'system'
    }
  }

  return {
    content: message.content,
    role: convertRole(message.senderType),
  }
}

type BotCache = {
  bot: models.Bot
  botService: IBotService
}

// Internal memory state, used for cache or stream connections
class MiaServiceState {
  // internal states (in-memory)
  sendMessageTaskHandler = new Map<string, IStreamHandler<MessageReply>>()
  botNameCache = new Map<string, models.Bot>()
  botIdCache = new Map<string, models.Bot>()

  constructor(private miaService: MiaService) {}

  async getBot(p: { id?: string; name?: string }): Promise<Result<models.Bot>> {
    // try to get bot by id
    if (p.id) {
      let bot = this.botIdCache.get(p.id)
      if (!bot) {
        const botRes = await this.miaService.getBotById(p.id)
        if (!botRes.ok) {
          return botRes
        }

        bot = botRes.value
        this.botIdCache.set(p.id, bot)
      }
      return { ok: true, value: bot }
    }

    // try to get bot by name
    if (p.name) {
      let bot = this.botNameCache.get(p.name)
      if (!bot) {
        const botRes = await this.miaService.getBotByName(p.name)
        if (!botRes.ok) {
          return botRes
        }

        bot = botRes.value
        this.botNameCache.set(p.name, bot)
      }
      return { ok: true, value: bot }
    }

    return {
      ok: false,
      error: new Error(`bot not found: ${JSON.stringify(p)}`),
    }
  }

  async refreshBot(p: { id?: string; name?: string }): Promise<void> {
    if (p.name) {
      this.botNameCache.delete(p.name)
    }

    if (p.id) {
      this.botIdCache.delete(p.id)
    }
  }
}

export class MiaService {
  private chatTable = database.get<models.ChatModel>('chats')
  private characterTable = database.get<models.CharacterModel>('characters')
  private messageTable = database.get<models.ChatMessageModel>('chat_messages')
  private userTable = database.get<models.UserModel>('users')
  private botTable = database.get<models.BotModel>('bots')
  private botTemplateTable =
    database.get<models.BotTemplateModel>('bot_templates')

  private settings: models.Settings
  private openaiClient: OpenAIClient

  private state: MiaServiceState = new MiaServiceState(this)

  constructor() {
    this.settings = getDefaultSettings()
    this.openaiClient = new OpenAIClient({
      endpoint: '',
      apiKey: '',
    })
  }

  // Settings
  updateSettings(settings: models.Settings) {
    const apiSettings = settings.apiSettings
    this.settings = settings
    this.openaiClient = new OpenAIClient({
      endpoint: apiSettings.openaiApiEndpoint,
      apiKey: apiSettings.openaiApiKey,
    })
  }

  // Users
  async getCurrentUser(): Promise<Result<models.User>> {
    const userRes = await getByIdFromTable(
      this.userTable,
      Constants.DefaultUserId
    )

    if (!userRes.ok) {
      return userRes
    }

    return {
      ok: true,
      value: {
        ...userRes.value.getRawObject(),
      },
    }
  }

  async updateCurrentUser(p: {
    displayName: string
    avatarUrl: string
  }): Promise<void> {
    await database.write(async () => {
      const user = await getByIdFromTable(
        this.userTable,
        Constants.DefaultUserId
      )
      if (!user.ok) {
        console.error(user.error)
        return
      }

      user.value.update((b) => {
        b.displayName = p.displayName
        b.avatarUrl = p.avatarUrl
      })
    })
  }

  // Bots

  async checkBotNameValid(p: {
    name: string
    curId?: string
  }): Promise<Result<boolean>> {
    const quries: Q.Clause[] = [
      Q.where('name', p.name),
      Q.where('deleted_at', null),
    ]

    if (p.curId) {
      quries.push(Q.where('id', Q.notEq(p.curId)))
    }

    const count = await this.botTable.query(...quries).fetchCount()
    if (count !== 0) {
      return {
        ok: false,
        error: new Error('Bot name is already taken'),
      }
    }
    return {
      ok: true,
      value: true,
    }
  }

  async listBots(filters: ListFilters): Promise<ListPage<models.BotMeta>> {
    const queryFilters: Q.Clause[] = [Q.where('deleted_at', null)]

    const total = await this.botTable.query(...queryFilters).fetchCount()

    const { pageSize = 20, currentPage = 1 } = filters

    queryFilters.push(
      Q.where('id', Q.notEq(Constants.NopBotId)),
      Q.sortBy(filters.orderBy || 'created_at', filters.order),
      Q.take(pageSize),
      Q.skip(pageSize * (currentPage - 1))
    )

    const data = await this.botTable.query(...queryFilters).fetch()

    return {
      data,
      currentPage,
      pageSize,
      total,
      loading: false,
    }
  }

  async createBot(p: {
    name: string
    displayName?: string
    description?: string
    avatarUrl?: string
    botTemplateId: string
    botTemplateParams: models.BotTemplateParams
  }): Promise<Result<models.BotMeta>> {
    return database.write(async () => {
      // Check if bot with same name exists
      const count = await this.botTable
        .query(Q.where('name', p.name))
        .fetchCount()
      if (count > 0) {
        return {
          ok: false,
          error: new Error('Bot with same name already exists'),
        }
      }

      const bot = await this.botTable.create((c) => {
        c.name = p.name
        c.displayName = p.displayName || p.name
        c.description = p.description || ''
        c.avatarUrl = p.avatarUrl || ''
        c.botTemplate.id = p.botTemplateId
        c.botTemplateParams = p.botTemplateParams
      })

      return {
        ok: true,
        value: bot,
      }
    })
  }

  async updateBot(
    botId: string,
    p: {
      name?: string
      displayName?: string
      description?: string
      avatarUrl?: string
      botTemplateParams?: models.BotTemplateParams
    }
  ): Promise<Result<boolean>> {
    if (Constants.PredefinedBotIds.has(botId)) {
      return { ok: false, error: new Error('Cannot update predefined bot') }
    }

    const res = await database.write(async () => {
      const botRes = await getByIdFromTable(this.botTable, botId)
      if (!botRes.ok) {
        return botRes
      }
      const bot = botRes.value
      this.state.refreshBot({
        id: bot.id,
        name: bot.name,
      })

      if (p.name) {
        const nameRes = await this.checkBotNameValid({
          name: p.name,
          curId: botId,
        })
        if (!nameRes.ok) {
          return nameRes
        }
      }

      bot.update((b) => {
        if (p.name) {
          b.name = p.name
        }
        if (p.displayName) {
          b.displayName = p.displayName
        }
        if (p.avatarUrl) {
          b.avatarUrl = p.avatarUrl
        }
        if (p.description) {
          b.description = p.description
        }
        if (p.botTemplateParams) {
          b.botTemplateParams = p.botTemplateParams
        }
      })

      return {
        ok: true,
        value: true,
      } as Result<boolean>
    })

    this.state.refreshBot({
      id: botId,
    })

    if (p.name) {
      this.state.refreshBot({
        name: p.name,
      })
    }

    return res
  }

  async getBotById(id: string): Promise<Result<models.Bot>> {
    const botRes = await getByIdFromTable(this.botTable, id)
    if (!botRes.ok) {
      return botRes
    }

    const bot = botRes.value
    // fetch bot template
    const botTemplate = await bot.botTemplate.fetch()

    return {
      ok: true,
      value: {
        ...bot.getRawObject(),
        botTemplate: botTemplate.getRawObject(),
      },
    }
  }

  async getBotByName(name: string): Promise<Result<models.Bot>> {
    const botRes = await getOneFromTable(
      this.botTable,
      Q.where('name', name),
      Q.where('deleted_at', null)
    )
    if (!botRes.ok) {
      return botRes
    }

    const bot = botRes.value
    // fetch bot template
    const botTemplate = await bot.botTemplate.fetch()

    return {
      ok: true,
      value: {
        ...bot.getRawObject(),
        botTemplate: botTemplate.getRawObject(),
      },
    }
  }

  // Bot templates
  async listBotTemplates(
    filters: ListFilters
  ): Promise<ListPage<models.BotTemplate>> {
    const queryFilters: Q.Clause[] = [Q.where('deleted_at', null)]

    const total = await this.botTemplateTable
      .query(...queryFilters)
      .fetchCount()

    const { pageSize = 20, currentPage = 1 } = filters

    queryFilters.push(
      Q.where('id', Q.notEq(Constants.NopBotTemplateId)),
      Q.sortBy(filters.orderBy || 'created_at', filters.order),
      Q.take(pageSize),
      Q.skip(pageSize * (currentPage - 1))
    )

    const data = await this.botTemplateTable.query(...queryFilters).fetch()

    return {
      data,
      currentPage,
      pageSize,
      total,
      loading: false,
    }
  }

  // Chats

  async listChats(filters: ListFilters): Promise<ListPage<ChatMeta>> {
    const queryFilters: Q.Clause[] = [Q.where('deleted_at', null)]

    const total = await this.chatTable.query(...queryFilters).fetchCount()

    const { pageSize = 20, currentPage = 1 } = filters

    queryFilters.push(
      Q.sortBy(filters.orderBy || 'created_at', filters.order),
      Q.take(pageSize),
      Q.skip(pageSize * (currentPage - 1))
    )

    const data = await this.chatTable.query(...queryFilters).fetch()

    return {
      data: data.map((c) => c.getRawObject()),
      currentPage,
      pageSize,
      total,
      loading: false,
    }
  }

  async getChatById(id: string): Promise<Result<Chat>> {
    const chatRes = await getByIdFromTable(this.chatTable, id)
    if (!chatRes.ok) {
      return chatRes
    }

    const chat = chatRes.value
    const messages = await chat.messages
      .extend(Q.where('deleted_at', null), Q.sortBy('created_at', 'asc'))
      .fetch()

    // TODO: optimize sender fetch logic, handle error
    const messageWithSenders: models.ChatMessage[] = await Promise.all(
      messages.map(async (m) => {
        const sender = await this.getMessageSenderById(m.senderType, m.senderId)
        return {
          ...m.getRawObject(),
          sender: sender.value,
        }
      })
    )

    return {
      ok: true,
      value: {
        ...chat.getRawObject(),
        messages: messageWithSenders,
      },
    }
  }

  async createChat(p: { name?: string }): Promise<ChatMeta> {
    let { name } = p

    if (!name) {
      const chats = await this.chatTable
        .query(
          Q.where('name', Q.like('New Chat %')),
          Q.where('deleted_at', null),
          Q.sortBy('created_at', 'desc'),
          Q.take(1)
        )
        .fetch()

      const lastName = chats[0]?.name || 'New Chat 0'
      try {
        const lastNumber = parseInt(lastName.split(' ')[2], 10)
        name = `New Chat ${lastNumber + 1}`
      } catch (e) {
        name = 'New Chat 1'
      }
    }

    const chat = await database.write(async () => {
      return this.chatTable.create((c) => {
        c.name = name || 'New Chat'
      })
    })

    return chat.getRawObject()
  }

  async updateChat(id: string, p: { name?: string }): Promise<ChatMeta> {
    const chat = await database.write(async () => {
      const chat = await this.chatTable.find(id)
      return await chat.update((c) => {
        if (p.name) {
          c.name = p.name
        }
      })
    })
    return chat.getRawObject()
  }

  async deleteChat(id: string): Promise<void> {
    await database.write(async () => {
      const chat = await this.chatTable.find(id)
      await chat.update((c) => {
        c.deletedAt = new Date()
      })
    })
  }

  // messages

  async updateMessage(
    id: string,
    p: { content?: string; toggleIgnore?: boolean; toggleCollapse?: boolean }
  ): Promise<void> {
    console.debug(`call updateMessage(${id})`, p)
    await database.write(async () => {
      const message = await this.messageTable.find(id)
      return await message.update((b) => {
        if (p.content != null) {
          b.content = p.content
        }

        if (p.toggleIgnore) {
          if (b.ignoreAt) {
            b.ignoreAt = undefined
          } else {
            b.ignoreAt = new Date()
          }
        }

        if (p.toggleCollapse) {
          if (b.ui.collapsed) {
            b.ui = { ...b.ui, collapsed: false }
          } else {
            b.ui = { ...b.ui, collapsed: true }
          }
        }
      })
    })
  }

  async deleteMessage(id: string) {
    await database.write(async () => {
      const message = await this.messageTable.find(id)
      return await message.update((b) => {
        b.deletedAt = new Date()
      })
    })
  }

  async getMessageById(id: string): Promise<models.ChatMessage> {
    const message = await this.messageTable.find(id)
    const sender = await this.getMessageSenderById(
      message.senderType,
      message.senderId
    )
    return {
      ...message.getRawObject(),
      sender: sender.value,
    }
  }

  async getMessageSenderById(
    senderType: 'bot' | 'user',
    senderId: string
  ): Promise<Result<models.MessageSender>> {
    if (senderType === 'bot') {
      const res = await getByIdFromTable(this.botTable, senderId)
      if (!res.ok) {
        return res
      }
      const value = res.value
      return {
        ok: true,
        value: {
          ...value.getRawObject(),
          type: senderType,
          displayName: value.displayName || value.name,
        },
      }
    }

    // user
    const res = await getByIdFromTable(this.userTable, senderId)
    if (!res.ok) {
      return res
    }

    const value = res.value
    return {
      ok: true,
      value: {
        ...value.getRawObject(),
        type: senderType,
        id: senderId,
        displayName: value.displayName || value.name,
      },
    }
  }

  async stopGenerateMessage(p: { messageId: string }) {
    // TODO: stop stream job
    await database.write(async () => {
      const message = await this.messageTable.find(p.messageId)
      if (!message) {
        return
      }

      message.update((m) => {
        if (m.loadingStatus != 'error') {
          m.loadingStatus = 'ok'
        }
      })
    })
  }

  async regenerateMessage(
    p: {
      messageId: string
      chatId: string
    } & MessageStreamCallbacks
  ): Promise<Result<boolean>> {
    const chat = await this.chatTable.find(p.chatId)
    if (!chat) {
      return { ok: false, error: new Error('Chat not found') }
    }

    const curMessage = await this.messageTable.find(p.messageId)
    if (!curMessage) {
      return { ok: false, error: new Error('Message not found') }
    }

    if (curMessage.senderType === 'bot') {
      return this._regenerateBotMessage({
        chat,
        replyMessage: curMessage,
        ...p,
      })
    }

    // user

    // find next message
    const nextMessages = await this._queryFilteredHistory(
      chat,
      Q.where('created_at', Q.gt(curMessage.createdAt.getTime())),
      Q.take(1)
    )

    // no next message, create new message
    if (nextMessages.length === 0) {
      const { replyMsg } = await database.write(async () => {
        const replyMsg = await this.messageTable.create((m) => {
          m.chat.id = chat.id
          m.senderType = 'bot'
          m.senderId = '_nop'
          m.content = ''
          m.loadingStatus = 'wait_first'
        })
        return { replyMsg }
      })

      p.onChatUpdated(chat.id)

      return this._regenerateBotMessage({
        chat,
        replyMessage: replyMsg,
        ...p,
      })
    }

    // update next message
    return this._regenerateBotMessage({
      chat,
      replyMessage: nextMessages[0],
      ...p,
    })
  }

  async _regenerateBotMessage(
    p: {
      chat: models.ChatModel
      replyMessage: models.ChatMessageModel
    } & MessageStreamCallbacks
  ): Promise<Result<boolean>> {
    const { chat, replyMessage } = p
    if (replyMessage.senderType !== 'bot') {
      return {
        ok: false,
        error: new Error(`message is not generated by bot`),
      }
    }

    if (replyMessage.deletedAt) {
      return {
        ok: false,
        error: new Error(`message is deleted`),
      }
    }

    await database.write(async () => {
      await replyMessage.update((m) => {
        m.content = ''
        m.loadingStatus = 'wait_first'
      })
    })

    const history = await this._queryFilteredHistory(chat)
      .extend(Q.where('created_at', Q.lt(replyMessage.createdAt.getTime())))
      .fetch()

    const resp = await this._handleSendMessage({
      toSendMessages: history,
      ...p,
    })

    return resp
  }

  async autoReplyMessage(
    p: { chatId: string } & MessageStreamCallbacks
  ): Promise<Result<boolean>> {
    const chat = await this.chatTable.find(p.chatId)
    if (!chat) {
      return { ok: false, error: new Error('Chat not found') }
    }

    const { replyMsg } = await database.write(async () => {
      const replyMsg = await this.messageTable.create((m) => {
        m.chat.id = chat.id
        m.senderType = 'bot'
        m.senderId = '_nop'
        m.content = ''
        m.loadingStatus = 'wait_first'
      })
      return { replyMsg }
    })

    p.onChatUpdated(chat.id)

    return this._regenerateBotMessage({
      chat,
      replyMessage: replyMsg,
      ...p,
    })
  }

  async sendNewMessage(
    p: {
      chatId: string
      content: string
    } & MessageStreamCallbacks
  ): Promise<Result<boolean>> {
    const chat = await this.chatTable.find(p.chatId)
    if (!chat) {
      return { ok: false, error: new Error('Chat not found') }
    }

    const history = await this._queryFilteredHistory(chat).fetch()

    // added message
    const { userMsg, replyMsg } = await database.write(async () => {
      const userMsg = await this.messageTable.create((m) => {
        m.chat.id = chat.id
        m.senderType = 'user'
        m.senderId = '_user'
        m.content = p.content
        m.loadingStatus = 'ok'
      })

      // sleep 2ms to use different timestamp
      await sleep(2)

      const replyMsg = await this.messageTable.create((m) => {
        m.chat.id = chat.id
        m.senderType = 'bot'
        m.senderId = '_nop'
        m.content = ''
        m.loadingStatus = 'wait_first'
      })

      return { userMsg, replyMsg }
    })

    p.onChatUpdated(chat.id)

    const toSendMessages = [...history, userMsg]

    return this._handleSendMessage({
      chat,
      replyMessage: replyMsg,
      toSendMessages,
      ...p,
    })
  }

  private async _handleSendMessage(
    p: {
      chat: models.ChatModel
      replyMessage: models.ChatMessageModel
      toSendMessages: models.ChatMessage[]
    } & MessageStreamCallbacks
  ): Promise<Result<boolean>> {
    if (p.toSendMessages.length === 0) {
      return { ok: false, error: new Error('no message to send') }
    }

    const lastMessage = p.toSendMessages[p.toSendMessages.length - 1]

    let botRes: Result<models.Bot> = {
      ok: false,
      error: new Error('no bot'),
    }

    if (p.replyMessage.senderId === '_nop') {
      // try get bot from message
      let botName = this.settings.chatDefaultSettings.defaultBotName
      const { name: parsedBotName } = extractBotNamePrefix(lastMessage.content)
      if (parsedBotName) {
        botName = parsedBotName
      }
      botRes = await this.state.getBot({
        name: botName,
      })
    } else {
      // get bot from id
      botRes = await this.state.getBot({
        id: p.replyMessage.senderId,
      })
    }

    // try get bot

    if (!botRes.ok) {
      return botRes
    }

    const bot = botRes.value
    const botServiceRes = createBotService({
      bot,
      openaiClient: this.openaiClient,
    })
    if (!botServiceRes.ok) {
      return botServiceRes
    }
    const botService = botServiceRes.value

    // update sender type
    await database.write(async () => {
      await p.replyMessage.update((m) => {
        m.senderId = bot.id
        m.senderType = 'bot'
      })
    })

    p.onMessageUpdated(p.replyMessage.id)

    const streamHandler = botService.sendMessage({
      messages: p.toSendMessages,
    })

    streamHandler.onData(async (r) => {
      await database.write(async () => {
        await p.replyMessage.update((m) => {
          if (m.loadingStatus === 'wait_first') {
            m.loadingStatus = 'loading'
          }

          if (r.kind === 'text') {
            m.content = m.content + r.value
          }

          if (r.kind === 'image_url') {
            m.content = m.content + `![image](${r.value})`
          }
        })
      })

      p.onMessageUpdated(p.replyMessage.id)
    })

    const resp = await streamHandler.wait()

    // sleep 50ms to make write finish
    // because watermelondb will queue the writer
    await sleep(50)

    if (!resp.ok) {
      await database.write(() =>
        p.replyMessage.update((m) => {
          m.loadingStatus = 'error'
        })
      )

      p.onMessageUpdated(p.replyMessage.id)
      return { ok: false, error: resp.error }
    }

    await database.write(
      async () =>
        await p.replyMessage.update((m) => {
          m.loadingStatus = 'ok'
        })
    )

    p.onMessageUpdated(p.replyMessage.id)
    return { ok: true, value: true }
  }

  private _queryFilteredHistory(chat: models.ChatModel, ...quries: Q.Clause[]) {
    return chat.messages.extend(
      Q.sortBy('created_at', 'asc'),
      Q.where('ignore_at', null),
      Q.where('deleted_at', null),
      ...quries
    )
  }
}

// Helpers
async function getByIdFromTable<T extends Model>(
  table: Collection<T>,
  id: string
): Promise<Result<T>> {
  try {
    const res = await table.find(id)
    return { ok: true, value: res }
  } catch (e) {
    return { ok: false, error: new NotFoundError(`id=${id} not found`) }
  }
}

async function getOneFromTable<T extends Model>(
  table: Collection<T>,
  ...clause: Q.Clause[]
): Promise<Result<T>> {
  const res = await table.query(...clause).fetch()
  if (res.length === 0) {
    return { ok: false, error: new NotFoundError(`not found`) }
  }

  if (res.length > 1) {
    return { ok: false, error: new Error(`not unique`) }
  }

  return { ok: true, value: res[0] }
}

export const miaService = new MiaService()
