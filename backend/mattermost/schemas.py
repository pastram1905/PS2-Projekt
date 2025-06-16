from pydantic import BaseModel


class GetMattToken(BaseModel):
    mattermost_login: str
    mattermost_password: str


class GetTeams(BaseModel):
    id: str
    title: str


class GetTemplates(BaseModel):
    id: str
    title: str


class PatchMattBoard(BaseModel):
    board_id: str
    title: str
    description: str
