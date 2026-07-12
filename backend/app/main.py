from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import auth, reports

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TransitOps API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins or specifically your dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reports.router)