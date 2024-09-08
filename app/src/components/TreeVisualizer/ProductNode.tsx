// components/TreeVisualizer/ProductNode.tsx

import React, { useEffect, useState } from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import { formatNumber } from '@/utils/formatNumber';
import ProcessSelector from './ProcessSelector';
import Image from 'next/image';
import { handleReplaceNode } from '@/utils/TreeVisualizer/handleReplaceNode';
import { useFlow } from '@/contexts/FlowContext';
import { usePouchDB } from '@/contexts/PouchDBContext';
import useMatchingConfigurations from '@/hooks/useMatchingConfigurations';

export type ProductNode = Node<{
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
}>;

const ProductNode: React.FC<NodeProps<ProductNode>> = ({ id, data }) => {
  const { nodes, edges, setNodes, setEdges, nodesRef, desiredAmount } = useFlow();
  const { db } = usePouchDB();
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
  } = data;

  const { name, massKilogramsPerUnit: weight, volumeLitersPerUnit: volume, type, category } = productDetails;
  const matchingConfigs = useMatchingConfigurations(productDetails.id);
  const [selectedId, setSelectedId] = useState<string | null>(selectedProcessId);

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
    setSelectedId(processId);
    handleSelectProcess(processId, id);
  };

  const handleConfigSelection = (configId: string) => {
    setSelectedId(configId);
    if (db) {
      handleReplaceNode(
        id,
        configId,
        db,
        nodes,
        edges,
        setNodes,
        setEdges,
        nodesRef,
        handleSelectProcess,
        handleSerialize,
        desiredAmount
      );
    } else {
      console.error('PouchDB is not initialized');
    }
  };

  const handleSaveProductionChain = async () => {
    if (db) {
      await handleSerialize(id);
    } else {
      console.error('PouchDB is not initialized');
    }
  };

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
        <div id="moreInfosSection" className="bg-lunarGreen-500 w-full py-1 px-2.5 flex flex-col items-start gap-1">
          <label htmlFor={`process-select-${id}`} className="text-xs font-medium text-falconWhite uppercase">
            Select Process or Configuration:
          </label>
          <ProcessSelector
            processes={processesByProductId}
            savedConfigurations={matchingConfigs}
            selectedId={selectedId}
            onProcessSelect={handleProcessSelection}
            onConfigSelect={handleConfigSelection}
            className="w-full border-lunarGreen-700 bg-lunarGreen-600"
            inputClassName="text-falconWhite placeholder:text-falconWhite/80"
            groupHeadingClassName="text-falconWhite font-semibold"
            itemClassName="text-falconWhite hover:bg-lunarGreen-600"
            style={{
              '--popover': 'hsl(210, 40%, 10%)',
              '--popover-foreground': 'hsl(210, 40%, 90%)',
            } as React.CSSProperties}
          />
        </div>
        <button
          className="bg-blue-500 text-white py-1 px-4 rounded mt-2 w-full"
          onClick={handleSaveProductionChain}
        >
          Serialize Node
        </button>
      </div>
      <Handle type="source" position={Position.Bottom} className="bg-green-500" />
    </div>
  );
};

export default ProductNode;