import { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import mattermostApi from "../../apis/mattApi"
import DatePicker from "react-datepicker"
import Select from "react-select"
import "react-datepicker/dist/react-datepicker.css"
import { FilePlus } from "lucide-react"


export default function TaskCreatorMatt({ boardID, boardMembers, columnID, setRefresh, dependsOnOptions, setRefreshParents }) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)
    const [selectedParentTasks, setSelectedParentTasks] = useState([])
    const [assigneeSelected, setAssigneeSelected] = useState(null)
    const [isOpen, setIsOpen] = useState(false)

    const normalizeDateToUTC = (date) => {
        //console.log(Object.prototype.toString.call(date))
        //console.log(date)
        if (!date) return null
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        console.log(utcDate.getTime())
        console.log(typeof utcDate.getTime())
        return utcDate.getTime()
    }

    const parentOptions = dependsOnOptions.map(task => ({
        value: task.id,
        label: task.value
    }))

    const assigneeOptions = boardMembers.map(member => ({
        value: member.id,
        label: member.username
    }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        const values = selectedParentTasks.map(task => task.value)
        const assigneeId = assigneeSelected ? assigneeSelected.value : null

        try {
            const response = await mattermostApi.post("/board/columns/tasks/", values, {
                params: {
                    board_id: boardID,
                    block_id: "v6kpn95ihmirjfb8bgzhhg9s6ka",
                    column_id: columnID,
                    title: title,
                    description: description,
                    start_date: normalizeDateToUTC(startDate),
                    end_date: normalizeDateToUTC(endDate),
                    assignee_id: assigneeId
                }
            })
            
            selectedParentTasks.map(task => task.value)

            if (response.status === 200) {
                setIsOpen(false)
                setTitle("")
                setDescription("")
                setStartDate(null)
                setEndDate(null)
                setAssigneeSelected([])
                setRefresh(prev => !prev)
                setRefreshParents(prev => !prev)

            } else {
                console.log("Failed to create task")
            }

        } catch (error) {
            console.log(error)
        }
    }
    
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
                                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-lg w-[400px] p-4"
                                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >

                                <Dialog.Title className="text-lg font-semibold text-gray-800 mb-3">
                                    New Task
                                </Dialog.Title>
                                <Dialog.Description />

                                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-3">
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Title"
                                            required
                                        />
                                        <textarea
                                            className="w-full h-24 p-2 border border-gray-300 rounded-lg shadow-sm resize-none focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Description"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex flex-col gap-1 flex-1">
                                            <DatePicker
                                                selected={startDate}
                                                onChange={(date) => setStartDate(date)}
                                                className="border border-gray-300 shadow-sm rounded-lg p-2 w-full focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                                placeholderText="Start Date"
                                                dateFormat="yyyy-MM-dd"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1 flex-1">
                                            <DatePicker
                                                selected={endDate}
                                                onChange={(date) => setEndDate(date)}
                                                className="border border-gray-300 shadow-sm rounded-lg p-2 w-full focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                                placeholderText="End Date"
                                                dateFormat="yyyy-MM-dd"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <Select
                                            className="react-select-container"
                                            isMulti
                                            options={parentOptions}
                                            onChange={setSelectedParentTasks}
                                            value={selectedParentTasks}
                                            placeholder="Depends on"
                                            classNamePrefix="react-select"
                                            menuPlacement="top"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <Select
                                            className="react-select-container"
                                            options={assigneeOptions}
                                            onChange={setAssigneeSelected}
                                            value={assigneeSelected}
                                            placeholder="Assignee"
                                            classNamePrefix="react-select"
                                            menuPlacement="top"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3">
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
