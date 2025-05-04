// services/ConfigurationLoadService.ts

import { InfluenceNode } from '@/types/reactFlowTypes';
import { Edge } from '@xyflow/react';
import { NodePlan } from '@/types/nodePlanTypes';
import { generateUniqueId } from '@/utils/generateUniqueId';
import NodeRealizationService from '@/services/NodeRealizationService';
import EdgeCreationService from '@/services/EdgeCreationService';

export interface LoadResult {
    nodes: InfluenceNode[];
    edges: Edge[];
    rootNodeId?: string;
    replacementInfo?: {
        originalNodeId: string;
        newNodeId: string;
    };
}

/**
 * Service for loading saved production chain configurations
 */
export const ConfigurationLoadService = {
    /**
     * Loads a configuration from PouchDB
     * @param configId The ID of the configuration to load
     * @param db PouchDB database instance
     * @param mode 'full' to replace the entire graph, 'partial' to replace part of it
     * @param replacementNodeId The ID of the node to replace (only used in 'partial' mode)
     * @param productDataMap Map of product IDs to product data (for node realization)
     * @returns Promise resolved with the loaded configuration
     */
    async loadConfiguration(
        configId: string,
        db: PouchDB.Database,
        mode: 'full' | 'partial',
        replacementNodeId?: string,
        productDataMap?: Record<string, any>
    ): Promise<LoadResult> {
        if (!db) {
            throw new Error('PouchDB instance is not available');
        }

        try {
            // Debug logging: show parameters
            console.log('[ConfigurationLoadService > loadConfiguration] Loading configuration with ID:', configId);
            console.log('[ConfigurationLoadService > loadConfiguration] DB Instance:', db);
            console.log('[ConfigurationLoadService > loadConfiguration] Mode:', mode);
            console.log('[ConfigurationLoadService > loadConfiguration] Replacement Node ID:', replacementNodeId);
            console.log('[ConfigurationLoadService > loadConfiguration] Product Data Map:', productDataMap);

            // 1. Fetch the configuration document
            const config = await db.get(configId);

            console.log('[ConfigurationLoadService > loadConfiguration] Loaded configuration:', config);

            // 2. Try to get the NodePlans attachment first (new format)
            let nodePlans: NodePlan[] = [];
            try {
                // Load the nodePlans property (NOT ATTACHMENT) from the configuration document, if it exists
                nodePlans = (config as any).nodePlans;
                console.log('[ConfigurationLoadService > loadConfiguration] Loaded NodePlans attachment:', nodePlans);
            } catch (error) {
                console.error('[ConfigurationLoadService > loadConfiguration] Error loading NodePlans attachment:', error);
                // If nodePlans attachment doesn't exist, fall back to nodes attachment (old format)
                const nodeAttachment = await db.getAttachment(configId, 'nodes');
                if (!(nodeAttachment instanceof Blob)) {
                    throw new Error('Node attachment is not available');
                }

                console.log('[ConfigurationLoadService > loadConfiguration] Loaded nodes attachment:', nodeAttachment);

                // Convert old format nodes to NodePlans
                const savedNodes = JSON.parse(await nodeAttachment.text());
                nodePlans = this.convertLegacyNodesToPlans(savedNodes, (config as any).focalProductId);
            }
            console.log('[ConfigurationLoadService > loadConfiguration] Exiting try/catch for NodePlans');

            // Handle different load modes
            if (mode === 'full') {
                return this.loadFullConfiguration(nodePlans, productDataMap);
            } else {
                if (!replacementNodeId) {
                    throw new Error('Replacement node ID is required for partial loading');
                }
                return this.loadPartialConfiguration(
                    nodePlans,
                    replacementNodeId,
                    productDataMap
                );
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
            throw error;
        }
    },

    /**
     * Loads a configuration as a complete replacement for the current graph
     * @param nodePlans Array of NodePlans to load
     * @param productDataMap Map of product IDs to product data (for node realization)
     * @returns Object containing the new nodes and edges
     */
    loadFullConfiguration(
        nodePlans: NodePlan[],
        productDataMap?: Record<string, any>
    ): LoadResult {
        // 1. Regenerate node IDs to ensure uniqueness
        const regeneratedPlans = this.regenerateNodeIds(nodePlans);
        console.log('[ConfigurationLoadService > loadFullConfiguration] Regenerated NodePlans:', regeneratedPlans);

        // 2. Realize the node plans
        const { nodes, nodeIdMap } = NodeRealizationService.realizePlans(
            regeneratedPlans,
            productDataMap || {}
        );

        // 3. Create edges for the nodes
        const edges = EdgeCreationService.createEdges(nodes as InfluenceNode[], nodeIdMap);

        // 4. Find the root node ID
        const rootNode = nodes.find(node =>
            node.type === 'outflowsCompoundNode' && node.data.isRoot
        );

        return {
            nodes: nodes as InfluenceNode[],
            edges,
            rootNodeId: rootNode?.id
        };
    },

    /**
     * Loads a configuration as a partial replacement for part of the current graph
     * @param nodePlans Array of NodePlans to load
     * @param replacementNodeId ID of the node to replace
     * @param productDataMap Map of product IDs to product data (for node realization)
     * @returns Object containing the new nodes and edges
     */
    loadPartialConfiguration(
        nodePlans: NodePlan[],
        replacementNodeId: string,
        productDataMap?: Record<string, any>
    ): LoadResult {
        // 1. Regenerate node IDs to ensure uniqueness
        const regeneratedPlans = this.regenerateNodeIds(nodePlans);

        // 2. Find the root node plan (the focal product node)
        const rootPlan = regeneratedPlans.find(plan =>
            plan.isRoot || (plan.metadata && plan.metadata.isRoot)
        );

        if (!rootPlan) {
            throw new Error('Root node plan not found in the configuration');
        }

        // 3. Realize the node plans
        const { nodes, nodeIdMap } = NodeRealizationService.realizePlans(
            regeneratedPlans,
            productDataMap || {}
        );

        // 4. Create edges for the nodes
        const edges = EdgeCreationService.createEdges(nodes as InfluenceNode[], nodeIdMap);

        // 5. Find the new root node
        const rootNode = nodes.find(node =>
            (node.type === 'productNode' && node.data.isRoot) ||
            (node.type === 'outflowsCompoundNode' && node.data.isRoot)
        );

        if (!rootNode) {
            throw new Error('Root node not found in realized nodes');
        }

        return {
            nodes: nodes as InfluenceNode[],
            edges,
            replacementInfo: {
                originalNodeId: replacementNodeId,
                newNodeId: rootNode.id
            }
        };
    },

    /**
     * Generates new unique IDs for all nodes in the plans
     * @param plans Array of NodePlans
     * @returns New array of NodePlans with unique IDs
     */
    regenerateNodeIds(plans: NodePlan[]): NodePlan[] {
        const idMap = new Map<string, string>();

        // First pass: Generate new IDs and build the mapping
        const plansWithNewIds = plans.map(plan => {
            const originalId = plan.metadata?.originalId;
            if (!originalId) return plan;

            const newId = generateUniqueId();
            idMap.set(originalId, newId);

            return {
                ...plan,
                metadata: {
                    ...plan.metadata,
                    originalId: newId
                }
            };
        });

        // Second pass: Update references to use the new IDs
        return plansWithNewIds.map(plan => {
            let updatedPlan = { ...plan };

            // Update logical parent ID
            if (plan.logicalParentId && idMap.has(plan.logicalParentId)) {
                updatedPlan.logicalParentId = idMap.get(plan.logicalParentId);
            }

            // Update physical parent ID
            if (plan.parentId && idMap.has(plan.parentId)) {
                updatedPlan.parentId = idMap.get(plan.parentId);
            }

            // Update ancestor IDs for side products
            if (plan.nodeType === 'sideProduct' &&
                plan.metadata &&
                Array.isArray(plan.metadata.ancestorIds)) {
                updatedPlan.metadata = {
                    ...updatedPlan.metadata,
                    ancestorIds: plan.metadata.ancestorIds.map(id =>
                        idMap.has(id) ? idMap.get(id)! : id
                    )
                };
            }

            return updatedPlan;
        });
    },

    /**
     * Converts legacy node format to NodePlans format for backward compatibility
     * @param nodes Array of nodes in the old format
     * @param focalProductId ID of the focal product
     * @returns Array of NodePlans
     */
    convertLegacyNodesToPlans(nodes: any[], focalProductId: string): NodePlan[] {
        const plans: NodePlan[] = [];

        nodes.forEach(node => {
            let plan: NodePlan | null = null;

            // Determine if this is the root/focal node
            const isRootNode = node.type === 'productNode' &&
                node.data.productDetails &&
                node.data.productDetails.id === focalProductId;

            if (node.type === 'productNode') {
                plan = {
                    nodeType: 'product',
                    productId: node.data.productDetails.id,
                    amount: node.data.amount,
                    isRoot: isRootNode,
                    logicalParentId: node.data.logicalParentId,
                    metadata: {
                        originalId: node.id,
                        isRoot: isRootNode,
                        parentId: node.parentId
                    }
                };
            }
            else if (node.type === 'processNode') {
                plan = {
                    nodeType: 'process',
                    processId: node.data.processDetails.id,
                    logicalParentId: node.data.logicalParentId,
                    metadata: {
                        originalId: node.id,
                        totalDuration: node.data.totalDuration,
                        totalRuns: node.data.totalRuns
                    }
                };
            }
            else if (node.type === 'sideProductNode') {
                plan = {
                    nodeType: 'sideProduct',
                    productId: node.data.productDetails.id,
                    amount: node.data.amount,
                    metadata: {
                        originalId: node.id,
                        ancestorIds: node.data.ancestorIds,
                        parentId: node.parentId
                    }
                };
            }
            else if (node.type === 'sideProductCompoundNode') {
                plan = {
                    nodeType: 'sideProductCompound',
                    parentId: node.parentId,
                    metadata: {
                        originalId: node.id,
                        processId: node.data.processId
                    }
                };
            }
            else if (node.type === 'outflowsCompoundNode') {
                plan = {
                    nodeType: 'outflowsCompound',
                    isRoot: node.data.isRoot,
                    metadata: {
                        originalId: node.id,
                        label: node.data.label,
                        processId: node.data.processId
                    }
                };
            }

            if (plan) {
                plans.push(plan);
            }
        });

        return plans;
    }
};