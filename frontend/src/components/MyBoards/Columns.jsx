import { DndContext, closestCenter, useSensors, useSensor, PointerSensor } from "@dnd-kit/core"
import { DragOverlay } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useEffect, useState } from "react"
import Column from "./Column"
import TaskInColumn from "./TaskInColumn"
import api from "../../apis/api"


export default function Columns({ boardID }) {
    const [columns, setColumns] = useState([])
    const [newColName, setNewColName] = useState("")
    const [tasksMap, setTasksMap] = useState({})
    const [activeTask, setActiveTask] = useState(null)
    const [refresh, setRefresh] = useState(false)
    const [allParentTasks, setAllParentTasks] = useState([])

    const sensors = useSensors(useSensor(PointerSensor))

    useEffect(() => {
        getColumnsWithTasks()
        getTasksBoard()
    }, [refresh])

    const getColumnsWithTasks = async () => {
        try {
            const response = await api.get(`/kanban/boards/${boardID}/columns/`)

            if (response.status === 200) {
                setColumns(response.data)
                const tasksByColumn = {}
                await Promise.all(response.data.map(async (col) => {
                    const tasksResp = await api.get(`/kanban/columns/${col.id}/tasks/`)
                    tasksByColumn[col.id] = tasksResp.data
                }))
                setTasksMap(tasksByColumn)

            } else {
                console.log("Failed to get columns")
            }

        } catch (error) {
            console.log(error)
        }
    }

    const getTasksBoard = async () => {
        try {
            const response = await api.get(`/kanban/boards/${boardID}/tasks/`)

            if (response.status === 200) {
                setAllParentTasks(response.data)

            } else {
                console.log("Failed to get tasks")
            }

        } catch (error) {
            console.log(error)
        }
    }

    const createColumn = async () => {
        if (!newColName.trim()) return

        try {
            const response = await api.post(`/kanban/boards/${boardID}/columns/`, { title: newColName })

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

        try {
            await Promise.all([
                ...updatedOver.map((task, index) =>
                    api.patch(`/kanban/tasks/${task.id}`, {
                        title: task.title,
                        description: task.description,
                        position: index,
                        column_id: overColID,
                        start_date: task.start_date,
                        end_date: task.end_date,
                        parent_ids: task.parent_ids
                    })
                ),
                ...updatedActive.map((task, index) =>
                    api.patch(`/kanban/tasks/${task.id}`, {
                        title: task.title,
                        description: task.description,
                        position: index,
                        column_id: activeColID,
                        start_date: task.start_date,
                        end_date: task.end_date,
                        parent_ids: task.parent_ids
                    })
                )
            ])
        } catch (error) {
            console.log(error)
        }
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

        try {
            await Promise.all(
                reordered.map((task, index) =>
                    api.patch(`/kanban/tasks/${task.id}`, {
                        title: task.title,
                        description: task.description,
                        position: index,
                        column_id: columnID,
                        start_date: task.start_date,
                        end_date: task.end_date,
                        parent_ids: task.parent_ids
                    })
                )
            )

        } catch (error) {
            console.log(error)
        }
    }

    const commitNewColumn = () => {
        if (newColName.trim()) {
            createColumn()
        }
    }

    return <div className="my-3 p-3 bg-gray-50 border border-gray-300 rounded-2xl shadow-md">
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onDragCancel={() => setActiveTask(null)}
        >
            <div className="flex items-start p-2 gap-3 overflow-x-auto">
                {columns.map((column) => (
                    <Column 
                        key={column.id}
                        column={column}
                        getColumnsWithTasks={getColumnsWithTasks}
                        tasksMap={tasksMap[column.id] || []}
                        setTasksMap={setTasksMap}
                        allParentTasks={allParentTasks}
                        setAllParentTasks={setAllParentTasks}
                        setRefresh={setRefresh}
                    />
                ))}
                
                <input
                    className="w-42 px-4 p-2 bg-gray-50 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none transition-all duration-300"
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
            </div>

            <DragOverlay>
                {activeTask ? (
                    <TaskInColumn
                        task={activeTask}
                        columnID={activeTask.columnID}
                        onDelete={() => {}}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    </div>
}
