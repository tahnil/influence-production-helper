// components/TreeVisualizer/SideProductNode.tsx

import React from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { formatNumber } from '@/utils/formatNumber';
import Image from 'next/image';
import { InfluenceProduct } from '@/types/influenceTypes';

export type SideProductNode = Node<{
    amount: number;
    totalWeight: number;
    totalVolume: number;
    image: string;
    productDetails: InfluenceProduct;
    selectedProcessId: string | null;
    handleSelectProcess: (processId: string, nodeId: string) => void;
    handleSerialize: (focalProductId: string) => Promise<void>;
    ancestorIds?: string[];
    descendantIds?: string[];
}>;

const SideProductNode: React.FC<NodeProps<SideProductNode>> = ({ data }) => {
  const { productDetails, amount, totalWeight, totalVolume, image } = data;
  const { name, massKilogramsPerUnit: weight, volumeLitersPerUnit: volume } = productDetails;

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

  return (
    <div className="side-product-node bg-lunarGreen-800 border overflow-hidden rounded-lg shadow-lg w-64">
      <Handle type="target" position={Position.Top} className="bg-yellow-500" />
      <div className="flex flex-col items-center">
        <div className="p-2 bg-lunarGreen-700 w-full flex items-center gap-2.5">
          <Image src={image} width={40} height={40} alt={name} className='object-contain' />
          <h2 className="text-lg font-bold text-white">{name}</h2>
        </div>
        <div className="p-2 w-full grid grid-cols-3 gap-2 text-white text-sm">
          <div className="flex flex-col items-center">
            <div>{formattedAmount.formattedValue}</div>
            <div>{formattedAmount.unit}</div>
          </div>
          <div className="flex flex-col items-center">
            <div>{formattedWeight.formattedValue}</div>
            <div>{formattedWeight.unit}</div>
          </div>
          <div className="flex flex-col items-center">
            <div>{formattedVolume.formattedValue}</div>
            <div>{formattedVolume.unit}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideProductNode;