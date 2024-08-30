// types/reactFlowTypes.ts:
// Updated types to fit React Flow's Node structure
import { Node as ReactFlowNode } from '@xyflow/react';
import { InfluenceProduct, InfluenceProcess, ProcessInput } from '@/types/influenceTypes';

export interface ProductNodeData extends Record<string, unknown> {
    amount: number;
    totalWeight: number;
    totalVolume: number;
    image: string;
    productDetails: InfluenceProduct;
    processesByProductId: InfluenceProcess[];
    selectedProcessId: string | null;
    onSelectProcess: (processId: string, nodeId: string) => void;
}

export interface ProcessNodeData extends Record<string, unknown> {
    totalDuration: number;
    totalRuns: number;
    image: string;
    processDetails: InfluenceProcess;
    inputProducts: ProcessInput[];
}

export type ProcessNode = ReactFlowNode<ProcessNodeData>;

export type ProductNode = ReactFlowNode<ProductNodeData>;