import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

// --- 1. The Smart Node ---
export function SmartNode(props: NodeProps) {
  // 🔨 THE HAMMER: Cast data to 'any' immediately. 
  // This bypasses the "unknown" error completely.
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
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <NodeResizer 
        color="#007bff" 
        isVisible={props.selected} 
        minWidth={100} 
        minHeight={40} 
      />

      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      
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

      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
}

// --- 2. The Group Node ---
export function GroupNode(props: NodeProps) {
  // 🔨 THE HAMMER AGAIN
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

      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none', top: -5 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none', bottom: -5 }} />
      
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