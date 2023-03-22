import {
  date,
  readonly,
  children,
  field,
  text,
  immutableRelation,
  json,
  relation,
} from '@nozbe/watermelondb/decorators'
import { Model, tableSchema, appSchema, Relation } from '@nozbe/watermelondb'
import { Q, Query } from '@nozbe/watermelondb'
import { Associations } from '@nozbe/watermelondb/Model'

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'chats',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'token_usage', type: 'string' },
        { name: 'character_id', type: 'string', isOptional: true },
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
        {
          name: 'sender_id',
          type: 'string',
        },
        {
          name: 'sender_type',
          type: 'string',
        },
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
        { name: 'deleted_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'characters',
      columns: [
        { name: 'name', type: 'string' },
        {
          name: 'avatar_url',
          type: 'string',
        },
        {
          name: 'description_prompt',
          type: 'string',
        },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'display_name', type: 'string' },
        {
          name: 'avatar_url',
          type: 'string',
        },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'bots',
      columns: [
        // unique key
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'display_name', type: 'string' },
        {
          name: 'avatar_url',
          type: 'string',
        },
        { name: 'kind', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'bot_template_id', type: 'string', isIndexed: true },
        // json object
        { name: 'bot_template_params', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'bot_templates',
      columns: [
        // unique key
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'description', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
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

export type BotTemplateParams = Record<string, unknown>

function sanitizeBotTemplateParams(data: object = {}): BotTemplateParams {
  return data as BotTemplateParams
}

export class UserModel extends Model {
  static table: string = 'users'

  @text('name') name!: string

  @text('display_name') displayName!: string

  @text('avatar_url') avatarUrl!: string

  @readonly
  @date('created_at')
  createdAt!: Date

  @readonly
  @date('updated_at')
  updatedAt!: Date

  @date('deleted_at')
  deletedAt?: Date

  getRawObject(): User {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    }
  }
}

export class ChatModel extends Model {
  static table = 'chats'
  static associations = {
    chat_messages: { type: 'has_many' as 'has_many', foreignKey: 'chat_id' },
  }

  @text('name') name!: string

  @children('chat_messages') messages!: Query<ChatMessageModel>

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

  getRawObject(): ChatMeta {
    return {
      id: this.id,
      name: this.name,
      tokenUsage: this.tokenUsage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    }
  }
}

export class ChatMessageModel extends Model {
  static table = 'chat_messages'
  static associations: Associations = {
    chat: { type: 'belongs_to', key: 'chat_id' },
  }

  @immutableRelation('chats', 'chat_id') chat!: Relation<ChatModel>

  @text('content') content!: string
  @field('role') role!: 'system' | 'user' | 'assistant'
  @field('actions_hidden') actionsHidden!: boolean
  @field('loading_status') loadingStatus!:
    | 'wait_first'
    | 'loading'
    | 'ok'
    | 'error'

  @text('sender_id') senderId!: string
  @text('sender_type') senderType!: 'user' | 'bot'

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

  getRawObject(): ChatMessageMeta {
    return {
      id: this.id,
      content: this.content,
      chat: {
        id: this.chat.id as string,
      },
      senderId: this.senderId as string,
      senderType: this.senderType,
      role: this.role,
      actionsHidden: this.actionsHidden,
      loadingStatus: this.loadingStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      hiddenAt: this.hiddenAt,
      deletedAt: this.deletedAt,
    }
  }
}

export class PromptModel extends Model {
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

export class CharacterModel extends Model {
  static table = 'characters'

  @text('name') name!: string

  @text('avatar_url') avatarUrl!: string

  @text('description_prompt') descriptionPrompt!: string

  @readonly
  @date('created_at')
  createdAt!: Date

  @readonly
  @date('updated_at')
  updatedAt!: Date

  @date('deleted_at')
  deletedAt?: Date

  getRawObject(): Character {
    return {
      id: this.id,
      name: this.name,
      avatarUrl: this.avatarUrl,
      descriptionPrompt: this.descriptionPrompt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    }
  }
}

export class BotModel extends Model {
  static table = 'bots'
  static associations: Associations = {
    botTemplate: { type: 'belongs_to', key: 'chat_id' },
  }

  @text('name') name!: string

  @text('display_name') displayName!: string

  @text('avatar_url') avatarUrl!: string

  @text('kind') kind!: string

  @text('description') description!: string

  @relation('bot_templates', 'bot_template_id')
  botTemplate!: Relation<BotTemplateModel>

  @json('bot_template_params', sanitizeBotTemplateParams)
  botTemplateParams!: BotTemplateParams

  @readonly
  @date('created_at')
  createdAt!: Date

  @readonly
  @date('updated_at')
  updatedAt!: Date

  @date('deleted_at')
  deletedAt?: Date

  getRawObject(): BotMeta {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      avatarUrl: this.avatarUrl,
      kind: this.kind,
      description: this.description,
      botTemplateParams: this.botTemplateParams,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    }
  }
}

export class BotTemplateModel extends Model {
  static table = 'bot_templates'

  @text('name') name!: string

  @text('description') description!: string

  @readonly
  @date('created_at')
  createdAt!: Date

  @readonly
  @date('updated_at')
  updatedAt!: Date

  @date('deleted_at')
  deletedAt?: Date
}

// Model Raw Types

export type User = ExtractModelType<UserModel>

export type Character = ExtractModelType<CharacterModel>

export type Chat = ChatMeta & {
  messages: ChatMessageMeta[]
}

export type ChatMeta = Omit<ExtractModelType<ChatModel>, 'messages'>

export type ChatMessageMeta = Omit<
  ExtractModelType<ChatMessageModel>,
  'chat'
> & {
  chat: { id: string }
}

export type ChatMessage = ChatMessageMeta & {
  sender?: MessageSender
}

export type BotMeta = Omit<ExtractModelType<BotModel>, 'botTemplate'>
export type Bot = BotMeta & {
  botTemplate: BotTemplate
}

export type BotTemplate = ExtractModelType<BotTemplateModel>

// @see https://stackoverflow.com/questions/53501721/typescript-exclude-property-key-when-starts-with-target-string

export type ExtractModelType<T extends Model> = ExtractModelTypeImpl<T>

type ExtractModelTypeImpl<T extends Model> = Omit<
  {
    [P in keyof T]: T[P] extends Query<infer R>
      ? ExtractModelTypeImpl<R>[]
      : T[P]
  },
  Exclude<keyof Model, 'id'> | 'getRawObject'
>

export interface Settings {
  apiSettings: {
    openaiApiEndpoint: string
    openaiApiKey: string
  }
  chatDefaultSettings: {
    defaultBotName: string
  }
}

export interface MessageSender {
  type: 'user' | 'bot'
  id: string
  name: string
  displayName: string
  avatarUrl: string
}
