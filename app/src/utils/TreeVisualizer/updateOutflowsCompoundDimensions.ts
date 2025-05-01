import { InfluenceNode } from "@/types/reactFlowTypes";

/**
 * Updates the dimensions of an outflows compound node when a new child node is added
 * 
 * @param nodes Array of all nodes in the graph
 * @param outflowsCompoundId ID of the outflows compound node to update
 * @returns Updated array of nodes with adjusted dimensions
 */
export function updateOutflowsCompoundDimensions(
    nodes: InfluenceNode[],
    outflowsCompoundId: string
  ): InfluenceNode[] {
    // Find the outflows compound node
    const outflowsCompoundNode = nodes.find(node => 
      node.id === outflowsCompoundId && node.type === 'outflowsCompoundNode'
    );
    
    if (!outflowsCompoundNode) {
      console.error(`[updateOutflowsCompoundDimensions] Outflows compound node ${outflowsCompoundId} not found`);
      return nodes;
    }
    
    // Find all direct children of this compound node
    const children = nodes.filter(node => node.parentId === outflowsCompoundId);
    
    if (children.length === 0) {
      // console.log(`[updateOutflowsCompoundDimensions] No children found for outflows compound node ${outflowsCompoundId}`);
      return nodes;
    }
    
    // Calculate the bounding box that contains all children
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    // Calculate dimensions based on measured values of children or fallback to estimates
    children.forEach(child => {
      let childWidth = child.measured?.width || 
          (child.type === 'productNode' ? 300 : 
           child.type === 'processNode' ? 250 : 
           child.type === 'sideProductNode' ? 200 :
           child.type === 'sideProductCompoundNode' ? 400 : 150);
      
      let childHeight = child.measured?.height || 
          (child.type === 'productNode' ? 290 : 
           child.type === 'processNode' ? 185 : 
           child.type === 'sideProductNode' ? 100 :
           child.type === 'sideProductCompoundNode' ? 250 : 80);
      
      // For compound children, recursively check their children too
      if (child.type === 'sideProductCompoundNode') {
        const subChildren = nodes.filter(node => node.parentId === child.id);
        if (subChildren.length > 0) {
          // Use the child's own measured dimensions if it has children
          const { width: subWidth, height: subHeight } = calculateCompoundNodeSize(subChildren);
          if (subWidth > childWidth) childWidth = subWidth;
          if (subHeight > childHeight) childHeight = subHeight;
        }
      }
      
      // Calculate positions using a layout approach
      if (minX === Infinity) {
        // First child
        minX = 0;
        minY = 0;
        maxX = childWidth;
        maxY = childHeight;
      } else {
        // Subsequent children - stack horizontally with some padding
        maxX += 20 + childWidth; // 20px padding between nodes
        maxY = Math.max(maxY, childHeight);
      }
    });
    
    // Add padding around the compound node
    const padding = 40; // 20px padding on each side
    const width = maxX - minX + padding;
    const height = maxY - minY + padding;
    
    // Create a new array with the updated node
    return nodes.map(node => {
      if (node.id === outflowsCompoundId) {
        return {
          ...node,
          measured: {
            ...node.measured,
            width,
            height
          }
        };
      }
      return node;
    });
  }
  
  /**
   * Helper function to calculate the size needed for a compound node to contain its children
   */
  function calculateCompoundNodeSize(children: InfluenceNode[]): { width: number, height: number } {
    if (children.length === 0) {
      return { width: 200, height: 100 }; // Default size
    }
    
    let totalWidth = 0;
    let maxHeight = 0;
    
    children.forEach(child => {
      const childWidth = child.measured?.width || 
        (child.type === 'productNode' ? 300 : 
         child.type === 'processNode' ? 250 : 
         child.type === 'sideProductNode' ? 200 : 150);
      
      const childHeight = child.measured?.height || 
        (child.type === 'productNode' ? 290 : 
         child.type === 'processNode' ? 185 : 
         child.type === 'sideProductNode' ? 100 : 80);
      
      totalWidth += childWidth + 20; // Add padding between children
      maxHeight = Math.max(maxHeight, childHeight);
    });
    
    // Adjust for padding and the final element's padding
    totalWidth = Math.max(0, totalWidth - 20) + 40; // Remove last padding, add container padding
    maxHeight += 40; // Add container padding
    
    return { width: totalWidth, height: maxHeight };
  }