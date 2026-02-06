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
  // Panel,  <-- REMOVE THIS (Fixes TS6133)
  type Node,      // <-- ADD THIS
  type Edge       // <-- ADD THIS
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
  
  // --- STATE ---
  const [isDirty, setIsDirty] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
// --- NEW: Edge Style State ---
  const [edgeStyle, setEdgeStyle] = useState<'default' | 'smoothstep'>('default');
//  const [nodes, setNodes, onNodesChange] = useNodesState([]);
//  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fitView, getNodes, toObject, setViewport } = useReactFlow();
// --- NEW: Toggle Function ---
  const toggleEdgeStyle = () => {
    const newStyle = edgeStyle === 'default' ? 'smoothstep' : 'default';
    setEdgeStyle(newStyle);
    
    // Update all existing edges immediately
    setEdges((eds) => eds.map((e) => ({
      ...e,
      type: newStyle
    })));
  };
  const nodeTypes = useMemo(() => ({
    smart: SmartNode,
    group: GroupNode
  }), []);

  // --- DETECT PENDING CHANGES ---
  // Check if any node is currently highlighted in "New" Green
  const hasPendingChanges = useMemo(() => {
    return nodes.some(n => n.data.backgroundColor === '#d0f0c0');
  }, [nodes]);

  // --- WRAPPERS ---
  const onNodesChangeWrapped = useCallback((changes: any) => {
    onNodesChange(changes);
    if (changes.length > 0) setIsDirty(true);
  }, [onNodesChange]);

  const onEdgesChangeWrapped = useCallback((changes: any) => {
    onEdgesChange(changes);
    if (changes.length > 0) setIsDirty(true);
  }, [onEdgesChange]);

  const onConnectWrapped = useCallback((params: any) => {
    const newEdge = { 
        ...params, 
        type: edgeStyle, // NEW: Use current style for new edges
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#333', strokeWidth: 2 }
      };
	setEdges((eds) => addEdge(params, eds));
    setIsDirty(true);
  }, [setEdges, edgeStyle]);

  // --- HISTORY ---
  const addToHistory = (newNodes: any[], newEdges: any[]) => {
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
      setIsDirty(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(nextIndex);
      setIsDirty(true);
    }
  };

  // --- ACTIONS ---
  const handleNewCanvas = () => {
    if (nodes.length > 0 && isDirty) {
      if(!window.confirm("Unsaved changes. Create new canvas?")) return;
    }
    setNodes([]);
    setEdges([]);
    setHistory([]);
    setHistoryIndex(-1);
    setPrompt("");
    setIsDirty(false);
  };

  // NEW: Accept Changes Function
  const handleAcceptChanges = () => {
    const cleanNodes = nodes.map(node => {
      // If node is Green (#d0f0c0), reset it to default
      if (node.data.backgroundColor === '#d0f0c0') {
        return {
          ...node,
          data: {
            ...node.data,
            // Restore default colors based on type
            backgroundColor: node.type === 'group' ? 'rgba(240, 240, 240, 0.4)' : '#ffffff'
          }
        };
      }
      return node;
    });

    setNodes(cleanNodes);
    addToHistory(cleanNodes, edges); // Allow Undo of "Accept"
    setIsDirty(true);
  };

  const onSave = useCallback(() => {
    const flow = toObject();
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowchart-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsDirty(false);
  }, [toObject]);

  const onLoadClick = () => {
    if (nodes.length > 0 && isDirty) {
       if(!window.confirm("Unsaved changes. Load file?")) return;
    }
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
          setHistory([{ nodes: flowData.nodes, edges: flowData.edges }]);
          setHistoryIndex(0);
          setIsDirty(false);
          if (flowData.viewport) {
            const { x, y, zoom } = flowData.viewport;
            setViewport({ x, y, zoom });
          } else {
            setTimeout(() => fitView(), 100);
          }
        }
      } catch (err) { alert("Invalid file."); }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const currentGraph = nodes.length > 0 ? { nodes, edges } : null;
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await axios.post(`${API_URL}/generate`,{ 
        prompt, mode, current_graph: currentGraph 
      });

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

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(processedNodes, processedEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      addToHistory(layoutedNodes, layoutedEdges);
      setIsDirty(true);
      setTimeout(() => fitView(), 100);
    } catch (error) { console.error(error); alert("Error generating flow"); }
    setLoading(false);
  };

  const loadDemo = () => {
    if (nodes.length > 0 && isDirty) {
        if(!window.confirm("Discard changes?")) return;
    }
    const { nodes: demoNodes, edges: demoEdges } = getDemoData();
    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(demoNodes, demoEdges);
    setNodes(lNodes);
    setEdges(lEdges);
    setHistory([{ nodes: lNodes, edges: lEdges }]);
    setHistoryIndex(0);
    setIsDirty(false);
    setTimeout(() => fitView(), 100);
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
        
        {/* Undo/Redo */}
        <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
             <button onClick={handleUndo} disabled={historyIndex <= 0} style={{ cursor: historyIndex > 0 ? 'pointer' : 'not-allowed', opacity: historyIndex > 0 ? 1 : 0.5, fontSize: '18px', border: 'none', background: 'transparent' }} title="Undo">↩️</button>
             <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} style={{ cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed', opacity: historyIndex < history.length - 1 ? 1 : 0.5, fontSize: '18px', border: 'none', background: 'transparent' }} title="Redo">↪️</button>
        </div>

        <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="flowchart">Flowchart</option>
          <option value="system">Architecture</option>
        </select>

        <input
          type="text"
          style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
          placeholder="Describe changes..."
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
          {loading ? "Thinking..." : "Update"}
        </button>

        {/* ACCEPT CHANGES BUTTON (Only visible when green nodes exist) */}
        {hasPendingChanges && (
            <button 
                onClick={handleAcceptChanges}
                style={{ padding: '10px 15px', backgroundColor: '#198754', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', animation: 'fadeIn 0.3s' }}
                title="Accept Changes (Reset Colors)"
            >
                <span>✓</span> Accept
            </button>
        )}

        <div style={{ width: '1px', height: '30px', background: '#ddd', margin: '0 5px' }}></div>
		{/* --- NEW: Edge Style Toggle Button --- */}
        <button 
          onClick={toggleEdgeStyle} 
          title="Toggle Edge Style (Curved / Right-Angle)" 
          style={{ 
            padding: '8px 12px', 
            backgroundColor: 'white', 
            color: '#333', 
            border: '1px solid #ccc', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          {edgeStyle === 'default' ? '⤵ Arrow' : '⮥ Arrow'}
        </button>
        <button onClick={handleNewCanvas} title="New Canvas" style={{ padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📄</button>
        <button onClick={onSave} title="Save JSON" style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{isDirty ? '💾 *' : '💾'}</button>
        <button onClick={onLoadClick} title="Load JSON" style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📂</button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileUpload} />
        <button onClick={onDownloadImage} title="Export PNG" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📷</button>
        <button onClick={loadDemo} title="Load Example" style={{ padding: '10px 15px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🚀</button>
      </div>

      <div style={{ flex: 1, width: '100%', position: 'relative', background: '#fafafa' }}>
        <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes} 
            onNodesChange={onNodesChangeWrapped}
            onEdgesChange={onEdgesChangeWrapped}
            onNodeClick={(_, n) => { setSelectedNodeId(n.id); setEditorOpen(true); }} 
            onPaneClick={() => setSelectedNodeId(null)} 
            onConnect={onConnectWrapped}
            fitView 
            minZoom={0.1}
        >
          <Background color="#ccc" gap={20} />
          <Controls />
        </ReactFlow>

        <EditorPanel 
            nodes={nodes} 
            edges={edges} 
            setNodes={(val: any) => { setNodes(val); setIsDirty(true); }} 
            setEdges={(val: any) => { setEdges(val); setIsDirty(true); }} 
            selectedNodeId={selectedNodeId} 
            onSelectNode={setSelectedNodeId} 
            isOpen={editorOpen} 
            toggleOpen={() => setEditorOpen(!editorOpen)} 
        />
      </div>
    </div>
  );
}