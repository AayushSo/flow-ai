from pydantic import BaseModel
from typing import List, Optional, Dict

class Node(BaseModel):
    id: str
    data: Dict[str, str]  # React Flow expects {"label": "Text"} here
    type: str = "default"
    position: Dict[str, float] = {"x": 0, "y": 0}

class Edge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None

class Flowchart(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    explanation: Optional[str] = None

class PromptRequest(BaseModel):
    prompt: str
    current_graph: Optional[Flowchart] = None