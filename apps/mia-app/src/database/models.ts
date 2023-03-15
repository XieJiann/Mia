import {
  date,
  readonly,
  children,
  field,
  text,
  immutableRelation,
  lazy,
  json,
} from '@nozbe/watermelondb/decorators'
import { Model, tableSchema, appSchema } from '@nozbe/watermelondb'
import { Q, Query } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'chats',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'chat_messages',
      columns: [
        { name: 'chat_id', type: 'string', isIndexed: true },
        { name: 'content', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'actions_hidden', type: 'boolean' },
        { name: 'loading_status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
        { name: 'hidden_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'prompts',
      columns: [
        { name: 'content', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number' },
      ],
    }),
  ],
})

export type ChatTokenUsage = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

function sanitizeChatTokenUsage(data: object = {}): ChatTokenUsage {
  return {
    ...data,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  }
}

export class Chat extends Model {
  static table = 'chats'
  static associations = {
    messages: { type: 'has_many' as 'has_many', foreignKey: 'chat_id' },
  }

  @children('chat_messages') messages!: Query<ChatMessage>

  // @lazy validMessages = this.messages.extend(
  //   Q.where('hidden_at', Q.notEq(null)),
  //   Q.where('deleted_at', Q.notEq(null))
  // )

  @json('token_usage', sanitizeChatTokenUsage) tokenUsage!: ChatTokenUsage

  @readonly
  @date('created_at')
  createdAt!: Date

  @readonly
  @date('updated_at')
  updatedAt!: Date

  @date('deleted_at')
  deletedAt?: Date
}

export class ChatMessage extends Model {
  static table = 'chat_messages'
  static associations = {
    chat: { type: 'belongs_to' as 'belongs_to', key: 'chat_id' },
  }

  @immutableRelation('chats', 'chat_id') chat!: Chat

  @text('content') content!: string
  @field('role') role!: 'system' | 'user' | 'assistant'
  @field('actions_hidden') actionsHidden!: boolean
  @field('loading_status') loadingStatus!:
    | 'wait_first'
    | 'loading'
    | 'success'
    | 'error'

  @readonly
  @date('created_at')
  createdAt!: Date

  @readonly
  @date('updated_at')
  updatedAt!: Date

  @date('hidden_at')
  hiddenAt?: Date

  @date('deleted_at')
  deletedAt?: Date
}

export class Prompt extends Model {
  static table = 'prompts'

  @text('content') content!: string

  @readonly
  @date('created_at')
  createdAt!: Date

  @readonly
  @date('updated_at')
  updatedAt!: Date

  @date('deleted_at')
  deletedAt?: Date
}
