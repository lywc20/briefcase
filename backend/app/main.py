from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend" / "build"

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR / "static")
    name="static",
)

@app.get("/")
async def root():
    return {"message": "Hello World"} 

