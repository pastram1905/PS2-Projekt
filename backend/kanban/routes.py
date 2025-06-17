from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from core.database import get_db
from . import models
from . import schemas
from . import cpm
import auth.models
from auth import utils
import pandas as pd
from io import StringIO
import re
import plotly.express as px
import networkx as nx
from networkx.readwrite import json_graph
from .services import get_task_data, generate_gantt
from .cpm import calculate_critical_path


router = APIRouter()


@router.post("/boards/", response_model=schemas.BoardOut)
def create_board(
        title: str,
        description: str,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    new_board = models.Board(title=title, description=description, owner_id=user.id)
    db.add(new_board)
    db.commit()
    db.refresh(new_board)
    return new_board


@router.get("/boards/", response_model=List[schemas.BoardOut])
def get_boards(
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    return db.query(models.Board).filter(models.Board.owner_id == user.id).all()


@router.get("/boards/{board_id}", response_model=schemas.BoardOut)
def get_board(
        board_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    board = db.query(models.Board).filter(models.Board.owner_id == user.id, models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.patch("/boards/{board_id}", response_model=schemas.BoardOut)
def update_board(
        board_id: int,
        updated_board: schemas.BoardCreate,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    board = db.query(models.Board).filter(models.Board.owner_id == user.id, models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    for key, value in updated_board.dict(exclude_unset=True).items():
        setattr(board, key, value)
    
    db.commit()
    db.refresh(board)
    return board


@router.delete("/boards/{board_id}")
def delete_board(
        board_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    board = db.query(models.Board).filter(models.Board.owner_id == user.id, models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    db.delete(board)
    db.commit()
    return {"message": "Board deleted"}


@router.post("/boards/{board_id}/columns/", response_model=schemas.ColumnOut)
def create_column(
        board_id: int,
        column: schemas.ColumnCreate,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    board = db.query(models.Board).filter(models.Board.owner_id == user.id, models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    new_column = models.BoardColumn(title=column.title, board_id=board.id)
    db.add(new_column)
    db.commit()
    db.refresh(new_column)
    return new_column


@router.get("/boards/{board_id}/columns/", response_model=List[schemas.ColumnOut])
def get_columns(
        board_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    board = db.query(models.Board).filter(models.Board.owner_id == user.id, models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return db.query(models.BoardColumn).filter(models.BoardColumn.board_id == board.id).all()


@router.get("/columns/{column_id}", response_model=schemas.ColumnOut)
def get_column(
        column_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    column = db.query(models.BoardColumn).join(models.Board).filter(models.Board.owner_id == user.id, models.BoardColumn.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    return column


@router.patch("/columns/{column_id}", response_model=schemas.ColumnOut)
def update_column(
        column_id: int,
        column_data: schemas.ColumnCreate,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    column = db.query(models.BoardColumn).join(models.Board).filter(models.Board.owner_id == user.id, models.BoardColumn.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    column.title = column_data.title
    db.commit()
    db.refresh(column)
    return column


@router.delete("/columns/{column_id}")
def delete_column(
        column_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    column = db.query(models.BoardColumn).join(models.Board).filter(models.BoardColumn.id == column_id, models.Board.owner_id == user.id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    db.delete(column)
    db.commit()
    return {"message": "Column deleted"}


@router.post("/columns/{column_id}/tasks/", response_model=schemas.TaskOut)
def create_task(
        column_id: int,
        task: schemas.TaskCreate,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    column = db.query(models.BoardColumn).join(models.Board).filter(models.BoardColumn.id == column_id, models.Board.owner_id == user.id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    
    board_id = column.board_id
    parent_tasks = []
    if task.parent_ids:
        parent_tasks = db.query(models.Task).join(models.BoardColumn).filter(
            models.Task.id.in_(task.parent_ids),
            models.BoardColumn.board_id == board_id
        ).all()

        if len(parent_tasks) != len(task.parent_ids):
            raise HTTPException(
                status_code=400,
                detail="Some parent tasks do not exist or are not on the same board"
            )
    
    new_task = models.Task(
        title=task.title,
        description=task.description,
        position=task.position,
        column_id=column.id,
        start_date=task.start_date,
        end_date=task.end_date,
        parent_tasks=parent_tasks
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return schemas.TaskOut.from_orm(new_task)


@router.get("/boards/{board_id}/tasks/", response_model=List[schemas.TaskOut])
def get_board_tasks(
        board_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    board = db.query(models.Board).filter(models.Board.owner_id == user.id, models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    tasks = db.query(models.Task).join(models.BoardColumn).filter(
        models.BoardColumn.board_id == board.id
    ).options(joinedload(models.Task.parent_tasks)).order_by(models.Task.position).all()

    return [schemas.TaskOut.from_orm(task) for task in tasks]


@router.get("/columns/{column_id}/tasks/", response_model=List[schemas.TaskOut])
def get_tasks(
        column_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    column = db.query(models.BoardColumn).join(models.Board).filter(models.BoardColumn.id == column_id, models.Board.owner_id == user.id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    tasks = db.query(models.Task).filter(models.Task.column_id == column.id).order_by(models.Task.position).all()
    return [schemas.TaskOut.from_orm(task) for task in tasks]


@router.get("/tasks/{task_id}", response_model=schemas.TaskOut)
def get_task(
        task_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    task = db.query(models.Task).join(models.BoardColumn).join(models.Board).filter(models.Board.owner_id == user.id, models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return schemas.TaskOut.from_orm(task)


@router.patch("/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(
        task_id: int,
        updated_task: schemas.TaskUpdate,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    task = db.query(models.Task).join(models.BoardColumn).join(models.Board).filter(models.Board.owner_id == user.id, models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = updated_task.dict(exclude_unset=True)

    if "parent_ids" in update_data:
        parent_ids = update_data.pop("parent_ids")
        parent_tasks = db.query(models.Task).filter(models.Task.id.in_(parent_ids)).all()
        task.parent_tasks = parent_tasks
        
    for key, value in update_data.items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    return schemas.TaskOut.from_orm(task)


@router.delete("/tasks/{task_id}")
def delete_task(
        task_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    task = db.query(models.Task).join(models.BoardColumn).join(models.Board).filter(models.Board.owner_id == user.id, models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


@router.get("/gantt/early/{board_id}")
def get_gantt_early_chart(
        board_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    task_input = get_task_data(db, user, board_id)
    tasks_dict, _, _ = calculate_critical_path(task_input)
    fig = generate_gantt(tasks_dict, "early_start_date", "early_finish_date")
    return Response(content=fig.to_json(), media_type="application/json")


@router.get("/gantt/late/{board_id}")
def get_gantt_late_chart(
        board_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    task_input = get_task_data(db, user, board_id)
    tasks_dict, _, _ = calculate_critical_path(task_input)
    fig = generate_gantt(tasks_dict, "late_start_date", "late_finish_date")
    return Response(content=fig.to_json(), media_type="application/json")


@router.get("/gantt/{board_id}")
def get_gantt_chart(
        board_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    board = db.query(models.Board).filter(models.Board.owner_id == user.id, models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    print(board)
    tasks = db.query(models.Task).join(models.BoardColumn).filter(
        models.BoardColumn.board_id == board.id
    ).options(joinedload(models.Task.parent_tasks)).order_by(models.Task.position).all()

    task_data = [{
        "Task": task.title,
        "Start Date": task.start_date,
        "End Date": task.end_date
    } for task in tasks if task.start_date and task.end_date]
    print(task_data)
    if not task_data:
        raise HTTPException(status_code=400, detail="No tasks with valid start and end dates")

    df = pd.DataFrame(task_data)
    df["Start Date"] = pd.to_datetime(df["Start Date"])
    df["End Date"] = pd.to_datetime(df["End Date"])
    df = df.sort_values("Start Date")

    min_date = df["Start Date"].min()
    max_date = df["End Date"].max()

    fig = px.timeline(df, x_start="Start Date", x_end="End Date", y="Task")
    fig.update_yaxes(autorange="reversed")
    fig.update_layout(xaxis_range=[min_date, max_date])

    return Response(content=fig.to_json(), media_type="application/json")


@router.get("/cpm_graph/{board_id}")
def get_cpm_graph(
        board_id: int,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    board = db.query(models.Board).filter(models.Board.owner_id == user.id, models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    tasks = db.query(models.Task).join(models.BoardColumn).filter(
        models.BoardColumn.board_id == board.id
    ).options(joinedload(models.Task.parent_tasks)).order_by(models.Task.position).all()

    board_data = [{
        "id": board.id,
        "tasks": [{
            "id": task.id,
            "title": task.title,
            "Start_Date": str(task.start_date),
            "End_Date": str(task.end_date),
            "Depends_on": [parent.id for parent in task.parent_tasks]
        } for task in tasks]
    }]

    task_map, graph_map, critical_tasks = cpm.calculate_critical_path(board_data)

    G = nx.DiGraph()
    for tid, task in task_map.items():
        G.add_node(tid, label=task["title"], color="red" if tid in critical_tasks else "gray")
    for source, targets in graph_map.items():
        for target in targets:
            is_critical = source in critical_tasks and target in critical_tasks
            G.add_edge(source, target, color="red" if is_critical else "gray")
    
    data = json_graph.node_link_data(G)
    return JSONResponse(content=data)


@router.post("/import_csv/", response_model=schemas.BoardOut)
def import_csv_project(
        title: str,
        description: str,
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):

    contents = file.file.read().decode("utf-8")
    df = pd.read_csv(StringIO(contents))

    new_board = models.Board(title=title, description=description, owner_id=user.id)
    db.add(new_board)
    db.commit()
    db.refresh(new_board)
    
    new_column = models.BoardColumn(title="To Do", board_id=new_board.id)
    db.add(new_column)
    db.commit()
    db.refresh(new_column)

    task_map = {}
    for _, row in df.iterrows():
        start_date = datetime.strptime(row["Start Date"], "%Y-%m-%d").date() if pd.notna(row["Start Date"]) else None
        end_date = datetime.strptime(row["End Date"], "%Y-%m-%d").date() if pd.notna(row["End Date"]) else None

        task = models.Task(
            title=row["Title"],
            description=row["Description"],
            start_date=start_date,
            end_date=end_date,
            column_id=new_column.id,
            position=0
        )
        db.add(task)
        db.flush()
        task_map[row["Title"]] = task
    db.commit()

    for _, row in df.iterrows():
        current_title = row["Title"].strip()
        task = task_map[current_title]

        if pd.notna(row["Depends on"]):
            depends_raw = row["Depends on"]
            parent_titles = re.findall(r'"([^"]+)"', depends_raw)

            parent_tasks = []
            for pt in parent_titles:
                pt_clean = pt.strip()
                if pt_clean in task_map:
                    parent_tasks.append(task_map[pt_clean])
                    
            task.parent_tasks = parent_tasks
    db.commit()

    return new_board


@router.post("/export_from_matt/")
def export_board_to_local(
        data: List[dict],
        title: str,
        description: str,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(utils.get_current_user)
    ):
    new_board = create_board(title, description, db, user)
    board_id = new_board.id

    task_id_map = {}

    for column in data:
        column_schema = schemas.ColumnCreate(title=column["title"])
        new_column = create_column(board_id, column_schema, db, user)
        column_id = new_column.id

        for task in column["tasks"]:
            task_schema = schemas.TaskCreate(
                title=task["title"],
                description=task["Description"],
                position=0,
                column_id=column_id,
                start_date=task["Start_Date"],
                end_date=task["End_Date"],
                parent_ids=[]
            )
            new_task = create_task(column_id, task_schema, db, user)
            task_id_map[task["id"]] = new_task.id
    
    for column in data:
        for task in column["tasks"]:
            current_task_id = task_id_map[task["id"]]
            depends_on = [pid for pid in task.get("Depends_on", []) if pid]
            parent_ids = [task_id_map[pid] for pid in depends_on if pid in task_id_map]

            if parent_ids:
                update_data = schemas.TaskUpdate(parent_ids=parent_ids)
                update_task(
                    task_id=current_task_id,
                    updated_task=update_data,
                    db=db,
                    user=user
                )
    
    return {"status": "success", "board_id": board_id}
