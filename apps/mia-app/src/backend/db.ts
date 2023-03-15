import { Database } from '@nozbe/watermelondb'
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'
import {
  ChatModel,
  ChatMessageModel,
  PromptModel,
  schema,
  CharacterModel,
} from './models'

const migrations = schemaMigrations({
  migrations: [],
})

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  dbName: 'mia',
})

const database = new Database({
  adapter,
  modelClasses: [ChatModel, ChatMessageModel, PromptModel, CharacterModel],
})

export { database }
