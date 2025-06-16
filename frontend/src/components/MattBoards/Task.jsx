import { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import mattermostApi from "../../apis/mattApi"
import DatePicker from "react-datepicker"
import Select from "react-select"
import "react-datepicker/dist/react-datepicker.css"
import { Pencil } from "lucide-react"


export default function TaskMatt({ boardID, boardMembers, columnID, task, setRefresh, setRefreshParents, dependsOnOptions, onTaskUpdated }) {
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.Description)
    const [startDate, setStartDate] = useState(task.Start_Date)
    const [endDate, setEndDate] = useState(task.End_Date)
    
    const [prevTitle, setPrevTitle] = useState(task.title)
    const [prevDescription, setPrevDescription] = useState(task.Description)
    const [prevStartDate, setPrevStartDate] = useState(startDate)
    const [prevEndDate, setPrevEndDate] = useState(endDate)
    
    const [isOpen, setIsOpen] = useState(false)

    const getMatchingParentObjects = (taskIDs, options) =>
    Array.isArray(taskIDs) && Array.isArray(options)
        ? options
              .filter(opt => opt && typeof opt.id === 'string')
              .filter(opt => taskIDs.includes(opt.id))
        : []
    
    const [parentsList, setParentsList] = useState(() => getMatchingParentObjects(task.Depends_on, dependsOnOptions) || [])
    const [prevParentsList, setPrevParentsList] = useState(getMatchingParentObjects(task.Depends_on, dependsOnOptions))

    const [assigneeID, setAssigneeID] = useState(task.Assignee_ID)

    useEffect(() => {
        const updated = getMatchingParentObjects(task.Depends_on, dependsOnOptions) || []

        const updatedIDs = updated.map(opt => opt.id).filter(Boolean).sort()
        const currentIDs = (parentsList ?? []).map(opt => opt.id).filter(Boolean).sort()

        if (JSON.stringify(updatedIDs) !== JSON.stringify(currentIDs)) {
            setParentsList(updated)
            setPrevParentsList(updated)
        }
    }, [JSON.stringify(task.Depends_on), JSON.stringify(dependsOnOptions)])

    const renameTask = async (title) => {
        try {
            const response = await mattermostApi.patch("/board/columns/tasks/rename/", {}, {
                params: {
                    board_id: boardID,
                    task_id: task.id,
                    new_title: title
                }
            })

            if (response.status === 200) {
                setRefreshParents(prev => !prev)
            }
            else console.log("Failed to update task")

        } catch (error) {
            console.log(error)
        }
    }

    const updateTask = async ({ description, startDate, endDate, parentsList, assigneeID }) => {
        try {
            const response = await mattermostApi.patch("/board/columns/tasks/", parentsList, {
                params: {
                    board_id: boardID,
                    column_id: columnID,
                    task_id: task.id,
                    description: description ?? "",
                    start_date: new Date(startDate).getTime(),
                    end_date: new Date(endDate).getTime(),
                    assignee_id: assigneeID
                }
            })

            if (response.status === 200) {
                setRefresh(prev => !prev)
                setRefreshParents(prev => !prev)
            }
            else console.log("Failed to update task")

        } catch (error) {
            console.log(error)
        }
    }

    const commitUpdateTask = async () => {
        const trimmedTitle = (title ?? "").trim()
        const trimmedDescription = (description ?? "").trim()
        const prevParentIDs = prevParentsList.map(opt => opt.id).sort()
        const currentParentIDs = (parentsList ?? []).map(opt => opt.id).sort()
        console.log(currentParentIDs)
        const parentsChanged = JSON.stringify(prevParentIDs) !== JSON.stringify(currentParentIDs)

        if (trimmedTitle !== prevTitle) {
            await renameTask(trimmedTitle)
            setPrevTitle(trimmedTitle)
            setRefresh(prev => !prev)
        }
        if (trimmedDescription !== prevDescription) {
            await updateTask({
                description: trimmedDescription,
                startDate,
                endDate,
                parentsList: currentParentIDs,
                assigneeID
            })
            setPrevDescription(trimmedDescription)
            setRefresh(prev => !prev)
            if (onTaskUpdated) {
                onTaskUpdated({ Description: trimmedDescription })
            }
        }
        if (parentsChanged) {
            await updateTask({
                description,
                startDate,
                endDate,
                parentsList: currentParentIDs,
                assigneeID
            })
            setPrevParentsList(parentsList)
            setRefresh(prev => !prev)
        }
    }

    const assigneeOptions = (boardMembers ?? []).map(member => ({
        value: member.id,
        label: member.username
    }))

    return <div className="flex">
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
                <button className="w-16 bg-blue-400 flex items-center justify-center text-sm text-white rounded-lg cursor-pointer hover:bg-blue-500 transition duration-200">
                    <Pencil size={18} />
                </button>
            </Dialog.Trigger>

            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        <Dialog.Overlay asChild>
                            <motion.div
                                className="fixed inset-0 bg-black/30"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            />
                        </Dialog.Overlay>
                        
                        <Dialog.Content asChild
                            onInteractOutside={(e) => e.preventDefault()}
                            onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                            <motion.div
                                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-lg w-[400px] my-6 p-4"
                                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >

                                <Dialog.Title className="text-xl font-semibold text-gray-800 mb-3">
                                    Edit Task
                                </Dialog.Title>
                                <Dialog.Description />

                                <div className="space-y-3 rounded-lg">
                                    <div>
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onBlur={commitUpdateTask}
                                        />
                                    </div>
                                    <div>
                                        <textarea
                                            className="w-full h-24 p-2 border border-gray-300 rounded-lg shadow-sm resize-none focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                            value={description ?? ''}
                                            onChange={(e) => setDescription(e.target.value)}
                                            onBlur={commitUpdateTask}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <DatePicker
                                            selected={startDate}
                                            onChange={async (date) => {
                                                setStartDate(date)
                                                if (date.getTime() !== new Date(prevStartDate).getTime()) {
                                                    await updateTask({
                                                        description,
                                                        startDate: date,
                                                        endDate,
                                                        parentsList: (parentsList ?? []).map(opt => opt.id).sort(),
                                                        assigneeID
                                                    })
                                                    setPrevStartDate(date)
                                                    setRefresh(prev => !prev)
                                                    if (onTaskUpdated) {
                                                        onTaskUpdated({ Start_Date: date })
                                                    }
                                                }
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                            placeholderText="Select start date"
                                            dateFormat="yyyy-MM-dd"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <DatePicker
                                            selected={endDate}
                                            onChange={async (date) => {
                                                setEndDate(date)
                                                if (date.getTime() !== new Date(prevEndDate).getTime()) {
                                                    await updateTask({
                                                        description,
                                                        startDate,
                                                        endDate: date,
                                                        parentsList: (parentsList ?? []).map(opt => opt.id).sort(),
                                                        assigneeID
                                                    })
                                                    setPrevEndDate(date)
                                                    setRefresh(prev => !prev)
                                                    if (onTaskUpdated) {
                                                        onTaskUpdated({ End_Date: date })
                                                    }
                                                }
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                            placeholderText="Select start date"
                                            dateFormat="yyyy-MM-dd"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <Select
                                            isMulti
                                            options={dependsOnOptions.filter(parent => parent.id !== task.id)}
                                            getOptionLabel={(e) => e.value}
                                            getOptionValue={(e) => e.id}
                                            value={parentsList}
                                            onChange={async (selectedOptions) => {
                                                setParentsList(selectedOptions)
                                        
                                                const selectedIds = selectedOptions.map(opt => opt.id)
                                                const prevIds = prevParentsList.map(opt => opt.id)
                                        
                                                const hasChanged = JSON.stringify(selectedIds.sort()) !== JSON.stringify(prevIds.sort())
                                        
                                                if (hasChanged) {
                                                    await updateTask({
                                                        description,
                                                        startDate,
                                                        endDate,
                                                        parentsList: selectedIds,
                                                        assigneeID
                                                    })
                                                    setPrevParentsList(selectedOptions)
                                                }
                                            }}
                                            placeholder="Depends on"
                                            classNamePrefix="react-select"
                                            menuPlacement="top"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <Select
                                            options={assigneeOptions}
                                            value={assigneeOptions.find(option => option.value === assigneeID) || null}
                                            onChange={async (selectedOption) => {
                                                const selectedValue = selectedOption ? selectedOption.value : ""

                                                setAssigneeID(selectedValue)

                                                if (selectedValue !== task.Assignee_ID) {
                                                    await updateTask({
                                                        description,
                                                        startDate,
                                                        endDate,
                                                        parentsList: (parentsList ?? []).map(opt => opt.id).sort(),
                                                        assigneeID: selectedValue
                                                    })
                                                }
                                            }}
                                            placeholder="Assignee"
                                            classNamePrefix="react-select"
                                            menuPlacement="top"
                                            isClearable
                                        />
                                    </div>
                                </div>

                                <button
                                    className="w-full mt-4 bg-red-400 text-white py-2 rounded-lg shadow-md cursor-pointer hover:bg-red-500 transition duration-200"
                                    onClick={() => setIsOpen(false)}
                                    type="button"
                                >Close
                                </button>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    </div>
}
