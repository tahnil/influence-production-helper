// src/utils/TreeVisualizer/processNodeBuilder.ts

import { Node } from '@xyflow/react';
import { generateUniqueId } from '../generateUniqueId';
import { InfluenceProcess, ProcessInput } from '@/types/influenceTypes';
import { buildProductNode } from './productNodeBuilder';

/**
 * Builds a process node with all necessary data
 * 
 * @param selectedProcessId The ID of the process to build
 * @param parentId The ID of the parent product node
 * @param parentNodeAmount The amount of the parent product
 * @param parentNodeProductId The product ID of the parent node
 * @param handleSelectProcess Callback function for selecting a process
 * @param handleSerialize Callback function for serializing the production chain
 * @returns A Promise resolving to the process node and its child product nodes, or null if there was an error
 */
export const buildProcessNode = async (
  selectedProcessId: string,
  parentId: string,
  parentNodeAmount: number,
  parentNodeProductId: string,
  handleSelectProcess: (processId: string, nodeId: string) => void,
  handleSerialize: (focalProductId: string) => void,
): Promise<{ processNode: Node, productNodes: Node[] } | null> => {
  try {
    // Fetch process details and input products
    const [processDetails, inputProducts] = await Promise.all([
      getProcessDetails(selectedProcessId),
      getInputsByProcessId(selectedProcessId)
    ]);

    // Fetch building icon
    const buildingIcon = await fetchBuildingIconBase64(processDetails.buildingId);

    // Generate a unique ID for the process node
    const processNodeId = generateUniqueId();

    // Initialize arrays for inflow and outflow IDs
    const inflowIds: string[] = [];
    const outflowIds: string[] = [];

    // Find the output corresponding to the parent product
    const output = processDetails.outputs.find(output => output.productId === parentNodeProductId);

    if (!output) {
      console.error('No matching output found for parent product:', parentNodeProductId);
      return null;
    }

    // Calculate the total runs needed
    const outputUnitsPerSR = parseFloat(output.unitsPerSR);
    const totalRuns = parentNodeAmount / outputUnitsPerSR || 1;

    // Calculate total duration
    const totalDuration = totalRuns * parseFloat(processDetails.bAdalianHoursPerAction || '0');

    // Build child product nodes (inputs to the process)
    const productNodesPromises = inputProducts.map(async (inputProduct) => {
      // Calculate amount based on process runs
      const amount = parseFloat(inputProduct.unitsPerSR) * totalRuns;

      // Build the product node
      const productNode = await buildProductNode(
        inputProduct.product.id,
        amount,
      );

      if (productNode) {
        // Add the process node's ID as parent
        const newProductNode = {
          ...productNode,
          parentId: processNodeId,
          data: {
            ...productNode.data,
            handleSelectProcess,
            handleSerialize,
            inflowIds: [], // Input products have no inflows initially
            outflowIds: [processNodeId], // The process node is an outflow
          }
        };

        return newProductNode;
      }

      return null;
    });

    // Wait for all product nodes to be built
    const productNodes = (await Promise.all(productNodesPromises)).filter(Boolean) as Node[];

    // Create the process node
    const processNode: Node = {
      id: processNodeId,
      type: 'processNode',
      position: { x: 0, y: 0 },
      parentId: parentId,
      data: {
        processDetails,
        inputProducts,
        image: buildingIcon,
        totalRuns,
        totalDuration,
        inflowIds: productNodes.map(node => node.id), // Input products are inflows of the process
        outflowIds: [parentId], // The parent product node is the outflow
      },
    };

    return { processNode, productNodes };
  } catch (err) {
    console.error('[buildProcessNode] Error:', err);
    return null;
  }
};

/**
 * Fetch process details directly
 * This replicates the API call made in useProcessDetails
 */
export const getProcessDetails = async (id: string): Promise<InfluenceProcess> => {
  const response = await fetch(`/api/processes?id=${id}`);
  if (response.status !== 200) {
    throw new Error('Failed to fetch process details');
  }
  const data = await response.json();
  return data[0]; // API returns an array with the first element being the process
};

/**
 * Fetch process inputs directly
 * This replicates the API call made in useInputsByProcessId
 */
export const getInputsByProcessId = async (processId: string): Promise<ProcessInput[]> => {
  const response = await fetch(`/api/processes?processId=${processId}`);
  if (response.status !== 200) {
    throw new Error('[getInputsByProcessId] Failed to fetch inputs');
  }
  return response.json();
};

/**
 * Fetch building icon directly
 * This replicates the API call made by fetchBuildingIconBase64 in the useBuildingIcon hook
 */
export const fetchBuildingIconBase64 = async (buildingId: string): Promise<string> => {
  try {
    const response = await fetch(`/api/buildingIcon?buildingId=${buildingId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch building icon');
    }
    const { base64Image } = await response.json();
    return base64Image;
  } catch (error) {
    console.error('Error fetching building icon:', error);
    // Return empty string instead of throwing to avoid breaking the UI
    return '';
  }
};