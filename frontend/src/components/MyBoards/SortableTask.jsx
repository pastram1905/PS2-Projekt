import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskInColumn from './TaskInColumn'


export default function SortableTask({ task, columnID, setTasksMap, allParentTasks, setAllParentTasks, setRefresh }) {
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
            <TaskInColumn
                columnID={columnID}
                task={task}
                dragHandleProps={{ ...listeners, ...attributes }}
                setTasksMap={setTasksMap}
                allParentTasks={allParentTasks}
                setAllParentTasks={setAllParentTasks}
                setRefresh={setRefresh}
            />
        </div>
    )
}
