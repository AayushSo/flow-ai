import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from schemas import Flowchart, PromptRequest

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
    system_prompt = """
    You are a flowchart architect. Output pure JSON.
    1. Nodes must have 'data': {'label': '...'} and 'position': {'x': 0, 'y': 0}.
    2. 'type' should be 'default'.
    3. Edges must link valid node IDs.
    """

    # We manually define the schema here to avoid SDK/Pydantic conflicts
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
                        "label": {"type": "string"}
                    },
                    "required": ["id", "source", "target"]
                }
            }
        },
        "required": ["nodes", "edges"]
    }

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite", # Using the stable 2.0 Flash model
        contents=request.prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            response_schema=json_schema, 
        )
    )
    
    # Manually parse the JSON string response
    # This is safer than relying on response.parsed for complex nested schemas right now
    try:
        if response.text:
            data = json.loads(response.text)
            return data
        else:
            return {"nodes": [], "edges": []}
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return {"nodes": [], "edges": []}