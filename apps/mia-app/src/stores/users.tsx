import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import * as models from '../backend/models'
import { GetLoading, miaService } from '../backend/service'

export type UserStore = {
  currentUser: GetLoading<models.User>

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
        s.currentUser.loading = false
        s.currentUser.error = user.error
        s.currentUser.value = user.value
      })
    }

    return {
      currentUser: {
        loading: false,
      },

      async updateCurrentUser(p) {
        await miaService.updateCurrentUser(p)
        await handleRefreshCurrentUser()
      },

      getCurrentUser() {
        const user = get().currentUser

        // load user
        if (!user.value && !user.loading) {
          handleRefreshCurrentUser()
          set((s) => {
            s.currentUser.loading = true
          })
        }
        return get().currentUser
      },
    }
  })
}

export const useUserStore = create(CreateUserStore())
