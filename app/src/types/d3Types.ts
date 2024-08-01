// types/d3Types.ts

import { InfluenceProduct, InfluenceProcess } from './influenceTypes';

export interface BaseNode {
    id: string;
    name: string;
    children: D3TreeNode[];
    _children: D3TreeNode[];
    nodeType: 'product' |'sideProduct' | 'process';
}

// Define the ProductNode type
export interface ProductNode extends BaseNode {
    nodeType: 'product';
    productData: InfluenceProduct;
    amount: number;
    totalWeight: number; // Calculated total weight
    totalVolume: number; // Calculated total volume
    children: ProcessNode[];
    processes: InfluenceProcess[];
}

// Define the SideProductNode type
export interface SideProductNode extends BaseNode {
    nodeType: 'sideProduct';
    productData: InfluenceProduct;
    amount: number;
    totalWeight: number; // Calculated total weight
    totalVolume: number; // Calculated total volume
}

// Define the ProcessNode type
export interface ProcessNode extends BaseNode {
    nodeType: 'process';
    totalDuration: number; // Calculated total duration
    totalRuns: number; // Calculated total number of standard runs
    sideProducts: SideProductNode[]; // Add side products here
    children: ProductNode[]; // Children are always ProductNodes
}

// Union type for D3TreeNode
export type D3TreeNode = ProductNode | ProcessNode | SideProductNode;