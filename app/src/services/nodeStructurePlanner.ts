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

    // 1. Create process node plan - process nodes are never wrapped
    const processNodePlan: NodePlan = {
        nodeType: 'process',
        logicalParentId: logicalParentId, // Process points to its output product's parent
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

    // 2. Create outflows compound node for the main output product
    const outputCompoundId = 'OUTPUT_COMPOUND_NODE_ID';
    plans.push({
        nodeType: 'outflowsCompound',
        logicalParentId: logicalParentId, // Same parent as the process
        id: outputCompoundId,
        metadata: {
            label: 'Process Output',
        }
    });

    // 3. Create main outflow product node inside its outflows compound
    const mainOutflow = processData.mainOutflow;
    if (mainOutflow) {
        plans.push({
            nodeType: 'product',
            logicalParentId: 'PROCESS_NODE_ID', // Logical parent is the process
            parentId: outputCompoundId, // Physical parent is the outflows compound
            productId: mainOutflow.productId,
            amount: parseFloat(mainOutflow.unitsPerSR) * processData.totalRuns,
        });
    }

    // 4. If there are side products, add them to the same outflows compound as the main product
    if (processData.hasSideProducts) {
        plans.push({
            nodeType: 'sideProductCompound',
            logicalParentId: 'PROCESS_NODE_ID', // Logical parent is the process
            parentId: outputCompoundId, // Physical parent is the same outflows compound as the main product
        });

        // Add side product nodes inside the side product compound
        processData.sideProducts.forEach((product: InfluenceProcessInputOutput) => {
            plans.push({
                nodeType: 'sideProduct',
                logicalParentId: 'PROCESS_NODE_ID', // Logical parent is the process
                parentId: 'SIDE_PRODUCT_COMPOUND_NODE_ID', // Physical parent is the side product compound
                productId: product.productId,
                amount: parseFloat(product.unitsPerSR) * processData.totalRuns
            });
        });
    }

    // 5. Create an outflows compound for each input product
    processData.inputProducts.forEach((input: ProcessInput, index: number) => {
        const inputCompoundId = `INPUT_COMPOUND_${index}`;

        // Create outflows compound for this input product
        plans.push({
            nodeType: 'outflowsCompound',
            id: inputCompoundId,
            logicalParentId: 'PROCESS_NODE_ID', // Logical parent is the process
            metadata: {
                label: `${input.product.name} Container`,
            }
        });

        // Create the input product inside its outflows compound
        plans.push({
            nodeType: 'product',
            logicalParentId: 'PROCESS_NODE_ID', // Logical parent is the process
            parentId: inputCompoundId, // Physical parent is its outflows compound
            productId: input.product.id,
            amount: parseFloat(input.unitsPerSR) * processData.totalRuns,
        });
    });

    return plans;
}

export function createProductNodePlan(
    productData: ProductData,
    amount: number,
    isRoot: boolean = false
): NodePlan[] {
    const plans: NodePlan[] = [];

    if (isRoot) {
        // Create an outflows compound node for the root product
        plans.push({
            nodeType: 'outflowsCompound',
            id: 'ROOT_OUTFLOWS_COMPOUND_ID', // Placeholder ID that will be replaced
            isRoot: true,
            metadata: {
                isRoot: true,
                label: 'Root Outflows',
            }
        });

        // Create the root product inside its outflows compound
        plans.push({
            nodeType: 'product',
            productId: productData.productDetails.id,
            amount,
            isRoot: true,
            logicalParentId: undefined, // No logical parent for root
            parentId: 'ROOT_OUTFLOWS_COMPOUND_ID', // Reference to the placeholder
            metadata: {
                isRoot: true,
                productData
            }
        });
    } else {
        // For non-root products
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