import { InfluenceProcessInputOutput, InfluenceProduct, ProcessInput, ProductData } from "@/types/influenceTypes";

// services/nodeStructurePlanner.ts
export interface NodePlan {
    nodeType: 'process' | 'product' | 'sideProduct' | 'sideProductCompound' | 'outflowsCompound';
    id?: string; // Will be generated later
    logicalParentId?: string;
    compoundId?: string;
    productId?: string;
    processId?: string;
    amount?: number;
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

    // 2. Create input product node plans
    processData.inputProducts.forEach((input: ProcessInput) => {
        plans.push({
            nodeType: 'product',
            logicalParentId: 'PROCESS_NODE_ID', // Placeholder
            amount: parseFloat(input.unitsPerSR) * processData.totalRuns,
            productId: input.product.id,
        });
    });

    // 3. If there are side products, create a compound node
    if (processData.hasSideProducts) {
        plans.push({
            nodeType: 'sideProductCompound',
            logicalParentId: 'NONE_BUT_LATER_OUTFLOWS_COMPOUND_NODE_ID' // Placeholder
        });

        // 4. Create side product node plans
        processData.sideProducts.forEach((product: InfluenceProcessInputOutput) => {
            plans.push({
                nodeType: 'sideProduct',
                logicalParentId: 'SIDE_PRODUCT_COMPOUND_NODE_ID', // Placeholder
                productId: product.productId,
                amount: parseFloat(product.unitsPerSR) * processData.totalRuns
            });
        });
    }

    // 5. Placeholder for future outflows compound
    // This is where you'd add your planned outflows bundling feature

    return plans;
}

export function createProductNodePlan(
    productData: ProductData,
    amount: number,
    isRoot: boolean = false
): NodePlan[] {
    // Create a single plan for a root product node
    return [{
        nodeType: 'product',
        productId: productData.productDetails.id,
        amount,
        metadata: {
            isRoot,
            productData
        }
    }];
}