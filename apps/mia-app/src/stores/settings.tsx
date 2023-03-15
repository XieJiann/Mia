import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { Settings } from '../backend/models'
import { miaService } from '../backend/service'

export interface OpenAiProfile {
  name: string
  endpoint: string
  apiKey?: string
  desc?: string
}

type SettingsStore = {
  ui: {
    mainDrawerOpened: boolean
  }

  addOpenAiProfile(profile: OpenAiProfile): void
  setOpenaiProfile(profile: OpenAiProfile): void
  openMainDrawer(): void
  closeMainDrawer(): void
  toggleMainDrawer(): void
} & Settings

const defaultOpenaiProfiles: OpenAiProfile[] = [
  {
    name: 'openai-offical',
    endpoint: 'https://api.openai.com',
    apiKey: '',
  },
]

const settingsStoreCreator = immer<SettingsStore>((set, get) => ({
  ui: {
    mainDrawerOpened: false,
  },
  apiClient: {
    usedOpenaiProfile: defaultOpenaiProfiles[0],
  },
  openaiProfiles: defaultOpenaiProfiles,

  addOpenAiProfile(profile: OpenAiProfile) {
    set((s) => {
      s.openaiProfiles.push(profile)
    })
  },

  setOpenaiProfile(profile: OpenAiProfile) {
    set((s) => {
      s.apiClient.usedOpenaiProfile = profile
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
}))

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
  miaService.updateSettings(useSettingsStore.getState())
  useSettingsStore.subscribe((settings, prevSettings) => {
    if (settings.apiClient !== prevSettings.apiClient) {
      miaService.updateSettings(settings)
    }
  })
}

init()
