import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import api from "../../apis/api"
import mattermostApi from "../../apis/mattApi"
import MattColumns from "./Columns"
import GanttChartEarlyMatt from "./GanttChartEarly"
import GanttChartLateMatt from "./GanttChartLate"
import CpmGraphMatt from "./CpmGraph"
import ConfirmExport from "./ConfirmExport"


export default function MattBoard({ boardID }) {
    const [board, setBoard] = useState({})
    const [boardData, setBoardData] = useState({})
    const [title, setTitle] = useState("")
    const [prevTitle, setPrevTitle] = useState("")
    const [description, setDescription] = useState("")
    const [prevDescription, setPrevDescription] = useState("")
    const [teamID, setTeamID] = useState("")
    const [isOpenGanttEarly, setIsOpenGanttEarly] = useState(false)
    const [isOpenGanttLate, setIsOpenGanttLate] = useState(false)
    const [isOpenCpmGpaph, setIsOpenCpmGraph] = useState(false)
    
    useEffect(() => {
        getBoard()
        getBoardData()
    }, [])

    const getBoard = async () => {
        try {
            const response = await mattermostApi.get("/board/", {
                params: {
                    board_id: boardID
                },
                withCredentials: true
            })

            if (response.status === 200) {
                setBoard(response.data)
                setTitle(response.data.title)
                setDescription(response.data.description)
                setTeamID(response.data.teamId)
            }

        } catch (error) {
            console.log(error)
        }
    }

    const getBoardData = async () => {
        try {
            const response = await mattermostApi.get("/board/columns_with_tasks/", {
                params: {
                    board_id: boardID,
                    team_id: teamID
                }
            })

            if (response.status === 200) {
                setBoardData(response.data)
            }

        } catch (error) {
            console.log(error)
        }
    }

    const updateBoard = async (updatedFields) => {
        try {
            const response = await mattermostApi.patch("/board/",
                updatedFields,
                { withCredentials: true }
            )

            if (response.status === 200) return
            else console.log("Failed to update board")

        } catch (error) {
            console.log(error)
        }
    }

    const importBoardToLocal = async () => {
        try {
            await api.post("/kanban/export_from_matt/", boardData, {
                params: {
                    title: title,
                    description: description
                }
            })
            
        } catch (error) {
            console.log(error)
        }
    }

    const handleBlur = () => {
        if (title !== prevTitle || description !== prevDescription) {
            updateBoard({
                board_id: boardID,
                title: title,
                description: description
            })
            setPrevTitle(title)
            setPrevDescription(description)
        }
    }

    const toggleDropdownGanttEarly = () => {
        setIsOpenGanttEarly((prev) => !prev)
    }

    const toggleDropdownGanttLate = () => {
        setIsOpenGanttLate((prev) => !prev)
    }

    const toggleDropdownCpmGraph = () => {
        setIsOpenCpmGraph((prev) => !prev)
    }

    return (
        <div className="w-[70%] space-y-2 mx-auto my-2 p-2">
            <div className="flex gap-4">
                <div className="w-[80%] space-y-2">
                    <input
                        className="bg-gray-50 w-full p-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none transition duration-200"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => handleBlur("title")}
                    />
                    <textarea
                        className="bg-gray-50 w-full h-30 p-2 text-sm border border-gray-300 rounded-lg shadow-sm resize-none focus:ring-1 focus:ring-gray-500 focus:outline-none transition duration-200"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => handleBlur("description")}
                    />
                </div>
                <div className="w-[20%] flex flex-col gap-2">
                    <button
                        className="bg-gray-300 text-gray-900 text-sm px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-400 transition duration-200"
                        onClick={toggleDropdownGanttEarly}
                    >Gantt Chart ES/EF
                    </button>
                    <button
                        className="bg-gray-300 text-gray-900 text-sm px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-400 transition duration-200"
                        onClick={toggleDropdownGanttLate}
                    >Gantt Chart LS/LF
                    </button>
                    <button
                        className="bg-gray-300 text-gray-900 text-sm px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-400 transition duration-200"
                        onClick={toggleDropdownCpmGraph}
                    >Critical Path Graph
                    </button>
                    <ConfirmExport importBoardToLocal={importBoardToLocal} />
                </div>

            </div>
            <AnimatePresence>
                {isOpenGanttEarly && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-50 border border-gray-300 p-3 rounded-lg"
                    >
                        <GanttChartEarlyMatt boardID={boardID} teamID={teamID} />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpenGanttLate && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-50 border border-gray-300 p-3 rounded-lg"
                    >
                        <GanttChartLateMatt boardID={boardID} teamID={teamID} />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpenCpmGpaph && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-50 border border-gray-300 p-3 rounded-lg"
                    >
                        <CpmGraphMatt boardID={boardID} teamID={teamID} />
                    </motion.div>
                )}
            </AnimatePresence>
            {teamID && (
                <MattColumns board={board} boardID={boardID} teamID={teamID} />
            )}
        </div>
    )
}
