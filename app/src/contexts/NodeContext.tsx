// contexts/NodeContext.tsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import { globalState } from '@/globalState';
import { ProductNode } from '@/types/d3Types';

// Define the structure of the context's value for better TypeScript support
interface NodeContextType {
  selectedProduct: InfluenceProduct | null;
  setSelectedProduct: (product: InfluenceProduct | null) => void;
  processes: InfluenceProcess[];
  processesLoading: boolean;
  processesError: string | null;
  selectedProcessId: string | null;
  setSelectedProcessId: (processId: string | null) => void;
  handleProcessSelection: (processId: string, node: ProductNode) => void;
  }

const HandleProcessSelectionContext = createContext<NodeContextType>({
  selectedProduct: null,
  setSelectedProduct: () => {},
  processes: [],
  processesLoading: false,
  processesError: null,
  selectedProcessId: null,
  setSelectedProcessId: () => {},
  handleProcessSelection: () => {},
});

export const NodeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(globalState.selectedProduct);
  const { processes, loading: processesLoading, error: processesError } = useProcessesByProductId(selectedProduct?.id || '');
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);


  // Update global state whenever processes or selectedProduct change
  useEffect(() => {
    globalState.updateProcesses(processes);
    if (selectedProduct) {
      globalState.updateSelectedProduct(selectedProduct);
    }
    if (selectedProcessId) {
      globalState.updateSelectedProcessId(selectedProcessId);
    }
  }, [processes, selectedProduct, selectedProcessId]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    selectedProduct,
    setSelectedProduct,
    processes,
    processesLoading,
    processesError,
    selectedProcessId,
    setSelectedProcessId,
    handleProcessSelection: (processId: string, node: ProductNode) => { setSelectedProcessId(processId)}
  }), [selectedProduct, processes, processesLoading, processesError, selectedProcessId]);

  return (
    <HandleProcessSelectionContext.Provider value={value}>
      {children}
    </HandleProcessSelectionContext.Provider>
  );
};

export const useNodeContext = () => useContext(HandleProcessSelectionContext);

export { HandleProcessSelectionContext };
