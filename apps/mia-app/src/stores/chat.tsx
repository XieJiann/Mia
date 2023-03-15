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
  const idGenerator = new ShortUniqueId()

  // TODO: find a better way to retrieve the deps
  const getOpenaiClient = () => {
    // below function is not reactive
    // @see https://github.com/pmndrs/zustand/discussions/630
    const openaiProfile =
      useSettingsStore.getState().apiClient.usedOpenaiProfile
    const openaiClient = new OpenAIClient(openaiProfile)

    return openaiClient
  }

  const postprocessMessages = (p: {
    historyMessages: api_t.ChatCompletionMessage[]
    newMessage?: api_t.ChatCompletionMessage
    mustHaveMessages: api_t.ChatCompletionMessage[]
  }) => {
    // TODO: when shrinking the content, we should consider the must have messages

    if (p.newMessage) {
      return [...p.historyMessages, p.newMessage]
    }

    return p.historyMessages
  }

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

    const handleSendMessageStream = async (p: {
      chatId: string
      messageId: string
      sendMessages: api_t.ChatCompletionMessage[]
    }): Promise<Result<boolean>> => {
      const openaiClient = getOpenaiClient()

      const chatIdx = get().chats.findIndex((c) => c.id === p.chatId)
      if (chatIdx === -1) {
        return {
          ok: false,
          error: new Error(`chat not found, id: ${p.chatId}`),
        }
      }

      const recvMessageIndex = get().chats[chatIdx].messages.findIndex(
        (m) => m.id === p.messageId
      )

      const handleStream = (
        events: api_t.CreateChatCompletionsReplyEventData[]
      ) => {
        set((s) => {
          const chat = s.chats[chatIdx]

          const message = chat.messages[recvMessageIndex]

          if (message.loadingStatus === 'wait_first') {
            message.loadingStatus = 'loading'
          }

          let newContent = ''
          // append content
          for (const event of events) {
            newContent += event.choices[0].delta.content || ''
          }

          message.content += newContent
        })
      }

      const resp = await openaiClient.createChatCompletionsStream(
        { model: 'gpt-3.5-turbo', messages: p.sendMessages },
        handleStream
      )

      if (!resp.ok) {
        set((s) => {
          const message = s.chats[chatIdx].messages[recvMessageIndex]
          message.loadingStatus = 'error'
        })
        return { ok: false, error: resp.error }
      }

      set((s) => {
        const message = s.chats[chatIdx].messages[recvMessageIndex]
        message.loadingStatus = 'ok'
      })

      return { ok: true, value: true }
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

      async sendNewMessageStream(p: {
        chatId: string
        content: string
      }): Promise<Result<boolean>> {
        const chatIdx = get().chats.findIndex((c) => c.id === p.chatId)

        if (chatIdx === -1) {
          throw new Error(`chat not found, id: ${p.chatId}`)
        }

        const userMessage: api_t.ChatCompletionMessage = {
          role: 'user',
          content: p.content,
        }

        const chat = get().chats[chatIdx]
        const messages = postprocessMessages({
          historyMessages: filterValidHistories(chat.messages).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          newMessage: userMessage,
          mustHaveMessages: [],
        })

        const replyMessageId = idGenerator.randomUUID(8)

        const newlyAddedMessage = [
          createChatMessageData({
            id: idGenerator.randomUUID(8),
            createdAt: getNowTimestamp(),
            ...userMessage,
          }),
          createChatMessageData({
            id: replyMessageId,
            createdAt: getNowTimestamp(),
            role: 'assistant',
            content: '',
          }),
        ]

        set((s) => {
          const chat = s.chats[chatIdx]

          // push user & reply message to history
          chat.messages.push(...newlyAddedMessage)
        })

        const resp = await handleSendMessageStream({
          chatId: p.chatId,
          messageId: replyMessageId,
          sendMessages: messages,
        })

        return resp
      },

      async regenerateMessageStream(p) {
        const chatIdx = get().chats.findIndex((c) => c.id === p.chatId)
        if (chatIdx === -1) {
          return {
            ok: false,
            error: new Error(`chat not found, id: ${p.chatId}`),
          }
        }

        const chat = get().chats[chatIdx]

        const messageIndex = chat.messages.findIndex(
          (m) => m.id === p.messageId
        )
        if (messageIndex === -1) {
          return {
            ok: false,
            error: new Error(`message not found, id: ${p.messageId}`),
          }
        }

        const message = chat.messages[messageIndex]
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

        set((s) => {
          const chat = s.chats[chatIdx]

          // push reply message to history
          const message = chat.messages[messageIndex]
          message.content = ''
          message.loadingStatus = 'wait_first'
          message.createdAt = getNowTimestamp()
        })

        const historyMessages = filterValidHistories(
          chat.messages.slice(0, messageIndex)
        )
        console.log(`message_indx=`, messageIndex, historyMessages)
        const messages = postprocessMessages({
          historyMessages: historyMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          mustHaveMessages: chat.mustHaveMessages,
        })

        const resp = await handleSendMessageStream({
          chatId: p.chatId,
          messageId: p.messageId,
          sendMessages: messages,
        })
        return resp
      },
    }
  })
}

export const useChatStore = create(
  persist(createChatStore(), {
    name: 'mia-chats',
  })
)
