// components/TreeVisualizer/SideProductNode.tsx

import React from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { formatNumber } from '@/utils/formatNumber';
import Image from 'next/image';
import { InfluenceProduct } from '@/types/influenceTypes';
import { ArrowUpRight } from 'lucide-react';

export type SideProductNode = Node<{
  amount: number;
  totalWeight: number;
  totalVolume: number;
  image: string;
  productDetails: InfluenceProduct;
  handleSelectProcess: (processId: string, nodeId: string) => void;
  handleSerialize: (focalProductId: string) => Promise<void>;
  ancestorIds?: string[];
}>;

const SideProductNode: React.FC<NodeProps<SideProductNode>> = ({ id, data }) => {
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
    <div className="side-product-node bg-lunarGreen-700 border overflow-hidden rounded-lg shadow-lg w-56">
      <Handle
        type="source"
        position={Position.Left}
        className="side-product-handle bg-yellow-500"
        id={`source-${id}`}
      />
      <div className="flex flex-col items-center">
        <div className="p-2 bg-lunarGreen-600 w-full flex items-center gap-2">
          {/* Side Product Indicator */}
          <div className="rounded-full bg-yellow-400 p-1 flex items-center justify-center">
            <ArrowUpRight size={14} className="text-lunarGreen-950" />
          </div>

          <Image src={image} width={28} height={28} alt={name} className='object-contain' />
          <h2 className="text-md font-bold text-white">{name}</h2>
        </div>
        <div className="p-2 w-full grid grid-cols-3 gap-2 text-white text-xs">
          <div className="flex flex-col items-center">
            <div>{formattedAmount.formattedValue} {formattedAmount.scale}</div>
            <div>{formattedAmount.unit}</div>
          </div>
          <div className="flex flex-col items-center">
            <div>{formattedWeight.formattedValue} {formattedAmount.scale}</div>
            <div>{formattedWeight.unit}</div>
          </div>
          <div className="flex flex-col items-center">
            <div>{formattedVolume.formattedValue} {formattedAmount.scale}</div>
            <div>{formattedVolume.unit}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideProductNode;