import * as models from './models'
export * as models from './models'

import { database } from './db'
import { api_t, OpenAIClient } from '../api'
import { Q } from '@nozbe/watermelondb'
import { Result } from '../types'

const defaultSettings: models.Settings = {
  apiClient: {
    usedOpenaiProfile: {
      name: 'openai-offical',
      endpoint: 'https://api.openai.com',
      apiKey: '',
    },
  },
  openaiProfiles: [],
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

import type { Character, Chat, ChatMessage, ChatMeta } from './models'
export type { Character, Chat, ChatMessage, ChatMeta }

interface MessageStreamCallbacks {
  onMessageUpdated: (messageId: string) => void
  onChatUpdated: (chatId: string) => void
}

export class MiaService {
  private chatTable = database.get<models.ChatModel>('chats')
  private characterTable = database.get<models.CharacterModel>('characters')
  private messageTable = database.get<models.ChatMessageModel>('chat_messages')
  private settings: models.Settings = defaultSettings
  private openaiClient: OpenAIClient

  constructor() {
    this.openaiClient = new OpenAIClient(
      this.settings.apiClient.usedOpenaiProfile
    )
  }

  updateSettings(settings: models.Settings) {
    console.log('updateSettings', settings)
    this.settings = settings
    this.openaiClient = new OpenAIClient(
      this.settings.apiClient.usedOpenaiProfile
    )
  }

  // Characters

  async listCharacters(filters: ListFilters): Promise<ListPage<Character>> {
    const queryFilters: Q.Clause[] = [Q.where('deleted_at', null)]

    const total = await this.characterTable.query(...queryFilters).fetchCount()

    const { pageSize = 20, currentPage = 1 } = filters

    queryFilters.push(
      Q.sortBy(filters.orderBy || 'created_at', filters.order),
      Q.take(pageSize),
      Q.skip(pageSize * (currentPage - 1))
    )

    const data = await this.characterTable.query(...queryFilters).fetch()

    return {
      data,
      currentPage,
      pageSize,
      total,
      loading: false,
    }
  }

  async createCharacter(p: {
    name: string
    avatarUrl?: string
    descriptionPrompt?: string
  }): Promise<Character> {
    return database.write(async () => {
      return this.characterTable.create((c) => {
        c.name = p.name
        c.avatarUrl = p.avatarUrl || ''
        c.descriptionPrompt = p.descriptionPrompt || ''
      })
    })
  }

  async deleteCharacter(id: string): Promise<void> {
    await database.write(async () => {
      const character = await this.characterTable.find(id)
      await character.update((c) => {
        c.deletedAt = new Date()
      })
    })
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

  async getChatById(id: string): Promise<Chat> {
    const chat = await this.chatTable.find(id)
    const messages = await chat.messages
      .extend(Q.sortBy('created_at', 'asc'))
      .fetch()

    return {
      ...chat.getRawObject(),
      messages: messages.map((m) => m.getRawObject()),
    }
  }

  async createChat(p: { name?: string }): Promise<ChatMeta> {
    let { name = 'New Chat' } = p

    if (!name) {
      const chats = await this.chatTable
        .query(Q.sortBy('name', 'desc'), Q.where('name', Q.like('New Chat %')))
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
        c.name = name
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
  async getMessageById(id: string): Promise<ChatMessage> {
    const message = await this.messageTable.find(id)
    return message.getRawObject()
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

  async regenerateMessageStream(
    p: {
      messageId: string
      chatId: string
    } & MessageStreamCallbacks
  ): Promise<Result<boolean>> {
    const chat = await this.chatTable.find(p.chatId)
    if (!chat) {
      return { ok: false, error: new Error('Chat not found') }
    }

    const message = await this.messageTable.find(p.messageId)
    if (!message) {
      return { ok: false, error: new Error('Message not found') }
    }
    if (message.role !== 'assistant') {
      return {
        ok: false,
        error: new Error(
          `message is not assistant message, got=${message.role}`
        ),
      }
    }

    if (message.deletedAt || message.hiddenAt) {
      return {
        ok: false,
        error: new Error(`message is either hidden or deleted`),
      }
    }

    await database.write(async () => {
      await message.update((m) => {
        m.content = ''
        m.loadingStatus = 'wait_first'
      })
    })

    p.onMessageUpdated(message.id)

    const history = await this._queryFilteredHistory(chat)
      .extend(Q.where('created_at', Q.lt(message.createdAt.getTime())))
      .fetch()
    const toSendMessages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ]

    const resp = await this._handleSendMessageStream({
      chat,
      replyMessage: message,
      toSendMessages,
      ...p,
    })

    return resp
  }

  async sendNewMessageStream(
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
    const { replyMsg } = await database.write(async () => {
      await this.messageTable.create((m) => {
        m.chat.id = chat.id
        m.role = 'user'
        m.content = p.content
      })

      // sleep 2ms to use different timestamp
      await sleep(2)

      const replyMsg = await this.messageTable.create((m) => {
        m.chat.id = chat.id
        m.role = 'assistant'
        m.content = ''
        m.loadingStatus = 'wait_first'
      })

      return { replyMsg }
    })

    p.onChatUpdated(chat.id)

    const toSendMessages: api_t.ChatCompletionMessage[] = [
      ...history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: 'user',
        content: p.content,
      },
    ]

    return this._handleSendMessageStream({
      chat,
      replyMessage: replyMsg,
      toSendMessages,
      ...p,
    })
  }

  private async _handleSendMessageStream(
    p: {
      chat: models.ChatModel
      replyMessage: models.ChatMessageModel
      toSendMessages: api_t.ChatCompletionMessage[]
    } & MessageStreamCallbacks
  ): Promise<Result<boolean>> {
    const handleStream = async (
      events: api_t.CreateChatCompletionsReplyEventData[]
    ) => {
      let newContent = ''
      for (const event of events) {
        newContent += event.choices[0].delta.content || ''
      }

      await database.write(async () => {
        await p.replyMessage.update((m) => {
          if (m.loadingStatus === 'wait_first') {
            m.loadingStatus = 'loading'
          }
          m.content += newContent
        })
      })

      p.onMessageUpdated(p.replyMessage.id)
    }

    const resp = await this.openaiClient.createChatCompletionsStream(
      {
        model: 'gpt-3.5-turbo',
        messages: p.toSendMessages,
      },
      handleStream
    )

    if (!resp.ok) {
      await database.write(() =>
        p.replyMessage.update((m) => {
          m.loadingStatus = 'error'
        })
      )

      p.onMessageUpdated(p.replyMessage.id)
      return { ok: false, error: resp.error }
    }

    await database.write(() =>
      p.replyMessage.update((m) => {
        m.loadingStatus = 'ok'
      })
    )

    p.onMessageUpdated(p.replyMessage.id)
    return { ok: true, value: true }
  }

  private _queryFilteredHistory(chat: models.ChatModel) {
    return chat.messages.extend(
      Q.sortBy('created_at', 'asc'),
      Q.where('hidden_at', null),
      Q.where('deleted_at', null)
    )
  }
}

export const miaService = new MiaService()