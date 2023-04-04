import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { Settings, User } from '../backend/models'
import { getDefaultSettings, GetLoading, miaService } from '../backend/service'

type SettingsStore = {
  ui: {
    mainDrawerOpened: boolean
    followOutput: boolean
  }

  main: Settings

  updateMainSettings(settings: Settings): Promise<void>
  openMainDrawer(): void
  closeMainDrawer(): void
  toggleMainDrawer(): void

  toggleFollowOutput(): void
}

const settingsStoreCreator = immer<SettingsStore>((set, get) => {
  return {
    ui: {
      mainDrawerOpened: false,
      followOutput: false,
    },
    main: getDefaultSettings(),

    async updateMainSettings(settings) {
      miaService.updateSettings(settings)
      set((s) => {
        s.main = settings
      })
    },

    openMainDrawer() {
      set((s) => {
        s.ui.mainDrawerOpened = true
      })
    },

    closeMainDrawer() {
      set((s) => {
        s.ui.mainDrawerOpened = false
      })
    },

    toggleMainDrawer() {
      set((s) => {
        s.ui.mainDrawerOpened = !s.ui.mainDrawerOpened
      })
    },

    toggleFollowOutput() {
      set((s) => {
        s.ui.followOutput = !s.ui.followOutput
      })
    },
  }
})

export const useSettingsStore = create(
  devtools(
    persist(settingsStoreCreator, {
      name: 'mia-settings',
    }),
    {
      name: 'mia-settings',
    }
  )
)

function init() {
  miaService.updateSettings(useSettingsStore.getState().main)
}

init()
