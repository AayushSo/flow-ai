import { useState, useCallback, useMemo, useRef } from "react";
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
  Panel
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { toPng } from 'html-to-image';

// Import our modules
import { getLayoutedElements } from "./utils/layout";
import { EditorPanel } from "./components/EditorPanel";
import { getDemoData } from "./data/demoData";
import { SmartNode, GroupNode } from "./components/CustomNodes";

// --- Wrapper to provide Context ---
export default function App() {
  return (
    <ReactFlowProvider>
      <Flowchart />
    </ReactFlowProvider>
  );
}

function Flowchart() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("flowchart");
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
  // Hidden input for file loading
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // React Flow Hooks
  const { fitView, getNodes, toObject, setViewport } = useReactFlow();

  // Register Custom Nodes
  const nodeTypes = useMemo(() => ({
    smart: SmartNode,
    group: GroupNode
  }), []);

  // --- SAVE FUNCTIONALITY ---
  const onSave = useCallback(() => {
    const flow = toObject();
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowchart-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [toObject]);

  // --- LOAD FUNCTIONALITY ---
  const onLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const flowData = JSON.parse(result);

        if (flowData.nodes && flowData.edges) {
          setNodes(flowData.nodes || []);
          setEdges(flowData.edges || []);
          
          if (flowData.viewport) {
            const { x, y, zoom } = flowData.viewport;
            setViewport({ x, y, zoom });
          } else {
            setTimeout(() => fitView(), 100);
          }
        }
      } catch (err) {
        console.error("Failed to parse JSON", err);
        alert("Invalid flowchart file.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  // --- DOWNLOAD IMAGE ---
  const onDownloadImage = () => {
    const nodesBounds = getNodesBounds(getNodes());
    const padding = 50;
    const imageWidth = nodesBounds.width + (padding * 2);
    const imageHeight = nodesBounds.height + (padding * 2);
    const viewportElem = document.querySelector('.react-flow__viewport') as HTMLElement;

    if (viewportElem) {
        toPng(viewportElem, {
            backgroundColor: '#ffffff',
            width: imageWidth,
            height: imageHeight,
            style: {
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                transform: `translate(${ -nodesBounds.x + padding }px, ${ -nodesBounds.y + padding }px) scale(1)`
            }
        }).then((dataUrl) => {
            const a = document.createElement('a');
            a.download = `flowchart-${Date.now()}.png`;
            a.href = dataUrl;
            a.click();
        });
    }
  };

  // --- GENERATE GRAPH ---
  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const currentGraph = nodes.length > 0 ? { nodes, edges } : null;

      const res = await axios.post("http://localhost:8000/generate", { 
        prompt, 
        mode,
        current_graph: currentGraph 
      });

      let newNodes = res.data.nodes.map((node: any) => {
        const isGroup = node.type === 'group';
        return {
            ...node,
            type: isGroup ? 'group' : 'smart', 
            data: { 
              label: node.data.label,
              body: "",
              backgroundColor: isGroup ? 'rgba(240, 240, 240, 0.4)' : '#ffffff' 
            }, 
            style: isGroup ? { width: 100, height: 100, zIndex: -1 } : {}
        };
      });

      const newEdges = res.data.edges.map((edge: any) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2 }
      }));

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      setTimeout(() => fitView(), 100);
    } catch (error) {
      console.error(error);
      alert("Error generating flow");
    }
    setLoading(false);
  };

  // --- LOAD DEMO DATA ---
  const loadDemo = () => {
    const { nodes: demoNodes, edges: demoEdges } = getDemoData();
    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(demoNodes, demoEdges);
    setNodes(lNodes);
    setEdges(lEdges);
    setTimeout(() => fitView(), 100);
  };

  // Keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER / CONTROLS */}
      <div style={{ padding: '10px 20px', background: '#f0f2f5', borderBottom: '1px solid #ccc', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <h3 style={{ margin: 0, marginRight: '20px', color: '#333' }}>✨ AI Flow</h3>
        
        <select 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="flowchart">Flowchart Mode</option>
          <option value="system">System Arch Mode</option>
        </select>

        <input
          type="text"
          style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
          placeholder={mode === 'system' ? "Describe system (e.g. 'Microservices Auth System')" : "Describe flow (e.g. 'How to make tea')"}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown} 
          disabled={loading}
        />
        
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: loading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        <div style={{ width: '1px', height: '30px', background: '#ddd', margin: '0 10px' }}></div>

        {/* --- TOOLS SECTION --- */}
        <button onClick={onSave} title="Save to JSON" style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
           💾 Save
        </button>

        <button onClick={onLoadClick} title="Load from JSON" style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
           📂 Load
        </button>
        <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".json" 
            onChange={handleFileUpload} 
        />

        <button onClick={onDownloadImage} title="Export PNG" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
           📷 PNG
        </button>

        {/* RESTORED BUTTON */}
        <button onClick={loadDemo} title="Load Example" style={{ padding: '10px 15px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
           🚀 Demo
        </button>
      </div>

      {/* CANVAS */}
      <div style={{ flex: 1, width: '100%', position: 'relative', background: '#fafafa' }}>
        <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes} 
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

        <EditorPanel 
            nodes={nodes} 
            edges={edges} 
            setNodes={setNodes} 
            setEdges={setEdges} 
            selectedNodeId={selectedNodeId} 
            onSelectNode={setSelectedNodeId} 
            isOpen={editorOpen} 
            toggleOpen={() => setEditorOpen(!editorOpen)} 
        />
      </div>
    </div>
  );
}