import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

// --- 1. The Smart Node ---
export function SmartNode(props: NodeProps) {
  // 🔨 THE HAMMER: Cast data to 'any' for safety
  const safeData = props.data as any;

  const label = String(safeData.label || 'Node');
  const body = String(safeData.body || '');
  const hasBody = body.trim().length > 0;
  const bgColor = String(safeData.backgroundColor || '#ffffff');
  
  return (
    <div 
      style={{ 
        backgroundColor: bgColor, 
        border: props.selected ? '2px solid #007bff' : '1px solid #333', 
        borderRadius: '5px',
        width: '100%',         
        height: 'auto',        
        minHeight: '100%',     
        boxShadow: props.selected ? '0 4px 12px rgba(0,123,255,0.3)' : '0 2px 5px rgba(0,0,0,0.1)',
        fontSize: '12px',
        color: '#222',
        textAlign: 'center',
        overflow: 'visible', // Changed to visible so handles on edge don't get clipped
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <NodeResizer 
        color="#007bff" 
        isVisible={props.selected} 
        minWidth={100} 
        minHeight={40} 
      />

      {/* --- INPUTS (Targets) --- */}
      {/* Top Input */}
      <Handle type="target" position={Position.Top} id="t" style={{ background: '#555', zIndex: 10 }} />
      {/* Left Input */}
      <Handle type="target" position={Position.Left} id="l" style={{ background: '#555', zIndex: 10 }} />
      
      {/* Header */}
      <div style={{ 
        padding: '8px 10px', 
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.05)', 
        borderBottom: hasBody ? '1px solid rgba(0,0,0,0.1)' : 'none'
      }}>
        {label}
      </div>

      {/* Body */}
      {hasBody && (
        <div style={{ 
          padding: '8px 10px', 
          textAlign: 'left', 
          fontSize: '11px',
          color: '#555',
          whiteSpace: 'pre-wrap', 
          flex: 1, 
          overflowY: 'auto' 
        }}>
          {body}
        </div>
      )}

      {/* --- OUTPUTS (Sources) --- */}
      {/* Bottom Output */}
      <Handle type="source" position={Position.Bottom} id="b" style={{ background: '#555', zIndex: 10 }} />
      {/* Right Output */}
      <Handle type="source" position={Position.Right} id="r" style={{ background: '#555', zIndex: 10 }} />
    </div>
  );
}

// --- 2. The Group Node ---
export function GroupNode(props: NodeProps) {
  const safeData = props.data as any;
  const label = String(safeData.label || 'Group');
  const bgColor = String(safeData.backgroundColor || 'rgba(240, 240, 240, 0.4)');

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      backgroundColor: bgColor, 
      border: props.selected ? '2px dashed #007bff' : '2px dashed #aaa', 
      borderRadius: '8px',
      position: 'relative'
    }}>
      <NodeResizer 
        color="#007bff" 
        isVisible={props.selected} 
        minWidth={200} 
        minHeight={100} 
      />

      {/* Group nodes usually just need top/bottom to encompass things, but we can add all 4 */}
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none', top: -5 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none', bottom: -5 }} />
      <Handle type="target" position={Position.Left} style={{ background: 'transparent', border: 'none', left: -5 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'transparent', border: 'none', right: -5 }} />
      
      <div style={{ 
        position: 'absolute', 
        top: '-14px', 
        left: '10px', 
        backgroundColor: '#fff', 
        padding: '2px 8px', 
        fontWeight: 'bold', 
        fontSize: '11px', 
        color: '#666',
        border: '1px solid #ccc',
        borderRadius: '4px',
        zIndex: 5,
        whiteSpace: 'nowrap'
      }}>
        {label}
      </div>
    </div>
  );
}