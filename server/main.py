# server/main.py
import os
import json
import logging # <--- 1. Import Logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from schemas import Flowchart, PromptRequest

# 2. Configure Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@app.post("/generate", response_model=Flowchart)
async def generate_flow(request: PromptRequest):
    # 3. Log the incoming request
    logger.info(f"Received prompt: {request.prompt}")

    system_prompt = """
    You are a flowchart architect. Output pure JSON.
    1. Nodes must have 'data': {'label': '...'} and 'position': {'x': 0, 'y': 0}.
    2. 'type' should be 'default'.
    3. Edges must link valid node IDs.
    4. Set 'directed' to true for process flows (arrows), false for mind maps (lines).
    """

    # 4. Update Schema to include 'directed'
    json_schema = {
        "type": "object",
        "properties": {
            "nodes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "type": {"type": "string"},
                        "data": {
                            "type": "object",
                            "properties": {"label": {"type": "string"}},
                            "required": ["label"]
                        },
                        "position": {
                            "type": "object",
                            "properties": {"x": {"type": "number"}, "y": {"type": "number"}},
                            "required": ["x", "y"]
                        }
                    },
                    "required": ["id", "data", "position", "type"]
                }
            },
            "edges": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "source": {"type": "string"},
                        "target": {"type": "string"},
                        "label": {"type": "string"},
                        "directed": {"type": "boolean"} # <--- Added this
                    },
                    "required": ["id", "source", "target", "directed"]
                }
            }
        },
        "required": ["nodes", "edges"]
    }

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite", 
        contents=request.prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=json_schema, 
        )
    )
    
    try:
        if response.text:
            # 5. Log the raw AI output for debugging
            logger.info(f"AI Response: {response.text}") 
            data = json.loads(response.text)
            return data
        else:
            return {"nodes": [], "edges": []}
    except Exception as e:
        logger.error(f"Error parsing JSON: {e}")
        return {"nodes": [], "edges": []}