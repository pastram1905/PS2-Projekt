from datetime import datetime
import requests
import random
import string


def get_mattermost_token(login_id, password):
    url = "https://mattermost.portabo.cz/api/v4/users/login"
    headers = {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = '{"login_id":"' + login_id + '","password":"' + password + '"}'
    response = requests.post(url, headers=headers, data=data)
    token = response.headers["Token"]
    return token


def get_user(token):
    url = "https://mattermost.portabo.cz/api/v4/users/me"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.get(url, headers=headers)
    return response


def get_sessions(token, user_id):
    url = f"https://mattermost.portabo.cz/api/v4/users/{user_id}/sessions"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.get(url, headers=headers)
    return response


def revoke_session(token, user_id, session_id):
    url = f"https://mattermost.portabo.cz/api/v4/users/{user_id}/sessions/revoke"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = {
        "session_id": session_id
    }
    response = requests.post(url, headers=headers, json=data)
    return response


def get_teams(token):
    url = "https://mattermost.portabo.cz/plugins/focalboard/api/v2/teams"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.get(url, headers=headers)
    return response


def get_boards(token, team_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/teams/{team_id}/boards"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.get(url, headers=headers)
    return response


def get_templates(token, team_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/teams/{team_id}/templates"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.get(url, headers=headers)
    return response


def get_board(token, board_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.get(url, headers=headers)
    return response


def create_board(token, team_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/bbzj7aho8dtrx8emw8p4arkj1bw/duplicate?asTemplate=false&toTeam={team_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.post(url, headers=headers)
    return response


def delete_board(token, board_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.delete(url, json={}, headers=headers)
    return response


def get_cards(token, board_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/cards"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.get(url, headers=headers)
    return response


def get_blocks(token, board_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/blocks"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.get(url, headers=headers)
    return response


def patch_board(token, board_id, title, description):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = {
        "title": title,
        "description": description
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def create_column(token, board_id, columns, new_column):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }

    characters = string.ascii_letters + string.digits
    id = ''.join(random.choices(characters, k=27)).lower()
    new_column = {
        "id":id,
        "value":new_column,
        "color":"propColorDefault"
    }
    columns.append(new_column)
    new_columns = columns

    data = {
        "updatedCardProperties":[
            {
                "id":"a972dc7a-5f4c-45d2-8044-8c28c69717f1",
                "name":"Status",
                "options":new_columns,
                "type":"select"
            }
        ],
        "deletedCardProperties":[]
    }

    response = requests.patch(url, json=data, headers=headers)
    return response


def rename_column(token, board_id, column_id, columns, new_name):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }

    for column in columns:
        if column["id"] == column_id:
            column["value"] = new_name
            break
    
    data = {
        "updatedCardProperties":[
            {
                "id":"a972dc7a-5f4c-45d2-8044-8c28c69717f1",
                "name":"Status",
                "type":"select",
                "options":columns
            }
        ],
        "deletedCardProperties":[]
    }

    response = requests.patch(url, json=data, headers=headers)
    return response


def delete_column(token, board_id, column_id, columns):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }

    for i, column in enumerate(columns):
        if column["id"] == column_id:
            del columns[i]
            break
    
    data = {
        "updatedCardProperties":[
            {
                "id":"a972dc7a-5f4c-45d2-8044-8c28c69717f1",
                "name":"Status",
                "type":"select",
                "options":columns
            }
        ],
        "deletedCardProperties":[]
    }

    response = requests.patch(url, json=data, headers=headers)
    return response


def create_task(token, board_id, column_id, title, description_property_id, description):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/blocks"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }

    characters = string.ascii_letters + string.digits
    id = ''.join(random.choices(characters, k=27)).lower()
    now = int(datetime.utcnow().timestamp() * 1000)
    data = [
        {
            "id":id,
            "schema":1,
            "boardId":board_id,
            "parentId":board_id,
            "createdBy":"",
            "modifiedBy":"",
            "type":"card",
            "fields":{
                "properties":{
                    "a972dc7a-5f4c-45d2-8044-8c28c69717f1":column_id,
                    description_property_id:description
                },
                "contentOrder":[],
                "isTemplate":False
            },
            "title":title,
            "createAt":now,
            "updateAt":now,
            "deleteAt":0,
            "limited":False
        }
    ]

    response = requests.post(url, json=data, headers=headers)
    return response


def delete_task(token, board_id, task_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/blocks/{task_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = {}
    response = requests.delete(url, json=data, headers=headers)
    return response


def rename_task(token, board_id, task_id, new_title):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/blocks/{task_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = {"title":new_title}
    response = requests.patch(url, json=data, headers=headers)
    return response


def set_new_task_position(token, board_id, block_id, tasks_order, task_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/blocks/{block_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    tasks_order.append(task_id)
    new_tasks_order = tasks_order
    data = {
        "updatedFields":{
            "cardOrder":new_tasks_order
        }
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def change_task_columm(token, board_id, column_id, task_id):
    tasks = get_cards(token, board_id).json()
    for task in tasks:
        if task["id"] == task_id:
            current_properties = task["properties"]
            current_properties["a972dc7a-5f4c-45d2-8044-8c28c69717f1"] = column_id
            break
    
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/blocks/{task_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = {
        "updatedFields":{
            "properties":current_properties,
            "contentOrder":[]
        },
        "deletedFields":[]
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def set_task_order(token, board_id, task_list, block_id, task_id):
    tasks = get_cards(token, board_id).json()
    for task in tasks:
        if task["id"] == task_id:
            current_properties = task["properties"]
            break
    
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/blocks/{block_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = {
        "updatedFields":{
            "properties":current_properties,
            "cardOrder":task_list
        }
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def add_description_property(token, board_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    characters = string.ascii_letters + string.digits
    id = ''.join(random.choices(characters, k=27)).lower()
    data = {
        "updatedCardProperties":[
            {
                "id":id,
                "name":"Description",
                "type":"text",
                "options":[]
            }
        ],
        "deletedCardProperties":[],
        "updatedProperties":{},
        "deletedProperties":[]
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def set_task_properties(token, board_id, task_id, description, start_date, end_date, depends_on, assignee_id, column_id):
    board = get_board(token, board_id).json()
    properties = board["cardProperties"]
    for property in properties:
        if property["name"] == "Status":
            status_property_id = property["id"]
        elif property["name"] == "Description":
            description_property_id = property["id"]
        elif property["name"] == "Start Date":
            start_date_property_id = property["id"]
        elif property["name"] == "End Date":
            end_date_property_id = property["id"]
        elif property["name"] == "Depends on":
            depends_on_property_id = property["id"]
        elif property["name"] == "Assignee":
            assignee_property_id = property["id"]
    
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/blocks/{task_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = {
        "updatedFields":
        {
            "properties":
            {
                status_property_id:column_id,
                description_property_id:description,
                start_date_property_id:start_date,
                end_date_property_id:end_date,
                depends_on_property_id:depends_on,
                assignee_property_id:assignee_id
            },
            "contentOrder":[]
        },
        "deletedFields":[]
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def set_depends_on_options(token, board_id):
    board = get_board(token, board_id).json()
    properties = board["cardProperties"]
    for property in properties:
        if property["name"] == "Depends on":
            depends_on_property_id = property["id"]
    
    tasks = get_cards(token, board_id).json()
    options = []
    for task in tasks:
        options.append({
            "id":task.get("id"),
            "value":task.get("title"),
            "color":"propColorDefault"
        })
    
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = {
        "updatedCardProperties":[
            {
                "id":depends_on_property_id,
                "name":"Depends on",
                "options":options,
                "type":"multiSelect"
            }
        ],
        "deletedCardProperties":[]
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def add_start_date_property(token, board_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    characters = string.ascii_letters + string.digits
    id = ''.join(random.choices(characters, k=27)).lower()
    data = {
        "updatedCardProperties":[
            {
                "id":id,
                "name":"Start Date",
                "type":"date",
                "options":[]
            }
        ],
        "deletedCardProperties":[],
        "updatedProperties":{},
        "deletedProperties":[]
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def add_end_date_property(token, board_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    characters = string.ascii_letters + string.digits
    id = ''.join(random.choices(characters, k=27)).lower()
    data = {
        "updatedCardProperties":[
            {
                "id":id,
                "name":"End Date",
                "type":"date",
                "options":[]
            }
        ],
        "deletedCardProperties":[],
        "updatedProperties":{},
        "deletedProperties":[]
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def add_depends_on_property(token, board_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    characters = string.ascii_letters + string.digits
    id = ''.join(random.choices(characters, k=27)).lower()
    data = {
        "updatedCardProperties":[
            {
                "id":id,
                "name":"Depends on",
                "type":"multiSelect",
                "options":[]
            }
        ],
        "deletedCardProperties":[],
        "updatedProperties":{},
        "deletedProperties":[]
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def change_depends_on_option(token, board_id, options):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = {
        "updatedCardProperties":[
            {
                "id":"z2epbzkfhjcp1kmr4s9ukyvlpzd",
                "name":"Depends on",
                "type":"multiSelect",
                "options":options
            }
        ],
        "deletedCardProperties":[]
    }
    response = requests.patch(url, json=data, headers=headers)
    return response


def get_users_in_team(token, team_id, query):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/teams/{team_id}/users?search={query}&exclude_bots=true"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.get(url, headers=headers)
    return response


def get_board_members(token, board_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/members"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.get(url, headers=headers)
    return response


def get_board_members_usernames(token, team_id, user_ids):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/teams/{team_id}/users"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = [id for id in user_ids]
    response = requests.post(url, json=data, headers=headers)
    return response


def add_member_to_board(token, board_id, user_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/members"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    data = {
        "boardId":board_id,
        "userId":user_id,
        "roles":"editor",
        "schemeAdmin":False,
        "schemeEditor":True,
        "schemeCommenter":True,
        "schemeViewer":True
    }
    response = requests.post(url, json=data, headers=headers)
    return response


def remove_member_from_board(token, board_id, member_id):
    url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/members/{member_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    }
    response = requests.delete(url, headers=headers)
    return response


def remove_member_from_all_task(token, board_id, member_id):
    cards = get_cards(token, board_id).json()
    for card in cards:
        task_id = card["id"]
        properties = card["properties"]
        assigned_member = properties.get("axkhqa4jxr3jcqe4k87g8bhmary")
        
        if assigned_member is None:
            continue
        else:
            if assigned_member == member_id:
                properties["axkhqa4jxr3jcqe4k87g8bhmary"] = ""

                url = f"https://mattermost.portabo.cz/plugins/focalboard/api/v2/boards/{board_id}/blocks/{task_id}"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                }
                data = {
                    "updatedFields":
                    {
                        "properties":properties,
                        "contentOrder":[]
                    },
                    "deletedFields":[]
                }
                requests.patch(url, json=data, headers=headers)
            
            else:
                continue
    return None
