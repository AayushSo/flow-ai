import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [prompt, setPrompt] = useState("");

  // Function to call your FastAPI backend
  const generateFlow = async () => {
    try {
      const response = await axios.post('http://localhost:8000/generate', {
        prompt: prompt
      });
      setNodes(response.data.nodes);
      setEdges(response.data.edges);
    } catch (error) {
      console.error("Error connecting to backend:", error);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar for Input */}
      <div style={{ padding: '10px', background: '#f4f4f4', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your flowchart..."
          style={{ flexGrow: 1, padding: '8px' }}
        />
        <button onClick={generateFlow} style={{ padding: '8px 20px' }}>Generate</button>
      </div>

      {/* The Flowchart Canvas */}
      <div style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}