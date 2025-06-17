from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from . import models
import auth.models
import pandas as pd
import plotly.express as px


def get_task_data(db: Session, user: auth.models.User, board_id: int):
    board = db.query(models.Board).filter(models.Board.owner_id == user.id, models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    tasks = db.query(models.Task).join(models.BoardColumn).filter(
        models.BoardColumn.board_id == board.id
    ).options(joinedload(models.Task.parent_tasks)).order_by(models.Task.position).all()

    task_data = [{
        "id": task.id,
        "title": task.title,
        "Start_Date": task.start_date.strftime("%Y-%m-%d"),
        "End_Date": task.end_date.strftime("%Y-%m-%d"),
        "Depends_on": [p.id for p in task.parent_tasks] if task.parent_tasks else []
    } for task in tasks if task.start_date and task.end_date]

    if not task_data:
        raise HTTPException(status_code=400, detail="No tasks with valid start and end dates")

    return [{"tasks": task_data}]


def generate_gantt(tasks_dict, start_field, end_field):
    data = []
    for task in tasks_dict.values():
        data.append({
            "Task": task["title"],
            "Start Date": task[start_field],
            "End Date": task[end_field]
        })
    df = pd.DataFrame(data)
    df = df.sort_values("Start Date")
    fig = px.timeline(df, x_start="Start Date", x_end="End Date", y="Task")
    fig.update_yaxes(autorange="reversed")
    fig.update_layout(xaxis_range=[df["Start Date"].min(), df["End Date"].max()])
    return fig
