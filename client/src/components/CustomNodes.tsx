import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { getIcon } from './IconMapper';

// Define what your Node Data looks like
type CustomNodeData = Node['data'] & {
  label: string;
  subtitle?: string;
  icon?: string;
};

// Helper type for props
type CustomNodeProps = NodeProps<Node<CustomNodeData>>;

// --- 1. Enhanced Smart Node ---
export const SmartNode = memo(({ data, selected }: CustomNodeProps) => {
  // Safe destructuring with defaults
  const label = (data.label as string) || 'Node';
  const subtitle = (data.subtitle as string) || '';
  const icon = (data.icon as string) || '';

  return (
    <div
      style={{
        padding: '10px 15px',
        borderRadius: '8px',
        background: '#fff',
        border: selected ? '2px solid #555' : '1px solid #ddd',
        boxShadow: selected ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)',
        minWidth: '150px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        textAlign: 'left',
        transition: 'all 0.2s ease',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      
      {/* Icon Section */}
      <div style={{ color: '#555' }}>
        {getIcon(icon)}
      </div>

      {/* Typography Section */}
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#222' }}>
          {label}
        </div>
        {subtitle && (
          <div style={{ fontSize: '10px', color: '#777', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
});

// --- 2. Decision Node (Diamond) ---
export const DecisionNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = (data.label as string) || 'Decision';

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          position: 'absolute',
          top: 15, left: 15, width: '110px', height: '110px',
          background: '#fff6e5',
          border: selected ? '2px solid #f5a623' : '1px solid #f5a623',
          transform: 'rotate(45deg)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '90px' }}>
         <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', color: '#d48806' }}>
            {getIcon('question')} 
         </div>
         <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
            {label}
         </div>
      </div>
      <Handle type="target" position={Position.Top} style={{ top: 15, background: '#555' }} />
      <Handle type="source" position={Position.Right} id="yes" style={{ right: 15, background: '#555' }} />
      <Handle type="source" position={Position.Bottom} id="no" style={{ bottom: 15, background: '#555' }} />
      <Handle type="source" position={Position.Left} style={{ left: 15, background: '#555' }} />
    </div>
  );
});

// --- 3. Layered Node ---
export const LayeredNode = memo(({ data, selected }: CustomNodeProps) => {
    const label = (data.label as string) || 'Collection';

    return (
      <div style={{ position: 'relative' }}>
        <div style={{
            position: 'absolute', top: -4, left: 4, right: -4, bottom: 4,
            background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', zIndex: 0
        }} />
        <div style={{
            position: 'absolute', top: -8, left: 8, right: -8, bottom: 8,
            background: '#e0e0e0', border: '1px solid #ccc', borderRadius: '6px', zIndex: -1
        }} />
        <div
          style={{
            position: 'relative', zIndex: 1, padding: '10px 15px', borderRadius: '6px',
            background: '#fff', border: selected ? '2px solid #555' : '1px solid #ddd',
            display: 'flex', alignItems: 'center', gap: '10px', minWidth: '150px'
          }}
        >
          <Handle type="target" position={Position.Top} />
          <div style={{ color: '#555' }}>{getIcon('database')}</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{label}</div>
            <div style={{ fontSize: '10px', color: '#777' }}>Collection</div>
          </div>
          <Handle type="source" position={Position.Bottom} />
        </div>
      </div>
    );
});

// --- 4. Group Node ---
export const GroupNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = (data.label as string) || 'Group';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(240, 240, 240, 0.4)',
        border: selected ? '2px dashed #555' : '2px dashed #ccc',
        borderRadius: '12px',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute', top: '-14px', left: '20px',
          background: '#ffffff', padding: '4px 12px', borderRadius: '12px',
          border: '1px solid #ccc', fontWeight: 'bold', fontSize: '12px', color: '#555',
        }}
      >
        {label}
      </div>
    </div>
  );
});