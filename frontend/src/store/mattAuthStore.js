import { create } from "zustand"
import mattermostApi from "../apis/mattApi"


export const useMattAuthStore = create((set, get) => ({
    user: null,
    loading: true,

    getCurrentUser: async () => {
        set({ loading: true })

        try {
            const response = await mattermostApi.get("/user/")
            if (response.status === 200) {
                set({ user: response.data })

            } else {
                set({ user: null })
            }

        } catch (error) {
            set({ user: null })

        } finally {
            set({ loading: false })
        }
    },

    loginUser: async (login, password) => {
        try {
            const response = await mattermostApi.post("/token/", {
                mattermost_login: login,
                mattermost_password: password
            })
            await get().getCurrentUser()
            return response.status === 200 ? response : null

        } catch (error) {
            return null
        }
    },

    logoutMattUser: async () => {
        try {
            await mattermostApi.post("/logout_mattermost/")
            
        } catch (error) {
            console.error("Logout failed", error)
        }
        
        localStorage.removeItem("matt_boards")
        localStorage.removeItem("matt_team_id")
        set({ user: null })
    }
}))
