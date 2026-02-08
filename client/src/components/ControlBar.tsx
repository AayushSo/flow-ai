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

  // Height for the main input row
  const CONTROL_HEIGHT = '52px'; 

  // Colors
  const bg = isDarkMode ? '#1e1e1e' : '#ffffff';
  const text = isDarkMode ? '#e0e0e0' : '#333';
  const border = isDarkMode ? '1px solid #333' : '1px solid #e0e0e0';
  const inputBg = isDarkMode ? '#2c2c2c' : '#fff';
  const inputBorder = isDarkMode ? '1px solid #444' : '1px solid #ccc';

  // --- STYLES ---

  const barStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px 20px',
    borderBottom: border,
    backgroundColor: bg,
    color: text,
    transition: 'background 0.3s, color 0.3s',
    flexWrap: 'wrap',
  };

  // This container holds the [Textarea | Select | Generate] combo
  const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1, // Take available space
    minWidth: '300px',
    height: CONTROL_HEIGHT,
    alignItems: 'stretch', // Force children to fill height
    boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
    borderRadius: '8px',
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    height: '100%',
    padding: '8px 12px',
    border: inputBorder,
    borderRight: 'none', // Merge with select
    borderRadius: '8px 0 0 8px',
    backgroundColor: inputBg,
    color: text,
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: '1.4',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    width: '110px',
    height: '100%',
    padding: '0 10px',
    border: inputBorder,
    borderLeft: '1px solid rgba(128,128,128,0.2)', // Subtle divider
    borderRight: 'none', // Merge with button
    borderRadius: '0',
    backgroundColor: isDarkMode ? '#333' : '#f8f8f8',
    color: text,
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const generateBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '0 20px',
    height: '100%',
    border: 'none',
    borderRadius: '0 8px 8px 0',
    backgroundColor: '#2563eb',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
    opacity: loading || !prompt ? 0.7 : 1,
  };

  // Standard small icon buttons
  const iconBtnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: isDarkMode ? '#2c2c2c' : '#f0f0f0',
    color: text,
    transition: 'all 0.2s',
  };

  const groupContainer: React.CSSProperties = {
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px',
    height: '100%' 
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div style={barStyle}>
      {/* 1. BRAND */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '5px' }}>
        <span style={{ fontSize: '22px' }}>✨</span>
        <span className="brand-text" style={{ fontWeight: 700, fontSize: '18px' }}>AI Flow</span>
      </div>

      {/* 2. UNIFIED INPUT GROUP */}
      <div style={inputGroupStyle}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your process (e.g. 'User logs in -> System validates credentials...')"
          style={textareaStyle}
        />
        
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={selectStyle}
        >
          <option value="flowchart">Flowchart</option>
          <option value="system">System Arch</option>
        </select>
        
        <button 
          onClick={onGenerate} 
          disabled={loading || !prompt}
          style={generateBtnStyle}
        >
          {loading ? <RotateCw className="spin" size={18} /> : <Play size={18} fill="currentColor" />}
          Generate
        </button>
      </div>

      {/* 3. TOOLBAR ACTIONS */}
      <div style={groupContainer}>
        {/* EDIT / APPLY */}
        {hasPendingChanges && (
           <button onClick={onAcceptChanges} style={{ ...iconBtnBase, width: 'auto', padding: '0 12px', backgroundColor: '#10b981', color: '#fff' }} title="Accept Changes">
             <LayoutTemplate size={18} style={{ marginRight: 6 }}/> Apply
           </button>
        )}
        <button onClick={onAddNode} style={iconBtnBase} title="Add Node">
          <PlusSquare size={18} />
        </button>

        <div style={{ width: 1, height: '24px', background: isDarkMode ? '#444' : '#ddd', margin: '0 4px' }} />

        {/* HISTORY */}
        <button onClick={onUndo} disabled={!canUndo} style={{ ...iconBtnBase, opacity: !canUndo ? 0.3 : 1 }} title="Undo">
          <RotateCcw size={18} />
        </button>
        <button onClick={onRedo} disabled={!canRedo} style={{ ...iconBtnBase, opacity: !canRedo ? 0.3 : 1 }} title="Redo">
          <RotateCw size={18} />
        </button>

        <div style={{ width: 1, height: '24px', background: isDarkMode ? '#444' : '#ddd', margin: '0 4px' }} />

        {/* FILE OPS */}
        <button onClick={onNewCanvas} style={iconBtnBase} title="Clear Canvas">
          <FilePlus size={18} />
        </button>
        <label style={iconBtnBase} title="Upload JSON">
          <Upload size={18} />
          <input type="file" onChange={onLoadFile} accept=".json" style={{ display: 'none' }} />
        </label>
        <button onClick={onSave} style={iconBtnBase} title="Save JSON">
          <Save size={18} />
        </button>
        <button onClick={onExport} style={iconBtnBase} title="Export Image">
          <ImageIcon size={18} />
        </button>
        
        <div style={{ width: 1, height: '24px', background: isDarkMode ? '#444' : '#ddd', margin: '0 4px' }} />
        
        {/* VIEW SETTINGS */}
        <button onClick={onToggleEdgeStyle} style={iconBtnBase} title={`Edge Style: ${edgeStyle === 'default' ? 'Bezier' : 'Right Angle'}`}>
          <CornerDownLeft size={18} />
        </button>
        <button onClick={toggleDarkMode} style={iconBtnBase} title="Toggle Theme">
           {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .brand-text { display: none; }
        @media (min-width: 900px) {
            .brand-text { display: block; }
        }
        
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-thumb { background-color: #ccc; border-radius: 2px; }
      `}</style>
    </div>
  );
};