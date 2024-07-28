// contexts/NodeContext.tsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import { globalState } from '@/globalState';

// Define the structure of the context's value for better TypeScript support
interface NodeContextType {
  selectedProduct: InfluenceProduct | null;
  setSelectedProduct: (product: InfluenceProduct | null) => void;
  processes: InfluenceProcess[];
  processesLoading: boolean;
  processesError: string | null;
}

const HandleProcessSelectionContext = createContext<NodeContextType>({
  selectedProduct: null,
  setSelectedProduct: () => {},
  processes: [],
  processesLoading: false,
  processesError: null
});

export const NodeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(globalState.selectedProduct);
  const { processes, loading: processesLoading, error: processesError } = useProcessesByProductId(selectedProduct?.id || '');

  // Sync global state with local state
  useEffect(() => {
    globalState.updateSelectedProduct(selectedProduct);
  }, [selectedProduct]);

  useEffect(() => {
    globalState.updateProcesses(processes);
  }, [processes]);

  const value = useMemo(() => ({
    selectedProduct,
    setSelectedProduct,
    processes,
    processesLoading,
    processesError
  }), [selectedProduct, processes, processesLoading, processesError]);

  return (
    <HandleProcessSelectionContext.Provider value={value}>
      {children}
    </HandleProcessSelectionContext.Provider>
  );
};

export const useNodeContext = () => useContext(HandleProcessSelectionContext);

export { HandleProcessSelectionContext };
