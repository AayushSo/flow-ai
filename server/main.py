import os
import json
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from schemas import Flowchart, PromptRequest

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
    logger.info(f"Received prompt: {request.prompt} | Mode: {request.mode}")

    # 1. Select the Strategy based on Mode
    if request.mode == "system":
        system_instruction = """
        You are a System Architecture Expert. Output pure JSON.
        1. Identify high-level components (e.g., 'Frontend', 'Backend', 'Database') and create them as Container Nodes.
        2. Create sub-components inside them using the 'parentId' field.
        3. Container Nodes must have 'type': 'group'. (Standard nodes are 'default').
        4. Use 'directed': true for data flow.
        5. CONSTRAINT: Do not create more than 5 direct children per container. Group excess items into logical sub-groups if necessary.
        """
    else:
        system_instruction = """
        You are a Flowchart Architect. Output pure JSON.
        1. Create a logical step-by-step flow.
        2. Use 'type': 'default' for all nodes.
        3. Do not use parentId.
        4. CONSTRAINT: Keep the tree balanced. If a node has >5 children, introduce an intermediate category node to group them.
        """

    # 2. Update Schema
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
                        "parentId": {"type": "string"},
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
                        "directed": {"type": "boolean"}
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
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=json_schema, 
        )
    )
    
    try:
        if response.text:
            logger.info(f"AI Response: {response.text}")
            data = json.loads(response.text)
            return data
        else:
            return {"nodes": [], "edges": []}
    except Exception as e:
        logger.error(f"Error parsing JSON: {e}")
        return {"nodes": [], "edges": []}