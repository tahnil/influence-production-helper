// contexts/NodeContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';

// Define the structure of the context's value for better TypeScript support
interface NodeContextType {
  handleProcessSelection: (processId: string, parentId: string, source: any) => Promise<void>;
  processes: InfluenceProcess[];
  processesLoading: boolean;
  processesError: string | null;
  selectedProduct: InfluenceProduct | null;
  setSelectedProduct: (product: InfluenceProduct | null) => void;
}

const HandleProcessSelectionContext = createContext<NodeContextType>({
  handleProcessSelection: async () => { },
  processes: [],
  processesLoading: false,
  processesError: null,
  selectedProduct: null,
  setSelectedProduct: () => { }
});

export const NodeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(null);
  const { processes, loading: processesLoading, error: processesError } = useProcessesByProductId(selectedProduct ? selectedProduct.id : '');

  const handleProcessSelection = useCallback(async (processId: string, parentId: string, source: any) => {
    // PLACEHOLDER Your handleProcessSelection logic here
    // Simulate updating the tree data or processes based on the selection
    console.log(`Process ${processId} selected for product ${parentId}`);
    // Insert logic here that updates the tree data based on process selection.
    // For example, you might fetch new data, update local state, or trigger side effects here.
    // This could also involve calling setTreeData if you are managing tree state at this level.
  }, [processes]);

  return (
    <HandleProcessSelectionContext.Provider value={{
      handleProcessSelection,
      processes,
      processesLoading,
      processesError,
      selectedProduct,
      setSelectedProduct
    }}>
      {children}
    </HandleProcessSelectionContext.Provider>
  );
};

export const useNodeContext = () => useContext(HandleProcessSelectionContext);
export { HandleProcessSelectionContext }