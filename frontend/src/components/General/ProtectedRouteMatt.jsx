import { useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useMattAuthStore } from "../../store/mattAuthStore"


export default function ProtectedRouteMattermost({ children }) {
    const getCurrentUser = useMattAuthStore(state => state.getCurrentUser)
    const user = useMattAuthStore(state => state.user)
    const loading = useMattAuthStore(state => state.loading)
    
    useEffect(() => {
        if (user === null) {
            getCurrentUser()
        }
    }, [user])
    
    if (loading) return
    if (!user) return <Navigate to="/matt_not_auth" />
    return children
}
