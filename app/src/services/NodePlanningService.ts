// services/NodePlanningService.ts
import { ProductData } from '@/types/influenceTypes';
import { NodePlan } from '@/types/nodePlanTypes';
import { generateUniqueId } from '@/utils/generateUniqueId';

export const NodePlanningService = {
  /**
   * Creates a plan for generating a process node structure
   * @param processData Process data including details, inputs, outputs, etc.
   * @param logicalParentId ID of the parent node (typically a product node)
   * @returns Array of node plans to be realized
   */
  createProcessNodePlan(processData: any, logicalParentId: string): NodePlan[] {
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

    // 2. Set outflows compound node id for rest of plans
    const outputCompoundId = processData.outflowsCompoundId;

    // 3. If there are side products, add them to the same outflows compound as the main product
    if (processData.hasSideProducts) {
      plans.push({
        nodeType: 'sideProductCompound',
        parentId: outputCompoundId, // Physical parent is the same outflows compound as the main product
      });

      // Add side product nodes inside the side product compound
      processData.sideProducts.forEach((product: any) => {
        plans.push({
          nodeType: 'sideProduct',
          parentId: 'SIDE_PRODUCT_COMPOUND_NODE_ID', // Physical parent is the side product compound
          productId: product.productId,
          amount: parseFloat(product.unitsPerSR) * processData.totalRuns
        });
      });
    }

    // 4. Create an outflows compound for each input product
    processData.inputProducts.forEach((input: any, index: number) => {
      const inputCompoundId = `INPUT_COMPOUND_${index}`;

      // Create outflows compound for this input product
      plans.push({
        nodeType: 'outflowsCompound',
        id: inputCompoundId,
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

    console.log('[NodePlanningService] Process Node Plan:', plans);

    return plans;
  },

  /**
   * Creates a plan for generating a product node structure
   * @param productData Data for the product to be created
   * @param amount Amount of the product
   * @param isRoot Whether this is the root product node
   * @returns Array of node plans to be realized
   */
  createProductNodePlan(
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

    console.log('[NodePlanningService] Product Node Plan:', plans);

    return plans;
  },

  // Find a plan by its ID
  findPlanById(plans: NodePlan[], planId: string): NodePlan | undefined {
    return plans.find(plan => plan.id === planId);
  },

  // Find plans by node type
  findPlansByType(plans: NodePlan[], nodeType: string): NodePlan[] {
    return plans.filter(plan => plan.nodeType === nodeType);
  },

  // Replace a process plan 
  replaceProcessPlan(plans: NodePlan[], parentNodeId: string, processId: string): NodePlan[] {
    // Find the existing process plan
    const index = plans.findIndex(plan =>
      plan.nodeType === 'process' &&
      plan.logicalParentId === parentNodeId
    );

    if (index === -1) return plans;

    // Create new plan
    const updatedPlan: NodePlan = {
      ...plans[index],
      processId,
      // Update any other properties
    };

    // Return updated plans array
    return [
      ...plans.slice(0, index),
      updatedPlan,
      ...plans.slice(index + 1)
    ];
  },

  // Remove a plan and its related plans (e.g., when replacing a process)
  removePlanAndRelated(plans: NodePlan[], planId: string): NodePlan[] {
    // Find the plan
    const plan = this.findPlanById(plans, planId);
    if (!plan) return plans;

    // Helper to find all child plans
    const findChildPlans = (parentId: string): string[] => {
      const directChildren = plans
        .filter(p => (p.logicalParentId === parentId || p.parentId === parentId) && p.id !== undefined)
        .map(p => p.id as string);

      const allChildren = [...directChildren];

      // Recursively find grandchildren
      directChildren.forEach(childId => {
        allChildren.push(...findChildPlans(childId));
      });

      return allChildren;
    };

    // Get all plans to remove
    const plansToRemove = new Set([planId, ...findChildPlans(planId)]);

    // Filter out the plans to remove
    return plans.filter(p => p.id !== undefined && !plansToRemove.has(p.id));
  },

  // Add a unique ID to a plan if it doesn't have one
  ensurePlanId(plan: NodePlan): NodePlan {
    if (!plan.id) {
      return {
        ...plan,
        id: generateUniqueId() // Use your existing ID generation utility
      };
    }
    return plan;
  },

  // Ensure all plans have IDs
  ensurePlanIds(plans: NodePlan[]): NodePlan[] {
    return plans.map(plan => this.ensurePlanId(plan));
  },

  /**
   * Generates a unique ID for a node plan
   * This is a helper method that would typically be in NodePlanningService
   */
  generatePlanId(): string {
    return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

export default NodePlanningService;