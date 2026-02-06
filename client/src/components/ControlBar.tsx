import React, { useRef } from 'react';

interface ControlBarProps {
  prompt: string;
  setPrompt: (val: string) => void;
  onGenerate: () => void;
  loading: boolean;
  mode: string;
  setMode: (val: string) => void;
  // History
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // Changes
  hasPendingChanges: boolean;
  onAcceptChanges: () => void;
  // Edge Style
  edgeStyle: 'default' | 'smoothstep';
  onToggleEdgeStyle: () => void;
  // Actions
  onNewCanvas: () => void;
  onSave: () => void;
  onLoadFile: (e: React.ChangeEvent<HTMLInputElement>) => void; // We pass the event handler
  onExport: () => void;
  onLoadDemo: () => void;
  isDirty: boolean;
}

export function ControlBar(props: ControlBarProps) {
  // We move the ref INSIDE this component since the input lives here now
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      props.onGenerate();
    }
  };

  return (
    <div style={{ padding: '10px 20px', background: '#f0f2f5', borderBottom: '1px solid #ccc', display: 'flex', gap: '10px', alignItems: 'center' }}>
      <h3 style={{ margin: 0, marginRight: '10px', color: '#333' }}>✨ AI Flow</h3>
      
      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
           <button onClick={props.onUndo} disabled={!props.canUndo} style={{ cursor: props.canUndo ? 'pointer' : 'not-allowed', opacity: props.canUndo ? 1 : 0.5, fontSize: '18px', border: 'none', background: 'transparent' }} title="Undo">↩️</button>
           <button onClick={props.onRedo} disabled={!props.canRedo} style={{ cursor: props.canRedo ? 'pointer' : 'not-allowed', opacity: props.canRedo ? 1 : 0.5, fontSize: '18px', border: 'none', background: 'transparent' }} title="Redo">↪️</button>
      </div>

      <select value={props.mode} onChange={(e) => props.setMode(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
        <option value="flowchart">Flowchart</option>
        <option value="system">Architecture</option>
      </select>

      <input
        type="text"
        style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
        placeholder="Describe changes..."
        value={props.prompt}
        onChange={(e) => props.setPrompt(e.target.value)}
        onKeyDown={handleKeyDown} 
        disabled={props.loading}
      />
      
      <button
        onClick={props.onGenerate}
        disabled={props.loading}
        style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: props.loading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
      >
        {props.loading ? "Thinking..." : "Update"}
      </button>

      {/* ACCEPT CHANGES BUTTON */}
      {props.hasPendingChanges && (
          <button 
              onClick={props.onAcceptChanges}
              style={{ padding: '10px 15px', backgroundColor: '#198754', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', animation: 'fadeIn 0.3s' }}
              title="Accept Changes"
          >
              <span>✓</span> Accept
          </button>
      )}

      <div style={{ width: '1px', height: '30px', background: '#ddd', margin: '0 5px' }}></div>
      
      {/* Edge Style Toggle */}
      <button 
        onClick={props.onToggleEdgeStyle} 
        title="Toggle Edge Style" 
        style={{ padding: '8px 12px', backgroundColor: 'white', color: '#333', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}
      >
        {props.edgeStyle === 'default' ? '⤵ Arrow' : '⮥ Arrow'}
      </button>

      {/* File Actions */}
      <button onClick={props.onNewCanvas} title="New Canvas" style={{ padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📄</button>
      <button onClick={props.onSave} title="Save JSON" style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{props.isDirty ? '💾 *' : '💾'}</button>
      
      {/* Load Logic: Trigger the hidden input */}
      <button onClick={() => fileInputRef.current?.click()} title="Load JSON" style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📂</button>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={props.onLoadFile} />
      
      <button onClick={props.onExport} title="Export PNG" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📷</button>
      <button onClick={props.onLoadDemo} title="Load Example" style={{ padding: '10px 15px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🚀</button>
    </div>
  );
}