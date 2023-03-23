import {
  BotFeatures,
  BotInitParams,
  IBotService,
  MessageReply,
  SendMessageParams,
} from '.'
import { api_t, OpenAIClient } from '../../api'
import { IStreamHandler } from '../../types'
import { extractBotNamePrefix } from '../../utils'
import { models } from '../service'

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

export class OpenaiChatBot implements IBotService {
  constructor(
    private params: BotInitParams,
    private openaiClient: OpenAIClient
  ) {}

  getFeatures(): BotFeatures {
    return {}
  }
  sendMessage(p: SendMessageParams): IStreamHandler<MessageReply> {
    const apiMessages = p.messages.map(convertToOpenAIMessage)

    const streamHandler = this.openaiClient.createChatCompletionsStream({
      model: 'gpt-3.5-turbo',
      messages: apiMessages,
    })

    return streamHandler.map((events) => {
      let content = ''
      for (const event of events) {
        content += event.choices[0]?.delta.content || ''
      }

      return {
        kind: 'text',
        value: content,
      }
    })
  }
}

export class OpenaiImageBot implements IBotService {
  constructor(
    private params: BotInitParams,
    private openaiClient: OpenAIClient
  ) {}

  getFeatures(): BotFeatures {
    return {}
  }

  sendMessage(p: SendMessageParams): IStreamHandler<MessageReply> {
    if (p.messages.length === 0) {
      throw new Error('No messages')
    }

    // we only use the last message
    const message = p.messages[p.messages.length - 1]

    const { trimedContent } = extractBotNamePrefix(message.content)

    const streamHandler = this.openaiClient.generateImages({
      prompt: trimedContent,
      response_format: 'url',
    })

    return streamHandler.map((reply) => {
      return {
        kind: 'image_url',
        value: reply.data[0].url,
      }
    })
  }
}
