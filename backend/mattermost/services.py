from fastapi import HTTPException
from datetime import datetime
from . import api_calls
import json
import pandas as pd
import plotly.express as px


def get_boards_with_access(token, boards):
    boards_with_access = []
    
    for board in boards:
        board_id = board.get("id")
        response = api_calls.get_cards(token, board_id)
        if response.ok:
            boards_with_access.append(board)
    
    return boards_with_access


def get_valid_boards(token, boards):
    valid_boards = []

    for board in boards:
        board_id = board.get("id")
        blocks = api_calls.get_blocks(token, board_id).json()
        for block in blocks:
            if block["type"] == "view" and block["parentId"] == "bbzj7aho8dtrx8emw8p4arkj1bw":
                valid_boards.append(board)
                break
    
    return valid_boards


def is_valid_timestamp(value):
    try:
        if value in [None, '', 'NaN']:
            return False
        int(value)
        return True
    except (ValueError, TypeError):
        return False


def parse_date(value):
    try:
        if isinstance(value, str) and value.startswith("{"):
            value = json.loads(value)
            timestamp = value.get("from")
        else:
            timestamp = value

        if is_valid_timestamp(timestamp):
            return datetime.utcfromtimestamp(int(timestamp) / 1000).strftime('%Y-%m-%d')
    except Exception:
        pass
    return None


def map_card(board_json, cards_json, token, team_id):
    board_props = {prop["id"]: prop for prop in board_json["cardProperties"]}
    mapped_cards = []

    for card in cards_json:
        new_card = {
            "id": card["id"],
            "title": card["title"],
            "Status": None,
            "Description": None,
            "Start_Date": None,
            "End_Date": None,
            "Depends_on": [],
            "Assignee_Username": None,
            "Assignee_ID": None
        }

        for prop_id, raw_value in card.get("properties", {}).items():
            prop_def = board_props.get(prop_id)
            if not prop_def:
                continue

            name = prop_def["name"]

            if name == "Status":
                new_card["Status"] = raw_value
            elif name == "Description":
                new_card["Description"] = raw_value
            elif name == "Start Date":
                new_card["Start_Date"] = parse_date(raw_value)
            elif name == "End Date":
                new_card["End_Date"] = parse_date(raw_value)
            elif name == "Depends on":
                new_card["Depends_on"] = raw_value if isinstance(raw_value, list) else [raw_value]
            elif name == "Assignee":
                if raw_value == "":
                    pass
                else:
                    id_list = [raw_value]
                    response = api_calls.get_board_members_usernames(token, team_id, id_list).json()
                    
                    if isinstance(response, list) and response:
                        new_card["Assignee_Username"] = response[0].get("username")
                        new_card["Assignee_ID"] = raw_value
                    else:
                        pass

        mapped_cards.append(new_card)
    return mapped_cards


def get_cards_position(blocks):
    tracker_view = next((item for item in blocks if item.get("title") == "Progress Tracker"), None)
    if not tracker_view:
        return {}
    
    card_order = tracker_view.get("fields", {}).get("cardOrder", [])
    result = {card_id: index for index, card_id in enumerate(card_order) if card_id is not None}

    return result


def get_columns_with_tasks(token, board, board_id, tasks):
    status_prop = next(
        (prop for prop in board.get("cardProperties", []) if prop.get("name") == "Status"), 
        None
    )

    if not status_prop or "options" not in status_prop:
        raise HTTPException(status_code=404, detail="Status column not found in board properties")
    
    result = []
    for option in status_prop["options"]:
        status_id = option["id"]
        column = {
            "board_id": board.get("id"),
            "id": status_id,
            "title": option.get("value"),
            "tasks": [task for task in tasks if task.get("Status") == status_id]
        }
        result.append(column)
    
    blocks = api_calls.get_blocks(token, board_id).json()
    cards_position = get_cards_position(blocks)

    for column in result:
        for task in column.get("tasks", []):
            task_id = task["id"]
            if task_id in cards_position:
                task["position"] = cards_position[task_id]
    
    return result


def build_gantt_chart(tasks, start_field, end_field):
    df = pd.DataFrame([
        {
            "Task": t["title"],
            "Start": t[start_field],
            "End": t[end_field]
        }
        for t in tasks.values()
    ])

    df["Start"] = pd.to_datetime(df["Start"])
    df["End"] = pd.to_datetime(df["End"])
    df = df.sort_values(by="Start")

    fig = px.timeline(df, x_start="Start", x_end="End", y="Task")
    fig.update_yaxes(autorange="reversed")
    fig.update_layout(xaxis_range=[df["Start"].min(), df["End"].max()])
    return fig
