import { create } from 'zustand'

type AppStoreState = {
  initialized: boolean
  setInitialized: (initialized: boolean) => void
}

export const useAppStore = create<AppStoreState>(set => ({
  initialized: false,
  setInitialized: initialized => set({ initialized }),
}))
