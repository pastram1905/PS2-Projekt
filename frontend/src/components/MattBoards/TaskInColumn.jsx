import { useEffect, useState } from "react"
import TaskMatt from "./Task"
import mattermostApi from "../../apis/mattApi"
import { Trash2 } from "lucide-react"
import { format } from 'date-fns'
import { Eye } from "lucide-react"
import { EyeOff } from "lucide-react"


export default function TaskInColumnMatt({ boardID, boardMembers, task, columnID, dragHandleProps = {}, setTasksMap, setRefresh, dependsOnOptions, setDependsOnOptions, setRefreshParents }) {
    const [parents, setParents] = useState([])
    const [showProperties, setShowProperties] = useState(false)

    useEffect(() => {
        getParents()
    }, [dependsOnOptions, task.Depends_on])

    const deleteTask = async () => {
        try {
            const response = await mattermostApi.delete("/board/columns/tasks/", {
                params: {
                    board_id: boardID,
                    task_id: task.id
                }
            })

            if (response.status === 200) {
                setTasksMap((prev) => {
                    const currentTasks = prev[columnID] || []
                    const updatedTasks = currentTasks.filter(t => t.id !== task.id)
                    return { ...prev, [columnID]: updatedTasks }
                })
                setDependsOnOptions(prev => prev.filter(t => t.id !== task.id))
                setRefreshParents(prev => !prev)
                setRefresh(prev => !prev)

            } else {
                console.log("Failed to delete task")
            }

        } catch (error) {
            console.log(error)
        }
    }

    const getParents = () => {
        if (!Array.isArray(dependsOnOptions) || !Array.isArray(task.Depends_on)) return
    
        const matchedParents = dependsOnOptions
            .filter(parentTask => task.Depends_on.includes(parentTask.id))
            .map(parentTask => parentTask.value)
    
        setParents(matchedParents)
    }

    return <>
        {task.title && task.Description && task.Start_Date !== null && task.End_Date !== null ? (
            <div className="bg-white border border-gray-300 text-sm rounded-lg shadow-md hover:shadow-xl transition-shadow">
                <div className="p-2 flex flex-col gap-2 relative">
                    <div className="p-2 space-y-2 bg-gray-100 rounded-lg">
                        <div
                            className="w-48 cursor-grab rounded-lg hover:text-gray-700"
                            title="Drag"
                            {...dragHandleProps}
                        ><p className="font-bold text-sm">{task.title}</p>
                        </div>

                        {showProperties && (
                            <div className="w-48 space-y-2">
                                <div className="space-y-1">
                                    <p className="text-xs">Description:</p>
                                    <p className="font-bold text-sm">{task.Description}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs">Start Date:</p>
                                    <p className="font-bold text-sm">{format(new Date(task.Start_Date), 'yyyy-MM-dd')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs">End Date:</p>
                                    <p className="font-bold text-sm">{format(new Date(task.End_Date), 'yyyy-MM-dd')}</p>
                                </div>
                                {parents && parents.length > 0 ? (
                                    <div className="space-y-1">
                                        <p className="text-xs">Depends on:</p>
                                        <p className="font-bold text-md">
                                            {parents.map((parent, index) => (
                                                <span key={index} className="block my-1">{parent}</span>
                                            ))}
                                        </p>
                                    </div>
                                ) : null}
                                {task.Assignee_Username && task.Assignee_ID ? (
                                    <div className="space-y-1">
                                        <p className="text-xs">Assignee:</p>
                                        <p className="font-bold text-sm">{task.Assignee_Username}</p>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        <button
                            onClick={() => setShowProperties(prev => !prev)}
                            className="text-xs bg-blue-200 hover:bg-blue-300 text-blue-800 rounded px-2 py-1 w-fit"
                        >{showProperties ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="flex justify-center py-1 gap-4">
                        <TaskMatt
                            boardID={boardID}
                            boardMembers={boardMembers}
                            columnID={columnID}
                            task={task}
                            setRefresh={setRefresh}
                            setRefreshParents={setRefreshParents}
                            dependsOnOptions={dependsOnOptions}
                            onTaskUpdated={(updatedFields) => {
                                setTasksMap(prev => ({
                                    ...prev,
                                    [columnID]: prev[columnID].map(t =>
                                        t.id === task.id ? { ...t, ...updatedFields } : t
                                    )
                                }))
                            }}
                        />
                        <button
                            className="w-16 p-1 bg-red-400 flex items-center justify-center text-sm text-white rounded-lg cursor-pointer hover:bg-red-500 transition duration-200"
                            onClick={deleteTask}
                        ><Trash2 size={24} />
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <></>
        )}
    </>
}
