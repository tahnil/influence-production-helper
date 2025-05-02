// types/nodePlanTypes.ts
export interface NodePlan {
    nodeType: 'process' | 'product' | 'sideProduct' | 'sideProductCompound' | 'outflowsCompound';
    id?: string; // Will be generated later
    logicalParentId?: string;
    parentId?: string; // Physical parent for visualization
    compoundId?: string;
    productId?: string;
    processId?: string;
    amount?: number;
    isRoot?: boolean;
    metadata?: Record<string, any>;
  }