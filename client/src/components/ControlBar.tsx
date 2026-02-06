import React, { useRef, useEffect } from 'react';

interface ControlBarProps {
  prompt: string;
  setPrompt: (val: string) => void;
  onGenerate: () => void;
  loading: boolean;
  mode: string;
  setMode: (val: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasPendingChanges: boolean;
  onAcceptChanges: () => void;
  edgeStyle: 'default' | 'smoothstep';
  onToggleEdgeStyle: () => void;
  onNewCanvas: () => void;
  onSave: () => void;
  onLoadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onLoadDemo: () => void;
  onAddNode: () => void;
  isDirty: boolean;
}

export function ControlBar(props: ControlBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [props.prompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      props.onGenerate();
    }
  };

  return (
    <div style={{ padding: '10px 20px', background: '#f0f2f5', borderBottom: '1px solid #ccc', display: 'flex', gap: '10px', alignItems: 'center' }}>
      <h3 style={{ margin: 0, marginRight: '10px', color: '#333' }}>✨ AI Flow</h3>
      
      <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
           <button onClick={props.onUndo} disabled={!props.canUndo} style={{ cursor: props.canUndo ? 'pointer' : 'not-allowed', opacity: props.canUndo ? 1 : 0.5, fontSize: '18px', border: 'none', background: 'transparent' }} title="Undo">↩️</button>
           <button onClick={props.onRedo} disabled={!props.canRedo} style={{ cursor: props.canRedo ? 'pointer' : 'not-allowed', opacity: props.canRedo ? 1 : 0.5, fontSize: '18px', border: 'none', background: 'transparent' }} title="Redo">↪️</button>
      </div>

      <select value={props.mode} onChange={(e) => props.setMode(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', height: '40px' }}>
        <option value="flowchart">Flowchart</option>
        <option value="system">Architecture</option>
      </select>

      {/* --- CHANGED: Textarea instead of Input --- */}
      <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
        <textarea
            ref={textareaRef}
            rows={1}
            style={{ 
                flex: 1, padding: '10px', fontSize: '14px', borderRadius: '4px', 
                border: '1px solid #ccc', resize: 'none', overflow: 'hidden',
                fontFamily: 'inherit', minHeight: '40px', maxHeight: '150px'
            }}
            placeholder="Describe flow... (Shift+Enter for new line)"
            value={props.prompt}
            onChange={(e) => props.setPrompt(e.target.value)}
            onKeyDown={handleKeyDown} 
            disabled={props.loading}
        />
      </div>
      
      <button
        onClick={props.onGenerate}
        disabled={props.loading}
        style={{ padding: '10px 20px', height: '40px', cursor: 'pointer', backgroundColor: props.loading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
      >
        {props.loading ? "..." : "Update"}
      </button>

      {props.hasPendingChanges && (
          <button 
              onClick={props.onAcceptChanges}
              style={{ padding: '10px 15px', height: '40px', backgroundColor: '#198754', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Accept Changes"
          >
              <span>✓</span>
          </button>
      )}

      <div style={{ width: '1px', height: '30px', background: '#ddd', margin: '0 5px' }}></div>
      
      <button onClick={props.onAddNode} title="Add Node" style={{ padding: '8px 12px', height: '40px', backgroundColor: 'white', color: '#333', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>+ Node</button>

      <button onClick={props.onToggleEdgeStyle} title="Toggle Edge Style" style={{ padding: '8px 12px', height: '40px', backgroundColor: 'white', color: '#333', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        {props.edgeStyle === 'default' ? '⤵' : '⮥'}
      </button>

      <button onClick={props.onNewCanvas} title="New" style={{ padding: '10px 15px', height: '40px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📄</button>
      <button onClick={props.onSave} title="Save" style={{ padding: '10px 15px', height: '40px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{props.isDirty ? '💾 *' : '💾'}</button>
      <button onClick={() => fileInputRef.current?.click()} title="Load" style={{ padding: '10px 15px', height: '40px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📂</button>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={props.onLoadFile} />
      <button onClick={props.onExport} title="PNG" style={{ padding: '10px 15px', height: '40px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📷</button>
    </div>
  );
}