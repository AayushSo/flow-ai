import { useRef } from 'react';

export function EditorPanel({ nodes, setNodes, setEdges, selectedNodeId, isOpen, toggleOpen }: any) {
    const colorInputRef = useRef<HTMLInputElement>(null);

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
  
    // 2. Find the selected node
    const selectedNode = nodes.find((n: any) => n.id === selectedNodeId);
  
    // 3. Helper to update node data
    const updateNode = (field: string, value: any) => {
      setNodes((nds: any[]) => nds.map((n) => {
          if (n.id === selectedNodeId) {
             return { ...n, data: { ...n.data, [field]: value } };
          }
          return n;
      }));
    };

    // 4. Helper to delete the node
    const handleDelete = () => {
        if(!window.confirm("Delete this node?")) return;
        setNodes((nds: any[]) => nds.filter((n) => n.id !== selectedNodeId));
        setEdges((eds: any[]) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
        toggleOpen(); 
    };

    // --- COLOR PALETTE ---
    const presetColors = [
        '#ffffff', // White
        '#ffcccb', // Red
        '#c1e1c1', // Green (Safe)
        '#add8e6', // Blue
        '#f0e68c', // Yellow
        '#e6d2b5', // Light Coffee
        '#e6e6fa', // Lavender
    ];
  
    return (
      <div style={{ 
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '300px', 
        backgroundColor: '#fff', borderLeft: '1px solid #ddd', padding: '20px', 
        boxShadow: '-2px 0 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', zIndex: 10 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Editor</h3>
          <button onClick={toggleOpen} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>
  
        {selectedNode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 }}>
             {/* Label Input */}
             <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Label</label>
                <input 
                  type="text" 
                  value={selectedNode.data.label} 
                  onChange={(e) => updateNode('label', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
             </div>

             {/* Background Color */}
             <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    
                    {/* Presets */}
                    {presetColors.map(c => (
                        <div 
                            key={c} 
                            onClick={() => updateNode('backgroundColor', c)} 
                            style={{ 
                                width: '32px', height: '32px', 
                                backgroundColor: c, 
                                border: selectedNode.data.backgroundColor === c ? '2px solid #333' : '1px solid #ddd', 
                                cursor: 'pointer', borderRadius: '50%',
                                transition: 'transform 0.1s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                            title={c}
                        ></div>
                    ))}

                    {/* Rainbow / Custom Button */}
                    <div 
                        onClick={() => colorInputRef.current?.click()}
                        style={{
                            width: '32px', height: '32px',
                            background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #a18cd1 100%)',
                            border: '1px solid #ddd',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                        title="Custom Color"
                    >
                        <span style={{ fontSize: '12px' }}>🎨</span>
                    </div>

                    {/* Hidden Native Input */}
                    <input 
                        ref={colorInputRef}
                        type="color" 
                        value={selectedNode.data.backgroundColor || '#ffffff'} 
                        onChange={(e) => updateNode('backgroundColor', e.target.value)}
                        style={{ display: 'none' }}
                    />
                </div>
             </div>

             {/* Description (Body) */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Details</label>
                <textarea 
                  value={selectedNode.data.body || ''}
                  onChange={(e) => updateNode('body', e.target.value)}
                  style={{ flex: 1, width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'none', fontFamily: 'inherit' }}
                  placeholder="Add details here..."
                />
             </div>

             {/* Delete Button */}
             <button 
                onClick={handleDelete}
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