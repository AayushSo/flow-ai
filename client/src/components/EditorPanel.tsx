import { MarkerType } from "@xyflow/react";

// --- Helper: Safe Color for Input ---
// Prevents crash if color is rgba() or undefined
const safeColor = (color: string | undefined) => {
  if (!color || typeof color !== 'string') return '#ffffff';
  if (color.startsWith('#') && color.length === 7) return color;
  return '#ffffff';
};

export function EditorPanel({ nodes, edges, setNodes, setEdges, selectedNodeId, isOpen, toggleOpen }: any) {
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
  
    const selectedNode = nodes.find((n: any) => n.id === selectedNodeId);
    const otherNodes = nodes.filter((n: any) => n.id !== selectedNodeId);
    const outgoingEdges = edges.filter((e: any) => e.source === selectedNodeId);
  
    const updateNode = (id: string, field: string, value: any, isStyle = false) => {
      setNodes((nds: any[]) => nds.map((n) => {
        if (n.id !== id) return n;

        // Special logic for body text updates (auto-height)
        if (field === 'body') {
             return { 
                 ...n, 
                 data: { ...n.data, [field]: value },
                 style: { ...n.style, height: undefined } 
             };
        }
        
        if (isStyle) return { ...n, style: { ...n.style, [field]: value } };
        return { ...n, data: { ...n.data, [field]: value } };
      }));
    };
  
    // const deleteNode = (id: string) => {
      // setNodes((nds: any[]) => nds.filter((n) => n.id !== id));
      // setEdges((eds: any[]) => eds.filter((e) => e.source !== id && e.target !== id));
      // if (selectedNodeId === id) onSelectNode(null);
    // };
  
    const addEdge = (targetId: string) => {
      const newEdge = {
          id: `e-${selectedNodeId}-${targetId}`,
          source: selectedNodeId,
          target: targetId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#333', strokeWidth: 2 }
      };
      setEdges((eds: any[]) => [...eds, newEdge]);
    }

    return (
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '450px', height: '60vh', backgroundColor: 'white', borderTop: '2px solid #ccc', borderLeft: '2px solid #ccc', zIndex: 10, display: 'flex', flexDirection: 'column', boxShadow: '-5px -5px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#f8f9fa', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Graph Editor</h3>
          <button onClick={toggleOpen} style={{ cursor: 'pointer', border: 'none', background: 'transparent', fontSize: '16px' }}>✖</button>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1, padding: '15px' }}>
          {selectedNode ? (
            <div style={{ marginBottom: '20px', padding: '10px', background: '#e6f7ff', borderRadius: '6px', border: '1px solid #91d5ff' }}>
               <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px', color: '#0050b3' }}>
                  Selected: <strong>{selectedNode.data.label}</strong>
               </h4>
               
               <div style={{ marginBottom: '10px' }}>
                  <label style={{display: 'block', fontSize: '12px', marginBottom: '4px'}}>Header (Title):</label>
                  <input type="text" value={selectedNode.data.label} onChange={(e) => updateNode(selectedNode.id, 'label', e.target.value)} style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
               </div>

               {/* ADDED: Color Picker */}
               <div style={{ marginBottom: '10px' }}>
                  <label style={{display: 'block', fontSize: '12px', marginBottom: '4px'}}>Node Color:</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={safeColor(selectedNode.style?.backgroundColor)} 
						onChange={(e) => updateNode(selectedNode.id, 'backgroundColor', e.target.value)} // No 'true' = save to data                        style={{ width: '40px', height: '40px', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '4px' }} 
                      />
                      <span style={{ fontSize: '12px', color: '#666' }}>Click to change background</span>
                  </div>
               </div>

               <div style={{ marginBottom: '10px' }}>
                  <label style={{display: 'block', fontSize: '12px', marginBottom: '4px'}}>Body (Description):</label>
                  <textarea 
                    rows={3}
                    value={selectedNode.data.body || ""} 
                    onChange={(e) => updateNode(selectedNode.id, 'body', e.target.value)} 
                    placeholder="Add details here..."
                    style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'sans-serif' }} 
                  />
               </div>

               <div style={{ marginTop: '15px' }}>
                  <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold'}}>Connects To:</label>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px 0' }}>
                      {outgoingEdges.map((edge: any) => (
                          <li key={edge.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px', borderBottom: '1px solid #eee' }}>
                              <span style={{fontSize: '13px'}}>→ {nodes.find((n:any)=>n.id===edge.target)?.data.label || edge.target}</span>
                              <button onClick={() => setEdges((eds:any[]) => eds.filter(e=>e.id!==edge.id))} style={{ color: 'red', border: 'none', cursor: 'pointer' }}>×</button>
                          </li>
                      ))}
                  </ul>
                  <div style={{ display: 'flex', gap: '5px' }}>
                      <select id="new-connection-select" style={{ flex: 1, padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}>
                          <option value="">+ Connect to...</option>
                          {otherNodes.map((n: any) => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                      </select>
                      <button onClick={() => { const el = document.getElementById('new-connection-select') as HTMLSelectElement; if(el.value) { addEdge(el.value); el.value=''; } }} style={{ background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', padding: '0 10px' }}>Add</button>
                  </div>
               </div>
            </div>
          ) : <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Select a node to edit</div>}
        </div>
      </div>
    );
}