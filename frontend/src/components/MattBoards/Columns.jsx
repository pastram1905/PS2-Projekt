import { DndContext, closestCenter, useSensors, useSensor, PointerSensor } from "@dnd-kit/core"
import { DragOverlay } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useEffect, useState } from "react"
import MattColumn from "./Column"
import TaskInColumnMatt from "./TaskInColumn"
import mattermostApi from "../../apis/mattApi"
import { Users, UserMinus } from 'lucide-react'
import AsyncSelect from "react-select/async"


export default function MattColumns({ board, boardID, teamID }) {
    const [columns, setColumns] = useState([])
    const [newColName, setNewColName] = useState("")
    const [tasksMap, setTasksMap] = useState({})
    const [activeTask, setActiveTask] = useState(null)
    const [blockID, setBlockID] = useState()
    const [dependsOnOptions, setDependsOnOptions] = useState([])
    const [boardMembers, setBoardMembers] = useState([])
    const [refreshMembers, setRefreshMembers] = useState(false)
    const [refresh, setRefresh] = useState(false)
    const [refreshParents, setRefreshParents] = useState(false)
    const [membersIsOpen, setMembersIsOpen] = useState(false)
    const [newMember, setNewMember] = useState()

    const sensors = useSensors(useSensor(PointerSensor))

    useEffect(() => {
        getColumnsWithTasks()
        getBlockID()
    }, [refresh])

    useEffect(() => {
        getDependsOnOptions()
    }, [refreshParents])
    
    useEffect(() => {
        if (teamID) {
            getBoardMembers()
        }
    }, [teamID, newMember, refreshMembers])

    const getColumnsWithTasks = async () => {
        try {
            const response = await mattermostApi.get("/board/columns_with_tasks/", {
                params: {
                    board_id: boardID,
                    team_id: teamID
                },
                withCredentials: true
            })

            if (response.status === 200) {
                setColumns(response.data)

                const tasksByColumn = {}
                response.data.forEach(col => {
                    const sortedTasks = [...(col.tasks || [])].sort((a, b) => a.position - b.position)
                    tasksByColumn[col.id] = sortedTasks
                })
                setTasksMap(tasksByColumn)
                console.log(tasksByColumn)

            } else {
                console.log("Failed to get columns")
            }
            
        } catch (error) {
            console.log(error)
        }
    }

    const getBlockID = async () => {
        try {
            const response = await mattermostApi("/board/get_block_id/", {
                params: {
                    board_id: boardID
                }
            })
            
            if (response.status === 200) setBlockID(response.data)
            else console.log("Failed to get block id")

        } catch (error) {
            console.log(error)
        }
    }

    const getDependsOnOptions = async () => {
        try {
            const response = await mattermostApi.get("/board/", {
                params: {
                    board_id: boardID
                }
            })

            if (response.status === 200) {
                response.data.cardProperties.forEach((prop) => {
                    if (prop.name === "Depends on") {
                        setDependsOnOptions(prop.options)
                    }
                })
            }

        } catch (error) {
            console.log(error)
        }
    }

    const getBoardMembers = async () => {
        try {
            const response = await mattermostApi.get("/board/members/", {
                params: {
                    board_id: boardID,
                    team_id: teamID
                }
            })

            if (response.status === 200) {
                setBoardMembers(response.data)
            }

        } catch (error) {
            console.log(error)
        }
    }

    const createColumn = async () => {
        if (!newColName.trim()) return

        try {
            const response = await mattermostApi.post("/board/columns/", null, {
                params: {
                    board_id: boardID,
                    new_column: newColName
                }
            })

            if (response.status === 200) {
                setNewColName("")
                setRefresh(prev => !prev)

            } else {
                console.log("Failed to create a column")
            }

        } catch (error) {
            console.log(error)
        }
    }

    const handleDragStart = (event) => {
        const { active } = event
        const [columnID, taskID] = active.id.split("-")
        const task = tasksMap[columnID]?.find(t => t.id.toString() === taskID)
        if (task) {
            setActiveTask({ ...task, columnID })
        }
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
            
        if (!over || active.id === over.id) {
            setActiveTask(null)
            return
        }

        const [activeColID, activeTaskID] = active.id.split("-")
        const [overColID, overTaskID] = over.id.split("-")

        if (!activeColID || !activeTaskID || !overColID) {
            setActiveTask(null)
            return
        }

        if (activeColID !== overColID) {
            await moveTaskBetweenColumns(activeColID, activeTaskID, overColID, overTaskID)

        } else {
            await reorderTasksInColumn(activeColID, active.id, over.id)
        }
    }

    const moveTaskBetweenColumns = async (activeColID, activeTaskID, overColID, overTaskID) => {
        const activeTasks = [...tasksMap[activeColID]]
        const overTasks = [...tasksMap[overColID]]

        const draggedTask = activeTasks.find(task => task.id.toString() === activeTaskID)
        if (!draggedTask) return

        const updatedActive = activeTasks.filter(t => t.id !== draggedTask.id)
        let insertIndex = overTasks.findIndex(t => t.id.toString() === overTaskID)
        if (insertIndex === -1) insertIndex = overTasks.length

        const updatedOver = [...overTasks]
        updatedOver.splice(insertIndex, 0, { ...draggedTask, column: parseInt(overColID) })
        
        const updatedMap = {
            ...tasksMap,
            [activeColID]: updatedActive,
            [overColID]: updatedOver
        }
        setTasksMap(updatedMap)

        const taskList = updatedOver.map(task => task.id)

        try {
            await mattermostApi.patch("/board/task_column/", taskList, {
                params: {
                    board_id: boardID,
                    block_id: blockID,
                    column_id: overColID,
                    task_id: draggedTask.id
                }
            })
        } catch (error) {
            console.log(error)
        }

        setRefresh(prev => !prev)
    }

    const reorderTasksInColumn = async (columnID, activeID, overID) => {
        const tasks = [...tasksMap[columnID]]
        const oldIndex = tasks.findIndex(task => `${columnID}-${task.id}` === activeID)
        const newIndex = tasks.findIndex(task => `${columnID}-${task.id}` === overID)

        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(tasks, oldIndex, newIndex)

        setTasksMap(prev => ({
            ...prev,
            [columnID]: reordered
        }))

        const taskList = reordered.map(task => task.id)

        try {
            await mattermostApi.patch("/board/task_column/", taskList, {
                params: {
                    board_id: boardID,
                    block_id: blockID,
                    column_id: columnID,
                    task_id: reordered[0].id
                }
            })

        } catch (error) {
            console.log(error)
        }

        setRefresh(prev => !prev)
    }

    const commitNewColumn = () => {
        if (newColName.trim()) {
            createColumn()
        }
    }

    if (!board || !Array.isArray(board.cardProperties)) {
        return <div>No data</div>
    }

    const loadUserOptions = async (inputValue) => {
        if (!inputValue || inputValue.trim() === "") return []

        try {
            const response = await mattermostApi.get("/team/users/", {
                params: {
                    team_id: board.teamId,
                    query: inputValue
                }
            })

            if (response.status === 200) {
                return response.data.map(user => ({
                    value: user.id,
                    label: user.username
                }))
            }
        } catch (error) {
            console.log(error)
        }

        return []
    }

    const addMember = async (user) => {
        if (!user?.value) return

        try {
            const response = mattermostApi.post("/add_member_to_board/", null, {
                params: {
                    board_id: boardID,
                    user_id: user.value
                }
            })

            if (response.status === 200) {
                setRefresh(prev => !prev)
            }

        } catch (error) {
            console.log(error)
        }
    }

    const removeMember = async (id) => {
        try {
            const response = await mattermostApi.delete("/board/members/", {
                params: {
                    board_id: boardID,
                    member_id: id
                }
            })

            if (response.status === 200) {
                getBoardMembers()
                setRefresh(prev => !prev)
            }
            
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="my-3 p-3 bg-gray-50 border border-gray-300 rounded-2xl shadow-md">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                onDragCancel={() => setActiveTask(null)}
            >
                <div className="flex items-start p-2 gap-3 overflow-x-auto">
                    {columns.map((column) => (
                        <MattColumn 
                            key={column.id}
                            boardID={boardID}
                            boardMembers={boardMembers}
                            column={column}
                            getColumnsWithTasks={getColumnsWithTasks}
                            tasksMap={tasksMap[column.id] || []}
                            setTasksMap={setTasksMap}
                            setRefresh={setRefresh}
                            dependsOnOptions={dependsOnOptions}
                            setDependsOnOptions={setDependsOnOptions}
                            setRefreshParents={setRefreshParents}
                        />
                    ))}

                    <input
                        className="w-30 px-4 p-2 bg-gray-50 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none transition-all duration-300"
                        type="text"
                        value={newColName}
                        placeholder="New Column"
                        onChange={(e) => setNewColName(e.target.value)}
                        onBlur={commitNewColumn}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                handleBlur("newColName")
                                e.target.blur()
                            }
                        }}
                    />

                    <div className="relative inline-block text-left">
                        <button
                            onClick={() => setMembersIsOpen(!membersIsOpen)}
                            className="bg-blue-200 hover:bg-blue-300 text-blue-800 rounded px-3 py-2 w-fit flex items-center"
                        ><Users size={18} />
                        </button>

                        {membersIsOpen && (
                            <div className="absolute top-full right-0 mt-1 bg-white rounded shadow-lg text-md z-50">
                                <ul className="border border-gray-300">
                                    {Array.isArray(boardMembers) ? (
                                        boardMembers.map((member) => (
                                            <li className="px-2 py-2 hover:bg-gray-100"
                                                key={member.username}
                                            >
                                                <div className="flex items-center">
                                                    <p>{member.username}</p>
                                                    <button className="ml-auto px-3 py-2 bg-red-400 text-sm text-white rounded-sm shadow-sm cursor-pointer hover:bg-red-500 transition duration-200"
                                                        onClick={() => {
                                                            removeMember(member.id)
                                                            setRefreshMembers(prev => !prev)
                                                            setRefresh(prev => !prev)
                                                        }}
                                                    ><UserMinus size={18} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <></>
                                    )}
                                </ul>

                                <div className="flex flex-col gap-1 w-50">
                                    <AsyncSelect
                                        cacheOptions
                                        defaultOptions
                                        loadOptions={loadUserOptions}
                                        onChange={(user) => {
                                            setNewMember(user)
                                            addMember(user)
                                        }}
                                        value={""}
                                        placeholder="Users"
                                        classNamePrefix="react-select"
                                        menuPlacement="bottom"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <TaskInColumnMatt
                        task={activeTask}
                        columnID={activeTask.columnID}
                        onDelete={() => {}}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}
