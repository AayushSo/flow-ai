import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from schemas import Flowchart, PromptRequest, Node, Edge

load_dotenv()

app = FastAPI()

# VERY IMPORTANT: This allows your React app to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "AI Flowchart Server is Running"}

@app.post("/generate")
async def generate_flow(request: PromptRequest):
    # This is where the AI logic will go later.
    # For now, let's return a "dummy" graph to test the connection.
    return {
        "nodes": [
            {"id": "1", "data": {"label": "Start"}, "position": {"x": 250, "y": 5}},
            {"id": "2", "data": {"label": "End"}, "position": {"x": 250, "y": 100}},
        ],
        "edges": [
            {"id": "e1-2", "source": "1", "target": "2"}
        ]
    }