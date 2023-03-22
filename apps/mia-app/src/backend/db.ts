import { Database } from '@nozbe/watermelondb'
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'
import {
  ChatModel,
  ChatMessageModel,
  PromptModel,
  schema,
  CharacterModel,
  BotModel,
  BotTemplateModel,
  UserModel,
} from './models'
import { initDatas } from './data'

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

function initDatabase() {
  const database = new Database({
    adapter,
    modelClasses: [
      UserModel,
      ChatModel,
      ChatMessageModel,
      PromptModel,
      CharacterModel,
      BotModel,
      BotTemplateModel,
    ],
  })

  // init data
  initDatas(database)

  return database
}

const database = initDatabase()

export { database }
