import { appSchema, tableSchema, Database } from '@nozbe/watermelondb'
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'
import { Chat, ChatMessage, Prompt, schema } from './models'

export * as models from './models'

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
  modelClasses: [Chat, ChatMessage, Prompt],
})

export { database }
