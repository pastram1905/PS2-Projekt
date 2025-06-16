import { useEffect, useState } from "react"
import mattermostApi from "../../apis/mattApi"
import SetTeam from "./SetTeam"
import BoardInListMatt from "./BoardInList"
import { useMattAuthStore } from "../../store/mattAuthStore"
import LoadingIndicator from "../General/LoadingIndicator"


export default function BoardListMatt() {
    const [boards, setBoards] = useState([])
    const [teamID, setTeamID] = useState("")
    const user = useMattAuthStore(state => state.user)
    const [loading, setLoading] = useState(false)
    const [refresh, setRefresh] = useState(false)

    useEffect(() => {
        const savedTeamID = localStorage.getItem("matt_team_id")
        const savedBoards = localStorage.getItem("matt_boards")

        if (savedTeamID) {
            setTeamID(savedTeamID)
        }

        if (savedBoards) {
            try {
                setBoards(JSON.parse(savedBoards))
            } catch (error) {
                console.log("No boards", error)
            }
        }

        setLoading(false)
    }, [])

    useEffect(() => {
        if (!teamID) return
    
        const savedBoards = localStorage.getItem("matt_boards")

        if (refresh || !savedBoards) {
            getBoards(teamID)
        }
    }, [teamID, refresh])

    useEffect(() => {
        if (!user) {
            setBoards([])
            setTeamID("")
        }
    }, [user])    

    const getBoards = async (teamID) => {
        setLoading(true)

        try {
            const response = await mattermostApi.get("/boards_with_access/", {
                params: { team_id: teamID },
                withCredentials: true
            })
            setBoards(response.data)

            localStorage.setItem("matt_boards", JSON.stringify(response.data))
            localStorage.setItem("matt_team_id", teamID)

        } catch (error) {
            console.log(error)

        } finally {
            setLoading(false)
            setRefresh(false)
        }
    }

    return (
        <div className="mx-auto mt-4 rounded-lg space-y-3">
            <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Mattermost Boards</h1>
                {user ? (
                    <SetTeam
                        onTeamSelect={setTeamID}
                        setLoading={setLoading}
                        setRefresh={setRefresh}
                    />
                ) : (
                    <></>
                )}
            </div>

            {user ? (
                <>
                    {loading ? (
                        <div className="py-10">
                            <LoadingIndicator />
                        </div>
                    ) : boards.length > 0 ? (
                        <div className="space-y-3">
                            {boards.map((board) => (
                                <BoardInListMatt 
                                    key={board.id}
                                    board={board}
                                    setRefresh={setRefresh}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex bg-gray-50 border-2 border-gray-300 rounded-xl shadow-md">
                            <p className="mx-auto my-20">No boards found</p>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="flex bg-gray-50 border-2 border-gray-300 rounded-xl shadow-md">
                        <p className="mx-auto my-20">You are not logged into Mattermost</p>
                    </div>
                </>
            )}
        </div>
    )
}
