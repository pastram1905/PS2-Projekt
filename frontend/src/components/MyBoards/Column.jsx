import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import TaskCreator from "./TaskCreator"
import SortableTask from "./SortableTask"
import api from "../../apis/api"
import { Trash2 } from "lucide-react"


export default function Column({ column, getColumnsWithTasks, tasksMap, setTasksMap, allParentTasks, setAllParentTasks, setRefresh }) {
    const [title, setTitle] = useState(column.title)
    const [prevTitle, setPrevTitle] = useState(column.title)
    const { setNodeRef } = useDroppable({ id: column.id.toString() })

    const updateColumn = async (updatedFields) => {
        try {
            const response = await api.patch(`/kanban/columns/${column.id}`, updatedFields)

            if (response.status === 200) return
            else console.log("Failed to update column")

        } catch (error) {
            console.log(error)
        }
    }

    const deleteColumn = async () => {
        try {
            const response = await api.delete(`/kanban/columns/${column.id}`)

            if (response.status === 200) {
                getColumnsWithTasks()

            } else {
                console.log("Failed to delete column")
            }

        } catch (error) {
            console.log(error)
        }
    }

    const commitColumnTitleChange = () => {
        const trimmedTitle = title.trim()
        if (trimmedTitle !== prevTitle) {
            updateColumn({ title: trimmedTitle })
            setPrevTitle(trimmedTitle)
        }
    }

    const handleTaskCreated = (newTask) => {
        setTasksMap(prev => ({
            ...prev,
            [column.id]: [...(prev[column.id] || []), newTask]
        }))
    }

    return (
        <div
            className="p-2 bg-gray-100 border-1 border-gray-300 rounded-lg"
            ref={setNodeRef}
        >
            <div className="flex">
                <input
                    className="w-50 p-2 bg-gray-50 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none transition duration-200"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={commitColumnTitleChange}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            handleBlur("title")
                            e.target.blur()
                        }
                    }}
                />
                <button 
                    className="ml-2 p-2 bg-red-400 text-sm text-white rounded-lg shadow-sm cursor-pointer hover:bg-red-500 transition duration-200"
                    onClick={deleteColumn}
                ><Trash2 size={22} />
                </button>
            </div>
            <SortableContext
                items={tasksMap.map(task => `${column.id}-${task.id}`)}
                id={column.id.toString()}
                strategy={verticalListSortingStrategy}
            >
                <div className="my-4 space-y-4">
                    {tasksMap.map((task) => (
                        <SortableTask
                            key={task.id}
                            columnID={column.id}
                            task={task}
                            setTasksMap={setTasksMap}
                            allParentTasks={allParentTasks}
                            setAllParentTasks={setAllParentTasks}
                            setRefresh={setRefresh}
                        />
                    ))}
                </div>
            </SortableContext>
            <TaskCreator
                columnID={column.id}
                onTaskCreated={handleTaskCreated}
                existingTasks={tasksMap}
                allParentTasks={allParentTasks}
                setRefresh={setRefresh}
            />
        </div>
    )
}
