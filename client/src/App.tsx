import { useState, useCallback, useMemo } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  addEdge,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { toPng } from 'html-to-image';

// Import our modules
import { getLayoutedElements } from "./utils/layout";
import { EditorPanel } from "./components/EditorPanel";
import { getDemoData } from "./data/demoData";
import { SmartNode, GroupNode } from "./components/CustomNodes";

function Flowchart() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("flowchart");
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
  const { fitView, getNodes } = useReactFlow();

  // Register Custom Nodes
  const nodeTypes = useMemo(() => ({
    smart: SmartNode,
    group: GroupNode
  }), []);

  // --- Smart Download Function ---
  const onDownload = () => {
    // 1. Get the exact size of the graph content
    const nodesBounds = getNodesBounds(getNodes());
    
    // 2. Define image dimensions (content size + padding)
    const padding = 50;
    const imageWidth = nodesBounds.width + (padding * 2);
    const imageHeight = nodesBounds.height + (padding * 2);

    // 3. Select the Viewport (The layer that actually holds the nodes/edges)
    const viewportElem = document.querySelector('.react-flow__viewport') as HTMLElement;

    if (viewportElem) {
        toPng(viewportElem, {
            backgroundColor: '#ffffff', // Clean white background
            width: imageWidth,
            height: imageHeight,
            style: {
                // FORCE the image size
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                // CRITICAL: Shift the graphics so they start at (0,0) + padding
                // This removes the user's current Pan/Zoom settings for the screenshot
                transform: `translate(${ -nodesBounds.x + padding }px, ${ -nodesBounds.y + padding }px) scale(1)`
            }
        }).then((dataUrl) => {
            const a = document.createElement('a');
            a.download = `flowchart-${Date.now()}.png`; // Unique timestamped name
            a.href = dataUrl;
            a.click();
        }).catch((err) => {
             console.error("Download failed", err);
        });
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/generate", { prompt, mode });

      let newNodes = res.data.nodes.map((node: any) => {
        const isGroup = node.type === 'group';
        return {
            ...node,
            // FORCE TYPE: 'group' uses GroupNode, others use SmartNode
            type: isGroup ? 'group' : 'smart', 
            data: { 
              label: node.data.label,
              body: "" // Initialize body empty
            }, 
            style: isGroup ? { 
                width: 100, height: 100, // Layout will fix
                zIndex: -1 
            } : {
                // Remove hardcoded width/color, let SmartNode handle it
            }
        };
      });

      let newEdges = res.data.edges.map((edge: any) => ({
        ...edge,
        animated: false,
        markerEnd: edge.directed ? { type: MarkerType.ArrowClosed } : undefined,
        style: { stroke: '#333', strokeWidth: 2 }
      }));

      const layouted = getLayoutedElements(newNodes, newEdges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setEditorOpen(true); 
      setTimeout(() => fitView({ padding: 0.2 }), 100);

    } catch (error) {
      console.error("Error:", error);
      alert("Error generating flow.");
    } finally {
      setLoading(false);
    }
  };

  // --- Demo Button for Testing ---
  const loadDemo = () => {
      const { nodes: demoNodes, edges: demoEdges } = getDemoData();
      // Ensure demo nodes use our new types
      const typedNodes = demoNodes.map(n => ({ 
          ...n, 
          type: n.type === 'group' ? 'group' : 'smart' 
      }));
      
      const layouted = getLayoutedElements(typedNodes, demoEdges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '15px 20px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: '15px', alignItems: 'center', background: '#fff', zIndex: 10 }}>
        <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
          <option value="flowchart">Flowchart</option>
          <option value="system">System Architecture</option>
        </select>
        <input type="text" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} placeholder="Describe..." value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} disabled={loading} />
        <button onClick={handleGenerate} disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{loading ? "..." : "Generate"}</button>
        <button onClick={onDownload} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Download Image</button>
        <button onClick={loadDemo} style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Test Demo</button>
      </div>

      <div style={{ flex: 1, width: '100%', position: 'relative', background: '#fafafa' }}>
        <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes} // <--- Register types here
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onNodeClick={(_, n) => { setSelectedNodeId(n.id); setEditorOpen(true); }} 
            onPaneClick={() => setSelectedNodeId(null)} 
            onConnect={(p) => setEdges((eds) => addEdge(p, eds))} 
            fitView 
            minZoom={0.1}
        >
          <Background color="#ccc" gap={20} />
          <Controls />
        </ReactFlow>
        <EditorPanel nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} isOpen={editorOpen} toggleOpen={() => setEditorOpen(!editorOpen)} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flowchart />
    </ReactFlowProvider>
  );
}