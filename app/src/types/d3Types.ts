import { InfluenceProduct, InfluenceProcess } from './influenceTypes';

// Define the ProductNode type
export interface ProductNode {
    name: string;
    type: 'product';
    influenceProduct: InfluenceProduct; // Reference to InfluenceProduct
    amount: number;
    totalWeight: number; // Calculated total weight
    totalVolume: number; // Calculated total volume
    children?: ProcessNode[];
}

// Define the SideProductNode type
export interface SideProductNode {
    name: string;
    type: 'sideProduct';
    influenceProduct: InfluenceProduct;
    amount: number;
    totalWeight: number; // Calculated total weight
    totalVolume: number; // Calculated total volume
}

// Define the ProcessNode type
export interface ProcessNode {
    name: string;
    type: 'process';
    influenceProcess: InfluenceProcess; // Reference to InfluenceProcess
    totalDuration: number; // Calculated total duration
    totalRuns: number; // Calculated total number of standard runs
    sideProducts?: SideProductNode[]; // Add side products here
    children?: ProductNode[]; // Children are always ProductNodes
}

// Union type for D3TreeNode
export type D3TreeNode = ProductNode | ProcessNode | SideProductNode;
