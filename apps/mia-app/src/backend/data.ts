import { Collection, Database, Model, Q } from '@nozbe/watermelondb'
import {
  BotMeta,
  BotModel,
  BotTemplate,
  BotTemplateModel,
  User,
  UserModel,
} from './models'

const bots: (Omit<BotMeta, 'createdAt' | 'updatedAt'> & {
  botTemplateId: string
})[] = [
  {
    id: '_chatgpt',
    kind: '',
    name: 'chatgpt',
    avatarUrl: '/avatars/bot_chatgpt.png',
    displayName: 'ChatGPT',
    botTemplateId: '_openai-chat',
    botTemplateParams: {},
    description: 'default bot for openai-chat',
  },
]

const botTemplates: Omit<BotTemplate, 'createdAt' | 'updatedAt'>[] = [
  {
    id: '_openai-chat',
    name: 'openai-chat',
    description: 'Use OpenAI chat completions API',
  },
  {
    id: '_openai-image',
    name: 'openai-image',
    description: 'Use OpenAI image creation API',
  },
]

const users: Omit<User, 'createdAt' | 'updatedAt'>[] = [
  // default user
  {
    id: '_user',
    name: 'user',
    displayName: 'User',
    avatarUrl:
      '/avatars/user_ghost.png',
  },
]

// Initialize data in database
export async function initDatas(database: Database) {
  const userTable = database.get<UserModel>('users')
  const botTemplateTable = database.get<BotTemplateModel>('bot_templates')
  const botTable = database.get<BotModel>('bots')

  await database.write(async (writer) => {
    const ops = await createOrUpdate({
      values: users as UserModel[],
      collection: userTable,
      updater(value, b) {
        // updateProps(value, b)
        b.name = value.name
        if (!b.displayName) {
          b.displayName = value.displayName
        }
        b._raw.id = value.id
      },
    })

    await writer.batch(ops)
  }, 'init users')

  await database.write(async (writer) => {
    const ops = await createOrUpdate({
      values: botTemplates as BotTemplateModel[],
      collection: botTemplateTable,
      updater(value, b) {
        updateProps(value, b)
        b._raw.id = value.id
      },
    })
    await writer.batch(ops)
  }, 'init bot templates')

  await database.write(async (writer) => {
    const ops = await createOrUpdate({
      values: bots,
      collection: botTable,
      updater(value, b) {
        updateProps(value, b)
        b.botTemplate.id = value.botTemplateId
        b._raw.id = value.id
      },
    })

    await writer.batch(ops)
  }, 'init bots')
}

function updateProps(value: object, target: object) {
  for (const key in value) {
    if (key === 'id') {
      continue
    }
    // @ts-expect-error ...
    target[key] = value[key]
  }
}

async function createOrUpdate<V extends { id: string }, T extends Model>(p: {
  values: V[]
  collection: Collection<T>
  updater: (value: V, b: T) => void
}): Promise<T[]> {
  const ids = p.values.map((t) => t.id)
  const existedModels = await p.collection
    .query(Q.where('id', Q.oneOf(ids)))
    .fetch()

  const existedModelMap = new Map(existedModels.map((v) => [v.id, v]))

  const batches: T[] = []
  for (const value of p.values) {
    const model = existedModelMap.get(value.id)
    const updater = (b: T) => {
      p.updater(value, b)
    }

    if (model) {
      // to update
      batches.push(model.prepareUpdate(updater))
    } else {
      // to create
      batches.push(p.collection.prepareCreate(updater))
    }
  }

  return batches
}
