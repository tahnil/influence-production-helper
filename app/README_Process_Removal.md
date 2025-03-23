https://claude.ai/chat/fc08b2a4-0e9c-456e-a6b6-7155d3e56d8e

# Remove Process Feature

## User Story
As user I want to be able to remove an inflow process from any product node, because I may have selected the process just out of curiosity or mistakenly, and when copying the ingredients to the clipboard I want only ingredients included that I actually need to produce.

## Functional Requirements
1. Users should be able to delete/remove a process node that is an inflow to a product node.
2. When a process node is removed, all its inflows (child product nodes and their descendant nodes) should also be removed.
3. The production chain visualization should update immediately after removal to reflect the changes.
4. The ingredients list should update to exclude any materials that were only required by the removed process.
5. Edge connections should be properly cleaned up after removal to maintain the graph integrity.
6. The system should handle potential changes to the root node or important structural elements gracefully.

## Technical Requirements
1. Add a visual UI element (button or icon) that allows users to remove a process node.
2. Implement a removal handler function that can:
   * Identify and collect all affected nodes (the process node and all its descendants)
   * Remove these nodes from the nodes state
   * Remove associated edges from the edges state
   * Update any parent node's inflowIds array to remove references to the deleted process
3. Integrate with the existing React Flow state management
4. Trigger re-layout of the graph after removal

## User Experience Requirements
1. The removal action should be easily discoverable
2. Provide proper visual feedback when hovering over the removal control
3. Consider adding a confirmation dialog for process nodes with many descendants to prevent accidental data loss
4. Ensure the Dagre layout correctly adjusts after node removal

## Acceptance Criteria
1. Process Removal UI
   * [ ] A consistent UI element (button or icon) is visible for each process node
   * [ ] The UI element has appropriate hover and active states
2. Process Removal Action
   * [ ] Clicking the removal UI element removes the targeted process node
   * [ ] All child nodes of the removed process node are also removed
   * [ ] The parent product node's inflow references are correctly updated
3. Graph Updates
   * [ ] The React Flow visualization updates immediately after removal
   * [ ] The Dagre layout recalculates correctly, with no orphaned nodes
   * [ ] No "ghost edges" remain after node removal
4. Ingredients List Updates
   * [ ] The ingredients list (both raw materials and all products view) updates to exclude any materials that were only required by the removed process
   * [ ] Quantities of shared materials are adjusted correctly
5. Edge Cases
   * [ ] Removing a process connected to the root node works correctly
   * [ ] The system handles multiple process removals in a single session
   * [ ] No runtime errors occur when removing nodes with complex relationships
6. Performance
   * [ ] Node removal and graph updates occur without noticeable performance degradation
   * [ ] Layout recalculation completes within an acceptable time frame for large graphs

