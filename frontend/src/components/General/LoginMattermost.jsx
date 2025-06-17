import { useState } from "react"
import { useMattAuthStore } from "../../store/mattAuthStore"
import * as Dialog from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"


export default function LoginMattermost() {
    const loginUser = useMattAuthStore(state => state.loginUser)
    const [mattLogin, setMattLogin] = useState("")
    const [mattPassword, setMattPassword] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const response = await loginUser(mattLogin, mattPassword)

            if (response.status === 200) {
                setMattLogin("")
                setMattPassword("")
                setIsOpen(false)
            }

        } catch (error) {
            console.log(error)
        }
    }

    return <div className="flex ml-auto">
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
                <button className="bg-gray-100 my-3 p-2 text-[13px] text-black rounded-lg hover:bg-gray-300 transition duration-200">
                    Login to Mattermost
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
                                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-lg w-[400px] p-6"
                                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >

                                <Dialog.Title className="text-xl font-semibold text-gray-800 mb-8">
                                    Set Credentials
                                </Dialog.Title>
                                <Dialog.Description />

                                <form onSubmit={handleSubmit} className="flex flex-col gap-7">
                                    <div className="flex flex-col gap-4">
                                        <input
                                            className="border rounded-lg p-2"
                                            type="text"
                                            value={mattLogin}
                                            onChange={(e) => setMattLogin(e.target.value)}
                                            placeholder="Mattermost Account Login"
                                            required
                                        />
                                        <input
                                            className="border rounded-lg p-2"
                                            type="password"
                                            value={mattPassword}
                                            onChange={(e) => setMattPassword(e.target.value)}
                                            placeholder="Mattermost Account Password"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <button
                                            className="bg-blue-500 text-white py-2 rounded-lg shadow-md cursor-pointer hover:bg-blue-700 transition duration-200"
                                            type="submit"
                                        >Login
                                        </button>

                                        <button
                                            className="bg-red-400 text-white py-2 rounded-lg shadow-md cursor-pointer hover:bg-red-500 transition duration-200"
                                            onClick={() => {setIsOpen(false)}}
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
