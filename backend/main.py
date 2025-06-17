from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import create_db_and_tables
from auth.routes import router as auth_router
from kanban.routes import router as kanban_router
from mattermost.routes import router as mattermost_router


app = FastAPI(
    title="MattGantt",
    description="Backend API for MattGantt",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(kanban_router, prefix="/kanban", tags=["kanban"])
app.include_router(mattermost_router, prefix="/mattermost", tags=["mattermost"])
