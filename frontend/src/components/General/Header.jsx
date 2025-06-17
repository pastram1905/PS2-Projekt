import { useNavigate } from "react-router-dom"
import { useMattAuthStore } from "../../store/mattAuthStore"
import LoginMattermost from "./LoginMattermost"
import { useEffect } from "react"
import ConfrimLogout from "./ConfirmLogout"


export default function Header() {
    const logoutMattUser = useMattAuthStore(state => state.logoutMattUser)
    const user = useMattAuthStore(state => state.user)
    const getCurrentUser = useMattAuthStore(state => state.getCurrentUser)
    const navigate = useNavigate()

    useEffect(() => {
        if (user === null) {
            getCurrentUser()
        }
    }, [user])

    const goToHome = () => {
        navigate("/")
    }

    const logoutMatt = () => {
        logoutMattUser()
    }

    const goToAuthPage = () => {
        navigate("/auth")
    }

    return <div className="bg-gray-700 text-white sticky top-0 z-100">
        <div className="flex justify-center px-4">
            <div className="flex mr-auto gap-4">
                <button
                    className="bg-gray-100 my-3 p-2 text-[13px] text-black rounded-lg cursor-pointer hover:bg-gray-300 transition duration-200"
                    onClick={goToAuthPage}
                >Sign in | Sign up
                </button>

                {user ? (
                    <div className="flex my-3 p-2 bg-gray-900 rounded-lg items-center text-[13px]">
                        <p>You are login as {user.username}</p>
                    </div>
                ) : (
                    <LoginMattermost />
                )}
            </div>

            <button
                className="h-full absolute bg-gray-700 px-6 items-center text-xl font-bold hover:bg-gray-800 transition duration-200"
                onClick={goToHome}
            >MattGantt
            </button>

            <div className="flex ml-auto gap-4">
                <ConfrimLogout />

                {user ? (
                    <button
                        className="bg-red-400 my-3 p-2 text-[13px] rounded-lg cursor-pointer hover:bg-red-500 transition duration-200"
                        onClick={logoutMatt}
                    >Logout from Mattermost
                    </button>
                ) : (
                    <></>
                )}
            </div>
        </div>
    </div>
}
