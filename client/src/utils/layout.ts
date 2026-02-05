import * as dagre from 'dagre';

export const getLayoutedElements = (nodes: any[], edges: any[]) => {
  if (!dagre || !dagre.graphlib) return { nodes, edges };

  // Helper to calculate node dimensions based on content
  const getNodeSize = (node: any) => {
    // If it's a group, we let the children dictate size later
    if (node.type === 'group') return { width: 100, height: 100 };
    
    // Base size
    let width = 170;
    let height = 40;

    // Check for Body Text
    if (node.data?.body) {
       // Approximate height calculation: 40px base + 15px per line of text
       const lines = Math.ceil((node.data.body.length || 0) / 25); // ~25 chars per line
       height += Math.max(20, lines * 15);
    }

    return { width, height };
  };

  const runDagreLayout = (nodeList: any[], edgeList: any[], isHorizontal = false) => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: isHorizontal ? 'LR' : 'TB' });

    nodeList.forEach((node) => {
      const { width, height } = getNodeSize(node);
      g.setNode(node.id, { width, height });
    });

    edgeList.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    return nodeList.map((node) => {
      const pos = g.node(node.id);
      const { width, height } = getNodeSize(node);
      return {
        ...node,
        position: { x: pos.x - (width / 2), y: pos.y - (height / 2) },
        style: { ...node.style, width, height } // Apply calculated size
      };
    });
  };

  try {
    const topLevelNodes = nodes.filter(n => !n.parentId);
    const groups = nodes.filter(n => n.type === 'group');
    
    let processedNodes = [...nodes];
    const GROUP_PADDING = 40; 

    // 1. Process Groups First
    groups.forEach(group => {
      const children = nodes.filter(n => n.parentId === group.id);
      const childEdges = edges.filter(e => 
        children.find(c => c.id === e.source) && children.find(c => c.id === e.target)
      );

      if (children.length > 0) {
        const layoutedChildren = runDagreLayout(children, childEdges, true);
        
        const minX = Math.min(...layoutedChildren.map(n => n.position.x));
        const maxX = Math.max(...layoutedChildren.map(n => n.position.x + n.style.width));
        const minY = Math.min(...layoutedChildren.map(n => n.position.y));
        const maxY = Math.max(...layoutedChildren.map(n => n.position.y + n.style.height));
        
        const groupWidth = (maxX - minX) + (GROUP_PADDING * 2);
        const groupHeight = (maxY - minY) + (GROUP_PADDING * 2);

        // Update Group
        const groupIndex = processedNodes.findIndex(n => n.id === group.id);
        if (groupIndex !== -1) {
          processedNodes[groupIndex] = {
              ...processedNodes[groupIndex],
              style: { 
                  ...processedNodes[groupIndex].style,
                  width: groupWidth, 
                  height: groupHeight,
                  zIndex: -1 
              }
          };
        }

        // Update Children
        layoutedChildren.forEach(child => {
          const childIndex = processedNodes.findIndex(n => n.id === child.id);
          if (childIndex !== -1) {
              processedNodes[childIndex] = {
                  ...child,
                  position: {
                      x: child.position.x - minX + GROUP_PADDING,
                      y: child.position.y - minY + GROUP_PADDING
                  }
              }
          }
        });
      }
    });

    // 2. Process Top Level
    const finalGraph = new dagre.graphlib.Graph();
    finalGraph.setDefaultEdgeLabel(() => ({}));
    finalGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 });

    topLevelNodes.forEach(node => {
        const updatedNode = processedNodes.find(n => n.id === node.id);
        const { width, height } = getNodeSize(updatedNode);
        
        // If it's a group, use the calculated size from step 1
        const finalW = updatedNode.type === 'group' ? updatedNode.style.width : width;
        const finalH = updatedNode.type === 'group' ? updatedNode.style.height : height;

        finalGraph.setNode(node.id, { width: finalW, height: finalH });
    });

    edges.forEach(edge => {
        const sourceNode = processedNodes.find(n => n.id === edge.source);
        const targetNode = processedNodes.find(n => n.id === edge.target);
        if (!sourceNode?.parentId && !targetNode?.parentId) {
            finalGraph.setEdge(edge.source, edge.target);
        }
    });

    dagre.layout(finalGraph);

    topLevelNodes.forEach(node => {
        const pos = finalGraph.node(node.id);
        const index = processedNodes.findIndex(n => n.id === node.id);
        
        // Retrieve calculated size again
        const updatedNode = processedNodes[index];
        const w = updatedNode.style.width || 170;
        const h = updatedNode.style.height || 40;
        
        if (index !== -1 && pos) {
            processedNodes[index] = {
                ...processedNodes[index],
                position: {
                    x: pos.x - (w / 2),
                    y: pos.y - (h / 2),
                }
            };
        }
    });

    return { nodes: processedNodes, edges };
  } catch (err) {
    console.error("Layout error", err);
    return { nodes, edges };
  }
};