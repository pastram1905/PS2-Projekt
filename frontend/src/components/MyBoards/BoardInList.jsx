import { useNavigate } from "react-router-dom"
import api from "../../apis/api"
import { Eye } from "lucide-react"
import { Trash2 } from "lucide-react"


export default function BoardInList({ board, setRefresh }) {
    const navigate = useNavigate()

    const deleteBoard = async () => {
        try {
            const response = await api.delete(`/kanban/boards/${board.id}`)

            if (response.status === 200) {
                setRefresh(prev => !prev)

            } else {
                console.log("Failed to delete board")
            }

        } catch (error) {
            console.log(error)
        }
    }

    const goToBoard = () => {
        navigate(`/boards/${board.id}`)
    }

    return (
        <div className="flex items-center bg-gray-50 shadow-lg border-2 border-gray-300 rounded-xl p-2 hover:shadow-xl transition-shadow duration-200">
            <div className="w-[60%]">
                <h1 className="font-bold">{board.title}</h1>
                <p>{board.description}</p>
            </div>

            <div className="flex ml-auto gap-4">
                <button 
                    className="bg-blue-400 text-white rounded-lg px-5 py-3 ml-auto cursor-pointer shadow-md hover:bg-blue-500 transition duration-200"
                    onClick={goToBoard}
                ><Eye size={18} />
                </button>
                <button
                    className="bg-red-400 text-white rounded-lg px-5 py-3 ml-auto cursor-pointer shadow-md hover:bg-red-500 transition duration-200"
                    onClick={deleteBoard}
                ><Trash2 size={18} />
                </button>
            </div>
        </div>
    )
}
