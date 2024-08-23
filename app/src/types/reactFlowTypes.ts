// types/reactFlowTypes.ts:
// Updated types to fit React Flow's Node structure
import { Node as ReactFlowNode } from '@xyflow/react';
import { InfluenceProduct, InfluenceProcess } from '@/types/influenceTypes';

export interface ProductNodeData extends Record<string, unknown> {
    name: string;
    productData: InfluenceProduct;
    amount: number;
    totalWeight: number;
    totalVolume: number;
    processes: InfluenceProcess[];
    imageBase64: string;
}

export interface ProcessNodeData {
    name: string;
    processData: InfluenceProcess;
    totalDuration: number;
    totalRuns: number;
    imageBase64: string;
}

export type ProcessNode = ReactFlowNode<
    {
        data: ProcessNodeData
    }
>;

export type ProductNode = ReactFlowNode<
    {
        data: ProductNodeData
    }
>;