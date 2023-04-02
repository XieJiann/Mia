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
  MessageStreamCallbacks,
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

  chatTokens: {
    [key: string]: Result<{ totalTokens: number }>
  }

  listChats(p: ListFilters): ListPage<ChatMeta>

  getChat(id: string): GetLoading<Chat>

  createChat(p: { name?: string }): Promise<ChatMeta>

  updateChat(id: string, p: { name?: string }): Promise<void>

  deleteChat(id: string): Promise<void>

  getChatTokens(p: { chatId: string }): GetLoading<{ totalTokens: number }>

  updateMessage: MiaService['updateMessage']

  deleteMessage: (p: { chatId: string; messageId: string }) => Promise<void>

  stopGenerateMessage(p: { messageId: string }): Promise<void>

  sendNewMessage(p: {
    chatId: string
    content: string
  }): Promise<Result<boolean>>

  autoReplyMessage(p: { chatId: string }): Promise<Result<boolean>>

  regenerateMessage(p: {
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

    const handleRefreshChatTokens = async (p: { chatId: string }) => {
      const { chatId } = p
      const res = await miaService.countTokensForChat(p)
      set((s) => {
        s.chatTokens[chatId] = res
      })
    }

    const messageStreamCallbacks: MessageStreamCallbacks = {
      onChatUpdated(chatId) {
        handleRefreshChat(chatId)
        handleRefreshViews()
      },
      onMessageListUpdated(chatId) {
        handleRefreshChat(chatId)
      },
      onMessageUpdated(messageId) {
        handleRefreshMessage(messageId)
      },
    }

    return {
      chats: {},
      chatsView: {},
      chatTokens: {},

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

      getChatTokens(p) {
        const res = get().chatTokens[p.chatId]
        if (!res) {
          handleRefreshChatTokens(p)
          return { loading: true }
        }

        return { loading: false, value: res.value, error: res.error }
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

      async updateMessage(p) {
        await miaService.updateMessage(p)
        await handleRefreshMessage(p.messageId)
        if (p.toggleIgnore || p.content) {
          await handleRefreshChatTokens({ chatId: p.chatId })
        }
      },

      async deleteMessage(p) {
        await miaService.deleteMessage(p.messageId)
        await handleRefreshChat(p.chatId)
        await handleRefreshChatTokens({ chatId: p.chatId })
      },

      async stopGenerateMessage(p) {
        await miaService.stopGenerateMessage(p)
        await handleRefreshMessage(p.messageId)
      },

      async sendNewMessage(p: {
        chatId: string
        content: string
      }): Promise<Result<boolean>> {
        const resp = await miaService.sendNewMessage({
          ...p,
          ...messageStreamCallbacks,
        })

        await handleRefreshChatTokens({ chatId: p.chatId })
        return resp
      },

      async autoReplyMessage(p) {
        const resp = await miaService.autoReplyMessage({
          ...p,
          ...messageStreamCallbacks,
        })

        await handleRefreshChatTokens({ chatId: p.chatId })
        return resp
      },

      async regenerateMessage(p) {
        // more fine-grained refresh
        const resp = await miaService.regenerateMessage({
          ...p,
          ...messageStreamCallbacks,
        })

        await handleRefreshChatTokens({ chatId: p.chatId })
        return resp
      },
    }
  })
}

export const useChatStore = create(createChatStore())
