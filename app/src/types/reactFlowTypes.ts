// types/reactFlowTypes.ts:
// Updated types to fit React Flow's Node structure
import { Node as ReactFlowNode } from '@xyflow/react';
import { InfluenceProduct, InfluenceProcess, ProcessInput, ProcessOutput } from '@/types/influenceTypes';

export interface ProductNodeData extends Record<string, unknown> {
    logicalParentId: string | undefined;
    amount: number;
    totalWeight: number;
    totalVolume: number;
    image: string;
    productDetails: InfluenceProduct;
    processesByProductId: InfluenceProcess[];
    selectedProcessId: string | null;
    handleSelectProcess: (processId: string, nodeId: string) => void;
    handleSerialize: (focalProductId: string) => void;
    isRoot?: boolean;
}

export interface ProcessNodeData extends Record<string, unknown> {
    logicalParentId: string | null;
    totalDuration: number;
    totalRuns: number;
    image: string;
    processDetails: InfluenceProcess;
    inputProducts: ProcessInput[];
    inflowIds?: string[];
    outflowIds?: string[];
    [key: string]: any;
}

export interface SideProductNodeData extends Record<string, unknown> {
    logicalParentId: string | undefined;
    amount: number;
    totalWeight: number;
    totalVolume: number;
    image: string;
    productDetails: InfluenceProduct;
    handleSelectProcess: (processId: string, nodeId: string) => void;
    handleSerialize: (focalProductId: string) => void;
    ancestorIds: string[]; // Array of process IDs that produce this side product
}

export interface CompoundNodeData extends Record<string, unknown> {
    id: string;
    width: string | number;
    height: string | number;
    children: React.ReactNode;
}

export type ProcessNode = ReactFlowNode<ProcessNodeData>;
export type ProductNode = ReactFlowNode<ProductNodeData>;
export type SideProductNode = ReactFlowNode<SideProductNodeData>;
export type CompoundNode = ReactFlowNode<CompoundNodeData>;

export type InfluenceNode = ProductNode | ProcessNode | SideProductNode | CompoundNode;
