import React from 'react';

export function EditorPanel({ nodes, edges, setNodes, setEdges, selectedNodeId, isOpen, toggleOpen }: any) {
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
    const otherNodes = nodes.filter((n: any) => n.id !== selectedNodeId);
    const outgoingEdges = edges.filter((e: any) => e.source === selectedNodeId);
  
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
        
        // Remove node
        setNodes((nds: any[]) => nds.filter((n) => n.id !== selectedNodeId));
        // Remove connected edges
        setEdges((eds: any[]) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
        
        toggleOpen(); // Close panel
    };
  
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
                <div style={{ display: 'flex', gap: '5px' }}>
                    <input 
                    type="color" 
                    value={selectedNode.data.backgroundColor || '#ffffff'} 
                    onChange={(e) => updateNode('backgroundColor', e.target.value)}
                    style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }}
                    />
                    {/* Quick Colors */}
                    {['#ffffff', '#ffcccb', '#d0f0c0', '#add8e6', '#f0e68c'].map(c => (
                        <div key={c} onClick={() => updateNode('backgroundColor', c)} style={{ width: '30px', height: '30px', backgroundColor: c, border: '1px solid #ccc', cursor: 'pointer', borderRadius: '4px' }}></div>
                    ))}
                </div>
             </div>

             {/* Description (Body) */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Details</label>
                <textarea 
                  value={selectedNode.data.body || ''}
                  onChange={(e) => updateNode('body', e.target.value)}
                  style={{ flex: 1, width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'none' }}
                  placeholder="Add details here..."
                />
             </div>

             {/* Delete Button */}
             <button 
                onClick={handleDelete}
                style={{ 
                    marginTop: '10px', padding: '10px', backgroundColor: '#dc3545', 
                    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
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