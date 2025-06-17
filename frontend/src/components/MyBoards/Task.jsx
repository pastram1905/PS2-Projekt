import { useEffect, useState } from "react"
import api from "../../apis/api"
import * as Dialog from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import DatePicker from "react-datepicker"
import Select from "react-select"
import "react-datepicker/dist/react-datepicker.css"
import { Pencil } from "lucide-react"


export default function Task({ task, onTaskUpdated, allParentTasks, setAllParentTasks, setRefreshParents }) {
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description)
    const [startDate, setStartDate] = useState(task.start_date ? new Date(task.start_date) : null)
    const [endDate, setEndDate] = useState(task.end_date ? new Date(task.end_date) : null)

    const [prevTitle, setPrevTitle] = useState(task.title)
    const [prevDescription, setPrevDescription] = useState(task.description)
    const [prevStartDate, setPrevStartDate] = useState(startDate)
    const [prevEndDate, setPrevEndDate] = useState(endDate)

    const [selectedParentTasks, setSelectedParentTasks] = useState(
        Array.isArray(task.parent_ids)
            ? task.parent_ids.map(id => ({
                value: id,
                label: Array.isArray(allParentTasks) 
                    ? allParentTasks.find(t => t.id === id)?.title || `Task ${id}`
                    : `Task ${id}`,
            }))
            : []
    )
    const [prevSelectedParentTasks, setPrevSelectedParentTasks] = useState(selectedParentTasks)

    useEffect(() => {
        const updatedParents = Array.isArray(task.parent_ids)
            ? task.parent_ids.map(id => ({
                value: id,
                label: Array.isArray(allParentTasks) 
                    ? allParentTasks.find(t => t.id === id)?.title || `Task ${id}`
                    : `Task ${id}`,
                }))
                : []
        
        setSelectedParentTasks(updatedParents)
    }, [allParentTasks])
    
    const [isOpen, setIsOpen] = useState(false)

    const formatDate = (date) => date instanceof Date ? date.toISOString().split("T")[0] : date

    const parentOptions = Array.isArray(allParentTasks)
        ? allParentTasks
            .filter(parent => parent.id !== task.id)
            .map(task => ({
                value: task.id,
                label: task.title
            })) : []
    
    const commitTaskUpdate = async (field, value) => {
        const trimmedValue = typeof value === "string" ? value.trim() : value

        let isUnchanged = false

        if (field === "title") {
            isUnchanged = trimmedValue === prevTitle
        } else if (field === "description") {
            isUnchanged = trimmedValue === prevDescription
        } else if (field === "start_date") {
            isUnchanged = trimmedValue?.toISOString() === prevStartDate?.toISOString()
        } else if (field === "end_date") {
            isUnchanged = trimmedValue?.toISOString() === prevEndDate?.toISOString()
        } else if (field === "parent_ids") {
            const prevIDs = prevSelectedParentTasks.map(t => t.value).sort()
            const newIDs = value.map(t => t.value).sort()
            isUnchanged = JSON.stringify(prevIDs) === JSON.stringify(newIDs)
        }

        if (isUnchanged) return

        switch (field) {
            case "title":
                setTitle(trimmedValue)
                setPrevTitle(trimmedValue)
                break

            case "description":
                setDescription(trimmedValue)
                setPrevDescription(trimmedValue)
                break

            case "start_date":
                setStartDate(trimmedValue)
                setPrevStartDate(trimmedValue)
                break

            case "end_date":
                setEndDate(trimmedValue)
                setPrevEndDate(trimmedValue)
                break
            
            case "parent_ids":
                setSelectedParentTasks(value)
                setPrevSelectedParentTasks(value)
                break
        }

        const updates = {
            title: field === "title" ? trimmedValue : title.trim(),
            description: field === "description" ? trimmedValue : description.trim(),
            start_date: formatDate(field === "start_date" ? trimmedValue : startDate),
            end_date: formatDate(field === "end_date" ? trimmedValue : endDate),
            parent_ids: field === "parent_ids"
                ? value.map(task => task.value)
                : selectedParentTasks.map(task => task.value),
            position: task.position,
            column_id: task.column_id
        }

        try {
            const response = await api.patch(`/kanban/tasks/${task.id}`, updates)
            if (response.status === 200 && onTaskUpdated) {
                const updatedTask = { ...task, ...updates }
                onTaskUpdated(updatedTask)
                setAllParentTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t))
                setRefreshParents(prev => !prev)
            }

        } catch (error) {
            console.log(error)
        }
    }

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
                        
                        <Dialog.Content
                            asChild
                            onInteractOutside={(e) => e.preventDefault()}
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                            <motion.div
                                className="mt-8 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-lg w-[400px] p-5"
                                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >

                                <Dialog.Title className="text-xl font-semibold text-gray-800 mb-4">
                                    Edit Task
                                </Dialog.Title>
                                <Dialog.Description />

                                <div className="p-4 space-y-4 bg-gray-100 rounded-lg">
                                    <div>
                                        <p className="mb-1 text-xs">Title:</p>
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            onBlur={() => commitTaskUpdate('title', title)}
                                        />
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs">Description:</p>
                                        <textarea
                                            className="w-full h-24 p-2 border border-gray-300 rounded-lg shadow-sm resize-none focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            onBlur={() => commitTaskUpdate('description', description)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="mb-1 text-xs">Parent Tasks:</label>
                                        <Select
                                            isMulti
                                            options={parentOptions}
                                            value={selectedParentTasks}
                                            onChange={(val) => commitTaskUpdate("parent_ids", val)}
                                            placeholder="Select parent tasks..."
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="mb-1 text-xs">Start Date:</label>
                                        <DatePicker
                                            selected={startDate}
                                            onChange={(date) => {
                                                setStartDate(date)
                                                commitTaskUpdate("start_date", date)
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                            placeholderText="Select start date"
                                            dateFormat="yyyy-MM-dd"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="mb-1 text-xs">End Date:</label>
                                        <DatePicker
                                            selected={endDate}
                                            onChange={(date) => {
                                                setEndDate(date)
                                                commitTaskUpdate("end_date", date)
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                            placeholderText="Select start date"
                                            dateFormat="yyyy-MM-dd"
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
