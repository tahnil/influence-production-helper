// services/ConfigurationSaveService.ts

import { v4 as uuidv4 } from 'uuid';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { NodePlan } from '@/types/nodePlanTypes';
import { ProductNode } from '@/components/TreeVisualizer/ProductNode';
import { ProcessNode } from '@/components/TreeVisualizer/ProcessNode';
import { SideProductNode } from '@/components/TreeVisualizer/SideProductNode';

/**
 * Service for saving production chain configurations
 */
export const ConfigurationSaveService = {
    /**
     * Converts a graph or partial graph to NodePlans and saves it to PouchDB
     * @param focalNodeId The ID of the focal node (usually a product node)
     * @param nodes All nodes in the current graph
     * @param db PouchDB database instance
     * @returns Promise resolved when the configuration is saved
     */
    async saveConfiguration(
        focalNodeId: string,
        nodes: InfluenceNode[],
        db: PouchDB.Database
    ): Promise<string> {
        if (!db) {
            throw new Error('PouchDB instance is not available');
        }

        // 1. Find the focal node
        const focalNode = nodes.find(node => node.id === focalNodeId);
        if (!focalNode || focalNode.type !== 'productNode') {
            throw new Error('Focal node not found or is not a ProductNode');
        }

        // 2. Find all relevant nodes (the focal node and its inflow hierarchy)
        const relevantNodes = this.getRelevantNodes(nodes, focalNodeId);

        // 3. Convert nodes to NodePlans
        const nodePlans = this.convertNodesToPlans(relevantNodes, focalNodeId);

        // 4. Create document metadata
        const configId = uuidv4();
        const configDocument = {
            _id: configId,
            focalProductId: (focalNode as ProductNode).data.productDetails.id,
            createdAt: new Date().toISOString(),
            nodeCount: relevantNodes.length,
            rootProductId: (focalNode as ProductNode).data.productDetails.id,
            // Include the original nodes for backward compatibility
            nodes: relevantNodes,
            // Add the new NodePlans structure
            nodePlans: nodePlans
        };

        try {
            // 5. Save the document to PouchDB
            const response = await db.put(configDocument);

            // 6. Save the serialized nodes as an attachment for backward compatibility
            const nodeAttachment = new Blob(
                [JSON.stringify(relevantNodes)],
                { type: 'application/json' }
            );
            await db.putAttachment(configId, 'nodes', response.rev, nodeAttachment, 'application/json');

            // 7. Save the NodePlans as a separate attachment
            const planAttachment = new Blob(
                [JSON.stringify(nodePlans)],
                { type: 'application/json' }
            );
            await db.putAttachment(configId, 'nodePlans', response.rev, planAttachment, 'application/json');

            return configId;
        } catch (error) {
            console.error('Error saving configuration:', error);
            throw error;
        }
    },

    /**
     * Gets all nodes that are part of the production chain starting from the focal node
     * @param nodes All nodes in the current graph
     * @param focalNodeId The ID of the focal node
     * @returns Array of nodes in the production chain, properly ordered for ReactFlow
     */
    getRelevantNodes(nodes: InfluenceNode[], focalNodeId: string): InfluenceNode[] {
        const relevantNodes: InfluenceNode[] = [];
        const visited = new Set<string>();

        // First, collect all nodes and their relationships
        const collectNodes = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;

            // Find physical parent (compound node) if exists
            if (node.parentId && !visited.has(node.parentId)) {
                const parentNode = nodes.find(n => n.id === node.parentId);
                if (parentNode) {
                    collectNodes(parentNode.id);  // Process parent first
                }
            }

            // Add the current node
            relevantNodes.push(node);

            // Process logical children (inflows)
            if (Array.isArray(node.data.inflowIds)) {
                node.data.inflowIds.forEach(inflowId => {
                    collectNodes(inflowId);
                });
            }

            // For process nodes, find their side products
            if (node.type === 'processNode') {
                // Find side product compound nodes that have this process as their logical parent
                const sideProductCompounds = nodes.filter(n =>
                    n.type === 'sideProductCompoundNode' &&
                    n.data.processId === node.id
                );

                sideProductCompounds.forEach(compound => {
                    if (!visited.has(compound.id)) {
                        collectNodes(compound.id);

                        // Find all side product nodes that are children of this compound
                        const sideProducts = nodes.filter(n =>
                            n.type === 'sideProductNode' &&
                            n.parentId === compound.id
                        );

                        sideProducts.forEach(sideProduct => {
                            collectNodes(sideProduct.id);
                        });
                    }
                });

                // Find any side product nodes that have this process as an ancestor (for backward compatibility)
                const sideProducts = nodes.filter(n =>
                    n.type === 'sideProductNode' &&
                    Array.isArray(n.data.ancestorIds) &&
                    n.data.ancestorIds.includes(node.id)
                );

                sideProducts.forEach(sideProduct => {
                    if (!visited.has(sideProduct.id)) {
                        collectNodes(sideProduct.id);
                    }
                });
            }

            // For outflowsCompound nodes, ensure all children are included
            if (node.type === 'outflowsCompoundNode') {
                const children = nodes.filter(n => n.parentId === node.id);
                children.forEach(child => {
                    if (!visited.has(child.id)) {
                        collectNodes(child.id);
                    }
                });
            }
        };

        // Start from the focal node
        collectNodes(focalNodeId);

        // Now we need to reorder nodes to ensure parent nodes come before their children
        const result: InfluenceNode[] = [];
        const nodesToProcess = [...relevantNodes];
        const processed = new Set<string>();

        // Helper function to check if a node can be added (all its parents are processed)
        const canAddNode = (node: InfluenceNode): boolean => {
            // Nodes without parents can always be added
            if (!node.parentId) return true;

            // Nodes with parents can only be added if their parent is already processed
            return processed.has(node.parentId);
        };

        // Process nodes in correct order
        while (nodesToProcess.length > 0) {
            let progress = false;

            for (let i = 0; i < nodesToProcess.length; i++) {
                const node = nodesToProcess[i];

                if (canAddNode(node)) {
                    // Add this node to result
                    result.push(node);
                    processed.add(node.id);

                    // Remove from nodesToProcess
                    nodesToProcess.splice(i, 1);
                    i--; // Adjust index after removal

                    progress = true;
                }
            }

            // If we went through a full iteration without progress, we might have a circular dependency
            if (!progress && nodesToProcess.length > 0) {
                console.warn('Possible circular dependency in node hierarchy');
                // Add remaining nodes in current order as fallback
                result.push(...nodesToProcess);
                break;
            }
        }

        return result;
    },

    /**
     * Converts nodes to NodePlans
     * @param nodes Nodes to convert
     * @param focalNodeId The ID of the focal node
     * @returns Array of NodePlans
     */
    convertNodesToPlans(nodes: InfluenceNode[], focalNodeId: string): NodePlan[] {
        const plans: NodePlan[] = [];
        const idMap = new Map<string, string>();

        // First pass: Create plans for product and process nodes
        nodes.forEach(node => {
            let plan: NodePlan | null = null;

            if (node.type === 'productNode') {
                const productNode = node as ProductNode;

                plan = {
                    nodeType: 'product',
                    productId: productNode.data.productDetails.id,
                    amount: productNode.data.amount,
                    isRoot: node.id === focalNodeId,
                    logicalParentId: productNode.data.logicalParentId,
                    metadata: {
                        originalId: node.id,
                        isRoot: node.id === focalNodeId,
                        // Include parent information for physical hierarchy
                        parentId: productNode.parentId
                    }
                };
            }
            else if (node.type === 'processNode') {
                const processNode = node as ProcessNode;

                plan = {
                    nodeType: 'process',
                    processId: processNode.data.processDetails.id,
                    logicalParentId: processNode.data.logicalParentId,
                    metadata: {
                        originalId: node.id,
                        totalDuration: processNode.data.totalDuration,
                        totalRuns: processNode.data.totalRuns
                    }
                };
            }
            else if (node.type === 'sideProductNode') {
                const sideProductNode = node as SideProductNode;

                plan = {
                    nodeType: 'sideProduct',
                    productId: sideProductNode.data.productDetails.id,
                    amount: sideProductNode.data.amount,
                    metadata: {
                        originalId: node.id,
                        ancestorIds: sideProductNode.data.ancestorIds,
                        parentId: sideProductNode.parentId
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
                    isRoot: typeof node.data.isRoot === 'boolean' ? node.data.isRoot : undefined,
                    metadata: {
                        originalId: node.id,
                        label: node.data.label,
                        processId: node.data.processId
                    }
                };
            }

            if (plan) {
                // Store the original ID mapping
                idMap.set(node.id, plan.metadata?.originalId ?? node.id);
                plans.push(plan);
            }
        });

        // Second pass: Update parent references
        plans.forEach(plan => {
            // Skip nodes without logical parents
            if (!plan.logicalParentId) return;

            // If the logicalParentId exists in our idMap, use the placeholder ID
            if (idMap.has(plan.logicalParentId)) {
                // For logical hierarchy (inflowIds, outflowIds)
                plan.logicalParentId = idMap.get(plan.logicalParentId);
            }

            // Handle physical hierarchy (parentId for rendering)
            if (plan.parentId && idMap.has(plan.parentId)) {
                plan.parentId = idMap.get(plan.parentId);
            }

            // Handle ancestorIds for side products
            if (plan.nodeType === 'sideProduct' &&
                plan.metadata &&
                Array.isArray(plan.metadata.ancestorIds)) {
                plan.metadata.ancestorIds = plan.metadata.ancestorIds.map(id =>
                    idMap.has(id) ? idMap.get(id)! : id
                );
            }
        });

        return plans;
    }
};