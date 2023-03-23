import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
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
  GetLoading,
  MiaService,
} from '../backend/service'
import { Result } from '../types'

export type ChatRole = 'user' | 'assistant' | 'system'
export type { Chat, ChatMessage, ChatMeta }

// Helper functions

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
    [key: string]: Result<Chat>
  }

  listChats(p: ListFilters): ListPage<ChatMeta>

  getChat(id: string): GetLoading<Chat>

  createChat(p: { name?: string }): Promise<ChatMeta>

  updateChat(id: string, p: { name?: string }): Promise<void>

  deleteChat(id: string): Promise<void>

  updateMessage: MiaService['updateMessage']

  deleteMessage: (p: { chatId: string; messageId: string }) => Promise<void>

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

    const handleRefreshChat = async (id: string) => {
      const chat = await miaService.getChatById(id)

      set((s) => {
        s.chats[id] = chat
      })
    }

    const handleRefreshMessage = async (messageId: string) => {
      const message = await miaService.getMessageById(messageId)
      if (!message) {
        return
      }

      set((s) => {
        const chatRes = s.chats[message.chat.id]
        if (!chatRes.ok) {
          return
        }

        const chat = chatRes.value

        const index = chat.messages.findIndex((m) => m.id === messageId)
        if (index < 0) {
          return
        }

        chat.messages[index] = message
      })
    }

    return {
      chats: {},
      chatsView: {},

      getChat(id: string): GetLoading<Chat> {
        const chatRes = get().chats[id]
        if (!chatRes) {
          handleRefreshChat(id)
          return { loading: true, value: undefined }
        }
        return { loading: false, value: chatRes.value, error: chatRes.error }
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

      async updateMessage(id, p) {
        await miaService.updateMessage(id, p)
        await handleRefreshMessage(id)
      },

      async deleteMessage(p) {
        await miaService.deleteMessage(p.messageId)
        await handleRefreshChat(p.chatId)
      },

      async stopGenerateMessage(p) {
        await miaService.stopGenerateMessage(p)
        await handleRefreshMessage(p.messageId)
      },

      async sendNewMessageStream(p: {
        chatId: string
        content: string
      }): Promise<Result<boolean>> {
        const resp = await miaService.sendNewMessage({
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
        const resp = await miaService.regenerateMessage({
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
