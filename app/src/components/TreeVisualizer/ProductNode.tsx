// components/TreeVisualizer/ProductNode.tsx

import React, { useEffect, useState } from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import { formatNumber } from '@/utils/formatNumber';
import ProcessSelector from './ProcessSelector';
import Image from 'next/image';
import { handleReplaceNode } from '@/utils/TreeVisualizer/handleReplaceNode';
import { hasStoredProductionChain } from '@/utils/TreeVisualizer/hasStoredProductionChain';
import useMatchingConfigurations from '@/hooks/useMatchingConfigurations'; // New hook
import { useFlow } from '@/contexts/FlowContext';
import { usePouchDB } from '@/contexts/PouchDBContext';
import { InfluenceNode } from '@/types/reactFlowTypes';

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
    handleSerialize: (focalProductId: string) => Promise<void>;
    ancestorIds?: string[];
    descendantIds?: string[];
  }
>;

const ProductNode: React.FC<NodeProps<ProductNode>> = ({ id, data }) => {
  const { nodes, edges, setNodes, setEdges, nodesRef } = useFlow();
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
  const { db } = usePouchDB();
  const [hasChain, setHasChain] = useState(false);
  const matchingConfigs = useMatchingConfigurations(productDetails.id);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  console.log(`ProductNode ${id}: ${matchingConfigs.length} matching configurations found`);

  // useEffect(() => {
  //   console.log('ProductNode received nodes:', nodes.length);
  // }, [nodes]);

  useEffect(() => {
    // console.log('ProductNode StoreChecker mounted');
    const checkForChain = async () => {
      const exists = await hasStoredProductionChain(productDetails.id, db);
      setHasChain(exists);
    };

    checkForChain();
  }, [productDetails.id, db]);

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

  const handleSaveProductionChain = async () => {
    // Implement the logic to save the production chain here
    // Save this ProductNode including all its ancestors in the Production Chain
    // Add new chain to the Pouch DB

    if (db) {
      await handleSerialize(id);
    } else {
      console.error('PouchDB is not initialized');
    }
  };

  const handleInsertProductionChain = () => {
    // Implement the logic to insert the production chain here
    // Replace this ProductNode with a saved ProductNode of the same product id, including all its ancestors in the Production Chain
    // Apply selected chain from Pouch DB
    if (selectedConfigId && db) {
      console.log(`Inserting production chain. Node ID: ${id}, Config ID: ${selectedConfigId}`);
      console.log('Current nodes in ProductNode:', nodesRef.current.length);
      handleReplaceNode(
        id,
        selectedConfigId,
        db,
        nodes,
        edges,
        setNodes,
        setEdges,
        nodesRef,
        handleSelectProcess,
        handleSerialize
      );
    } else {
      console.error('No configuration selected or PouchDB not initialized');
    }
  };

  const handleConfigSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedConfigId(event.target.value);
  };

  const handleSaveDerivedProducts = () => {
    // Implement the logic to save derived products here
    // Save this ProductNode including all its descendants in the Production Chain
    // Add new chain to the Pouch DB
  };

  const handleInsertDerivedProducts = () => {
    // Implement the logic to insert derived products here
    // Replace this ProductNode with a saved ProductNode of the same product id, including all its descendants in the Production Chain
    // Apply selected chain from Pouch DB
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
              '--popover': 'hsl(210, 40%, 10%)',
              '--popover-foreground': 'hsl(210, 40%, 90%)',
            } as React.CSSProperties}
          />
        </div>
        <button
          className="bg-blue-500 text-white py-1 px-4 rounded mt-2"
          onClick={handleSaveProductionChain}
        >
          Serialize Node
        </button>
        {matchingConfigs.length > 0 && (
          <div className="w-full py-1 px-2.5">
            <label htmlFor={`config-select-${id}`} className="text-xs font-medium text-falconWhite uppercase">
              Select Saved Configuration:
            </label>
            <select
              id={`config-select-${id}`}
              value={selectedConfigId || ''}
              onChange={handleConfigSelection}
              className="w-full mt-1 bg-lunarGreen-500 border border-lunarGreen-700 rounded"
            >
              <option value="">Select a configuration</option>
              {matchingConfigs.map((config) => (
                <option key={config._id} value={config._id}>
                  {new Date(config.createdAt).toLocaleString()} ({config.nodeCount} nodes)
                </option>
              ))}
            </select>
            <button
              className="bg-green-500 text-white py-1 px-4 rounded mt-2 w-full"
              onClick={handleInsertProductionChain}
              disabled={!selectedConfigId}
            >
              Insert Production Chain
            </button>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="bg-green-500" />
    </div>
  );
};

export default ProductNode;