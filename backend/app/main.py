from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import shares
from app.db.database import engine
from app.db.database import Base
from app.routes import folders
from app.routes import auth
from app.routes import files
import app.routes.upload as upload
from app.routes import public
from app.routes import stars

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow local dev frontend (Vite) and same-origin deployments.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(folders.router)
app.include_router(auth.router)
app.include_router(files.router)
app.include_router(upload.router)
app.include_router(shares.router)
app.include_router(public.router)
app.include_router(stars.router)

@app.get("/")
def root():

    return {
        "message": "Cloud Storage API Running"
    }
