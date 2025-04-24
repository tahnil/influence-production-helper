import { InfluenceProcessInputOutput, InfluenceProduct, ProcessInput } from "@/types/influenceTypes";

// services/nodeStructurePlanner.ts
export interface NodePlan {
    nodeType: 'process' | 'product' | 'sideProduct' | 'compound' | 'outflowsCompound';
    parentId?: string;
    compoundId?: string;
    productId?: string;
    processId?: string;
    amount?: number;
    metadata?: Record<string, any>;
    id?: string; // Will be generated later
  }
  
  export function createProcessNodePlan(
    processData: any,
    logicalParentId: string
  ): NodePlan[] {
    const plans: NodePlan[] = [];
    
    // 1. Create process node plan
    const processNodePlan: NodePlan = {
      nodeType: 'process',
      parentId: logicalParentId,
      processId: processData.processDetails.id,
      metadata: {
        totalRuns: processData.totalRuns,
        totalDuration: processData.totalDuration,
        buildingIcon: processData.buildingIcon
      }
    };
    plans.push(processNodePlan);
    
    // 2. Create input product node plans
    processData.inputProducts.forEach((input: ProcessInput) => {
      plans.push({
        nodeType: 'product',
        parentId: 'PROCESS_NODE_ID', // Placeholder
        productId: input.product.id,
        amount: parseFloat(input.unitsPerSR) * processData.totalRuns
      });
    });
    
    // 3. If there are side products, create a compound node
    if (processData.hasSideProducts) {
      plans.push({
        nodeType: 'compound',
        parentId: 'PROCESS_NODE_ID' // Placeholder
      });
      
      // 4. Create side product node plans
      processData.sideProducts.forEach((product: InfluenceProcessInputOutput) => {
        plans.push({
          nodeType: 'sideProduct',
          parentId: 'COMPOUND_NODE_ID', // Placeholder
          productId: product.productId,
          amount: parseFloat(product.unitsPerSR) * processData.totalRuns
        });
      });
    }
    
    // 5. Placeholder for future outflows compound
    // This is where you'd add your planned outflows bundling feature
    
    return plans;
  }