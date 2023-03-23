import { IStreamHandler } from '../../types'
import { models } from '../service'

export type BotInitParams = {
  botName: string
  botId: string
  template: models.BotTemplate
  templateParams: models.BotTemplateParams
}

export interface BotFeatures {}

export interface SendMessageParams {
  messages: models.ChatMessage[]
}

export type MessageReply =
  | {
      kind: 'text'
      value: string
    }
  | { kind: 'image_b64'; value: string }
  | { kind: 'image_url'; value: string }

export interface IBotService {
  getFeatures(): BotFeatures
  sendMessage(p: SendMessageParams): IStreamHandler<MessageReply>
}
