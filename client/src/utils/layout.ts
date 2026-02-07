import * as dagre from 'dagre';
import { Position, type Node, type Edge } from '@xyflow/react';

const nodeWidth = 180;
const nodeHeight = 80;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  const dagreGraph = new dagre.graphlib.Graph();
  
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
        width: node.measured?.width ?? nodeWidth, 
        height: node.measured?.height ?? nodeHeight 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - (node.measured?.width ?? nodeWidth) / 2,
        y: nodeWithPosition.y - (node.measured?.height ?? nodeHeight) / 2,
      },
    };
  });

  // --- THE FIX ---
  // We must match the IDs in CustomNodes.tsx exactly.
  // CustomNodes uses: "source-top", "target-top", "source-bottom", etc.
  const newEdges = edges.map((edge) => {
      return {
          ...edge,
          // sourceHandle must point to a SOURCE handle (prefix: source-)
          sourceHandle: isHorizontal ? 'source-right' : 'source-bottom',
          
          // targetHandle must point to a TARGET handle (prefix: target-)
          targetHandle: isHorizontal ? 'target-left' : 'target-top',
      };
  });

  return { nodes: newNodes, edges: newEdges };
};