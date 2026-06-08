from dotenv import load_dotenv
load_dotenv() 


import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.summarize import router

app = FastAPI()

# FIX: Never use allow_origins=["*"] with allow_credentials=True
# That combination is blocked by browsers and is a security hole.
# Set the exact origin your frontend runs on.
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000"   # default for local dev
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def home():
    return {"message": "AI Text Summarizer API Running"}