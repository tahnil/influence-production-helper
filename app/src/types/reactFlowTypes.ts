// Updated types to fit React Flow's Node structure
import { Node as ReactFlowNode } from '@xyflow/react';
import { InfluenceProduct, InfluenceProcess } from '@/types/influenceTypes';

export interface ProductNodeData {
    name: string;
    productData: InfluenceProduct;
    amount: number;
    totalWeight: number;
    totalVolume: number;
    processes: InfluenceProcess[];
    imageBase64: string;
    buildProcessNodeCallback?: (selectedProcessId: string, parentNode: ReactFlowNode<ProductNodeData>) => void;
}

export interface ProcessNodeData {
    name: string;
    processData: InfluenceProcess;
    totalDuration: number;
    totalRuns: number;
    imageBase64: string;
}

export type ProcessNodeComponent = ReactFlowNode<
    {
        data: ProcessNodeData
    }
>;

export type ProductNodeComponent = ReactFlowNode<
    {
        data: ProductNodeData
    }
>;