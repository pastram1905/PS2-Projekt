from fastapi import APIRouter, HTTPException, Request, Body, Query, Response, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import re
import io
import auth.models
import auth.utils
from core.database import get_db
from . import api_calls
from . import schemas
from . import services
from . import cpm
import pandas as pd
import networkx as nx
from networkx.readwrite import json_graph


router = APIRouter()


@router.post("/token/")
def get_matt_token(
        matt_conn: schemas.GetMattToken,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(auth.utils.get_current_user)
    ):
    token = api_calls.get_mattermost_token(
        matt_conn.mattermost_login,
        matt_conn.mattermost_password
    )
    if token:
        response = JSONResponse(content={"message": "Token was received"})
        response.set_cookie("mattermost_token", token, httponly=True, max_age=7*24*60*60, samesite="Lax")
        hashed_token = auth.utils.encrypt_token(token)

        db_user = db.query(auth.models.User).filter(auth.models.User.id == user.id).first()
        if db_user:
            db_user.hashed_mattermost_token = hashed_token
            db.commit()
            db.refresh(db_user)
            return response
        
    else:
        response = JSONResponse(content={"message": "Token was not received"})
        return response


@router.get("/user/")
def get_matt_user(request: Request):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.get_user(token)
    return response.json()


@router.post("/logout_mattermost/")
def revoke_matt_session(
        request: Request,
        db: Session = Depends(get_db),
        user: auth.models.User = Depends(auth.utils.get_current_user)
    ):
    token = request.cookies.get("mattermost_token")
    user_data = api_calls.get_user(token).json()
    user_id = user_data["id"]

    sessions = api_calls.get_sessions(token, user_id).json()
    for session in sessions:
        if session["props"]["browser"] == "Unknown/0.0" and session["props"]["os"] == "":
            session_id = session["id"]
            api_calls.revoke_session(token, user_id, session_id)

    db_user = db.query(auth.models.User).filter(auth.models.User.id == user.id).first()
    if db_user:
        db_user.hashed_mattermost_token = None
        db.commit()
    
    response = JSONResponse(content={"message": "Logged out from Mattermost"})
    response.delete_cookie("mattermost_token")
    return response


@router.get("/teams/", response_model=List[schemas.GetTeams])
def get_matt_teams(request: Request):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.get_teams(token)
    return response.json()


@router.get("/boards/")
def get_matt_boards(request: Request, team_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.get_boards(token, team_id)
    return response.json()


@router.get("/templates/", response_model=List[schemas.GetTemplates])
def get_matt_templates(request: Request, team_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.get_templates(token, team_id).json()
    return response


@router.get("/board/")
def get_matt_board(request: Request, board_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.get_board(token, board_id)
    return response.json()


@router.post("/board/")
def create_matt_board(request: Request, team_id: str, title: str, description: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.create_board(token, team_id).json()
    board_id = response["boards"][0]["id"]
    api_calls.patch_board(token, board_id, title, description)
    api_calls.add_start_date_property(token, board_id)
    api_calls.add_end_date_property(token, board_id)
    api_calls.add_description_property(token, board_id)
    api_calls.add_depends_on_property(token, board_id)
    return response


@router.delete("/board/")
def delete_matt_board(request: Request, board_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.delete_board(token, board_id).json()
    return response


@router.patch("/board/")
def patch_matt_board(request: Request, patch_model: schemas.PatchMattBoard):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")

    response = api_calls.patch_board(
        token=token,
        board_id=patch_model.board_id,
        title=patch_model.title,
        description=patch_model.description
    )
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)    
    
    return response.json()


@router.get("/board/cards/")
def get_matt_cards(request: Request, board_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.get_cards(token, board_id)
    return response.json()


@router.get("/board/blocks/")
def get_matt_blocks(request: Request, board_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.get_blocks(token, board_id)
    return response.json()


@router.get("/boards_with_access/")
def get_matt_boards_with_access(request: Request, team_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    boards_response = api_calls.get_boards(token, team_id)
    if not boards_response.ok:
        raise HTTPException(status_code=boards_response.status_code, detail="Failed to fetch boards")
    
    boards = boards_response.json()
    boards_with_access = services.get_boards_with_access(token, boards)
    valid_boards = services.get_valid_boards(token, boards_with_access)

    return valid_boards


@router.get("/board/columns_with_tasks/")
def get_matt_columns_with_tasks(request: Request, board_id: str, team_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    board = api_calls.get_board(token, board_id).json()
    cards = api_calls.get_cards(token, board_id).json()
    tasks = services.map_card(board, cards, token, team_id)

    board_response = api_calls.get_board(token, board_id)
    board = board_response.json()

    result = services.get_columns_with_tasks(token, board, board_id, tasks)

    return result


@router.post("/board/columns/")
def create_matt_column(request: Request, board_id: str, new_column: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    board = api_calls.get_board(token, board_id).json()
    columns = next((prop["options"] for prop in board["cardProperties"] if prop.get("name") == "Status"),[])

    response = api_calls.create_column(token, board_id, columns, new_column).json()
    return response


@router.patch("/board/columns/")
def patch_matt_column(request: Request, board_id: str, column_id: str, new_name: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    board = api_calls.get_board(token, board_id).json()
    columns = next((prop["options"] for prop in board["cardProperties"] if prop.get("name") == "Status"),[])

    response = api_calls.rename_column(token, board_id, column_id, columns, new_name).json()
    return response


@router.delete("/board/columns/")
def delete_matt_column(request: Request, board_id: str, column_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    board = api_calls.get_board(token, board_id).json()
    columns = next((prop["options"] for prop in board["cardProperties"] if prop.get("name") == "Status"),[])

    response = api_calls.delete_column(token, board_id, column_id, columns).json()
    return response


@router.post("/board/columns/tasks/")
def create_matt_tasks(
        request: Request,
        board_id: str,
        block_id: str,
        column_id: str,
        title: str,
        description: str,
        start_date: str,
        end_date: str,
        depends_on: list[str],
        assignee_id: Optional[str] = None
    ):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    board = api_calls.get_board(token, board_id).json()
    card_properties = board["cardProperties"]
    for property in card_properties:
        if property["name"] == "Description":
            description_property_id = property["id"]
            break
    
    response = api_calls.create_task(token, board_id, column_id, title, description_property_id, description).json()
    
    blocks = api_calls.get_blocks(token, board_id).json()
    for block in blocks:
        if block["title"] == "Progress Tracker" and block["type"] == "view":
            fields = block["fields"]
            card_order = fields["cardOrder"]
            break
    
    for task in response:
        task_id = task["id"]
    api_calls.set_new_task_position(token, board_id, block_id, card_order, task_id)
    api_calls.set_depends_on_options(token, board_id)
    api_calls.set_task_properties(token, board_id, task_id, description, start_date, end_date, depends_on, assignee_id, column_id)
    return response


@router.delete("/board/columns/tasks/")
def delete_matt_tasks(request: Request, board_id: str, task_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    board = api_calls.get_board(token, board_id).json()
    properties = board["cardProperties"]
    for property in properties:
        if property["name"] == "Depends on":
            options = property["options"]
            for i, option in enumerate(options):
                if option["id"] == task_id:
                    del options[i]
                    api_calls.change_depends_on_option(token, board_id, options)
                    break
    
    response = api_calls.delete_task(token, board_id, task_id).json()
    return response


@router.patch("/board/columns/tasks/rename/")
def rename_matt_tasks(request: Request, board_id: str, task_id: str, new_title: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.rename_task(token, board_id, task_id, new_title).json()

    board = api_calls.get_board(token, board_id).json()
    properties = board["cardProperties"]
    for property in properties:
        if property["name"] == "Depends on":
            options = property["options"]
            for option in options:
                if option["id"] == task_id:
                    option["value"] = new_title
                    api_calls.change_depends_on_option(token, board_id, options)
                    break
    
    return response


@router.patch("/board/columns/tasks/")
def patch_matt_task(
        request: Request,
        board_id: str,
        column_id: str,
        task_id: str,
        description: str,
        start_date: str,
        end_date: str,
        depends_on: list[str],
        assignee_id: str
    ):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
            
    response = api_calls.set_task_properties(token, board_id, task_id, description, start_date, end_date, depends_on, assignee_id, column_id)
    return response


@router.patch("/board/task_column/")
def change_matt_task_column(request: Request, board_id: str, block_id: str, column_id: str, task_list: list[str], task_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.change_task_columm(token, board_id, column_id, task_id).json()
    api_calls.set_task_order(token, board_id, task_list, block_id, task_id)
    return response


@router.get("/board/get_block_id/")
def get_block_id(request: Request, board_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    blocks = api_calls.get_blocks(token, board_id).json()
    for block in blocks:
        if block["title"] == "Progress Tracker" and block["type"] == "view":
            block_id = block["id"]
            break
    
    return block_id


@router.post("/gantt/early/")
def gantt_early_view(request: Request, board_id: str, team_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")

    board = api_calls.get_board(token, board_id).json()
    cards = api_calls.get_cards(token, board_id).json()
    tasks = services.map_card(board, cards, token, team_id)
    board_response = api_calls.get_board(token, board_id)
    board = board_response.json()
    project_data = services.get_columns_with_tasks(token, board, board_id, tasks)
    for board in project_data:
        for task in board["tasks"]:
            if task.get("Depends_on") == [None]:
                task["Depends_on"] = []

    tasks, _, _ = cpm.calculate_critical_path(project_data)
    fig = services.build_gantt_chart(
        tasks,
        start_field="early_start_date",
        end_field="early_finish_date"
    )
    return Response(content=fig.to_json(), media_type="application/json")


@router.post("/gantt/late/")
def gantt_late_view(request: Request, board_id: str, team_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")

    board = api_calls.get_board(token, board_id).json()
    cards = api_calls.get_cards(token, board_id).json()
    tasks = services.map_card(board, cards, token, team_id)
    board_response = api_calls.get_board(token, board_id)
    board = board_response.json()
    project_data = services.get_columns_with_tasks(token, board, board_id, tasks)
    for board in project_data:
        for task in board["tasks"]:
            if task.get("Depends_on") == [None]:
                task["Depends_on"] = []

    tasks, _, _ = cpm.calculate_critical_path(project_data)
    fig = services.build_gantt_chart(
        tasks,
        start_field="late_start_date",
        end_field="late_finish_date"
    )
    return Response(content=fig.to_json(), media_type="application/json")


@router.get("/cpm_graph/")
def get_cpm_graph(request: Request, board_id: str, team_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    board = api_calls.get_board(token, board_id).json()
    cards = api_calls.get_cards(token, board_id).json()
    tasks = services.map_card(board, cards, token, team_id)
    board_response = api_calls.get_board(token, board_id)
    board = board_response.json()
    project_data = services.get_columns_with_tasks(token, board, board_id, tasks)
    for board in project_data:
        for task in board["tasks"]:
            if task.get("Depends_on") == [None]:
                task["Depends_on"] = []

    task_map, graph_map, critical_tasks = cpm.calculate_critical_path(project_data)
    G = nx.DiGraph()

    for tid, task in task_map.items():
        G.add_node(tid, label=task["title"], color="red" if tid in critical_tasks else "gray")
    
    for source, targets in graph_map.items():
        for target in targets:
            is_critical = source in critical_tasks and target in critical_tasks
            G.add_edge(source, target, color="red" if is_critical else "gray")
    
    data = json_graph.node_link_data(G)
    return JSONResponse(content=data)


def normalize_title(title: str) -> str:
    return re.sub(r"\s+", " ", title.replace("—", "-").strip()).lower()


@router.post("/import_csv/")
async def import_csv_project(
    request: Request,
    team_id: str,
    title: str,
    description: str,
    csv_file: UploadFile = File(...)
):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.create_board(token, team_id).json()
    board_id = response["boards"][0]["id"]
    api_calls.patch_board(token, board_id, title, description)
    api_calls.add_start_date_property(token, board_id)
    api_calls.add_end_date_property(token, board_id)
    api_calls.add_description_property(token, board_id)
    api_calls.add_depends_on_property(token, board_id)

    board = api_calls.get_board(token, board_id).json()
    props = board["cardProperties"]
    for prop in props:
        if prop["name"] == "Status":
            column_id = prop["options"][0]["id"]
            break

    blocks = api_calls.get_blocks(token, board_id).json()
    block_id = next(block["id"] for block in blocks if block["type"] == "view" and block["title"] == "Progress Tracker")

    contents = await csv_file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

    title_to_id = {}

    for _, row in df.iterrows():
        start_date = int(datetime.strptime(row["Start Date"], "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp() * 1000)
        end_date = int(datetime.strptime(row["End Date"], "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp() * 1000)

        depends_ids = []
        depends_str = row["Depends on"] if not pd.isna(row["Depends on"]) else ""
        for other_title in df["Title"]:
            if str(other_title) in depends_str and other_title in title_to_id:
                depends_ids.append(title_to_id[other_title])

        response = create_matt_tasks(
            request=request,
            board_id=board_id,
            block_id=block_id,
            column_id=column_id,
            title=row["Title"],
            description=row["Description"],
            start_date=start_date,
            end_date=end_date,
            depends_on=depends_ids,
        )

        for task in response:
            title_to_id[row["Title"]] = task["id"]

    return {"message": "Board and tasks created successfully", "board_id": board_id}


@router.get("/team/users/")
def get_matt_users_in_team(request: Request, team_id: str, query: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.get_users_in_team(token, team_id, query).json()
    return response


@router.get("/board/members/")
def get_matt_board_members(request: Request, board_id: str, team_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    member_ids = []
    members = api_calls.get_board_members(token, board_id).json()
    for member in members:
        member_ids.append(member["userId"])
    response = api_calls.get_board_members_usernames(token, team_id, member_ids).json()
    return response


@router.post("/add_member_to_board/")
def add_matt_member_to_board(request: Request, board_id: str, user_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.add_member_to_board(token, board_id, user_id).json()
    return response


@router.delete("/board/members/")
def remove_matt_member_from_board(request: Request, board_id: str, member_id: str):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")
    
    response = api_calls.remove_member_from_board(token, board_id, member_id).json()
    api_calls.remove_member_from_all_task(token, board_id, member_id)
    return response


from datetime import datetime, timezone

def normalize_date_to_utc(date):
    if date is None:
        return None
    utc_date = datetime(date.year, date.month, date.day, tzinfo=timezone.utc)
    return int(utc_date.timestamp() * 1000)


@router.post("/export_from_local/")
def export_board_to_mattermost(
    request: Request,
    data: dict = Body(...),
    tasks: list = Body(...),
    team_id: str = Query(...)
):
    token = request.cookies.get("mattermost_token")
    if not token:
        raise HTTPException(status_code=401, detail="No Mattermost token")

    new_board = create_matt_board(request, team_id, data["title"], data["description"])
    board_id = new_board["boards"][0]["id"]

    # Удаляем колонку "Status"
    properties = new_board["boards"][0]["cardProperties"]
    for property in properties:
        if property["name"] == "Status":
            for option in property["options"]:
                delete_matt_column(request, board_id, option["id"])

    block_id = get_block_id(request, board_id)

    # Создаём колонки
    for column in data["columns"]:
        create_matt_column(request, board_id, column["title"])

    created_columns = get_matt_columns_with_tasks(request, board_id, team_id)
    title_to_column_id = {col["title"]: col["id"] for col in created_columns}

    # Создаём мапу old_id -> task
    task_map = {task["id"]: task for task in tasks}
    old_to_new_task_id = {}

    # Шаг 1: создаём задачи без зависимостей
    for task in tasks:
        column_title = next((col["title"] for col in data["columns"] if col["id"] == task["column_id"]), None)
        column_id = title_to_column_id.get(column_title)
        if not column_id:
            continue

        start_date_dt = datetime.strptime(task["start_date"], "%Y-%m-%d")
        end_date_dt = datetime.strptime(task["end_date"], "%Y-%m-%d")
        start_date_unix = normalize_date_to_utc(start_date_dt)
        end_date_unix = normalize_date_to_utc(end_date_dt)

        created_task = create_matt_tasks(
            request=request,
            board_id=board_id,
            block_id=block_id,
            column_id=column_id,
            title=task["title"],
            description=task["description"],
            start_date=start_date_unix,
            end_date=end_date_unix,
            depends_on=[],  # пока нет связей
            assignee_id=None
        )

        if isinstance(created_task, list) and created_task:
            new_task_id = created_task[0]["id"]
        else:
            raise Exception(f"Unexpected task creation format: {created_task}")

        old_to_new_task_id[task["id"]] = new_task_id

    # Шаг 2: обновляем задачи, проставляя depends_on
    for task in tasks:
        old_id = task["id"]
        new_id = old_to_new_task_id.get(old_id)
        if not new_id:
            continue

        column_title = next((col["title"] for col in data["columns"] if col["id"] == task["column_id"]), None)
        column_id = title_to_column_id.get(column_title)
        if not column_id:
            continue

        start_date_unix = normalize_date_to_utc(datetime.strptime(task["start_date"], "%Y-%m-%d"))
        end_date_unix = normalize_date_to_utc(datetime.strptime(task["end_date"], "%Y-%m-%d"))

        depends_on = [old_to_new_task_id[parent_id] for parent_id in task.get("parent_ids", []) if parent_id in old_to_new_task_id]

        patch_matt_task(
            request=request,
            board_id=board_id,
            column_id=column_id,
            task_id=new_id,
            description=task["description"],
            start_date=start_date_unix,
            end_date=end_date_unix,
            depends_on=depends_on,
            assignee_id=None
        )

    return {"status": "ok", "board_id": board_id}
