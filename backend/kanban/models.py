from sqlalchemy import Table, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base


class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", backref="boards")
    columns = relationship("BoardColumn", back_populates="board", cascade="all, delete-orphan")


class BoardColumn(Base):
    __tablename__ = "board_columns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    board_id = Column(Integer, ForeignKey("boards.id"))
    board = relationship("Board", back_populates="columns")
    tasks = relationship("Task", back_populates="column", cascade="all, delete-orphan")


task_parents = Table(
    "task_parents",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id"), primary_key=True),
    Column("parent_id", Integer, ForeignKey("tasks.id"), primary_key=True)
)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    position = Column(Integer, nullable=False)
    column_id = Column(Integer, ForeignKey("board_columns.id"))
    column = relationship("BoardColumn", back_populates="tasks")
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    parent_tasks = relationship(
        "Task",
        secondary=task_parents,
        primaryjoin=id == task_parents.c.task_id,
        secondaryjoin=id == task_parents.c.parent_id,
        backref="child_tasks"
    )
