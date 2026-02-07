import React from 'react';
import { 
  Play, RotateCcw, RotateCw, Save, Upload, 
  Image as ImageIcon, FilePlus, Moon, Sun, 
  CornerDownLeft, PlusSquare, LayoutTemplate
} from 'lucide-react';

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
  edgeStyle: string;
  onToggleEdgeStyle: () => void;
  onNewCanvas: () => void;
  onSave: () => void;
  onLoadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onLoadDemo: () => void;
  isDirty: boolean;
  onAddNode: () => void;
  isDarkMode: boolean;            
  toggleDarkMode: () => void;     
}

export const ControlBar: React.FC<ControlBarProps> = ({
  prompt, setPrompt, onGenerate, loading,
  mode, setMode, onUndo, onRedo, canUndo, canRedo,
  hasPendingChanges, onAcceptChanges,
  onNewCanvas, onSave, onLoadFile, onExport, 
  onAddNode, isDarkMode, toggleDarkMode,
  edgeStyle, onToggleEdgeStyle
}) => {

  const barStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
    color: isDarkMode ? '#e0e0e0' : '#333',
    transition: 'all 0.3s ease',
    flexWrap: 'wrap',
  };

  const groupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingRight: '12px',
    borderRight: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
  };

  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: '36px',
    padding: '0 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background 0.2s',
    backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0',
    color: isDarkMode ? '#fff' : '#333',
  };

  const primaryBtn: React.CSSProperties = {
    ...btnBase,
    backgroundColor: '#2563eb', 
    color: '#fff',
  };

  const successBtn: React.CSSProperties = {
    ...btnBase,
    backgroundColor: '#10b981', 
    color: '#fff',
  };

  const iconBtn: React.CSSProperties = {
    ...btnBase,
    padding: '0',
    width: '36px', 
  };

  return (
    <div style={barStyle}>
      {/* 1. BRAND */}
      <div style={{ fontWeight: 'bold', fontSize: '18px', marginRight: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>✨</span>
        <span style={{ display: 'none', md: 'block' }}>AI Flow</span>
      </div>

      {/* 2. PROMPT INPUT */}
      <div style={{ ...groupStyle, flex: 1, borderRight: 'none' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
            placeholder="Describe your flowchart..."
            style={{
              flex: 1,
              height: '36px',
              padding: '0 12px',
              borderRadius: '6px 0 0 6px',
              border: isDarkMode ? '1px solid #444' : '1px solid #ddd',
              backgroundColor: isDarkMode ? '#2c2c2c' : '#fff',
              color: isDarkMode ? '#fff' : '#000',
              outline: 'none',
            }}
          />
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{
              height: '38px', 
              padding: '0 10px',
              border: isDarkMode ? '1px solid #444' : '1px solid #ddd',
              borderLeft: 'none',
              borderRadius: '0 6px 6px 0',
              backgroundColor: isDarkMode ? '#333' : '#f9f9f9',
              color: isDarkMode ? '#fff' : '#333',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <option value="flowchart">Flowchart</option>
            <option value="system">Architecture</option>
          </select>
        </div>
        
        <button 
          onClick={onGenerate} 
          disabled={loading || !prompt}
          style={{ ...primaryBtn, opacity: loading || !prompt ? 0.6 : 1 }}
        >
          {loading ? <RotateCw className="spin" size={16} /> : <Play size={16} fill="currentColor" />}
          Generate
        </button>
      </div>

      {/* 3. EDIT ACTIONS */}
      <div style={groupStyle}>
        {hasPendingChanges && (
          <button onClick={onAcceptChanges} style={successBtn} title="Accept AI Changes">
             <LayoutTemplate size={16} /> Apply
          </button>
        )}
        <button onClick={onAddNode} style={btnBase} title="Add Manual Node">
            <PlusSquare size={16} /> Node
        </button>
      </div>

      {/* 4. HISTORY */}
      <div style={groupStyle}>
        <button onClick={onUndo} disabled={!canUndo} style={{ ...iconBtn, opacity: !canUndo ? 0.3 : 1 }} title="Undo">
          <RotateCcw size={16} />
        </button>
        <button onClick={onRedo} disabled={!canRedo} style={{ ...iconBtn, opacity: !canRedo ? 0.3 : 1 }} title="Redo">
          <RotateCw size={16} />
        </button>
      </div>

      {/* 5. FILE OPS */}
      <div style={{ ...groupStyle, borderRight: 'none' }}>
        <button onClick={onNewCanvas} style={iconBtn} title="New Canvas">
          <FilePlus size={16} />
        </button>
        
        <label style={iconBtn} title="Open File">
          <Upload size={16} />
          <input type="file" onChange={onLoadFile} accept=".json" style={{ display: 'none' }} />
        </label>

        <button onClick={onSave} style={iconBtn} title="Save JSON">
          <Save size={16} />
        </button>

        <button onClick={onExport} style={iconBtn} title="Export PNG">
          <ImageIcon size={16} />
        </button>

        {/* EDGE STYLE TOGGLE */}
        <button onClick={onToggleEdgeStyle} style={iconBtn} title={`Edge Style: ${edgeStyle === 'default' ? 'Bezier' : 'Step'}`}>
          <CornerDownLeft size={16} />
        </button>

        {/* DARK MODE TOGGLE */}
        <button onClick={toggleDarkMode} style={{ ...iconBtn, marginLeft: '8px' }} title="Toggle Theme">
           {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};