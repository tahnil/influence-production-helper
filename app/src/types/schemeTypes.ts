// we need to rewrite this file for the purpose of saving, retrieving, and applying schemes
// I expect that we still need a ProductScheme and a TreeScheme of sorts

import { ProcessNodeData, ProductNodeData } from "./reactFlowTypes";

export interface ProductSchemeProduct {
    // this type is able to describe any product node in a React Flow graph
    // our app logic will be able to convert this to a React Flow node 
    // and populate the graph with ancestors via producedBy and descendants via utilizedBy
    id: string; // unique id, not influence product id
    nodeData: ProductNodeData; // the content of the React Flow custom node's data attribute
    producedBy?: ProductSchemeProcess; // Optional: Only present if this product is an output of a process
    utilizedBy?: ProductSchemeProcess; // Optional: Only present if this product is an input of a process
}

export interface ProductSchemeProcess {
    // this type is able to describe any process node in a React Flow graph
    // our app logic will be able to convert this to a React Flow node
    // and populate the graph with ancestors via inputs, the chain relevant output via 
    // primaryOutputId and the corresponding output product via outputs, as well as 
    // side products via outputs, where the product id does not match with primaryOutputId
    id: string; // unique id, not influence process id
    nodeData: ProcessNodeData;
    primaryOutputId?: string;  // The unique id of the main product this process produces
    inputs?: ProductSchemeProduct[];      // The products required as inputs for this process
    outputs?: ProductSchemeProduct[]; // The products produced
    isResourceExtraction?: boolean;       // Flag indicating if this is a resource extraction process
}

export interface ProductScheme {
    // this type is the starting point for a production or derived products chain 
    // with the focalProductId at its origin
    id: string; // unique id of this scheme
    focalProductId: string; // The Influence id of the product currently being explored (either in forward or backward direction)
    focalProduct: ProductSchemeProduct;
    description: string;
}

export interface TreeScheme {
    // this type can overlay both a backtracking production chain as well as 
    // a derived products chain, where the focal product is the product with 
    // the focalProductId (an Influence product id)
    id: string;
    focalProductId: string; // Influence product id
    productionChainScheme?: ProductScheme[];
    derivedProductsScheme?: ProductScheme[];
}