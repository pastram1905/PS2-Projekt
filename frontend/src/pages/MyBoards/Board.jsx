import { useParams } from "react-router-dom"
import Board from "../../components/MyBoards/Board"


export default function BoardPage() {
    const { id } = useParams()

    return (
        <div>
            <Board boardID={id} />
        </div>
    )
}
