import { create } from "zustand"
import api from "../apis/api"


export const useAuthStore = create((set, get) => ({
    user: null,
    loading: true,
    refreshTimeoutRef: null,

    loginUser: async (username, password) => {
        try {
            const response = await api.post("/auth/login", new URLSearchParams({ username, password }))
            set({ user: response.data })
            get().scheduleTokenRefresh()
            
        } catch (error) {
            throw new Error("Login failed", error)
        }
    },

    getCurrentUser: async () => {
        set({ loading: true })

        try {
            const response = await api.get("/auth/me")
            if (response.status === 200) {
                set({ user: response.data })
                get().scheduleTokenRefresh()

            } else {
                set({ user: null })
            }

        } catch (error) {
            set({ user: null })

        } finally {
            set({ loading: false })
        }
    },

    refreshToken: async () => {
        try {
            const response = await api.post("/auth/refresh")
            if (response.status === 200) {
                await get().getCurrentUser()
                get().scheduleTokenRefresh()
            } else {
                get().logoutUser()

            }
        } catch (error) {
            get().logoutUser()
        }
    },

    scheduleTokenRefresh: () => {
        const { refreshTimeoutRef } = get()
        if (refreshTimeoutRef) {
            clearTimeout(refreshTimeoutRef)
        }

        const timeout = setTimeout(() => {
            get().refreshToken()
        }, 10 * 60 * 1000)

        set({ refreshTimeoutRef: timeout })
    },

    logoutUser: async () => {
        try {
            await api.post("/auth/logout")
            
        } catch (error) {
            throw new Error("Logout failed", error)
        }

        localStorage.removeItem("matt_boards")
        localStorage.removeItem("matt_team_id")
        
        const { refreshTimeoutRef } = get()
        if (refreshTimeoutRef) {
            clearTimeout(refreshTimeoutRef)
        }

        set({ user: null, refreshTimeoutRef: null })
    }
}))
