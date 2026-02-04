# server/schemas.py
from pydantic import BaseModel
from typing import List, Optional, Dict

class NodeData(BaseModel):
    label: str

class NodePosition(BaseModel):
    x: float
    y: float

class Node(BaseModel):
    id: str
    data: NodeData
    position: NodePosition
    type: str = "default"

class Edge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    directed: bool = True # <--- NEW FIELD (Default to True)

class Flowchart(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    explanation: Optional[str] = None

class PromptRequest(BaseModel):
    prompt: str
    current_graph: Optional[Flowchart] = None