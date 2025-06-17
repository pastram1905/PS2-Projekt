import { useParams } from "react-router-dom"
import Board from "../../components/MattBoards/Board"


export default function MattBoardPage() {
    const { id } = useParams()

    return (
        <div>
            <Board boardID={id} />
        </div>
    )
}
