import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import * as models from '../backend/models'
import { Constants, GetLoading, miaService } from '../backend/service'
import { Result } from '../types'

export type UserStore = {
  users: {
    [id: string]: Result<models.User>
  }

  currentUserId: string

  updateCurrentUser(p: {
    displayName: string
    avatarUrl: string
  }): Promise<void>
  getCurrentUser(): GetLoading<models.User>
}

function CreateUserStore() {
  return immer<UserStore>((set, get) => {
    const handleRefreshCurrentUser = async () => {
      const user = await miaService.getCurrentUser()

      set((s) => {
        s.users[s.currentUserId] = user
      })
    }

    return {
      currentUserId: Constants.DefaultUserId,
      users: {},

      async updateCurrentUser(p) {
        await miaService.updateCurrentUser(p)
        await handleRefreshCurrentUser()
      },

      getCurrentUser() {
        const user = get().users[get().currentUserId]

        // load user
        if (!user) {
          handleRefreshCurrentUser()
          return { loading: true }
        }
        return { loading: false, value: user.value, error: user.error }
      },
    }
  })
}

export const useUserStore = create(CreateUserStore())
