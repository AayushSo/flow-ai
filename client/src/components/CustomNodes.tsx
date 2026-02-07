import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getIcon } from './IconMapper';

// --- 1. Enhanced Smart Node (Rounded Rectangle) ---
export const SmartNode = memo(({ data, selected }: NodeProps) => {
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
        {getIcon(data.icon as string)}
      </div>

      {/* Typography Section */}
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#222' }}>
          {data.label as string}
        </div>
        {data.subtitle && (
          <div style={{ fontSize: '10px', color: '#777', marginTop: '2px' }}>
            {data.subtitle as string}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
});

// --- 2. New Decision Node (Diamond) ---
export const DecisionNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* The Diamond Shape (Rotated Square) */}
      <div
        style={{
          position: 'absolute',
          top: 15,
          left: 15,
          width: '110px',
          height: '110px',
          background: '#fff6e5', // Light yellow for decisions
          border: selected ? '2px solid #f5a623' : '1px solid #f5a623',
          transform: 'rotate(45deg)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          zIndex: 0,
        }}
      />

      {/* The Content (Not Rotated) */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '90px' }}>
         {/* Optional: Small Icon above text */}
         <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', color: '#d48806' }}>
            {getIcon('question')} 
         </div>
         <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
            {data.label as string}
         </div>
      </div>

      {/* Handles tailored for Diamond */}
      <Handle type="target" position={Position.Top} style={{ top: 15, background: '#555' }} />
      <Handle type="source" position={Position.Right} id="yes" style={{ right: 15, background: '#555' }} />
      <Handle type="source" position={Position.Bottom} id="no" style={{ bottom: 15, background: '#555' }} />
      <Handle type="source" position={Position.Left} style={{ left: 15, background: '#555' }} />
    </div>
  );
});

// --- 3. Stacked/Layered Node (e.g., for Databases/Multiple Items) ---
export const LayeredNode = memo(({ data, selected }: NodeProps) => {
    return (
      <div style={{ position: 'relative' }}>
        {/* Background Layers */}
        <div style={{
            position: 'absolute', top: -4, left: 4, right: -4, bottom: 4,
            background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', zIndex: 0
        }} />
        <div style={{
            position: 'absolute', top: -8, left: 8, right: -8, bottom: 8,
            background: '#e0e0e0', border: '1px solid #ccc', borderRadius: '6px', zIndex: -1
        }} />
        
        {/* Main Content Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '10px 15px',
            borderRadius: '6px',
            background: '#fff',
            border: selected ? '2px solid #555' : '1px solid #ddd',
            display: 'flex', alignItems: 'center', gap: '10px',
            minWidth: '150px'
          }}
        >
          <Handle type="target" position={Position.Top} />
          <div style={{ color: '#555' }}>{getIcon('database')}</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{data.label as string}</div>
            <div style={{ fontSize: '10px', color: '#777' }}>Collection</div>
          </div>
          <Handle type="source" position={Position.Bottom} />
        </div>
      </div>
    );
  });
  // --- 4. Group Node (Restored) ---
export const GroupNode = memo(({ data, selected }: NodeProps) => {
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
      {/* Group Label / Header */}
      <div
        style={{
          position: 'absolute',
          top: '-14px',
          left: '20px',
          background: '#ffffff',
          padding: '4px 12px',
          borderRadius: '12px',
          border: '1px solid #ccc',
          fontWeight: 'bold',
          fontSize: '12px',
          color: '#555',
        }}
      >
        {data.label as string}
      </div>
    </div>
  );
});