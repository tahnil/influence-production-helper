// components/TreeVisualizer/ProcessNode.tsx

import React from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { InfluenceProcess, ProcessInput } from '@/types/influenceTypes';
import { formatDuration } from '@/utils/formatDuration';
import { formatNumber } from '@/utils/formatNumber';
import Image from 'next/image';
import { BaseNodeData } from '@/types/reactFlowTypes';

export interface ProcessNodeData extends BaseNodeData {
  totalDuration: number;
  totalRuns: number;
  image: string;
  processDetails: InfluenceProcess;
  inputProducts: ProcessInput[];
}

export type ProcessNode = Node<ProcessNodeData>;

const ProcessNode: React.FC<NodeProps<ProcessNode>> = ({ id, data }) => {
  const { processDetails, inputProducts, totalDuration, totalRuns, image } = data;
  const { name, buildingId, bAdalianHoursPerAction, mAdalianHoursPerSR } = processDetails;

  const formattedDuration = formatDuration(totalRuns, mAdalianHoursPerSR);
  const formattedRuns = formatNumber(totalRuns, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
    scaleForUnit: true,
    scaleType: 'runs',
  });

  const isResourceExtraction = inputProducts.length === 0;

  return (
    <div className="process-node bg-mako-950 border overflow-hidden rounded-lg shadow-lg w-64">
      <Handle
        type="target"
        position={Position.Top}
        className="process-outflow-handle bg-blue-500"
        id={`target-${id}`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="process-inflow-handle bg-green-500"
        id={`source-${id}`}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="process-outflow-side-product-handle bg-purple-500"
        id={`target-side-product-${id}`}
      />
      <div id="processNodeCard" className="flex flex-col items-center">
        <div id="titleSection" className="p-2 bg-falcon-800 w-full flex justify-center items-center gap-2.5 grid grid-cols-3">
          <div id="buildingIcon" className="p-2">
            <Image src={image} width={24} height={24} alt={name} className='object-contain w-16 h-16' />
          </div>
          <div id="processName" className="col-span-2">
            <h2 className="text-xl font-bold text-white">{name}</h2>
          </div>
        </div>
        {!isResourceExtraction ? (
          <div id="statsSection" className="p-2 bg-mako-950 w-full flex justify-center items-center gap-2.5 grid grid-cols-2 text-white">
            <div id="totalDuration" className="flex flex-col items-center">
              <div>{formattedDuration}</div>
              <div>duration</div>
            </div>
            <div id="totalRuns" className="flex flex-col items-center">
              <div>{formattedRuns.formattedValue}</div>
              <div>{formattedRuns.unit}</div>
            </div>
          </div>
        ) : (
          <div id="noInputMsg" className="p-2 text-center w-full text-sm text-gray-500 bg-mako-950">
            No further inputs. This process extracts resources directly.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessNode;
