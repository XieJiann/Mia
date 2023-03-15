import ShortUniqueId from 'short-unique-id'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { api_t, OpenAIClient } from '../api'
import {
  ChatMessage,
  Chat,
  ChatMeta,
  ListFilters,
  ListPage,
  miaService,
  ListFiltersToString,
  createDefaultListPage,
  ListFiltersFromString,
} from '../backend/service'
import { Result } from '../types'
import { getNowTimestamp } from '../types/model'
import { useSettingsStore } from './settings'

export type ChatRole = 'user' | 'assistant' | 'system'
export type { Chat, ChatMessage, ChatMeta }

// Helper functions

const filterValidHistories = (messages: ChatMessage[]) => {
  return messages.filter((m) => {
    return m.loadingStatus === 'ok' && !m.hiddenAt && !m.deletedAt
  })
}

export function isMessageLoading(message: ChatMessage) {
  return (
    message.loadingStatus === 'loading' ||
    message.loadingStatus === 'wait_first'
  )
}

export type ChatStore = {
  // TODO: fix memory leak when use views and mappers
  // used for list
  chatsView: {
    [key: string]: ListPage<ChatMeta>
  }

  // used for chat
  chats: {
    [key: string]: Chat
  }

  listChats(p: ListFilters): ListPage<ChatMeta>

  getChat(id: string): Chat | undefined

  createChat(p: { name?: string }): Promise<ChatMeta>

  updateChat(id: string, p: { name?: string }): Promise<void>

  deleteChat(id: string): Promise<void>

  stopGenerateMessage(p: { messageId: string }): Promise<void>

  sendNewMessageStream(p: {
    chatId: string
    content: string
  }): Promise<Result<boolean>>

  regenerateMessageStream(p: {
    messageId: string
    chatId: string
  }): Promise<Result<boolean>>
}

function createChatStore() {
  return immer<ChatStore>((set, get) => {
    const handleRefreshViews = () => {
      const view = get().chatsView

      for (const key in view) {
        const filters = ListFiltersFromString(key)
        miaService.listChats(filters).then((page) => {
          set((s) => {
            s.chatsView[key] = page
          })
        })
      }
    }

    const handleRefreshChat = (id: string) => {
      miaService.getChatById(id).then((chat) => {
        set((s) => {
          s.chats[id] = chat
        })
      })
    }

    const handleRefreshMessage = async (messageId: string) => {
      const message = await miaService.getMessageById(messageId)
      if (!message) {
        return
      }

      set((s) => {
        const chat = s.chats[message.chat.id]
        if (!chat) {
          return
        }

        const index = chat.messages.findIndex((m) => m.id === messageId)
        if (index < 0) {
          return
        }

        chat.messages[index] = message
      })
    }

    return {
      // use for naming new chats
      chats: {},
      chatsView: {},
      chatNextIndex: 1,

      getChat(id: string): Chat | undefined {
        const chat = get().chats[id]
        if (!chat) {
          handleRefreshChat(id)
        }
        return chat
      },

      listChats(filters) {
        const key = ListFiltersToString(filters)
        const view = get().chatsView[key]
        if (view) {
          return view
        }
        set((s) => {
          s.chatsView[key] = createDefaultListPage(filters)
        })

        miaService.listChats(filters).then((page) => {
          set((s) => {
            s.chatsView[key] = page
          })
        })

        return get().chatsView[key]
      },

      async updateChat(
        id: string,
        p: {
          name?: string
        }
      ) {
        await miaService.updateChat(id, p)
        handleRefreshViews()
        handleRefreshChat(id)
      },

      async createChat(p: { name?: string }) {
        const chat = await miaService.createChat(p)
        handleRefreshViews()
        handleRefreshChat(chat.id)
        return chat
      },

      async deleteChat(id: string) {
        await miaService.deleteChat(id)
        handleRefreshViews()
        handleRefreshChat(id)
      },

      async stopGenerateMessage(p) {
        await miaService.stopGenerateMessage(p)
        handleRefreshMessage(p.messageId)
      },

      async sendNewMessageStream(p: {
        chatId: string
        content: string
      }): Promise<Result<boolean>> {
        const resp = await miaService.sendNewMessageStream({
          ...p,
          onChatUpdated(chatId) {
            handleRefreshChat(chatId)
          },
          onMessageUpdated(messageId) {
            handleRefreshMessage(messageId)
          },
        })
        return resp
      },

      async regenerateMessageStream(p) {
        // more fine-grained refresh
        const resp = await miaService.regenerateMessageStream({
          ...p,
          onChatUpdated(chatId) {
            handleRefreshChat(chatId)
          },
          onMessageUpdated(messageId) {
            handleRefreshMessage(messageId)
          },
        })
        return resp
      },
    }
  })
}

export const useChatStore = create(createChatStore())
