import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"


export default function ConfrimExport({ importBoardToLocal }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger asChild>
                    <button className="bg-gray-300 text-gray-900 text-sm px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-400 transition duration-200"
                    >Export to Local Boards
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
                                    Export project to local boards?
                                </Dialog.Title>
                                <Dialog.Description />

                                <div className="flex justify-center gap-4">
                                    <button
                                        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                                            onClick={() => {
                                                importBoardToLocal()
                                                setIsOpen(false)
                                            }}
                                    >Export
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                                        onClick={() => setIsOpen(false)}
                                    >Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    )
}
