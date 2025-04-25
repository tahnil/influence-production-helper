// services/nodeStructurePlanner.ts
import { InfluenceProcessInputOutput, InfluenceProduct, ProcessInput, ProductData } from "@/types/influenceTypes";

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

export function createProcessNodePlan(
    processData: any,
    logicalParentId: string
): NodePlan[] {
    const plans: NodePlan[] = [];

    // 1. Create process node plan
    const processNodePlan: NodePlan = {
        nodeType: 'process',
        logicalParentId: logicalParentId,
        processId: processData.processDetails.id,
        metadata: {
            totalDuration: processData.totalDuration,
            totalRuns: processData.totalRuns,
            buildingIcon: processData.buildingIcon,
            processDetails: processData.processDetails,
            inputProducts: processData.inputProducts,
        }
    };
    plans.push(processNodePlan);

    // 2. Create outflows compound node
    plans.push({
        nodeType: 'outflowsCompound',
        logicalParentId: 'PROCESS_NODE_ID', // Will be replaced with actual process node ID
        metadata: {
            processId: 'PROCESS_NODE_ID', // Will be replaced with actual process node ID
        }
    });

    // 3. Create main outflow product node (now a child of the outflows compound)
    const mainOutflow = processData.mainOutflow;
    if (mainOutflow) {
        plans.push({
            nodeType: 'product',
            logicalParentId: 'OUTFLOWS_COMPOUND_NODE_ID', // Will be replaced with actual outflows compound node ID
            parentId: 'OUTFLOWS_COMPOUND_NODE_ID', // Physical parent for visualization
            productId: mainOutflow.productId,
            amount: parseFloat(mainOutflow.unitsPerSR) * processData.totalRuns,
        });
    }

    // 4. Create input product node plans (these remain direct children of the process)
    processData.inputProducts.forEach((input: ProcessInput) => {
        plans.push({
            nodeType: 'product',
            logicalParentId: 'PROCESS_NODE_ID', // Will be replaced with actual process node ID
            amount: parseFloat(input.unitsPerSR) * processData.totalRuns,
            productId: input.product.id,
        });
    });

    // 5. If there are side products, create a compound node (now as child of outflows compound)
    if (processData.hasSideProducts) {
        plans.push({
            nodeType: 'sideProductCompound',
            logicalParentId: 'OUTFLOWS_COMPOUND_NODE_ID', // Now a child of the outflows compound
            parentId: 'OUTFLOWS_COMPOUND_NODE_ID', // Physical parent for visualization
        });

        // 6. Create side product node plans (still children of side product compound)
        processData.sideProducts.forEach((product: InfluenceProcessInputOutput) => {
            plans.push({
                nodeType: 'sideProduct',
                logicalParentId: 'SIDE_PRODUCT_COMPOUND_NODE_ID', // Will be replaced with actual side product compound node ID
                parentId: 'SIDE_PRODUCT_COMPOUND_NODE_ID', // Physical parent for visualization
                productId: product.productId,
                amount: parseFloat(product.unitsPerSR) * processData.totalRuns
            });
        });
    }

    return plans;
}

export function createProductNodePlan(
    productData: ProductData,
    amount: number,
    isRoot: boolean = false
): NodePlan[] {
    const plans: NodePlan[] = [];
    
    if (isRoot) {
        // For root nodes, create an outflows compound node first
        plans.push({
            nodeType: 'outflowsCompound',
            isRoot: true,
            metadata: {
                isRoot: true,
                label: 'Root Outflows',
            }
        });
        
        // Then create the product node as a child of the outflows compound
        plans.push({
            nodeType: 'product',
            productId: productData.productDetails.id,
            amount,
            isRoot: true,
            logicalParentId: 'OUTFLOWS_COMPOUND_NODE_ID', // Will be replaced with actual outflows compound node ID
            parentId: 'OUTFLOWS_COMPOUND_NODE_ID', // Physical parent for visualization
            metadata: {
                isRoot: true,
                productData
            }
        });
    } else {
        // Non-root product nodes remain unchanged
        plans.push({
            nodeType: 'product',
            productId: productData.productDetails.id,
            amount,
            metadata: {
                isRoot,
                productData
            }
        });
    }
    
    return plans;
}