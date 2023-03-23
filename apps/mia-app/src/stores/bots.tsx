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
} from '../backend/service'

interface BotStore {
  botListView: {
    [key: string]: ListPage<BotMeta>
  }

  botTemplateListView: {
    [key: string]: ListPage<BotTemplate>
  }

  listBots: (filters: ListFilters) => ListPage<BotMeta>
  listBotTemplates: (filters: ListFilters) => ListPage<BotTemplate>
  createBot: MiaService['createBot']
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

    return {
      botListView: {},
      botTemplateListView: {},

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
    }
  })
}

export const useBotStore = create(createBotStore())
