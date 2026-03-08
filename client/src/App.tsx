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
import { ControlBar } from "./components/ControlBar"; 
import { getDemoData } from "./data/demoData";
import { SmartNode, GroupNode, DecisionNode, LayeredNode } from "./components/CustomNodes";

type EdgeLabelPlacement = 'above' | 'center' | 'below';

const getEdgeLabelOffset = (placement: EdgeLabelPlacement) => {
  if (placement === 'above') return -14;
  if (placement === 'below') return 14;
  return 0;
};

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
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // History
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Flow State
  const [edgeStyle, setEdgeStyle] = useState<'default' | 'smoothstep'>('default');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
  const { fitView, getNodes, toObject } = useReactFlow();
  
  const nodeTypes = useMemo(() => ({ smart: SmartNode, group: GroupNode, decision: DecisionNode, layered: LayeredNode }), []);

  const buildEdgeWithPresentation = useCallback((edge: any, forcedType?: 'default' | 'smoothstep') => {
    const placement = (edge?.data?.labelPlacement || 'center') as EdgeLabelPlacement;
    const offset = getEdgeLabelOffset(placement);

    return {
      ...edge,
      type: forcedType || edge.type || edgeStyle,
      markerEnd: edge.markerEnd || { type: MarkerType.ArrowClosed },
      style: {
        strokeWidth: 2,
        stroke: isDarkMode ? '#aaa' : '#333',
        ...(edge.style || {})
      },
      data: {
        ...(edge.data || {}),
        labelPlacement: placement
      },
      labelShowBg: true,
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 4,
      labelBgStyle: {
        fill: isDarkMode ? '#1e1e1e' : '#ffffff',
        fillOpacity: 0.95
      },
      labelStyle: {
        fill: isDarkMode ? '#eaeaea' : '#222222',
        fontSize: 12,
        ...(edge.labelStyle || {}),
        transform: `translateY(${offset}px)`
      }
    };
  }, [edgeStyle, isDarkMode]);

  // --- HELPER: Toggle Edge Style ---
  // FIX: This now updates both the "future preference" AND "existing edges"
  const toggleEdgeStyle = () => {
    const newStyle = edgeStyle === 'default' ? 'smoothstep' : 'default';
    setEdgeStyle(newStyle);
    
    // Explicitly update all existing edges on the canvas
    setEdges((eds) => eds.map((e) => buildEdgeWithPresentation(e, newStyle)));
    
    setIsDirty(true);
  };

  // --- HELPERS ---
  const addToHistory = (newNodes: any[], newEdges: any[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, edges: newEdges });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const onNodesChangeWrapped = useCallback((changes: any) => {
    onNodesChange(changes);
    if (changes.length > 0) setIsDirty(true);

    // Auto-resize groups when children move (if autoSnap is enabled)
    const positionChanges = changes.filter((c: any) => c.type === 'position' && c.position && !c.dragging);
    if (positionChanges.length > 0) {
      setNodes((nds) => {
        const groupsToUpdate = new Set<string>();
        
        // Find groups that need updates
        positionChanges.forEach((change: any) => {
          const node = nds.find((n) => n.id === change.id);
          if (node?.parentId) {
            const parent = nds.find((n) => n.id === node.parentId);
            if (parent?.type === 'group' && parent.data?.autoSnap !== false) {
              groupsToUpdate.add(node.parentId);
            }
          }
        });

        if (groupsToUpdate.size === 0) return nds;

        // Recalculate bounds for affected groups
        const updatedNodes = [...nds];
        groupsToUpdate.forEach((groupId) => {
          const children = updatedNodes.filter((n) => n.parentId === groupId);
          if (children.length === 0) return;

          const groupNode = updatedNodes.find((n) => n.id === groupId);
          if (!groupNode) return;

          const groupPaddingX = 36;
          const groupPaddingTop = 48;
          const groupPaddingBottom = 28;

          const childBounds = children.map((child) => {
            const width = (child.measured?.width || child.style?.width || 180) as number;
            const height = (child.measured?.height || child.style?.height || 80) as number;
            const absX = groupNode.position.x + child.position.x;
            const absY = groupNode.position.y + child.position.y;
            return {
              minX: absX,
              minY: absY,
              maxX: absX + width,
              maxY: absY + height
            };
          });

          const minX = Math.min(...childBounds.map((b) => b.minX));
          const minY = Math.min(...childBounds.map((b) => b.minY));
          const maxX = Math.max(...childBounds.map((b) => b.maxX));
          const maxY = Math.max(...childBounds.map((b) => b.maxY));

          const newGroupX = minX - groupPaddingX;
          const newGroupY = minY - groupPaddingTop;
          const newGroupWidth = Math.max(220, maxX - minX + groupPaddingX * 2);
          const newGroupHeight = Math.max(160, maxY - minY + groupPaddingTop + groupPaddingBottom);

          // Update group position and size
          const groupIndex = updatedNodes.findIndex((n) => n.id === groupId);
          if (groupIndex !== -1) {
            updatedNodes[groupIndex] = {
              ...updatedNodes[groupIndex],
              position: { x: newGroupX, y: newGroupY },
              style: {
                ...updatedNodes[groupIndex].style,
                width: newGroupWidth,
                height: newGroupHeight
              }
            };

            // Update child relative positions
            children.forEach((child) => {
              const childIndex = updatedNodes.findIndex((n) => n.id === child.id);
              if (childIndex !== -1) {
                const absX = groupNode.position.x + child.position.x;
                const absY = groupNode.position.y + child.position.y;
                updatedNodes[childIndex] = {
                  ...updatedNodes[childIndex],
                  position: {
                    x: absX - newGroupX,
                    y: absY - newGroupY
                  }
                };
              }
            });
          }
        });

        return updatedNodes;
      });
    }
  }, [onNodesChange, setNodes]);

  const onEdgesChangeWrapped = useCallback((changes: any) => {
    onEdgesChange(changes);
    if (changes.length > 0) setIsDirty(true);
  }, [onEdgesChange]);

  const onConnectWrapped = useCallback((params: any) => {
    const newEdge = buildEdgeWithPresentation({
      ...params,
      data: { labelPlacement: 'center' }
    }, edgeStyle);
    setEdges((eds) => addEdge(newEdge, eds));
    setIsDirty(true);
  }, [setEdges, edgeStyle, buildEdgeWithPresentation]);

  const handleAddNode = () => {
    const id = `manual-${Date.now()}`;
    const newNode: Node = {
        id,
        type: 'smart',
        position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 50 },
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
          const normalizedEdges = flowData.edges.map((edge: any) => buildEdgeWithPresentation(edge));
          setEdges(normalizedEdges);
          setHistory([{ nodes: flowData.nodes, edges: normalizedEdges }]);
          setHistoryIndex(0);
          setIsDirty(false);
          setTimeout(() => fitView(), 100);
        }
      } catch (err) { alert("Invalid file."); }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const onDownloadImage = async () => {
    let previouslySelectedIds: string[] = [];

    try {
      previouslySelectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
      if (previouslySelectedIds.length > 0) {
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const currentNodes = getNodes();
      if (currentNodes.length === 0) return;

      const nodesBounds = getNodesBounds(currentNodes);
      const padding = 40;
      const imageWidth = Math.ceil(nodesBounds.width + padding * 2);
      const imageHeight = Math.ceil(nodesBounds.height + padding * 2);
      
      const viewportElem = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElem) return;

      const dataUrl = await toPng(viewportElem, {
        backgroundColor: '#ffffff',
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${-nodesBounds.x + padding}px, ${-nodesBounds.y + padding}px) scale(1)`
        },
        filter: (node: any) => {
          if (node.classList && node.classList.contains('react-flow__handle')) return false;
          return true;
        },
        onClone: (clonedNode: HTMLElement) => {
          const node = clonedNode as HTMLElement;
          node.querySelectorAll('.react-flow__edge-path').forEach((el) => {
            (el as HTMLElement).style.stroke = '#333333';
            (el as HTMLElement).style.strokeOpacity = '1';
          });
          node.querySelectorAll('.react-flow__edge-text').forEach((el) => {
            (el as HTMLElement).style.fill = '#000000';
          });
          node.querySelectorAll('.react-flow__edge-textbg').forEach((el) => {
            (el as HTMLElement).style.fill = '#ffffff';
          });
        }
      } as any);

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `flowchart-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      if (previouslySelectedIds.length > 0) {
        setNodes((nds) => nds.map((n) => ({ ...n, selected: previouslySelectedIds.includes(n.id) })));
      }
    }
  };
  
  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    const oldNodesMap = new Map(nodes.map(n => [n.id, n]));

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await axios.post(`${API_URL}/generate`, { 
        prompt, mode, current_graph: nodes.length > 0 ? { nodes, edges } : null 
      });

      const oldNodeIds = new Set(nodes.map(n => n.id));
      
      const processedNodes = res.data.nodes.map((node: any) => {
        const existingNode = oldNodesMap.get(node.id);
        const isGroup = node.type === 'group';
        const isNew = !oldNodeIds.has(node.id);
        return {
            ...node,
            type: existingNode ? existingNode.type : (isGroup ? 'group' : 'smart'),
            data: { 
              ...node.data,
              body: node.data.body || (existingNode?.data?.body || ""), 
              icon: existingNode?.data?.icon || "", 
              subtitle: existingNode?.data?.subtitle || "",
              backgroundColor: isNew ? '#d0f0c0' : (existingNode?.data?.backgroundColor || '#ffffff'),
              autoSnap: isGroup ? (existingNode?.data?.autoSnap ?? true) : undefined,
              lockChildren: isGroup ? (existingNode?.data?.lockChildren ?? false) : undefined
            }, 
            style: isGroup ? { width: 100, height: 100, zIndex: -1 } : {}
        };
      });
      const processedEdges = res.data.edges.map((edge: any) => buildEdgeWithPresentation(edge, edgeStyle));

      const { nodes: layoutedNodes, edges: lEdges } = getLayoutedElements(processedNodes, processedEdges);

      const finalNodes = layoutedNodes.map((node) => {
          const oldNode = oldNodesMap.get(node.id);
          if (oldNode) {
              return {
                  ...node,
                  position: oldNode.position, 
                  data: {
                      ...node.data,
                      body: node.data.body || oldNode.data.body, 
                      backgroundColor: oldNode.data.backgroundColor 
                  }
              };
          }
          return node;
      });

      setNodes(finalNodes);
      setEdges(lEdges);
      addToHistory(finalNodes, lEdges);
      setIsDirty(true);
      if (nodes.length === 0) setTimeout(() => fitView(), 100);
      
    } catch (error) { console.error(error); alert("Error generating flow"); }
    setLoading(false);
  };

  const loadDemo = () => {
    if (nodes.length > 0 && isDirty && !window.confirm("Discard changes?")) return;
    const { nodes: dNodes, edges: dEdges } = getDemoData();
    const normalizedDemoEdges = dEdges.map((edge: any) => buildEdgeWithPresentation(edge));
    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(dNodes, normalizedDemoEdges);
    setNodes(lNodes); setEdges(lEdges);
    setHistory([{ nodes: lNodes, edges: lEdges }]); setHistoryIndex(0);
    setIsDirty(false); setTimeout(() => fitView(), 100);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>
        {`
        .react-flow__edge-textbg { fill: #ffffff !important; }
        .react-flow__edge-text { fill: #222222 !important; font-size: 12px; }
        /* Dark Mode Overrides */
        ${isDarkMode ? `
           .react-flow__edge-path { stroke: #888 !important; }
           .react-flow__edge-text { fill: #eee !important; }
           .react-flow__edge-textbg { fill: #1e1e1e !important; }
           .react-flow__controls button { background-color: #333; fill: #fff; border-bottom: 1px solid #444; }
           .react-flow__controls button:hover { background-color: #444; }
        ` : ''}
        `}
      </style>
      
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
        onAddNode={handleAddNode}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <div style={{ flex: 1, width: '100%', position: 'relative', background: isDarkMode ? '#121212' : '#fafafa', transition: 'background 0.3s' }}>
        <ReactFlow 
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} 
            onNodesChange={onNodesChangeWrapped} onEdgesChange={onEdgesChangeWrapped}
            onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
              setSelectedNodeId(selectedNodes.length > 0 ? selectedNodes[0].id : null);
              setSelectedEdgeId(selectedEdges.length > 0 ? selectedEdges[0].id : null);
              if (selectedNodes.length > 0 || selectedEdges.length > 0) {
                setEditorOpen(true);
              }
            }}
            onConnect={onConnectWrapped}
            onReconnect={onReconnect}
            fitView minZoom={0.1}
            colorMode={isDarkMode ? 'dark' : 'light'}
        >
          <Background color={isDarkMode ? '#444' : '#ccc'} gap={20} />
          <Controls />
        </ReactFlow>

        <EditorPanel 
            nodes={nodes} edges={edges} 
            setNodes={(val: any) => { setNodes(val); setIsDirty(true); }} 
            setEdges={(val: any) => { setEdges(val); setIsDirty(true); }} 
            selectedNodeId={selectedNodeId} 
            selectedEdgeId={selectedEdgeId}
            isOpen={editorOpen} toggleOpen={() => setEditorOpen(!editorOpen)} 
            onAddNode={handleAddNode}
            isDarkMode={isDarkMode} 
        />
      </div>
    </div>
  );
}