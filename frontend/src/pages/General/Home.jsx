import BoardList from "../../components/MyBoards/BoardList"
import BoardListMatt from "../../components/MattBoards/BoardList"


export default function Home() {
    return (
        <div className="w-[70%] mx-auto">
            <BoardListMatt />
            <hr className="w-[99%] border-gray-400 mx-auto my-4" />
            <BoardList />
        </div>
    )
}
