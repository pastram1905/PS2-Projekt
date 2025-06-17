import { useEffect, useState } from "react"
import api from "../../apis/api"
import Plot from "react-plotly.js"
import LoadingIndicator from "../General/LoadingIndicator"


export default function GanttChart({ boardID }) {
    const [plotData, setPlotData] = useState()
    const [errorMsg, setErrorMsg] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getGanttData()
    }, [])

    const getGanttData = async () => {
        setLoading(true)

        try {
            const response = await api.get(`/kanban/gantt/${boardID}`)

            if (response.status === 200) {
                const updatedLayout = {
                    ...response.data.layout,
                    shapes: [
                        ...(response.data.layout.shapes || []),
                        {
                            type: "line",
                            x0: new Date().toISOString().split("T")[0],
                            x1: new Date().toISOString().split("T")[0],
                            y0: 0,
                            y1: 1,
                            yref: "paper",
                            line: {
                                color: "red",
                                width: 1,
                                dash: "solid"
                            }
                        }
                    ]
                }

                setPlotData({
                    data: response.data.data,
                    layout: updatedLayout
                })
                
            } else {
                console.log("Failed to get data")
            }

        } catch (error) {
            setErrorMsg("Some error")
            console.log(error)

        } finally {
            setLoading(false)
        }
    }

    return <>
        {loading ? (
            <div className="py-20">
                <LoadingIndicator />
            </div>
        ) : plotData ? (
            <div className="flex flex-col mx-auto gap-3">
                <h1 className="font-bold text-xl text-gray-900">Gantt Chart</h1>
                <div className="bg-white p-1 rounded-lg shadow-lg">
                    <Plot
                        data={plotData.data}
                        layout={plotData.layout}
                        style={{ width: "100%", height: "550px" }}
                        useResizeHandler={true}
                    />
                </div>
            </div>
        ) : (
            <div className="w-[50%] bg-gray-200 flex mx-auto my-40 py-20 justify-center rounded-lg">
                {errorMsg}
            </div>
        )}
    </>
}
