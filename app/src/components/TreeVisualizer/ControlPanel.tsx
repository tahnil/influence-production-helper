// components/TreeVisualizer/ControlPanel.tsx

import React from 'react';
import ProductSelector from '@/components/TreeVisualizer/ProductSelector';
import AmountInput from '@/components/TreeVisualizer/AmountInput';
import IngredientsList from '@/components/TreeVisualizer/IngredientsList';
import PouchDBViewer from '@/components/TreeVisualizer/PouchDbViewer';
import { useFlow } from '@/contexts/FlowContext';

interface ControlPanelProps {
  rawMaterialIngredients: any[];
  allProductIngredients: any[];
  handleSelectProcess: (processId: string, nodeId: string) => void;
  handleSerialize: (focalNodeId: string) => Promise<void>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  rawMaterialIngredients,
  allProductIngredients,
  handleSelectProcess,
  handleSerialize
}) => {
  const { selectedProductId, desiredAmount, dispatch } = useFlow();

  const handleProductSelect = (productId: string) => {
    console.log(`Product selected: ${productId}`);
    
    // First update the selected product ID in state
    dispatch({
      type: 'SELECT_PRODUCT',
      payload: productId
    });
    
    // Then clear existing nodes and create a new root node
    dispatch({
      type: 'BATCH_UPDATE',
      payload: {
        nodes: [],
        edges: []
      }
    });
    
    dispatch({
      type: 'REQUEST_PRODUCT_NODE_CREATION',
      payload: {
        productId: productId,
        amount: desiredAmount,
        isRoot: true
      }
    });
  };

  return (
    <div className="absolute bottom-4 left-4 bg-background p-4 shadow-lg rounded-lg z-10 max-h-[90vh] overflow-y-auto w-[35ch]">
      <h2 className="text-xl font-semibold mb-4">Controls</h2>
      <ProductSelector
        selectedProductId={selectedProductId}
        onProductSelect={handleProductSelect}
        className="p-2 border rounded border-gray-300 mb-4 w-full"
      />
      <AmountInput label="Desired Amount" />
      <IngredientsList
        rawMaterialIngredients={rawMaterialIngredients}
        allProductIngredients={allProductIngredients}
      />
      <PouchDBViewer
        handleSelectProcess={handleSelectProcess}
        handleSerialize={handleSerialize}
      />
    </div>
  );
};

export default ControlPanel;