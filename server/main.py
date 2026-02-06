import os
import json
import logging
from fastapi import FastAPI, Request, HTTPException
import re
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from schemas import Flowchart, PromptRequest
# --- NEW: Import CORS Middleware ---
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@app.post("/generate", response_model=Flowchart)
async def generate_flow(request: PromptRequest):
    logger.info(f"Received prompt: {request.prompt} | Mode: {request.mode}")

    # --- CONSTRUCT PROMPT WITH CONTEXT ---
    context_instruction = ""
    if request.current_graph and len(request.current_graph.nodes) > 0:
        graph_str = json.dumps(request.current_graph.model_dump(), indent=2)
        context_instruction = f"""
        ERROR CORRECTION / UPDATE MODE:
        The user wants to update an EXISTING graph.
        Current Graph JSON:
        {graph_str}

        INSTRUCTIONS:
        1. Parse the User Request below and modify the graph accordingly.
        2. KEEP existing nodes/edges unless the user explicitly asks to remove them.
        3. PRESERVE existing node IDs if possible to maintain layout stability.
        4. ADD new nodes with unique IDs.
        5. RETURN the full updated graph (old + new).
        """
    
    # Select Strategy
    if request.mode == "system":
        system_instruction = f"""
        You are a System Architecture Expert. Output pure JSON.
        {context_instruction}
        1. Identify high-level components (e.g., 'Frontend', 'Backend', 'Database') -> 'group' nodes.
        2. Create sub-components inside them using 'parentId'.
        3. Use 'directed': true for data flow.
        """
    else:
        system_instruction = f"""
        You are a Flowchart Expert. Output pure JSON.
        {context_instruction}
        1. Create clear logical steps.
        2. 'type' should be 'default'.
        3. Connect steps with 'directed': true.
        """

    # JSON Schema (Strict Output)
    json_schema = {
        "type": "object",
        "properties": {
            "nodes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "type": {"type": "string", "enum": ["default", "group", "smart"]},
                        "data": {
                            "type": "object",
                            "properties": {
                                "label": {"type": "string"},
                                "body": {"type": "string"},
                                "backgroundColor": {"type": "string"}
                            },
                            "required": ["label"]
                        },
                        "position": {
                            "type": "object",
                            "properties": {
                                "x": {"type": "number"},
                                "y": {"type": "number"}
                            },
                            "required": ["x", "y"]
                        },
                        "parentId": {"type": "string"}
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
    
    try:
        # 1. Make the API Call (Wrapped to catch Rate Limits)
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite", 
            contents=request.prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=json_schema, 
            )
        )
    except Exception as e:
        # Check for the Rate Limit (429) error
        error_str = str(e)
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            logger.warning(f"Rate Limit Hit: {e}")
            # Return a real 429 status so the frontend can show the "Wait 10s" alert
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        logger.error(f"AI Generation Error: {e}")
        raise HTTPException(status_code=500, detail="AI service failed")

    # 2. Parse the JSON (With Robust Cleanup)
    try:
        if response.text:
            raw_text = response.text
            
            # A. Strip Markdown code fences (e.g. ```json ... ```)
            cleaned_text = raw_text.replace('```json', '').replace('```', '').strip()

            # B. Attempt to parse
            try:
                data = json.loads(cleaned_text)
            except json.JSONDecodeError:
                logger.warning("JSON Decode Error - Attempting newline repair")
                # C. Fallback: Fix unescaped newlines inside strings
                # This replaces actual newlines with \n, allowing the parser to work
                # Note: This is a brute-force fix that usually saves the day for long text blocks
                cleaned_text = cleaned_text.replace('\n', '\\n')
                data = json.loads(cleaned_text, strict=False)

            logger.info("AI Response parsed successfully.")
            return data
        else:
            return {"nodes": [], "edges": []}

    except Exception as e:
        logger.error(f"Final JSON Parsing Failed: {e}")
        # Return empty graph instead of crashing
        return {"nodes": [], "edges": []}