import { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import mattermostApi from "../../apis/mattApi"
import { Plus } from "lucide-react"


export default function BoardCreatorMatt({ teams, setRefresh }) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedTeam, setSelectedTeam] = useState()
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (teams.length > 0 && !selectedTeam) {
            setSelectedTeam(teams[0].id)
        }
    }, [teams])

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const response = await mattermostApi.post("/board/", null, {
                params: {
                    team_id: selectedTeam,
                    title: title,
                    description: description
                }
            })

            if (response.status === 200) {
                setIsOpen(false)
                setTitle("")
                setDescription("")
                setRefresh(prev => !prev)

            } else {
                console.log("Failed to make board")
            }

        } catch (error) {
            console.log(error)
        }
    }
    
    const handleChange = (event) => {
        setSelectedTeam(event.target.value)
    }

    return <div className="flex ml-auto">
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
                <button className="bg-gray-600 px-6 py-3 text-white rounded-lg cursor-pointer hover:bg-gray-700 transition duration-200">
                    <Plus size={16} />
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

                                <Dialog.Title className="text-xl font-semibold text-gray-800 mb-4">
                                    New Board
                                </Dialog.Title>
                                <Dialog.Description />

                                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-3">
                                        <input
                                            className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none"
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
                                        <div className="flex flex-col gap-2">
                                            <label
                                                className="text-gray-500"
                                                htmlFor="dropdown"
                                            >Team
                                            </label>
                                            <select
                                                className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-gray-500 focus:outline-none"
                                                id="dropdown"
                                                value={selectedTeam}
                                                onChange={handleChange}
                                            >
                                                {teams.map((team) => (
                                                    <option
                                                        key={team.id}
                                                        value={team.id}
                                                    >{team.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
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
