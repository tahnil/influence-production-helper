import { InfluenceProduct, InfluenceProcess } from './influenceTypes';

export interface ExtendedD3HierarchyNode extends d3.HierarchyPointNode<D3TreeNode> {
    x0: number;
    y0: number;
    _children?: this[];
    _id: number;
}

export interface BaseNode {
    uniqueNodeId: string;
    id?: string;
    name: string;
    type: 'product' |'sideProduct' | 'process';
}

// Define the ProductNode type
export interface ProductNode extends BaseNode {
    type: 'product';
    influenceProduct: InfluenceProduct; // Reference to InfluenceProduct
    amount: number;
    totalWeight: number; // Calculated total weight
    totalVolume: number; // Calculated total volume
    children?: ProcessNode[];
    processes?: InfluenceProcess[];
}

// Define the SideProductNode type
export interface SideProductNode extends BaseNode {
    type: 'sideProduct';
    influenceProduct: InfluenceProduct;
    amount: number;
    totalWeight: number; // Calculated total weight
    totalVolume: number; // Calculated total volume
}

// Define the ProcessNode type
export interface ProcessNode extends BaseNode {
    type: 'process';
    influenceProcess: InfluenceProcess; // Reference to InfluenceProcess
    totalDuration: number; // Calculated total duration
    totalRuns: number; // Calculated total number of standard runs
    sideProducts?: SideProductNode[]; // Add side products here
    children?: ProductNode[]; // Children are always ProductNodes
}

// Union type for D3TreeNode
export type D3TreeNode = ProductNode | ProcessNode | SideProductNode;
