import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  Character,
  ListPage,
  ListFilters,
  ListFiltersToString,
  createDefaultListPage,
  miaService,
  ListFiltersFromString,
} from '../backend/service'

interface CharacterStore {
  charactersView: {
    [key: string]: ListPage<Character>
  }

  listCharacters: (filters: ListFilters) => ListPage<Character>
  createCharacter: (character: {
    name: string
    avatarUrl?: string
    descriptionPrompt?: string
  }) => Promise<Character>
}

function createCharacterStore() {
  return immer<CharacterStore>((set, get) => {
    const refetchAllViews = () => {
      const view = get().charactersView

      for (const key in view) {
        const filters = ListFiltersFromString(key)
        miaService.listCharacters(filters).then((page) => {
          set((s) => {
            s.charactersView[key] = page
          })
        })
      }
    }

    return {
      charactersView: {},
      listCharacters(filters: ListFilters) {
        const key = ListFiltersToString(filters)
        const view = get().charactersView[key]
        if (view) {
          return view
        }

        // init view
        set((s) => {
          s.charactersView[key] = createDefaultListPage(filters)
        })

        // push async
        miaService.listCharacters(filters).then((page) => {
          set((s) => {
            s.charactersView[key] = page
          })
        })

        return get().charactersView[key]
      },

      async createCharacter(p) {
        const character = await miaService.createCharacter(p)
        refetchAllViews()
        return character
      },
    }
  })
}

export const useCharacterStore = create(createCharacterStore())
