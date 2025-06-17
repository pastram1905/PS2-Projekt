import { useState } from "react"
import api from "../../apis/api"
import * as Dialog from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import DatePicker from "react-datepicker"
import Select from "react-select"
import "react-datepicker/dist/react-datepicker.css"
import { FilePlus } from "lucide-react"


export default function TaskCreator({ columnID, onTaskCreated, existingTasks, allParentTasks, setRefresh }) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)
    const [selectedParentTasks, setSelectedParentTasks] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        const position = existingTasks.length
        const formatDate = (date) => date?.toLocaleDateString('en-CA')

        try {
            const response = await api.post(`/kanban/columns/${columnID}/tasks/`, {
                title: title,
                description: description,
                position: position,
                column_id: columnID,
                start_date: formatDate(startDate),
                end_date: formatDate(endDate),
                parent_ids: selectedParentTasks.map(task => task.value)
            })

            if (response.status === 200) {
                setIsOpen(false)
                setTitle("")
                setDescription("")
                setStartDate(null)
                setEndDate(null)
                setSelectedParentTasks([])
                onTaskCreated(response.data)
                setRefresh(prev => !prev)

            } else {
                console.log("Failed to create task")
            }

        } catch (error) {
            console.log(error)
        }
    }

    const parentOptions = allParentTasks.map(task => ({
        value: task.id,
        label: task.title
    }))
    
    return <div className="flex">
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
                <button className="w-18 mx-auto bg-blue-400 flex items-center justify-center text-white text-sm px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-500 transition duration-200">
                    <FilePlus size={18} />
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
                        
                        <Dialog.Content asChild onInteractOutside={(e) => e.preventDefault()}>
                            <motion.div
                                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-lg w-[400px] my-6 p-6"
                                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >

                                <Dialog.Title className="text-xl font-semibold text-gray-800 mb-6">
                                    New Task
                                </Dialog.Title>
                                <Dialog.Description />

                                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-4">
                                        <input
                                            className="border rounded-lg p-2"
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Title"
                                            required
                                        />
                                        <textarea
                                            className="h-28 resize-none border rounded-lg p-2"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Description"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm text-gray-700">Parent Tasks</label>
                                        <Select
                                            className="react-select-container"
                                            isMulti
                                            options={parentOptions}
                                            value={selectedParentTasks}
                                            onChange={setSelectedParentTasks}
                                            placeholder="Select parent tasks..."
                                            classNamePrefix="react-select"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex flex-col gap-1 flex-1">
                                            <label className="text-sm text-gray-700">Start Date</label>
                                            <DatePicker
                                                selected={startDate}
                                                onChange={(date) => setStartDate(date)}
                                                className="border rounded-lg p-2 w-full"
                                                placeholderText="Select start date"
                                                dateFormat="yyyy-MM-dd"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1 flex-1">
                                            <label className="text-sm text-gray-700">End Date</label>
                                            <DatePicker
                                                selected={endDate}
                                                onChange={(date) => setEndDate(date)}
                                                className="border rounded-lg p-2 w-full"
                                                placeholderText="Select end date"
                                                dateFormat="yyyy-MM-dd"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <button
                                            className="bg-blue-500 text-white py-2 rounded-lg shadow-md cursor-pointer hover:bg-blue-700 transition duration-200"
                                            type="submit"
                                        >Create
                                        </button>

                                        <button
                                            className="bg-red-400 text-white py-2 rounded-lg shadow-md cursor-pointer hover:bg-red-500 transition duration-200"
                                            onClick={() => setIsOpen(false)}
                                            type="button"
                                        >Cancel
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    </div>
}
