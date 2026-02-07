import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, type Node } from '@xyflow/react';
import { getIcon } from './IconMapper';

// Define Node Data
type CustomNodeData = Node['data'] & {
  label: string;
  subtitle?: string;
  body?: string;
  icon?: string;
  backgroundColor?: string;
};

type CustomNodeProps = NodeProps<Node<CustomNodeData>>;

// --- Stacked Handles (4 Visual Dots, Bidirectional) ---
const StackedHandle = ({ position, id, style = {} }: { position: Position, id: string, style?: React.CSSProperties }) => {
    const handleSize = 10;
    const baseStyle: React.CSSProperties = {
        width: handleSize,
        height: handleSize,
        background: '#555',
        zIndex: 10,
        ...style
    };

    return (
        <>
            {/* INVISIBLE TARGET */}
            <Handle 
                type="target" 
                position={position} 
                id={`target-${id}`} 
                style={{ ...baseStyle, opacity: 0, zIndex: 5 }} 
            />
            {/* VISIBLE SOURCE */}
            <Handle 
                type="source" 
                position={position} 
                id={`source-${id}`} 
                style={baseStyle} 
            />
        </>
    );
};

const FourWayHandles = () => (
    <>
        <StackedHandle position={Position.Top} id="top" />
        <StackedHandle position={Position.Right} id="right" />
        <StackedHandle position={Position.Bottom} id="bottom" />
        <StackedHandle position={Position.Left} id="left" />
    </>
);


// --- 1. Enhanced Smart Node (Auto-Resizing) ---
export const SmartNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = (data.label as string) || 'Node';
  const subtitle = (data.subtitle as string) || '';
  const body = (data.body as string) || '';
  const icon = (data.icon as string) || '';
  const bgColor = (data.backgroundColor as string) || '#fff'; 

  return (
    <>
      <NodeResizer minWidth={150} minHeight={60} isVisible={selected} />
      
      <div
        style={{
          // LAYOUT FIXES:
          width: '100%',
          height: 'auto',        // Allow growth
          minHeight: '100%',     // Respect Resizer height
          minWidth: '150px',
          padding: '10px 15px',
          borderRadius: '8px',
          background: bgColor,
          border: selected ? '2px solid #555' : '1px solid #ddd',
          boxShadow: selected ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        <FourWayHandles />
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon && (
              <div style={{ color: '#555', flexShrink: 0 }}>
                  {getIcon(icon)}
              </div>
          )}
          <div style={{ flex: 1 }}>
              <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: '14px', 
                  color: '#222', 
                  whiteSpace: 'pre-wrap', // Allow wrapping
                  wordBreak: 'break-word' // Prevent overflow
              }}>
                {label}
              </div>
              {subtitle && (
              <div style={{ fontSize: '10px', color: '#777', marginTop: '2px' }}>
                  {subtitle}
              </div>
              )}
          </div>
        </div>

        {/* Body Text */}
        {body && (
          <div style={{ 
              marginTop: '8px', 
              paddingTop: '8px', 
              borderTop: '1px solid rgba(0,0,0,0.1)', 
              fontSize: '11px', 
              color: '#555',
              whiteSpace: 'pre-wrap', // Allow wrapping
              lineHeight: '1.4',
              wordBreak: 'break-word'
          }}>
              {body}
          </div>
        )}
      </div>
    </>
  );
});

// --- 2. Decision Node (Diamond) ---
export const DecisionNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = (data.label as string) || 'Decision';
  const icon = (data.icon as string) || '';
  const bgColor = (data.backgroundColor as string) || '#fff6e5';

  return (
    <>
      <NodeResizer minWidth={100} minHeight={100} keepAspectRatio isVisible={selected} />

      <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%', 
          minWidth: '100px', 
          minHeight: '100px',
          aspectRatio: '1 / 1' 
      }}>
        
        {/* Diamond Shape */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '70.7%', 
            height: '70.7%',
            background: bgColor,
            border: selected ? '2px solid #f5a623' : '1px solid #f5a623',
            transform: 'translate(-50%, -50%) rotate(45deg)',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            zIndex: 0,
          }}
        />

        {/* Content - Now allows wrapping */}
        <div style={{ 
            position: 'absolute', 
            top: '50%', left: '50%', 
            transform: 'translate(-50%, -50%)', 
            zIndex: 1, 
            textAlign: 'center', 
            width: '60%', // Constrain text to inside the diamond
            pointerEvents: 'none'
        }}>
           {icon && (
               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', color: '#d48806' }}>
                  {getIcon(icon)} 
               </div>
           )}
           <div style={{ 
               fontSize: '12px', 
               fontWeight: 'bold', 
               color: '#555', 
               wordWrap: 'break-word',
               whiteSpace: 'pre-wrap' // Allow wrapping
           }}>
              {label}
           </div>
        </div>

        <StackedHandle position={Position.Top} id="top" style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }} />
        <StackedHandle position={Position.Right} id="right" style={{ top: '50%', right: 0, transform: 'translateY(-50%)' }} />
        <StackedHandle position={Position.Bottom} id="bottom" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }} />
        <StackedHandle position={Position.Left} id="left" style={{ top: '50%', left: 0, transform: 'translateY(-50%)' }} />
      </div>
    </>
  );
});

// --- 3. Layered Node (Auto-Resizing) ---
export const LayeredNode = memo(({ data, selected }: CustomNodeProps) => {
    const label = (data.label as string) || 'Collection';
    const body = (data.body as string) || '';
    const icon = (data.icon as string) || '';
    const bgColor = (data.backgroundColor as string) || '#fff';

    return (
      <>
        <NodeResizer minWidth={150} minHeight={60} isVisible={selected} />

        <div style={{ position: 'relative', width: '100%', height: 'auto', minHeight: '100%', minWidth: '150px' }}>
          {/* Decorative Layers */}
          <div style={{
              position: 'absolute', top: -4, left: 4, right: -4, bottom: 4,
              background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px', zIndex: 0
          }} />
          <div style={{
              position: 'absolute', top: -8, left: 8, right: -8, bottom: 8,
              background: '#e0e0e0', border: '1px solid #ccc', borderRadius: '6px', zIndex: -1
          }} />
          
          {/* Main Card */}
          <div
            style={{
              position: 'relative', zIndex: 1, padding: '10px 15px', borderRadius: '6px',
              background: bgColor, 
              border: selected ? '2px solid #555' : '1px solid #ddd',
              width: '100%', 
              height: 'auto', minHeight: '100%', // Allow growth
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              boxSizing: 'border-box'
            }}
          >
            <FourWayHandles />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {icon ? (
                  <div style={{ color: '#555' }}>{getIcon(icon)}</div>
              ) : (
                  <div style={{ color: '#555' }}>{getIcon('database')}</div>
              )}
              <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{label}</div>
                  <div style={{ fontSize: '10px', color: '#777' }}>Collection</div>
              </div>
            </div>

            {body && (
              <div style={{ 
                  marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.1)', 
                  fontSize: '11px', color: '#555', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}>
                  {body}
              </div>
            )}
          </div>
        </div>
      </>
    );
});

// --- 4. Group Node ---
export const GroupNode = memo(({ data, selected }: CustomNodeProps) => {
  const label = (data.label as string) || 'Group';

  return (
    <>
      <NodeResizer minWidth={100} minHeight={100} isVisible={selected} />
      
      <div
        style={{
          width: '100%',
          height: '100%',
          minWidth: '100px',
          minHeight: '100px',
          backgroundColor: 'rgba(240, 240, 240, 0.4)',
          border: selected ? '2px dashed #555' : '2px dashed #ccc',
          borderRadius: '12px',
          position: 'relative',
          boxSizing: 'border-box'
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
    </>
  );
});