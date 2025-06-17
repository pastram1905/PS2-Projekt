from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    position: int
    column_id: int
    start_date: date
    end_date: date
    parent_ids: Optional[List[int]] = []


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = ""
    position: int
    column_id: int
    start_date: date
    end_date: date
    parent_ids: List[int] = []

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            title=obj.title,
            description=obj.description,
            position=obj.position,
            column_id=obj.column_id,
            start_date=obj.start_date,
            end_date=obj.end_date,
            parent_ids=[parent.id for parent in obj.parent_tasks]
        )


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = None
    column_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    parent_ids: Optional[List[int]] = None


class ColumnCreate(BaseModel):
    title: str


class ColumnOut(ColumnCreate):
    id: int
    board_id: int
    tasks: List[TaskOut] = []
    model_config = {"from_attributes": True}


class BoardCreate(BaseModel):
    title: str
    description: str


class BoardOut(BoardCreate):
    id: int
    owner_id: int
    columns: List[ColumnOut] = []
    model_config = {"from_attributes": True}
