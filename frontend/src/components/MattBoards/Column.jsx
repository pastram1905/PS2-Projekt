import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { useState } from "react"
import mattermostApi from "../../apis/mattApi"
import SortableTaskMatt from "./SortableTask"
import TaskCreatorMatt from "./TaskCreator"
import { Trash2 } from "lucide-react"


export default function MattColumn({ boardID, boardMembers, column, getColumnsWithTasks, tasksMap, setTasksMap, setRefresh, dependsOnOptions, setDependsOnOptions, setRefreshParents }) {
    const [title, setTitle] = useState(column.title)
    const [prevTitle, setPrevTitle] = useState(column.title)
    const { setNodeRef } = useDroppable({ id: column.id.toString() })

    const updateColumn = async (new_name) => {
        try {
            const response = await mattermostApi.patch("/board/columns/", {}, {
                params: {
                    board_id: boardID,
                    column_id: column.id,
                    new_name: new_name
                }
            })

            if (response.status === 200) return
            else console.log("Failed to update column")

        } catch (error) {
            console.log(error)
        }
    }

    const deleteColumn = async () => {
        const taskIDs = column.tasks.map(task => task.id)
        await Promise.all(taskIDs.map(taskID => 
            mattermostApi.delete("/board/columns/tasks/", {
                params: {
                    board_id: boardID,
                    task_id: taskID
                }
            }).catch(error => console.log(error))
        ))

        try {
            const response = await mattermostApi.delete("/board/columns/", {
                params: {
                    board_id: boardID,
                    column_id: column.id
                }
            })

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
            updateColumn(trimmedTitle)
            setPrevTitle(trimmedTitle)
        }
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
                        <SortableTaskMatt
                            key={task.id}
                            boardID={boardID}
                            boardMembers={boardMembers}
                            columnID={column.id}
                            task={task}
                            setTasksMap={setTasksMap}
                            setRefresh={setRefresh}
                            dependsOnOptions={dependsOnOptions}
                            setDependsOnOptions={setDependsOnOptions}
                            setRefreshParents={setRefreshParents}
                        />
                    ))}
                </div>
            </SortableContext>
            <TaskCreatorMatt
                boardID={boardID}
                boardMembers={boardMembers}
                columnID={column.id}
                existingTasks={tasksMap}
                setRefresh={setRefresh}
                dependsOnOptions={dependsOnOptions}
                setRefreshParents={setRefreshParents}
            />
        </div>
    )
}
