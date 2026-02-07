import { useRef, useState } from 'react';
import { MarkerType } from '@xyflow/react';
// Only import what is used in the Shape Selector buttons
import { Square, Layers, Diamond } from 'lucide-react';

export function EditorPanel({ nodes, setNodes, edges, setEdges, selectedNodeId, isOpen, toggleOpen }: any) {
    const colorInputRef = useRef<HTMLInputElement>(null);
    const [connectTargetId, setConnectTargetId] = useState("");

    // 1. If panel is closed, show a small toggle button
    if (!isOpen) {
      return (
        <button 
          onClick={toggleOpen}
          style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, padding: '10px 20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
        >
          Edit Graph
        </button>
      );
    }
  
    // 2. Prepare Data
    const selectedNode = nodes.find((n: any) => n.id === selectedNodeId);
    
    // Filter nodes to find potential targets (excluding self)
    const otherNodes = nodes.filter((n: any) => n.id !== selectedNodeId);
    // Find lines going OUT from this node
    const outgoingEdges = edges.filter((e: any) => e.source === selectedNodeId);

    // 3. Helper to update node DATA (Label, Icon, Subtitle, Body)
    const updateNodeData = (field: string, value: any) => {
      setNodes((nds: any[]) => nds.map((n) => {
          if (n.id === selectedNodeId) {
             return { ...n, data: { ...n.data, [field]: value } };
          }
          return n;
      }));
    };

    // 4. Helper to update node TYPE (Shape)
    // We need a separate function because 'type' is at the root, not inside 'data'
    const updateNodeType = (newType: string) => {
        setNodes((nds: any[]) => nds.map((n) => {
            if (n.id === selectedNodeId) {
               return { ...n, type: newType };
            }
            return n;
        }));
    };

    // 5. Helper to delete the node
    const handleDeleteNode = () => {
        if(!window.confirm("Delete this node?")) return;
        setNodes((nds: any[]) => nds.filter((n) => n.id !== selectedNodeId));
        setEdges((eds: any[]) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
        toggleOpen(); 
    };

    // Connection Helpers
    const handleAddEdge = () => {
        if (!connectTargetId) return;
        const newEdge = {
            id: `manual-e-${Date.now()}`,
            source: selectedNodeId,
            target: connectTargetId,
            type: 'default', 
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#333', strokeWidth: 2 }
        };
        setEdges((eds: any[]) => [...eds, newEdge]);
        setConnectTargetId(""); 
    };

    const handleDeleteEdge = (edgeId: string) => {
        setEdges((eds: any[]) => eds.filter((e) => e.id !== edgeId));
    };

    // --- ASSETS ---
    const presetColors = ['#ffffff', '#ffcccb', '#c1e1c1', '#add8e6', '#f0e68c', '#e6d2b5', '#e6e6fa'];
    const iconOptions = [
        { value: '', label: 'None' },
        { value: 'database', label: 'DB' },
        { value: 'server', label: 'Server' },
        { value: 'user', label: 'User' },
        { value: 'brain', label: 'AI' },
        { value: 'globe', label: 'Web' },
        { value: 'cloud', label: 'Cloud' },
        { value: 'file', label: 'File' },
        { value: 'settings', label: 'Config' },
        { value: 'code', label: 'Code' },
        { value: 'question', label: '?' },
        { value: 'error', label: '!' },
        { value: 'success', label: '✓' },
    ];
  
    return (
      <div style={{ 
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '320px', 
        backgroundColor: '#fff', borderLeft: '1px solid #ddd', padding: '20px', 
        boxShadow: '-2px 0 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', zIndex: 10 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Editor</h3>
          <button onClick={toggleOpen} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>
  
        {selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, overflowY: 'auto' }}>
             
             {/* 1. Label Input */}
             <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Label</label>
                <input 
                  type="text" 
                  value={selectedNode.data.label} 
                  onChange={(e) => updateNodeData('label', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
             </div>
             
             {/* 2. Subtitle Input */}
             <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Subtitle</label>
                <input 
                  type="text" 
                  placeholder="e.g. Validates Input"
                  value={selectedNode.data.subtitle || ''} 
                  onChange={(e) => updateNodeData('subtitle', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
             </div>

             {/* 3. Shape / Type Selector */}
             <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Shape</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                    {[
                        { id: 'smart', label: 'Box', icon: <Square size={16}/> },
                        { id: 'decision', label: 'Decision', icon: <Diamond size={16}/> },
                        { id: 'layered', label: 'Stack', icon: <Layers size={16}/> },
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => updateNodeType(type.id)}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                border: selectedNode.type === type.id ? '2px solid #333' : '1px solid #ddd',
                                backgroundColor: selectedNode.type === type.id ? '#eee' : '#fff',
                                fontSize: '12px'
                            }}
                        >
                            {type.icon} {type.label}
                        </button>
                    ))}
                </div>
             </div>

             {/* 4. Icon Selector */}
             <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Icon</label>
                <select 
                    value={selectedNode.data.icon || ''}
                    onChange={(e) => updateNodeData('icon', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                    {iconOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
             </div>

             {/* 5. Background Color */}
             <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {presetColors.map(c => (
                        <div 
                            key={c} 
                            onClick={() => updateNodeData('backgroundColor', c)} 
                            style={{ 
                                width: '32px', height: '32px', 
                                backgroundColor: c, 
                                border: selectedNode.data.backgroundColor === c ? '2px solid #333' : '1px solid #ddd', 
                                cursor: 'pointer', borderRadius: '50%',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        ></div>
                    ))}
                    <div 
                        onClick={() => colorInputRef.current?.click()}
                        style={{
                            width: '32px', height: '32px',
                            background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #a18cd1 100%)',
                            border: '1px solid #ddd', borderRadius: '50%', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <span style={{ fontSize: '12px' }}>🎨</span>
                    </div>
                    <input 
                        ref={colorInputRef} type="color" 
                        value={selectedNode.data.backgroundColor || '#ffffff'} 
                        onChange={(e) => updateNodeData('backgroundColor', e.target.value)}
                        style={{ display: 'none' }}
                    />
                </div>
             </div>

             {/* 6. Connections Section */}
             <div>
                 <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Connections (Outgoing)</label>
                 <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
                     
                     <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px 0' }}>
                         {outgoingEdges.length === 0 && <li style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>No outgoing connections</li>}
                         {outgoingEdges.map((edge: any) => {
                             const targetNode = nodes.find((n: any) => n.id === edge.target);
                             return (
                                 <li key={edge.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', fontSize: '13px' }}>
                                     <span>→ {targetNode?.data.label || 'Unknown Node'}</span>
                                     <button 
                                        onClick={() => handleDeleteEdge(edge.id)}
                                        style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                                        title="Remove Connection"
                                     >×</button>
                                 </li>
                             );
                         })}
                     </ul>

                     <div style={{ display: 'flex', gap: '5px' }}>
                         <select 
                            value={connectTargetId} 
                            onChange={(e) => setConnectTargetId(e.target.value)}
                            style={{ flex: 1, padding: '5px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                         >
                             <option value="">+ Connect to...</option>
                             {otherNodes.map((n: any) => (
                                 <option key={n.id} value={n.id}>
                                     {n.data.label.substring(0, 20)}{n.data.label.length > 20 ? '...' : ''}
                                 </option>
                             ))}
                         </select>
                         <button 
                            onClick={handleAddEdge}
                            disabled={!connectTargetId}
                            style={{ 
                                padding: '5px 10px', backgroundColor: connectTargetId ? '#007bff' : '#ccc', 
                                color: 'white', border: 'none', borderRadius: '4px', cursor: connectTargetId ? 'pointer' : 'default', fontSize: '12px' 
                            }}
                         >
                             Add
                         </button>
                     </div>
                 </div>
             </div>

             {/* 7. Description (Body) */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Details</label>
                <textarea 
                  value={selectedNode.data.body || ''}
                  onChange={(e) => updateNodeData('body', e.target.value)}
                  style={{ flex: 1, width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'none', fontFamily: 'inherit' }}
                  placeholder="Add details here..."
                />
             </div>

             {/* Delete Button */}
             <button 
                onClick={handleDeleteNode}
                style={{ 
                    marginTop: '10px', padding: '10px', backgroundColor: '#fff0f0', 
                    color: '#d9534f', border: '1px solid #fabebb', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
                }}
             >
                🗑️ Delete Node
             </button>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            Select a node to edit or delete it.
          </div>
        )}
      </div>
    );
}