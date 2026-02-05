import { MarkerType } from "@xyflow/react";

export const getDemoData = () => {
    const nodes = [
        // Group 1: Frontend
        { id: 'g1', type: 'group', position: { x: 0, y: 0 }, data: { label: 'Frontend Cluster' }, style: { backgroundColor: 'rgba(240, 240, 240, 0.5)', width: 400, height: 200, border: '2px dashed #aaa' } },
        { id: 'n1', parentId: 'g1', position: { x: 20, y: 20 }, data: { label: 'React App' }, style: { width: 150, height: 40, backgroundColor: '#fff', border: '1px solid #333' } },
        { id: 'n2', parentId: 'g1', position: { x: 200, y: 20 }, data: { label: 'CDN' }, style: { width: 150, height: 40, backgroundColor: '#fff', border: '1px solid #333' } },

        // Group 2: Backend
        { id: 'g2', type: 'group', position: { x: 0, y: 0 }, data: { label: 'Backend Cluster' }, style: { backgroundColor: 'rgba(240, 240, 240, 0.5)', width: 400, height: 300, border: '2px dashed #aaa' } },
        { id: 'n3', parentId: 'g2', position: { x: 20, y: 20 }, data: { label: 'API Gateway' }, style: { width: 150, height: 40, backgroundColor: '#fff', border: '1px solid #333' } },
        { id: 'n4', parentId: 'g2', position: { x: 20, y: 100 }, data: { label: 'Auth Service' }, style: { width: 150, height: 40, backgroundColor: '#fff', border: '1px solid #333' } },
        { id: 'n5', parentId: 'g2', position: { x: 200, y: 100 }, data: { label: 'Core Service' }, style: { width: 150, height: 40, backgroundColor: '#fff', border: '1px solid #333' } },

        // External Database
        { id: 'n6', position: { x: 0, y: 0 }, data: { label: 'PostgreSQL DB' }, style: { width: 170, height: 40, backgroundColor: '#e6f7ff', border: '1px solid #0050b3' } }
    ];

    const edges = [
        // Internal connections
        { id: 'e1', source: 'n1', target: 'n2', type: 'default', markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e2', source: 'n3', target: 'n4', type: 'default', markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e3', source: 'n3', target: 'n5', type: 'default', markerEnd: { type: MarkerType.ArrowClosed } },
        
        // Cross-group connections
        { id: 'e4', source: 'n1', target: 'n3', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, label: 'HTTP/JSON' },
        { id: 'e5', source: 'n5', target: 'n6', type: 'default', markerEnd: { type: MarkerType.ArrowClosed }, label: 'SQL' },
    ];

    return { nodes, edges };
};