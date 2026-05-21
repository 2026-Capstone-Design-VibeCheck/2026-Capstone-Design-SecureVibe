import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: string
    name: string
    key: string
}

interface AuthStore {
    user: User | null
    setUser: (user: User) => void
    clearUser: () => void
    guestApiKey: string
    setGuestApiKey: (key: string) => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            clearUser: () => set({ user: null }),
            guestApiKey: '',
            setGuestApiKey: (guestApiKey) => set({ guestApiKey }),
        }),
        {
            name: 'auth-storage',
        }
    )
)