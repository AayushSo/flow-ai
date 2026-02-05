// ... imports
import { MarkerType } from "@xyflow/react";

export function EditorPanel({ nodes, edges, setNodes, setEdges, selectedNodeId, onSelectNode, isOpen, toggleOpen }: any) {
    // ... existing helper functions (updateNode, deleteNode, addEdge) ...
    // COPY PASTE your existing updateNode, deleteNode, addEdge functions here.
    
    // Ensure you use the exact functions from before, just adding the new UI below.
    // ...
    
    const selectedNode = nodes.find((n: any) => n.id === selectedNodeId);
    const otherNodes = nodes.filter((n: any) => n.id !== selectedNodeId);
    const outgoingEdges = edges.filter((e: any) => e.source === selectedNodeId);

    const updateNode = (id: string, field: string, value: any, isStyle = false) => {
        setNodes((nds: any[]) => nds.map((n) => {
            if (n.id !== id) return n;
            if (isStyle) return { ...n, style: { ...n.style, [field]: value } };
            // FIX: If updating body, ensure we don't accidentally wipe it
            return { ...n, data: { ...n.data, [field]: value } };
        }));
    };
    
    const addEdge = (targetId: string) => {
        const newEdge = {
            id: `e-${selectedNodeId}-${targetId}`,
            source: selectedNodeId,
            target: targetId,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#333', strokeWidth: 2 }
        };
        setEdges((eds: any[]) => [...eds, newEdge]);
    };
    
    // ...

    if (!isOpen) return <button onClick={toggleOpen} style={{position: 'absolute', bottom: 20, right: 20, zIndex: 10, padding: '10px', background:'#333', color:'#fff'}}>Edit Graph</button>;

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
               
               {/* Label Input */}
               <div style={{ marginBottom: '10px' }}>
                  <label style={{display: 'block', fontSize: '12px', marginBottom: '4px'}}>Header (Title):</label>
                  <input type="text" value={selectedNode.data.label} onChange={(e) => updateNode(selectedNode.id, 'label', e.target.value)} style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
               </div>

               {/* NEW: Body Text Input */}
               <div style={{ marginBottom: '10px' }}>
                  <label style={{display: 'block', fontSize: '12px', marginBottom: '4px'}}>Body (Description):</label>
                  <textarea 
                    rows={3}
                    value={selectedNode.data.body || ""} 
                    onChange={(e) => updateNode(selectedNode.id, 'body', e.target.value)} 
                    placeholder="Add details here..."
                    style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'sans-serif' }} 
                  />
                  <small style={{ color: '#666' }}>Note: Node size will update on next layout.</small>
               </div>

               {/* Connections Manager */}
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