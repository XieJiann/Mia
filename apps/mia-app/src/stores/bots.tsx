import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Bot, BotMeta, BotTemplate } from '../backend/models'
import {
  Character,
  ListPage,
  ListFilters,
  ListFiltersToString,
  createDefaultListPage,
  miaService,
  ListFiltersFromString,
  MiaService,
  GetLoading,
} from '../backend/service'
import { Result } from '../types'

interface BotStore {
  botListView: {
    [key: string]: ListPage<BotMeta>
  }

  botTemplateListView: {
    [key: string]: ListPage<BotTemplate>
  }

  bots: {
    [key: string]: Result<Bot>
  }

  getBot(id: string): GetLoading<Bot>
  listBots: (filters: ListFilters) => ListPage<BotMeta>
  listBotTemplates: (filters: ListFilters) => ListPage<BotTemplate>
  createBot: MiaService['createBot']
  updateBot: MiaService['updateBot']
}

function createBotStore() {
  return immer<BotStore>((set, get) => {
    const refetchAllViews = () => {
      const view = get().botListView

      for (const key in view) {
        const filters = ListFiltersFromString(key)
        miaService.listBots(filters).then((page) => {
          set((s) => {
            s.botListView[key] = page
          })
        })
      }
    }

    const refreshBot = async (id: string) => {
      // push async
      const res = await miaService.getBotById(id)
      set((s) => {
        s.bots[id] = res
      })
    }

    return {
      botListView: {},
      botTemplateListView: {},
      bots: {},

      getBot(id) {
        const botRes = get().bots[id]
        if (!botRes) {
          refreshBot(id)
          return { loading: true, value: undefined }
        }
        return { loading: false, value: botRes.value, error: botRes.error }
      },
      listBots(filters) {
        const key = ListFiltersToString(filters)
        const view = get().botListView[key]
        if (view) {
          return view
        }

        // init view
        set((s) => {
          s.botListView[key] = createDefaultListPage(filters)
        })

        // push async
        miaService.listBots(filters).then((page) => {
          set((s) => {
            s.botListView[key] = page
          })
        })

        return get().botListView[key]
      },

      listBotTemplates(filters) {
        const key = ListFiltersToString(filters)
        const view = get().botTemplateListView[key]
        if (view) {
          return view
        }

        // init view
        set((s) => {
          s.botTemplateListView[key] = createDefaultListPage(filters)
        })

        // push async
        miaService.listBotTemplates(filters).then((page) => {
          set((s) => {
            s.botTemplateListView[key] = page
          })
        })

        return get().botTemplateListView[key]
      },

      async createBot(p) {
        const bot = await miaService.createBot(p)
        refetchAllViews()
        return bot
      },

      async updateBot(id, p) {
        const res = await miaService.updateBot(id, p)
        refreshBot(id)
        return res
      },
    }
  })
}

export const useBotStore = create(createBotStore())
