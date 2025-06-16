import { useEffect, useState } from "react"
import mattermostApi from "../../apis/mattApi"
import BoardCreatorMatt from "./BoardCreator"
import { Search } from "lucide-react"
import ImportCsvToMatt from "./ImportCsvToMatt"


export default function SetTeam({ onTeamSelect, setLoading, setRefresh }) {
    const [teams, setTeams] = useState([])
    const [selectedTeam, setSelectedTeam] = useState("")

    useEffect(() => {
        getTeams()
    }, [])

    const getTeams = async () => {
        try {
            const response = await mattermostApi.get("/teams/")
            setTeams(response.data)

            if (response.data.length > 0) {
                const firstTeamID = response.data[0].id
                setSelectedTeam(firstTeamID)

                const savedTeamID = localStorage.getItem("matt_team_id")

                if (!savedTeamID) {
                    setLoading(true)
                    onTeamSelect(firstTeamID)
                }
            }

        } catch (error) {
            console.log(error)
        }
    }

    const handleChange = (event) => {
        setSelectedTeam(event.target.value)
    }

    const handleClick = () => {
        if (selectedTeam) {
            localStorage.setItem("matt_team_id", selectedTeam)
            localStorage.removeItem("matt_boards")

            setLoading(true)
            setRefresh(true)
            onTeamSelect(selectedTeam)
        }
    }

    return (
        <div className="flex items-center ml-auto gap-3">
            <div className="flex ml-auto border-gray-300 rounded-lg gap-2">
                <label
                    className="flex items-center"
                    htmlFor="dropdown"
                >Team:
                </label>
                <select
                    className="bg-gray-50 px-2 py-1 border-2 border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 transition duration-200"
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
                <button 
                    className="bg-blue-400 px-5 py-3 text-white rounded-lg cursor-pointer hover:bg-blue-500 transition duration-200"
                    onClick={handleClick}
                ><Search size={18} />
                </button>
            </div>
            <ImportCsvToMatt teams={teams} setRefresh={setRefresh} />
            <BoardCreatorMatt teams={teams} setRefresh={setRefresh} />
        </div>
    )
}
