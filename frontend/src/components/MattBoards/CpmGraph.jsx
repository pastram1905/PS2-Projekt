import React, { useEffect, useState } from "react"
import CytoscapeComponent from "react-cytoscapejs"
import dagre from "cytoscape-dagre"
import Cytoscape from "cytoscape"
import mattermostApi from "../../apis/mattApi"


Cytoscape.use(dagre)


export default function CpmGraphMatt({ boardID, teamID }) {
    const [elements, setElements] = useState([])

    useEffect(() => {
        getCpmGraph()
    }, [])

    const getCpmGraph = async () => {
        try {
            const response = await mattermostApi.get("/cpm_graph/", {
                params: {
                    board_id: boardID,
                    team_id: teamID
                }
            })
            const data = response.data
            console.log("Graph data:", data)
            const els = [
                ...data.nodes.map(n => ({ data: {
                    id: n.id,
                    label: n.label,
                    color: n.color
                }})),
                ...data.links.map(e => ({ data: {
                    source: e.source,
                    target: e.target,
                    color: e.color
                }}))
            ]
            setElements(els)

        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="flex flex-col mx-auto gap-3">
            <h1 className="font-bold text-xl text-gray-900">Critical Path Graph</h1>
            <div className="bg-white p-1 rounded-lg shadow-lg">
                <div style={{ width: "100%", height: "400px" }}>
                    {elements.length > 0 && (
                        <CytoscapeComponent
                            key={elements.length}
                            elements={elements}
                            layout={{ name: "dagre", rankDir: "LR", nodeSep: 100, edgeSep: 30, rankSep: 100 }}
                            style={{ width: "100%", height: "100%" }}
                            stylesheet={[
                                {
                                    selector: 'node',
                                    style: {
                                        label: 'data(label)',
                                        'text-valign': 'center',
                                        'color': '#000',
                                        'text-outline-width': 1,
                                        'text-outline-color': '#fff',
                                        'font-size': 12,
                                        'background-color': 'data(color)'
                                    }
                                },
                                {
                                    selector: 'edge',
                                    style: {
                                        width: 2,
                                        'line-color': 'data(color)',
                                        'target-arrow-color': 'data(color)',
                                        'target-arrow-shape': 'triangle',
                                        'curve-style': 'bezier'
                                    }
                                }
                            ]}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
