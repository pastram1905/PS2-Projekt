import { useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"


export default function ProtectedRoute({ children }) {
    const getCurrentUser = useAuthStore(state => state.getCurrentUser)
    const user = useAuthStore(state => state.user)
    const loading = useAuthStore(state => state.loading)

    useEffect(() => {
        getCurrentUser()
    }, [])

    if (loading) return
    if (!user) return <Navigate to="/auth" />
    return children
}
