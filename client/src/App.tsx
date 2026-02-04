import { useState } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  ReactFlowProvider, // Keep this
  useReactFlow,
  getNodesBounds,    // Helper for smart bounding box
  getViewportForBounds
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { toPng } from 'html-to-image';

// --- Download Button Component ---
function DownloadButton() {
  const { getNodes } = useReactFlow();
  
  const onClick = () => {
    // 1. Get nodes from the SHARED context
    const nodes = getNodes();
    
    // Debug: Check if nodes are found
    console.log("Downloading... Found nodes:", nodes.length);
    
    if (nodes.length === 0) return;

    // 2. Calculate the bounding box
    const bounds = getNodesBounds(nodes);
    const padding = 50;
    const imageWidth = bounds.width + (padding * 2);
    const imageHeight = bounds.height + (padding * 2);
    
    // 3. Select the viewport
    const flowElement = document.querySelector('.react-flow__viewport') as HTMLElement;

    if (flowElement) {
        toPng(flowElement, {
            backgroundColor: '#fff',
            width: imageWidth,
            height: imageHeight,
            style: {
                width: imageWidth + 'px',
                height: imageHeight + 'px',
                // Shift the graph so the content is centered
                transform: `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)`
            }
        }).then((dataUrl) => {
            const a = document.createElement('a');
            a.setAttribute('download', 'flowchart.png');
            a.setAttribute('href', dataUrl);
            a.click();
        }).catch((err) => {
            console.error("Image generation failed:", err);
        });
    }
  };

  return (
    <button 
      onClick={onClick} 
      className="download-btn"
      style={{ padding: '8px 16px', marginLeft: '10px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
    >
      Download Image
    </button>
  );
}

// --- Main Flowchart Logic ---
function Flowchart() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/generate", {
        prompt: prompt,
      });

      const newNodes = res.data.nodes.map((node: any) => ({
        ...node,
        data: { label: node.data.label }, 
      }));

      const newEdges = res.data.edges.map((edge: any) => ({
        ...edge,
        animated: false, // Ensure lines are solid
        markerEnd: edge.directed ? { type: MarkerType.ArrowClosed } : undefined,
        style: { stroke: '#000', strokeWidth: 2 }
      }));

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error("Error generating flow:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleGenerate();
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #ccc', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          style={{ flex: 1, padding: '10px', fontSize: '16px' }}
          placeholder="Describe your flowchart..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: loading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
        
        {/* Button is now inside the same Provider context as ReactFlow */}
        <DownloadButton />
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, width: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background color="#ccc" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

// --- Root App Component ---
export default function App() {
  return (
    // WRAP EVERYTHING HERE
    <ReactFlowProvider>
      <Flowchart />
    </ReactFlowProvider>
  );
}