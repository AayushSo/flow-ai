import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  
  // --- HISTORY STATE ---
  // We store snapshots of { nodes, edges } for Undo/Redo
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView, getNodes, toObject, setViewport } = useReactFlow();

  const nodeTypes = useMemo(() => ({
    smart: SmartNode,
    group: GroupNode
  }), []);

  // --- UNDO / REDO LOGIC ---
  const addToHistory = (newNodes: any[], newEdges: any[]) => {
    // If we are in the middle of history and make a change, cut off the future
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, edges: newEdges });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = history[prevIndex];
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(prevIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(nextIndex);
    }
  };

  // --- SAVE ---
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

  // --- LOAD ---
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
          // Reset history on load
          setHistory([{ nodes: flowData.nodes, edges: flowData.edges }]);
          setHistoryIndex(0);
          
          if (flowData.viewport) {
            const { x, y, zoom } = flowData.viewport;
            setViewport({ x, y, zoom });
          } else {
            setTimeout(() => fitView(), 100);
          }
        }
      } catch (err) {
        alert("Invalid flowchart file.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const onDownloadImage = () => {
    const nodesBounds = getNodesBounds(getNodes());
    const viewportElem = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (viewportElem) {
        toPng(viewportElem, {
            backgroundColor: '#ffffff',
            width: nodesBounds.width + 100,
            height: nodesBounds.height + 100,
            style: {
                width: `${nodesBounds.width + 100}px`,
                height: `${nodesBounds.height + 100}px`,
                transform: `translate(${-nodesBounds.x + 50}px, ${-nodesBounds.y + 50}px) scale(1)`
            }
        }).then((dataUrl) => {
            const a = document.createElement('a');
            a.download = `flowchart-${Date.now()}.png`;
            a.href = dataUrl;
            a.click();
        });
    }
  };

  // --- GENERATE / UPDATE ---
  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);

    try {
      // 1. Capture current state for the "Context"
      const currentGraph = nodes.length > 0 ? { nodes, edges } : null;

      // 2. API Call
      const res = await axios.post("http://localhost:8000/generate", { 
        prompt, 
        mode,
        current_graph: currentGraph 
      });

      // 3. Process new nodes
      // We detect "NEW" nodes by checking if their ID existed in the old list
      const oldNodeIds = new Set(nodes.map(n => n.id));

      let processedNodes = res.data.nodes.map((node: any) => {
        const isGroup = node.type === 'group';
        const isNew = !oldNodeIds.has(node.id);
        
        return {
            ...node,
            type: isGroup ? 'group' : 'smart', 
            data: { 
              label: node.data.label,
              body: node.data.body || "",
              // If it's NEW, give it a light green tint, otherwise standard
              backgroundColor: isNew ? '#d0f0c0' : (node.data.backgroundColor || (isGroup ? 'rgba(240, 240, 240, 0.4)' : '#ffffff'))
            }, 
            style: isGroup ? { width: 100, height: 100, zIndex: -1 } : {}
        };
      });

      const processedEdges = res.data.edges.map((edge: any) => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2 }
      }));

      // 4. Layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(processedNodes, processedEdges);
      
      // 5. Update State & History
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      addToHistory(layoutedNodes, layoutedEdges);

      setTimeout(() => fitView(), 100);
    } catch (error) {
      console.error(error);
      alert("Error generating flow");
    }
    setLoading(false);
  };

  // Demo Load
  const loadDemo = () => {
    const { nodes: demoNodes, edges: demoEdges } = getDemoData();
    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(demoNodes, demoEdges);
    setNodes(lNodes);
    setEdges(lEdges);
    setHistory([{ nodes: lNodes, edges: lEdges }]);
    setHistoryIndex(0);
    setTimeout(() => fitView(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <div style={{ padding: '10px 20px', background: '#f0f2f5', borderBottom: '1px solid #ccc', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <h3 style={{ margin: 0, marginRight: '10px', color: '#333' }}>✨ AI Flow</h3>
        
        {/* Undo/Redo Buttons */}
        <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
             <button onClick={handleUndo} disabled={historyIndex <= 0} style={{ cursor: historyIndex > 0 ? 'pointer' : 'not-allowed', opacity: historyIndex > 0 ? 1 : 0.5, fontSize: '18px', border: 'none', background: 'transparent' }} title="Undo">↩️</button>
             <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} style={{ cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed', opacity: historyIndex < history.length - 1 ? 1 : 0.5, fontSize: '18px', border: 'none', background: 'transparent' }} title="Redo">↪️</button>
        </div>

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
          placeholder="Describe changes (e.g., 'Add a cache layer' or 'Remove step 2')"
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
          {loading ? "Thinking..." : "Update Flow"}
        </button>

        <div style={{ width: '1px', height: '30px', background: '#ddd', margin: '0 10px' }}></div>

        <button onClick={onSave} title="Save JSON" style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>💾</button>
        <button onClick={onLoadClick} title="Load JSON" style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📂</button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileUpload} />
        <button onClick={onDownloadImage} title="Export PNG" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📷</button>
        <button onClick={loadDemo} title="Load Example" style={{ padding: '10px 15px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🚀</button>
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