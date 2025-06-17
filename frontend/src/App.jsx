import { Routes, Route } from "react-router-dom"
import ProtectedRoute from "./components/General/ProtectedRoute"
import ProtectedRouteMattermost from "./components/General/ProtectedRouteMatt"
import Header from "./components/General/Header"
import Home from "./pages/General/Home"
import AuthPage from "./pages/General/Auth"
import BoardPage from "./pages/MyBoards/Board"
import MattBoardPage from "./pages/MattBoards/Board"
import NotAuthMattPage from "./pages/Errors/NotAuthMatt"
import PageNotFound from "./pages/Errors/PageNotFound"


export default function App() {
    return (
        <Routes>
            <Route 
                path="/"
                element={
                    <ProtectedRoute>
                        <Header />
                        <Home />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/matt_board/:id"
                element={
                    <ProtectedRoute>
                        <ProtectedRouteMattermost>
                            <Header />
                            <MattBoardPage />
                        </ProtectedRouteMattermost>
                    </ProtectedRoute>
                }
            />
            <Route 
                path="/boards/:id" 
                element={
                    <ProtectedRoute>
                        <Header />
                        <BoardPage />
                    </ProtectedRoute>
                }
            />
            <Route path="/auth" element={<AuthPage />} />
            <Route
                path="/matt_not_auth"
                element={
                    <ProtectedRoute>
                        <Header />
                        <NotAuthMattPage />
                    </ProtectedRoute>
                }
            />
            <Route 
                path="*"
                element={
                    <ProtectedRoute>
                        <Header />
                        <PageNotFound />
                    </ProtectedRoute>
                }
            />
        </Routes>
    )
}
