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
  reconnectEdge,
  type Connection,
  type Node,      
  type Edge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { toPng } from 'html-to-image';

// Custom Components
import { getLayoutedElements } from "./utils/layout";
import { EditorPanel } from "./components/EditorPanel";
import { ControlBar } from "./components/ControlBar"; // NEW IMPORT
import { getDemoData } from "./data/demoData";
import { SmartNode, GroupNode } from "./components/CustomNodes";

export default function App() {
  return (
    <ReactFlowProvider>
      <Flowchart />
    </ReactFlowProvider>
  );
}

function Flowchart() {
  // --- STATE ---
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("flowchart");
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // History
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Flow State
  const [edgeStyle, setEdgeStyle] = useState<'default' | 'smoothstep'>('default');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
  const { fitView, getNodes, toObject } = useReactFlow();
  
  const nodeTypes = useMemo(() => ({ smart: SmartNode, group: GroupNode }), []);

  // --- HELPERS ---
  const addToHistory = (newNodes: any[], newEdges: any[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, edges: newEdges });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // --- HANDLERS ---
  const toggleEdgeStyle = () => {
    const newStyle = edgeStyle === 'default' ? 'smoothstep' : 'default';
    setEdgeStyle(newStyle);
    setEdges((eds) => eds.map((e) => ({ ...e, type: newStyle })));
  };

  const onNodesChangeWrapped = useCallback((changes: any) => {
    onNodesChange(changes);
    if (changes.length > 0) setIsDirty(true);
  }, [onNodesChange]);

  const onEdgesChangeWrapped = useCallback((changes: any) => {
    onEdgesChange(changes);
    if (changes.length > 0) setIsDirty(true);
  }, [onEdgesChange]);

  // FIX: Applied the fix for unused newEdge here
  const onConnectWrapped = useCallback((params: any) => {
    const newEdge = { 
        ...params, 
        type: edgeStyle, 
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#333', strokeWidth: 2 }
    };
    setEdges((eds) => addEdge(newEdge, eds)); // Fix applied
    setIsDirty(true);
  }, [setEdges, edgeStyle]);
	// --- NEW: Handle Manual Add ---
  const handleAddNode = () => {
    const id = `manual-${Date.now()}`;
    const newNode: Node = {
        id,
        type: 'smart', // Defaults to smart node
        position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 50 }, // Center-ish
        data: { 
            label: 'New Node', 
            body: 'Description', 
            backgroundColor: '#ffffff' 
        }
    };
    setNodes((nds) => nds.concat(newNode));
    setIsDirty(true);
  };
  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
      setIsDirty(true);
    }, [setEdges]);

  // History Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyIndex - 1;
      setNodes(history[prev].nodes);
      setEdges(history[prev].edges);
      setHistoryIndex(prev);
      setIsDirty(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1;
      setNodes(history[next].nodes);
      setEdges(history[next].edges);
      setHistoryIndex(next);
      setIsDirty(true);
    }
  };

  // File & Action Handlers
  const handleNewCanvas = () => {
    if (nodes.length > 0 && isDirty && !window.confirm("Unsaved changes. Create new canvas?")) return;
    setNodes([]); setEdges([]); setHistory([]); setHistoryIndex(-1); setIsDirty(false); setPrompt("");
  };

  const handleAcceptChanges = () => {
    const cleanNodes = nodes.map(n => 
      n.data.backgroundColor === '#d0f0c0' 
        ? { ...n, data: { ...n.data, backgroundColor: n.type === 'group' ? 'rgba(240,240,240,0.4)' : '#ffffff' } } 
        : n
    );
    setNodes(cleanNodes);
    addToHistory(cleanNodes, edges);
    setIsDirty(true);
  };

  const onSave = useCallback(() => {
    const flow = toObject();
    const blob = new Blob([JSON.stringify(flow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `flowchart-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
    setIsDirty(false);
  }, [toObject]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const flowData = JSON.parse(evt.target?.result as string);
        if (flowData.nodes && flowData.edges) {
          setNodes(flowData.nodes);
          setEdges(flowData.edges);
          setHistory([{ nodes: flowData.nodes, edges: flowData.edges }]);
          setHistoryIndex(0);
          setIsDirty(false);
          setTimeout(() => fitView(), 100);
        }
      } catch (err) { alert("Invalid file."); }
    };
    reader.readAsText(file);
    e.target.value = ''; 
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
            a.href = dataUrl; a.click();
        });
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await axios.post(`${API_URL}/generate`, { 
        prompt, mode, current_graph: nodes.length > 0 ? { nodes, edges } : null 
      });

      const oldNodeIds = new Set(nodes.map(n => n.id));
      const processedNodes = res.data.nodes.map((node: any) => {
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

      const { nodes: lNodes, edges: lEdges } = getLayoutedElements(processedNodes, processedEdges);
      setNodes(lNodes);
      setEdges(lEdges);
      addToHistory(lNodes, lEdges);
      setIsDirty(true);
      setTimeout(() => fitView(), 100);
    } catch (error) { console.error(error); alert("Error generating flow"); }
    setLoading(false);
  };

  const loadDemo = () => {
    if (nodes.length > 0 && isDirty && !window.confirm("Discard changes?")) return;
    const { nodes: dNodes, edges: dEdges } = getDemoData();
    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(dNodes, dEdges);
    setNodes(lNodes); setEdges(lEdges);
    setHistory([{ nodes: lNodes, edges: lEdges }]); setHistoryIndex(0);
    setIsDirty(false); setTimeout(() => fitView(), 100);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ControlBar 
        prompt={prompt} setPrompt={setPrompt}
        onGenerate={handleGenerate} loading={loading}
        mode={mode} setMode={setMode}
        onUndo={handleUndo} onRedo={handleRedo}
        canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1}
        hasPendingChanges={nodes.some(n => n.data.backgroundColor === '#d0f0c0')}
        onAcceptChanges={handleAcceptChanges}
        edgeStyle={edgeStyle} onToggleEdgeStyle={toggleEdgeStyle}
        onNewCanvas={handleNewCanvas}
        onSave={onSave} onLoadFile={handleFileUpload}
        onExport={onDownloadImage} onLoadDemo={loadDemo}
        isDirty={isDirty}
      />

      <div style={{ flex: 1, width: '100%', position: 'relative', background: '#fafafa' }}>
        <ReactFlow 
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} 
            onNodesChange={onNodesChangeWrapped} onEdgesChange={onEdgesChangeWrapped}
            onNodeClick={(_, n) => { setSelectedNodeId(n.id); setEditorOpen(true); }} 
            onPaneClick={() => setSelectedNodeId(null)} 
            onConnect={onConnectWrapped}
            onReconnect={onReconnect}
            fitView minZoom={0.1}
        >
          <Background color="#ccc" gap={20} />
          <Controls />
        </ReactFlow>

        <EditorPanel 
            nodes={nodes} edges={edges} 
            setNodes={(val: any) => { setNodes(val); setIsDirty(true); }} 
            setEdges={(val: any) => { setEdges(val); setIsDirty(true); }} 
            selectedNodeId={selectedNodeId} 
            isOpen={editorOpen} toggleOpen={() => setEditorOpen(!editorOpen)} 
			onAddNode={handleAddNode} // <-- Pass it here
		/>
      </div>
    </div>
  );
}