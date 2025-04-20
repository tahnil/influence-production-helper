// types/reactFlowTypes.ts:
import { ProcessNode } from '@/components/TreeVisualizer/ProcessNode';
import { ProductNode } from '@/components/TreeVisualizer/ProductNode';
import { SideProductNode } from '@/components/TreeVisualizer/SideProductNode';
import { CompoundNode } from '@/components/TreeVisualizer/CompoundNode';

// Base interface for node data with common properties
export interface BaseNodeData extends Record<string, unknown> {
    logicalParentId?: string;
    inflowIds?: string[];
    outflowIds?: string[];
}

// Union type for all possible node types
export type InfluenceNode = ProductNode | ProcessNode | SideProductNode | CompoundNode;