// utils/TreeVisualizer/nodeRealizationHelper.ts

import { createProcessNode, createProductNode, createSideProductCompoundNode, createSideProductNode } from "@/services/nodeFactory";
import { NodePlan } from "@/services/nodeStructurePlanner";
import { ProductData } from "@/types/influenceTypes";
import { InfluenceNode } from "@/types/reactFlowTypes";

export function realizePlans(plans: NodePlan[], productDataMap: Record<string, ProductData>) {
    const nodeIdMap: Record<string, string> = {};
    const nodes: InfluenceNode[] = [];
    
    // Process different node types
    plans.forEach(plan => {
        let node;
        
        switch (plan.nodeType) {
            case 'product':
                const productData = productDataMap[plan.productId!];
                node = createProductNode(
                    productData,
                    plan.amount!,
                    plan.logicalParentId,
                    plan.metadata?.isRoot || false
                );
                break;
                
            case 'process':
                node = createProcessNode(plan.metadata, plan.logicalParentId!);
                nodeIdMap['PROCESS_NODE_ID'] = node.id;
                break;
                
            case 'sideProduct':
                const sideProductData = productDataMap[plan.productId!];
                node = createSideProductNode(
                    sideProductData,
                    plan.amount!,
                    nodeIdMap['PROCESS_NODE_ID'],
                    nodeIdMap['SIDE_PRODUCT_COMPOUND_NODE_ID']
                );
                break;
                
            case 'sideProductCompound':
                node = createSideProductCompoundNode(nodeIdMap['PROCESS_NODE_ID']);
                nodeIdMap['SIDE_PRODUCT_COMPOUND_NODE_ID'] = node.id;
                break;
        }
        
        if (node) {
            nodes.push(node);
        }
    });
    
    return { nodes, nodeIdMap };
}