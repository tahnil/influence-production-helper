// components/TreeVisualizer/ProcessNode.tsx

import React, { useState } from 'react';
import { Node, Handle, Position, NodeProps } from '@xyflow/react';
import { InfluenceProcess, ProcessInput } from '@/types/influenceTypes';
import { formatDuration } from '@/utils/formatDuration';
import { formatNumber } from '@/utils/formatNumber';
import Image from 'next/image';
import { X } from 'lucide-react'; // Import X icon from lucide-react
import { useFlow } from '@/contexts/FlowContext';
import useProcessRemoval from '@/utils/TreeVisualizer/useProcessRemoval';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ProcessNode = Node<
  {
    totalDuration: number;
    totalRuns: number;
    image: string;
    processDetails: InfluenceProcess;
    inputProducts: ProcessInput[];
    inflowIds?: string[];
    outflowIds?: string[];
  }
>;

const ProcessNode: React.FC<NodeProps<ProcessNode>> = ({ id, data }) => {
  const { processDetails, inputProducts, totalDuration, totalRuns, image } = data;
  const { name, buildingId, bAdalianHoursPerAction, mAdalianHoursPerSR } = processDetails;
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { isRemoving, handleRemoveProcess } = useProcessRemoval();

  const formattedDuration = formatDuration(totalRuns, mAdalianHoursPerSR);
  const formattedRuns = formatNumber(totalRuns, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
    scaleForUnit: true,
    scaleType: 'runs',
  });

  const isResourceExtraction = inputProducts.length === 0;
  
  const handleRemove = () => {
    // Use the dedicated process removal handler from our custom hook
    handleRemoveProcess(id);
    setConfirmDialogOpen(false);
  };
  
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if this process node has many children
    const hasChildren = inputProducts.length > 0;
    
    if (hasChildren) {
      // Show confirmation for processes with inputs
      setConfirmDialogOpen(true);
    } else {
      // Directly remove simple processes
      handleRemove();
    }
  };
  
  return (
    <div className="process-node bg-mako-950 border overflow-hidden rounded-lg shadow-lg w-64 relative">
      {/* Add remove button */}
      <button 
        className="absolute top-2 right-2 z-10 rounded-full bg-red-500 hover:bg-red-600 p-1 opacity-75 hover:opacity-100 transition-opacity"
        onClick={handleRemoveClick}
        title="Remove process"
      >
        <X className="h-4 w-4 text-white" />
      </button>
      
      <Handle type="target" position={Position.Top} className="bg-blue-500" />
      <div id="processNodeCard" className="flex flex-col items-center">
        <div id="titleSection" className="p-2 bg-falcon-800 w-full flex justify-center items-center gap-2.5 grid grid-cols-3">
          <div id="buildingIcon" className="p-2">
            <Image src={image} width={24} height={24} alt={name} className='object-contain w-16 h-16'/>
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
      <Handle type="source" position={Position.Bottom} className="bg-green-500" id={`source-${id}`} />
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Process</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the process and all its inputs from the production chain. 
              Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProcessNode;