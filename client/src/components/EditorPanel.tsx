import { useRef, useState } from 'react';
import { MarkerType } from '@xyflow/react';
import { 
  Square, Layers, Diamond 
} from 'lucide-react';

type EdgeLabelPlacement = 'above' | 'center' | 'below';

const getEdgeLabelOffset = (placement: EdgeLabelPlacement) => {
        if (placement === 'above') return -14;
        if (placement === 'below') return 14;
        return 0;
};

// Add isDarkMode to props
export function EditorPanel({ 
  nodes, setNodes, edges, setEdges, 
    selectedNodeId, selectedEdgeId, isOpen, toggleOpen, 
  isDarkMode 
}: any) {
    const colorInputRef = useRef<HTMLInputElement>(null);
    const [connectTargetId, setConnectTargetId] = useState("");

    // --- Styles ---
    const panelBg = isDarkMode ? '#1e1e1e' : '#ffffff';
    const textColor = isDarkMode ? '#e0e0e0' : '#333';
    const borderColor = isDarkMode ? '#333' : '#ddd';
    const inputBg = isDarkMode ? '#2c2c2c' : '#fff';

    if (!isOpen) {
      return (
        <button 
          onClick={toggleOpen}
          style={{ 
            position: 'absolute', bottom: 20, right: 20, zIndex: 10, 
            padding: '10px 20px', 
            backgroundColor: '#333', 
            color: '#fff', border: 'none', borderRadius: '5px', 
            cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' 
          }}
        >
          Edit Graph
        </button>
      );
    }
  
    const selectedNode = nodes.find((n: any) => n.id === selectedNodeId);
    const selectedEdge = edges.find((e: any) => e.id === selectedEdgeId);
    const otherNodes = nodes.filter((n: any) => n.id !== selectedNodeId);
    const outgoingEdges = edges.filter((e: any) => e.source === selectedNodeId);

    const updateNodeData = (field: string, value: any) => {
      setNodes((nds: any[]) => nds.map((n) => {
          if (n.id === selectedNodeId) {
             return { ...n, data: { ...n.data, [field]: value } };
          }
          return n;
      }));
    };

    const updateEdgeData = (field: string, value: any) => {
        setEdges((eds: any[]) => eds.map((e) => {
            if (e.id !== selectedEdgeId) return e;

            const placement = (field === 'labelPlacement' ? value : (e.data?.labelPlacement || 'center')) as EdgeLabelPlacement;
            const offset = getEdgeLabelOffset(placement);

            return {
                ...e,
                ...(field === 'labelPlacement' ? { data: { ...(e.data || {}), labelPlacement: placement } } : { [field]: value }),
                labelShowBg: true,
                labelBgPadding: [8, 4],
                labelBgBorderRadius: 4,
                labelBgStyle: {
                    fill: isDarkMode ? '#1e1e1e' : '#ffffff',
                    fillOpacity: 0.95
                },
                labelStyle: {
                    ...(e.labelStyle || {}),
                    transform: `translateY(${offset}px)`
                }
            };
        }));
    };

    const updateNodeType = (newType: string) => {
        setNodes((nds: any[]) => nds.map((n) => {
            if (n.id === selectedNodeId) {
               return { ...n, type: newType };
            }
            return n;
        }));
    };

    const handleDeleteNode = () => {
        if(!window.confirm("Delete this node?")) return;
        setNodes((nds: any[]) => nds.filter((n) => n.id !== selectedNodeId));
        setEdges((eds: any[]) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
        toggleOpen(); 
    };

    const handleAddEdge = () => {
        if (!connectTargetId) return;
        const newEdge = {
            id: `manual-e-${Date.now()}`,
            source: selectedNodeId,
            target: connectTargetId,
            type: 'default', 
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#333', strokeWidth: 2 },
            data: { labelPlacement: 'center' },
            labelShowBg: true,
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: isDarkMode ? '#1e1e1e' : '#ffffff', fillOpacity: 0.95 }
        };
        setEdges((eds: any[]) => [...eds, newEdge]);
        setConnectTargetId(""); 
    };

    const handleDeleteEdge = (edgeId: string) => {
        setEdges((eds: any[]) => eds.filter((e) => e.id !== edgeId));
    };

    const handleDeleteSelectedEdge = () => {
        if (!selectedEdgeId) return;
        if (!window.confirm("Delete this edge?")) return;
        setEdges((eds: any[]) => eds.filter((e) => e.id !== selectedEdgeId));
        toggleOpen();
    };

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
  
    const inputStyle = {
        width: '100%', padding: '8px', 
        border: `1px solid ${borderColor}`, 
        borderRadius: '4px',
        backgroundColor: inputBg,
        color: textColor,
        outline: 'none',
        boxSizing: 'border-box' as const // Fixes padding expanding width
    };

    return (
      <div style={{ 
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '320px', 
        backgroundColor: panelBg, 
        borderLeft: `1px solid ${borderColor}`, 
        boxShadow: '-2px 0 5px rgba(0,0,0,0.05)', 
        display: 'flex', flexDirection: 'column', zIndex: 10,
        color: textColor,
        transition: 'background 0.3s'
      }}>
        
        {/* HEADER (Fixed) */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Editor</h3>
          <button onClick={toggleOpen} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: textColor }}>×</button>
        </div>
  
        {/* SCROLLABLE CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {selectedEdge ? (
            <>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Edge Label</label>
                    <input
                    type="text"
                    value={selectedEdge.label || ''}
                    onChange={(e) => updateEdgeData('label', e.target.value)}
                    style={inputStyle}
                    placeholder="Add label for this edge..."
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Label Position</label>
                    <select
                    value={selectedEdge.data?.labelPlacement || 'center'}
                    onChange={(e) => updateEdgeData('labelPlacement', e.target.value)}
                    style={inputStyle}
                    >
                        <option value="above">Above line</option>
                        <option value="center">On line</option>
                        <option value="below">Below line</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>From</label>
                    <div style={{ ...inputStyle, opacity: 0.8 }}>
                        {nodes.find((n: any) => n.id === selectedEdge.source)?.data?.label || selectedEdge.source}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>To</label>
                    <div style={{ ...inputStyle, opacity: 0.8 }}>
                        {nodes.find((n: any) => n.id === selectedEdge.target)?.data?.label || selectedEdge.target}
                    </div>
                </div>

                <button
                    onClick={handleDeleteSelectedEdge}
                    style={{
                        marginTop: '10px', padding: '10px', backgroundColor: '#3f1515',
                        color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '4px', cursor: 'pointer'
                    }}
                >
                    Delete Edge
                </button>
                <div style={{ height: '20px' }}></div>
            </>
            ) : selectedNode ? (
            <>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Label</label>
                    <input 
                    type="text" 
                    value={selectedNode.data.label} 
                    onChange={(e) => updateNodeData('label', e.target.value)}
                    style={inputStyle}
                    />
                </div>
                
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Subtitle</label>
                    <input 
                    type="text" 
                    value={selectedNode.data.subtitle || ''} 
                    onChange={(e) => updateNodeData('subtitle', e.target.value)}
                    style={inputStyle}
                    />
                </div>

                {selectedNode.type === 'group' && (
                <>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Auto-Snap Children</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                            onClick={() => updateNodeData('autoSnap', true)}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                border: selectedNode.data.autoSnap !== false ? `2px solid ${isDarkMode ? '#fff' : '#333'}` : `1px solid ${borderColor}`,
                                backgroundColor: selectedNode.data.autoSnap !== false ? (isDarkMode ? '#444' : '#eee') : inputBg,
                                color: textColor,
                                fontSize: '12px'
                            }}
                        >
                            Snap On
                        </button>
                        <button
                            onClick={() => updateNodeData('autoSnap', false)}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                border: selectedNode.data.autoSnap === false ? `2px solid ${isDarkMode ? '#fff' : '#333'}` : `1px solid ${borderColor}`,
                                backgroundColor: selectedNode.data.autoSnap === false ? (isDarkMode ? '#444' : '#eee') : inputBg,
                                color: textColor,
                                fontSize: '12px'
                            }}
                        >
                            Snap Off
                        </button>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Lock Children Inside</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                            onClick={() => updateNodeData('lockChildren', true)}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                border: selectedNode.data.lockChildren === true ? `2px solid ${isDarkMode ? '#fff' : '#333'}` : `1px solid ${borderColor}`,
                                backgroundColor: selectedNode.data.lockChildren === true ? (isDarkMode ? '#444' : '#eee') : inputBg,
                                color: textColor,
                                fontSize: '12px'
                            }}
                        >
                            Lock On
                        </button>
                        <button
                            onClick={() => updateNodeData('lockChildren', false)}
                            style={{
                                flex: 1, padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                border: selectedNode.data.lockChildren !== true ? `2px solid ${isDarkMode ? '#fff' : '#333'}` : `1px solid ${borderColor}`,
                                backgroundColor: selectedNode.data.lockChildren !== true ? (isDarkMode ? '#444' : '#eee') : inputBg,
                                color: textColor,
                                fontSize: '12px'
                            }}
                        >
                            Lock Off
                        </button>
                    </div>
                </div>
                </>
                )}

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Shape</label>
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
                                    border: selectedNode.type === type.id ? `2px solid ${isDarkMode ? '#fff' : '#333'}` : `1px solid ${borderColor}`,
                                    backgroundColor: selectedNode.type === type.id ? (isDarkMode ? '#444' : '#eee') : inputBg,
                                    color: textColor,
                                    fontSize: '12px'
                                }}
                            >
                                {type.icon} {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Icon</label>
                    <select 
                        value={selectedNode.data.icon || ''}
                        onChange={(e) => updateNodeData('icon', e.target.value)}
                        style={inputStyle}
                    >
                        {iconOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Color</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {presetColors.map(c => (
                            <div 
                                key={c} 
                                onClick={() => updateNodeData('backgroundColor', c)} 
                                style={{ 
                                    width: '28px', height: '28px', 
                                    backgroundColor: c, 
                                    border: selectedNode.data.backgroundColor === c ? '2px solid #333' : '1px solid #ddd', 
                                    cursor: 'pointer', borderRadius: '50%',
                                }}
                            ></div>
                        ))}
                        <div 
                            onClick={() => colorInputRef.current?.click()}
                            style={{
                                width: '28px', height: '28px',
                                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #a18cd1 100%)',
                                border: '1px solid #ddd', borderRadius: '50%', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <span style={{ fontSize: '10px' }}>🎨</span>
                        </div>
                        <input 
                            ref={colorInputRef} type="color" 
                            value={selectedNode.data.backgroundColor || '#ffffff'} 
                            onChange={(e) => updateNodeData('backgroundColor', e.target.value)}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Connections</label>
                    <div style={{ background: isDarkMode ? '#252525' : '#f9f9f9', padding: '10px', borderRadius: '6px', border: `1px solid ${borderColor}` }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px 0' }}>
                            {outgoingEdges.map((edge: any) => {
                                const targetNode = nodes.find((n: any) => n.id === edge.target);
                                return (
                                    <li key={edge.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}>
                                        <span style={{maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>→ {targetNode?.data.label || 'Unknown'}</span>
                                        <button onClick={() => handleDeleteEdge(edge.id)} style={{ color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                                    </li>
                                );
                            })}
                        </ul>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <select 
                                value={connectTargetId} 
                                onChange={(e) => setConnectTargetId(e.target.value)}
                                style={{ ...inputStyle, padding: '4px', fontSize: '12px' }}
                            >
                                <option value="">+ Connect to...</option>
                                {otherNodes.map((n: any) => (
                                    <option key={n.id} value={n.id}>{n.data.label}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handleAddEdge}
                                disabled={!connectTargetId}
                                style={{ padding: '5px 10px', backgroundColor: connectTargetId ? '#2563eb' : '#555', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', opacity: 0.7 }}>Details</label>
                    <textarea 
                    value={selectedNode.data.body || ''}
                    onChange={(e) => updateNodeData('body', e.target.value)}
                    style={{ ...inputStyle, flex: 1, resize: 'none', fontFamily: 'inherit' }}
                    placeholder="Add details here..."
                    />
                </div>

                <button 
                    onClick={handleDeleteNode}
                    style={{ 
                        marginTop: '10px', padding: '10px', backgroundColor: '#3f1515', 
                        color: '#ff6b6b', border: '1px solid #ff6b6b', borderRadius: '4px', cursor: 'pointer' 
                    }}
                >
                    Delete Node
                </button>
                {/* Spacer to ensure last item isn't cut off by weird mobile browser chrome */}
                <div style={{ height: '20px' }}></div>
            </>
            ) : (
            <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>
                Select a node or edge to edit.
            </div>
            )}
        </div>
      </div>
    );
}