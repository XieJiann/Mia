import * as models from './models'
export * as models from './models'

import { database } from './db'
import { api_t, OpenAIClient } from '../api'
import { Q } from '@nozbe/watermelondb'
import { Result } from '../types'

const defaultSettings: models.Settings = {
  apiClient: {
    currentOpenaiProfile: {
      name: 'openai-offical',
      endpoint: 'https://api.openai.com',
      apiKey: '',
    },
  },
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

export type ListPage<T> = {
  data: T[]
  total: number
  currentPage: number
  pageSize: number
  loading: boolean
}

export type Character = models.ExtractModelType<models.CharacterModel>

export type Chat = models.ExtractModelType<models.ChatModel>

export type ChatMeta = Omit<Chat, 'messages'>

export type ChatMessage = models.ExtractModelType<models.ChatMessageModel>

export class MiaService {
  private chatTable = database.get<models.ChatModel>('chats')
  private characterTable = database.get<models.CharacterModel>('characters')
  private settings: models.Settings = defaultSettings
  private openaiClient: OpenAIClient

  constructor() {
    this.openaiClient = new OpenAIClient(
      this.settings.apiClient.currentOpenaiProfile
    )
  }

  updateSettings(settings: models.Settings) {
    this.settings = settings
    this.openaiClient = new OpenAIClient(
      this.settings.apiClient.currentOpenaiProfile
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
      data,
      currentPage,
      pageSize,
      total,
      loading: false,
    }
  }

  async getChatById(id: string): Promise<Chat> {
    const chat = await this.chatTable.find(id)
    const messages = await chat.messages.fetch()
    return { ...chat, id: chat.id, messages }
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

    return database.write(async () => {
      return this.chatTable.create((c) => {
        c.name = name
      })
    })
  }

  async updateChat(id: string, p: { name?: string }): Promise<ChatMeta> {
    return database.write(async () => {
      const chat = await this.chatTable.find(id)
      return await chat.update((c) => {
        if (p.name) {
          c.name = p.name
        }
      })
    })
  }

  async deleteChat(id: string): Promise<void> {
    await database.write(async () => {
      const chat = await this.chatTable.find(id)
      await chat.update((c) => {
        c.deletedAt = new Date()
      })
    })
  }

  async sendNewMessageStream(p: {
    chatId: string
    content: string
  }): Promise<Result<boolean>> {
    const chat = await this.chatTable.find(p.chatId)
    if (!chat) {
      return { ok: false, error: new Error('Chat not found') }
    }

    const history = await chat.messages
      .extend(
        Q.sortBy('created_at', 'asc'),
        Q.where('hidden_at', null),
        Q.where('deleted_at', null)
      )
      .fetch()

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

    return { ok: true, value: true }
  }
}

export const miaService = new MiaService()
