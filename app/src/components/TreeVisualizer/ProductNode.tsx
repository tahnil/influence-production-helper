// components/TreeVisualizer/ProductNode.tsx

import React, { useEffect, useState } from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import { formatNumber } from '@/utils/formatNumber';
import ProcessSelector from './ProcessSelector';
import Image from 'next/image';
import { handleReplaceNode } from '@/utils/TreeVisualizer/handleReplaceNode'; // Import the replace function
import { hasStoredProductionChain } from '@/utils/TreeVisualizer/hasStoredProductionChain'; // Import the new function
import PouchDB from 'pouchdb';
import { useFlow } from '@/contexts/FlowContext'; // Import the context

export type ProductNode = Node<
  {
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
  }
>;

const ProductNode: React.FC<NodeProps<ProductNode>> = ({ id, data }) => {
  const { nodes, edges, setNodes, setEdges } = useFlow(); // Use context to get nodes and edges
  const {
    productDetails,
    processesByProductId,
    amount,
    totalWeight,
    totalVolume,
    image,
    selectedProcessId,
    handleSelectProcess,
    handleSerialize,
    ancestorIds,
    descendantIds,
  } = data;

  const { name, massKilogramsPerUnit: weight, volumeLitersPerUnit: volume, type, category } = productDetails;
  // console.log('ProductNode data:', data);
  const db = new PouchDB('mydb'); // Initialize PouchDB (ensure this matches your existing setup)
  const [hasChain, setHasChain] = useState(false);

  useEffect(() => {
    console.log('ProductNode StoreChecker mounted');
    const checkForChain = async () => {
      const exists = await hasStoredProductionChain(productDetails.id, db);
      setHasChain(exists);
    };

    checkForChain();
  }, []);

  const formattedAmount = formatNumber(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
    scaleForUnit: true,
    scaleType: 'units',
  });

  const formattedWeight = formatNumber(totalWeight, {
    scaleForUnit: true,
    scaleType: 'weight',
  });

  const formattedVolume = formatNumber(totalVolume, {
    scaleForUnit: true,
    scaleType: 'volume',
  });

  const handleProcessSelection = (processId: string) => {
    handleSelectProcess(processId, id);
  };

  const handleSaveProductionChain = () => {
    // Implement the logic to save the production chain here
    // Save this ProductNode including all its ancestors in the Production Chain
    // Add new chain to the ChainStore
    handleSerialize(id);
  };

  const handleInsertProductionChain = () => {
    // Implement the logic to insert the production chain here
    // Replace this ProductNode with a saved ProductNode of the same product id, including all its ancestors in the Production Chain
    // Apply selected chain from ChainStore
    handleReplaceNode(
      id, 
      productDetails.id, 
      db, 
      nodes, 
      edges, 
      setNodes, 
      setEdges, 
      handleSelectProcess, 
      handleSerialize
    );
  };

  const handleSaveDerivedProducts = () => {
    // Implement the logic to save derived products here
    // Save this ProductNode including all its descendants in the Production Chain
    // Add new chain to the ChainStore
  };

  const handleInsertDerivedProducts = () => {
    // Implement the logic to insert derived products here
    // Replace this ProductNode with a saved ProductNode of the same product id, including all its descendants in the Production Chain
    // Apply selected chain from ChainStore
  };

  // I guess we also need a sub-component that retrieves all available chains 
  // for the current product id, and allows the user to select one.

  return (
    <div className="product-node bg-mako-900 border overflow-hidden rounded-lg shadow-lg w-72">
      <Handle type="target" position={Position.Top} className="bg-blue-500" />
      <div id="productNodeCard" className="flex flex-col items-center">
        <div id="titleSection" className="p-2 bg-mako-900 w-full flex justify-center items-center gap-2.5 grid grid-cols-3">
          <div className="p-2">
            <Image src={image} width={80} height={80} alt={name} className='object-contain w-16 h-16' />
          </div>
          <div id="productName" className="col-span-2">
            <h2 className="text-xl font-bold text-white">{name}</h2>
          </div>
        </div>
        <div id="productStatsSection" className="bg-mako-900 w-full py-1 px-2.5 flex flex-wrap items-start content-start gap-1 text-white">
          <div className="p-[2px] rounded bg-mako-950">{category}</div>
          <div className="p-[2px] rounded bg-mako-950">{weight} kg</div>
          <div className="p-[2px] rounded bg-mako-950">{volume} L</div>
        </div>
        <div id="outputSection" className="p-2 w-full bg-mako-950 flex justify-center items-center gap-2.5 grid grid-cols-3">
          <div id="units" className="flex flex-col items-center">
            <div>{formattedAmount.formattedValue}</div>
            <div>{formattedAmount.unit}</div>
          </div>
          <div id="weight" className="flex flex-col items-center">
            <div>{formattedWeight.formattedValue}</div>
            <div>{formattedWeight.unit}</div>
          </div>
          <div id="volume" className="flex flex-col items-center">
            <div>{formattedVolume.formattedValue}</div>
            <div>{formattedVolume.unit}</div>
          </div>
        </div>
        <div id="moreInfosSection" className="bg-lunarGreen-500 w-full py-1 px-2.5 flex flex-wrap items-start content-start gap-1">
          <label htmlFor={`process-select-${id}`} className="text-xs font-medium text-falconWhite uppercase">
            Select Process for {name}:
          </label>
          <ProcessSelector
            processes={processesByProductId}
            selectedProcessId={selectedProcessId}
            onProcessSelect={handleProcessSelection}
            className="w-full border-lunarGreen-700 bg-lunarGreen-500"
            style={{
              '--popover': 'hsl(210, 40%, 10%)', // Custom popover background color
              '--popover-foreground': 'hsl(210, 40%, 90%)', // Custom popover text color
            } as React.CSSProperties}
          />
        </div>
        <button
          className="bg-blue-500 text-white py-1 px-4 rounded mt-2"
          onClick={handleSaveProductionChain} // Pass the node's id to the serialize function
        >
          Serialize Node
        </button>
        {hasChain && (
          <button
            className="bg-green-500 text-white py-1 px-4 rounded mt-2"
            onClick={handleInsertProductionChain} // Insert the stored production chain if it exists
          >
            Insert Production Chain
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="bg-green-500" />
    </div>
  );
};

export default ProductNode;
