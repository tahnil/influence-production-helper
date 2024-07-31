import { InfluenceProduct, InfluenceProcess } from './influenceTypes';
import { HierarchyPointNode } from 'd3';

export interface ExtendedD3HierarchyNode extends HierarchyPointNode<D3TreeNode> {
    x0?: number;
    y0?: number;
    _children?: this[];
    _id?: number;
    uniqueNodeId: string;
}

export interface BaseNode {
    uniqueNodeId: string;
    id?: string;
    name: string;
    nodeType: 'product' |'sideProduct' | 'process';
}

// Define the ProductNode type
export interface ProductNode extends BaseNode {
    id: string;
    uniqueNodeId: string;
    nodeType: 'product';
    name: string;
    category: string;
    quantized: boolean;
    massKgPerUnit: string;
    volLitersPerUnit: string;
    influenceType: string;
    amount: number;
    totalWeight: number; // Calculated total weight
    totalVolume: number; // Calculated total volume
    children?: ProcessNode[];
    processes?: InfluenceProcess[];
}

// Define the SideProductNode type
export interface SideProductNode extends BaseNode {
    nodeType: 'sideProduct';
    name: string;
    category: string;
    quantized: boolean;
    massKgPerUnit: string;
    volLitersPerUnit: string;
    influenceType: string;
    amount: number;
    totalWeight: number; // Calculated total weight
    totalVolume: number; // Calculated total volume
    processes?: InfluenceProcess[];
}

// Define the ProcessNode type
export interface ProcessNode extends BaseNode {
    nodeType: 'process';
    totalDuration: number; // Calculated total duration
    totalRuns: number; // Calculated total number of standard runs
    sideProducts?: SideProductNode[]; // Add side products here
    children?: ProductNode[]; // Children are always ProductNodes
}

// Union type for D3TreeNode
export type D3TreeNode = ProductNode | ProcessNode | SideProductNode;