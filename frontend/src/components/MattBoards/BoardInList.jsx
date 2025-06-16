import { useNavigate } from "react-router-dom"
import mattermostApi from "../../apis/mattApi"
import { Eye } from "lucide-react"
import { Trash2 } from "lucide-react"


export default function BoardInListMatt({ board, setRefresh }) {
    const navigate = useNavigate()

    const goToBoard = () => {
        navigate(`/matt_board/${board.id}`)
    }

    const deleteBoard = async () => {
        try {
            const response = await mattermostApi.delete("/board/", {
                params: { board_id: board.id }
            })

            if (response.status === 200) return setRefresh(prev => !prev)
            else console.log("Failed to delete board")

        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="bg-gray-50 flex p-2 border-2 border-gray-300 rounded-lg shadow-md hover:shadow-lg transition duration-200">
            <div className="w-[60%]">
                <p className="font-bold">{board.title}</p>
                <p>{board.description}</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
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
