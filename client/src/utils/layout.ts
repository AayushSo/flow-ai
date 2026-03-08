import * as dagre from 'dagre';
import { Position, type Node, type Edge } from '@xyflow/react';

const nodeWidth = 180;
const nodeHeight = 80;

const toNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const getNodeWidth = (node: Node) => {
  const styled = toNumber((node.style as any)?.width, nodeWidth);
  return node.measured?.width ?? styled;
};

const getNodeHeight = (node: Node) => {
  const styled = toNumber((node.style as any)?.height, nodeHeight);
  return node.measured?.height ?? styled;
};

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: getNodeWidth(node),
      height: getNodeHeight(node)
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  let newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = getNodeWidth(node);
    const height = getNodeHeight(node);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2
      }
    };
  });

  // Auto-fit each group around its children and convert children to parent-relative coordinates.
  const groupPaddingX = 36;
  const groupPaddingTop = 48;
  const groupPaddingBottom = 28;

  const groups = newNodes.filter((node) => node.type === 'group');
  groups.forEach((group) => {
    const children = newNodes.filter((node) => node.parentId === group.id);
    if (children.length === 0) return;

    const childBounds = children.map((child) => {
      const width = getNodeWidth(child);
      const height = getNodeHeight(child);
      return {
        id: child.id,
        minX: child.position.x,
        minY: child.position.y,
        maxX: child.position.x + width,
        maxY: child.position.y + height
      };
    });

    const minX = Math.min(...childBounds.map((b) => b.minX));
    const minY = Math.min(...childBounds.map((b) => b.minY));
    const maxX = Math.max(...childBounds.map((b) => b.maxX));
    const maxY = Math.max(...childBounds.map((b) => b.maxY));

    const groupX = minX - groupPaddingX;
    const groupY = minY - groupPaddingTop;
    const groupWidth = Math.max(220, maxX - minX + groupPaddingX * 2);
    const groupHeight = Math.max(160, maxY - minY + groupPaddingTop + groupPaddingBottom);

    newNodes = newNodes.map((node) => {
      if (node.id === group.id) {
        return {
          ...node,
          position: { x: groupX, y: groupY },
          style: {
            ...(node.style || {}),
            width: groupWidth,
            height: groupHeight,
            zIndex: -1
          }
        };
      }

      if (node.parentId === group.id) {
        return {
          ...node,
          extent: group.data?.lockChildren === true ? 'parent' : undefined,
          position: {
            x: node.position.x - groupX,
            y: node.position.y - groupY
          }
        };
      }

      return node;
    });
  });

  const newEdges = edges.map((edge) => {
    return {
      ...edge,
      sourceHandle: isHorizontal ? 'source-right' : 'source-bottom',
      targetHandle: isHorizontal ? 'target-left' : 'target-top'
    };
  });

  return { nodes: newNodes, edges: newEdges };
};