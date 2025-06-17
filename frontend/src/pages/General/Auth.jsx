import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import api from "../../apis/api"


export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const loginUser = useAuthStore(state => state.loginUser)
    const logoutUser = useAuthStore(state => state.logoutUser)
    const navigate = useNavigate()

    const validateInputs = () => {
        if (!username.trim() || !password.trim()) {
            setError("Please enter both username and password")
            setSuccess("")
            return false
        }
        setError("")
        return true
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!validateInputs()) return

        try {
            await logoutUser()
            await loginUser(username, password)
            navigate("/")

        } catch {
            setError("Invalid username or password")
            setSuccess("")
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        if (!validateInputs()) return

        try {
            await api.post("/auth/register", { username, password })
            setSuccess("Registration successful. You can now log in")
            setIsLogin(true)
            setUsername("")
            setPassword("")
            setError("")

        } catch (error) {
            setError("Registration failed. User may already exist")
            setSuccess("")
        }
    }

    return (
        <div className="flex justify-center my-45">
            <form
                className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg w-100 space-y-4"
                onSubmit={isLogin ? handleLogin : handleRegister}
            >
                <h2 className="text-2xl font-semibold text-center">
                    {isLogin ? "Login" : "Register"}
                </h2>
                {error && (
                    <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 text-green-700 p-2 rounded text-sm">
                        {success}
                    </div>
                )}
                <input
                    className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-1 focus:ring-gray-500 focus:outline-none transition duration-200"
                    value={username}
                    placeholder="Username"
                    onChange={e => setUsername(e.target.value)}
                />
                <input
                    className="w-full px-3 py-2 border border-gray-400 rounded-md focus:ring-1 focus:ring-gray-500 focus:outline-none transition duration-200"
                    type="password"
                    value={password}
                    placeholder="Password"
                    onChange={e => setPassword(e.target.value)}
                />
                <button
                    className={`w-full ${
                        isLogin ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                    } text-white py-2 rounded-md transition duration-200`}
                    type="submit"
                >
                    {isLogin ? "Login" : "Register"}
                </button>
                <p className="text-sm text-center">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                        type="button"
                        className="text-blue-500 underline"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Register here" : "Login here"}
                    </button>
                </p>
            </form>
        </div>
    )
}
