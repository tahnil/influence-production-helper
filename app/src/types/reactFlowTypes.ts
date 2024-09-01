// types/reactFlowTypes.ts:
// Updated types to fit React Flow's Node structure
import { Node as ReactFlowNode } from '@xyflow/react';
import { InfluenceProduct, InfluenceProcess, ProcessInput, ProcessOutput } from '@/types/influenceTypes';

export interface ProductNodeData extends Record<string, unknown> {
    amount: number;
    totalWeight: number;
    totalVolume: number;
    image: string;
    productDetails: InfluenceProduct;
    processesByProductId: InfluenceProcess[];
    // add new field for processes that have this product as input
    selectedProcessId: string | null; // we need to rename this field to distinguish between a selected process that yields this product (current field) and a selected process for the derived products view
    onSelectProcess: (processId: string, nodeId: string) => void; // dito rename
    // selectedDerivedProcessId: string | null;
    // onSelectDerivedProcess: (processId: string, nodeId: string) => void;
}

export interface ProcessNodeData extends Record<string, unknown> {
    totalDuration: number;
    totalRuns: number;
    image: string;
    processDetails: InfluenceProcess;
    inputProducts: ProcessInput[];
    // outPutProducts: ProcessOutput[];
}

export type ProcessNode = ReactFlowNode<ProcessNodeData>;

export type ProductNode = ReactFlowNode<ProductNodeData>;