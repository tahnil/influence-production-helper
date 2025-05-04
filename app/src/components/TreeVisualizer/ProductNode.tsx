// components/TreeVisualizer/ProductNode.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Node, NodeProps, Handle, Position } from '@xyflow/react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import { formatNumber } from '@/utils/formatNumber';
import ProcessSelector from './ProcessSelector';
import Image from 'next/image';
import { useFlow } from '@/contexts/FlowContext';
import { Save } from 'lucide-react';
import { getDirectChildNodes } from '@/utils/TreeVisualizer/nodeHelpers';
import { InfluenceNode } from '@/types/reactFlowTypes';
import { useToast } from "@/hooks/use-toast";
import useMatchingConfigurations from '@/hooks/useMatchingConfigurations';
import { BaseNodeData } from '@/types/reactFlowTypes';

export interface ProductNodeData extends BaseNodeData {
  amount: number;
  totalWeight: number;
  totalVolume: number;
  image: string;
  productDetails: InfluenceProduct;
  processesByProductId: InfluenceProcess[];
  selectedProcessId?: string | null;
  handleSelectProcess?: (processId: string, nodeId: string) => void;
  handleSerialize?: (focalProductId: string) => void;
  isRoot?: boolean;
}

export type ProductNode = Node<ProductNodeData>;

const ProductNode: React.FC<NodeProps<ProductNode>> = ({ id, data }) => {
  const {
    nodes,
    dispatch,
    matchingConfigs,
    saveStatus,
    saveError,
    pendingSaveNodeId,
    lastSavedNodeId,
  } = useFlow();
  const { toast } = useToast();
  const {
    productDetails,
    processesByProductId,
    amount,
    totalWeight,
    totalVolume,
    image,
    selectedProcessId,
  } = data;

  const { name, massKilogramsPerUnit: weight, volumeLitersPerUnit: volume, type, category } = productDetails;
  const [selectedId] = useState<string | null>(selectedProcessId ?? null);

  // Setup configurations for this product
  useMatchingConfigurations(productDetails.id);

  // Memoize formatted values to prevent recalculations
  const formattedValues = useMemo(() => ({
    amount: formatNumber(amount, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
      scaleForUnit: true,
      scaleType: 'units',
    }),
    weight: formatNumber(totalWeight, {
      scaleForUnit: true,
      scaleType: 'weight',
    }),
    volume: formatNumber(totalVolume, {
      scaleForUnit: true,
      scaleType: 'volume',
    })
  }), [amount, totalWeight, totalVolume]);

  // Memoize process selection handler
  const handleProcessSelection = useCallback((processId: string) => {
    // console.log('[ProductNode] Process selected:', processId);
    dispatch({
      type: 'REQUEST_PROCESS_NODE_CREATION',
      payload: {
        processId, // The id of the selected process
        logicalParentId: id, // Set to id of this product node
        includeSideProducts: true, // Find out if this is needed
      }
    });
  }, [dispatch, id]);

  // Memoize config selection handler - updated to use the new approach
  const handleConfigSelection = useCallback((configId: string) => {
    dispatch({
      type: 'LOAD_SAVED_CONFIG',
      payload: {
        nodeId: id,
        configId,
        mode: 'partial' // This is a partial replacement
      }
    });
  }, [dispatch, id]);

  // Memoize save handler - updated to use the new approach
  const handleSaveProductionChain = useCallback(() => {
    if (saveStatus !== 'pending') {
      dispatch({
        type: 'SAVE_PRODUCTION_CHAIN',
        payload: { focalNodeId: id }
      });
    }
  }, [dispatch, id, saveStatus]);

  // Add a useEffect to handle toast based on saveStatus
  useEffect(() => {
    if (saveStatus === 'complete') {
      toast({
        title: "Configuration Saved",
        description: `Production chain for ${name} has been successfully saved.`,
        duration: 3000,
      });

      // Reset after a delay to ensure the UI updates are seen
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET_SAVE_STATUS' });
      }, 1500);

      return () => clearTimeout(timer);
    } else if (saveStatus === 'error') {
      toast({
        title: "Error",
        description: saveError || "Failed to save the configuration. Please try again.",
        variant: "destructive",
        duration: 3000,
      });

      // Reset after a delay
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET_SAVE_STATUS' });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [saveStatus, saveError, name, toast, dispatch]);

  const hasInflows = useMemo(() =>
    getDirectChildNodes(nodes as InfluenceNode[], id).length > 0,
    [nodes, id]
  );

  return (
    <div className="product-node bg-mako-900 border overflow-hidden rounded-lg shadow-lg w-72">
      {/* <Handle
        type="target"
        position={Position.Top}
        className="bg-blue-500"
        id={`target-${id}`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-green-500"
        id={`source-${id}`}
      /> */}
      <div id="productNodeCard" className="flex flex-col items-center">
        {id}
        <div id="titleSection" className="p-2 bg-mako-900 w-full flex justify-between items-center gap-2.5 grid grid-cols-[auto,1fr,auto]">
          <div className="p-2">
            <Image src={image} width={80} height={80} alt={name} className='object-contain w-16 h-16' />
          </div>
          <div id="productName">
            <h2 className="text-xl font-bold text-white">{name}</h2>
          </div>
          {hasInflows && (
            <div className="flex items-center justify-center">
              {saveStatus === 'pending' && pendingSaveNodeId === id && (
                <span className="text-yellow-500 text-xs">Saving...</span>
              )}
              {saveStatus === 'complete' && lastSavedNodeId === id && (
                <span className="text-green-500 text-xs">Saved!</span>
              )}
              {saveStatus === 'error' && lastSavedNodeId === id && (
                <span className="text-red-500 text-xs">Error!</span>
              )}
              <Save
                size={20}
                onClick={handleSaveProductionChain}
                className={`ml-1 ${saveStatus === 'pending' && pendingSaveNodeId === id ? 'text-gray-400 cursor-not-allowed' : 'text-falconWhite hover:text-fuscousGray-400 cursor-pointer'} transition-colors`}
              />
            </div>
          )}
        </div>
        <div id="productStatsSection" className="bg-mako-900 w-full py-1 px-2.5 flex flex-wrap items-start content-start gap-1 text-white">
          <div className="p-[2px] rounded bg-mako-950">{category}</div>
          <div className="p-[2px] rounded bg-mako-950">{weight} kg</div>
          <div className="p-[2px] rounded bg-mako-950">{volume} L</div>
        </div>
        <div id="outputSection" className="p-2 w-full bg-mako-950 flex justify-center items-center gap-2.5 grid grid-cols-3">
          <div id="units" className="flex flex-col items-center">
            <div>{formattedValues.amount.formattedValue} {formattedValues.amount.scale}</div>
            <div>{formattedValues.amount.unit}</div>
          </div>
          <div id="weight" className="flex flex-col items-center">
            <div>{formattedValues.weight.formattedValue} {formattedValues.weight.scale}</div>
            <div>{formattedValues.weight.unit}</div>
          </div>
          <div id="volume" className="flex flex-col items-center">
            <div>{formattedValues.volume.formattedValue} {formattedValues.volume.scale}</div>
            <div>{formattedValues.volume.unit}</div>
          </div>
        </div>
        <div id="moreInfosSection" className="bg-lunarGreen-500 w-full py-1 px-2.5 flex flex-col items-start gap-1">
          <label htmlFor={`process-select-${id}`} className="text-xs font-medium text-falconWhite uppercase">
            Select Process or Configuration:
          </label>
          <ProcessSelector
            processes={processesByProductId}
            savedConfigurations={matchingConfigs.filter(config =>
              config.focalProductId === productDetails.id
            )}
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
      </div>
    </div>
  );
};

ProductNode.displayName = 'ProductNode';

export default ProductNode;