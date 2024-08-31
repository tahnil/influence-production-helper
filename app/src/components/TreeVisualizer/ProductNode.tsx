// components/TreeVisualizer/ProductNode.tsx

import React from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import { formatNumber } from '@/utils/formatNumber';
import Image from 'next/image';
import ProcessSelector from './ProcessSelector'; // Import the new component

export type ProductNode = Node<
  {
    productDetails: InfluenceProduct;
    processesByProductId: InfluenceProcess[];
    amount: number;
    totalWeight: number;
    totalVolume: number;
    image: string;
    selectedProcessId: string | null;
    onSelectProcess: (processId: string, nodeId: string) => void;
  }
>;

const ProductNode: React.FC<NodeProps<ProductNode>> = ({ id, data }) => {
  const {
    productDetails,
    processesByProductId,
    amount,
    totalWeight,
    totalVolume,
    image,
    selectedProcessId,
    onSelectProcess
  } = data;

  const { name, massKilogramsPerUnit: weight, volumeLitersPerUnit: volume, type, category } = productDetails;
  // console.log('ProductNode data:', data);

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

  const handleProcessSelect = (processId: string) => {
    onSelectProcess(processId, id);
  };

  return (
    <div className="product-node bg-mako-900 border overflow-hidden rounded-lg shadow-lg w-72">
      <Handle type="target" position={Position.Top} className="bg-blue-500" />
      <div id="productNodeCard" className="flex flex-col items-center">
        <div id="titleSection" className="p-2 bg-mako-900 w-full flex justify-center items-center gap-2.5 grid grid-cols-3">
          <div className="p-2">
            <Image src={image} width={80} height={80} alt={name} className='object-contain w-16 h-16'/>
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
        <div id="moreInfosSection" className="bg-lunarGreen-500 py-1 px-2.5 flex flex-wrap items-start content-start gap-1">
          <label htmlFor={`process-select-${id}`} className="text-sm font-medium text-white">
            Select Process for {name}:
          </label>
          <ProcessSelector
            processes={processesByProductId}
            selectedProcessId={selectedProcessId}
            onProcessSelect={handleProcessSelect}
            className="w-full mt-2"
          />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="bg-green-500" />
    </div>
  );
};

export default ProductNode;
