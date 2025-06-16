import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskInColumnMatt from './TaskInColumn'


export default function SortableTaskMatt({ task, boardID, boardMembers, columnID, setTasksMap, setRefresh, dependsOnOptions, setDependsOnOptions, setRefreshParents }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id: `${columnID}-${task.id}` })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style}>
            <TaskInColumnMatt
                boardID={boardID}
                boardMembers={boardMembers}
                columnID={columnID}
                task={task}
                dragHandleProps={{ ...listeners, ...attributes }}
                setTasksMap={setTasksMap}
                setRefresh={setRefresh}
                dependsOnOptions={dependsOnOptions}
                setDependsOnOptions={setDependsOnOptions}
                setRefreshParents={setRefreshParents}
            />
        </div>
    )
}
