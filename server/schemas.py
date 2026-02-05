from pydantic import BaseModel
from typing import List, Optional

class NodeData(BaseModel):
    label: str

class NodePosition(BaseModel):
    x: float
    y: float

class Node(BaseModel):
    id: str
    data: NodeData
    position: NodePosition = {"x": 0, "y": 0} # Default 0, layout engine will fix it
    type: str = "default"
    parentId: Optional[str] = None      # <--- NEW: For System Architecture grouping
    extent: Optional[str] = None        # <--- NEW: Limits child movement (optional)

class Edge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    directed: bool = True 

class Flowchart(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    explanation: Optional[str] = None

class PromptRequest(BaseModel):
    prompt: str
    mode: str = "flowchart"             # <--- NEW: "flowchart" or "system"
    current_graph: Optional[Flowchart] = None