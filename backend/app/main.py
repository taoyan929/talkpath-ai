from fastapi import FastAPI

from app.api.health import router as health_router

app = FastAPI(title="TalkPath AI Backend")


@app.get("/")
def read_root():
    return {"message": "Welcome to TalkPath AI backend"}


app.include_router(health_router, prefix="/api")
