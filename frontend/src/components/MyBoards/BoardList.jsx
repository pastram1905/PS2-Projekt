import { useEffect, useState } from "react"
import BoardInList from "./BoardInList"
import BoardCreator from "./BoardCreator"
import api from "../../apis/api"
import ImportCsv from "./ImportToCsv"


export default function BoardList() {
    const [boards, setBoards] = useState([])
    const [refresh, setRefresh] = useState(false)

    useEffect(() => {
        getBoards()
    }, [refresh])

    const getBoards = async () => {
        try {
            const response = await api.get("/kanban/boards/")

            if (response.status === 200) {
                setBoards(response.data)

            } else {
                console.log("Failed to get boards")
            }

        } catch (error) {
            console.log(error)
        }
    }

    const handleBoardCreated = (newBoard) => {
        setBoards(prevBoards => [...prevBoards, newBoard])
    }

    return (
        <div className="mx-auto mt-4 mb-12 space-y-3">
            <div className="flex items-center">
                <h2 className="text-xl font-bold text-gray-900">
                    Local Boards
                </h2>
                <div className="flex ml-auto gap-3">
                    <ImportCsv setRefresh={setRefresh} />
                    <BoardCreator onBoardCreated={handleBoardCreated} />
                </div>
            </div>

            {boards.length > 0 ? (
                <>
                    {boards.map((board) => (
                        <BoardInList 
                            key={board.id}
                            board={board}
                            setRefresh={setRefresh}
                        />
                    ))}
                </>
            ) : (
                <>
                    <div className="flex bg-gray-50 border-2 border-gray-300 rounded-xl shadow-md">
                        <p className="mx-auto my-20">No boards found</p>
                    </div>
                </>
            )}
        </div>
    )
}
