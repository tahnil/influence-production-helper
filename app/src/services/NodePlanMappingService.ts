// services/NodePlanMappingService.ts
export const NodePlanMappingService = {
    // Map from node plan ID to actual node ID
    planToNodeMap: new Map<string, string>(),

    // Map from actual node ID to node plan ID
    nodeToPlanMap: new Map<string, string>(),

    // Register a mapping between a plan and a node
    registerMapping(planId: string, nodeId: string): void {
        this.planToNodeMap.set(planId, nodeId);
        this.nodeToPlanMap.set(nodeId, planId);
    },

    // Clear mappings (useful when loading new configurations)
    clearMappings(): void {
        this.planToNodeMap.clear();
        this.nodeToPlanMap.clear();
    },

    // Get node ID from plan ID
    getNodeId(planId: string): string | undefined {
        return this.planToNodeMap.get(planId);
    },

    // Get plan ID from node ID
    getPlanId(nodeId: string): string | undefined {
        return this.nodeToPlanMap.get(nodeId);
    },

    // Update plan ID mapping when a node ID changes
    updateNodeId(oldNodeId: string, newNodeId: string): void {
        const planId = this.nodeToPlanMap.get(oldNodeId);
        if (planId) {
            this.nodeToPlanMap.delete(oldNodeId);
            this.nodeToPlanMap.set(newNodeId, planId);
            this.planToNodeMap.set(planId, newNodeId);
        }
    },

    // Remove mapping
    removeMapping(nodeId: string): void {
        const planId = this.nodeToPlanMap.get(nodeId);
        if (planId) {
            this.nodeToPlanMap.delete(nodeId);
            this.planToNodeMap.delete(planId);
        }
    }
};