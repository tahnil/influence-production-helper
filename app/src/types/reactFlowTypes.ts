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
    selectedProcessId: string | null;
    handleSelectProcess: (processId: string, nodeId: string) => void;
    handleSerialize: (focalProductId: string) => void;
    ancestorIds?: string[];
    descendantIds?: string[];
    isRoot?: boolean;
}

export interface ProcessNodeData extends Record<string, unknown> {
    totalDuration: number;
    totalRuns: number;
    image: string;
    processDetails: InfluenceProcess;
    inputProducts: ProcessInput[];
    outputProducts: ProcessOutput[];
    ancestorIds?: string[];
    descendantIds?: string[];
}

export interface SideProductNodeData extends Record<string, unknown> {
    amount: number;
    totalWeight: number;
    totalVolume: number;
    image: string;
    productDetails: InfluenceProduct;
    ancestorIds?: string[];
}

export type ProcessNode = ReactFlowNode<ProcessNodeData>;
export type ProductNode = ReactFlowNode<ProductNodeData>;
export type SideProductNode = ReactFlowNode<SideProductNodeData>;

export type InfluenceNode = ProductNode | ProcessNode;
