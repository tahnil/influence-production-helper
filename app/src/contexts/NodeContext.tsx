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
  selectedProcess: string | null;
  setSelectedProcess: (processId: string | null) => void;
  handleProcessSelection: (processId: string, node: ProductNode) => void;
  }

const HandleProcessSelectionContext = createContext<NodeContextType>({
  selectedProduct: null,
  setSelectedProduct: () => {},
  processes: [],
  processesLoading: false,
  processesError: null,
  selectedProcess: null,
  setSelectedProcess: () => {},
  handleProcessSelection: () => {},
});

export const NodeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(globalState.selectedProduct);
  const { processes, loading: processesLoading, error: processesError } = useProcessesByProductId(selectedProduct?.id || '');
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);


  // Update global state whenever processes or selectedProduct change
  useEffect(() => {
    globalState.updateProcesses(processes);
    if (selectedProduct) {
      globalState.updateSelectedProduct(selectedProduct);
    }
    if (selectedProcess) {
      globalState.updateSelectedProcess(selectedProcess);
    }
  }, [processes, selectedProduct, selectedProcess]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    selectedProduct,
    setSelectedProduct,
    processes,
    processesLoading,
    processesError,
    selectedProcess,
    setSelectedProcess,
    handleProcessSelection: (processId: string, node: ProductNode) => { setSelectedProcess(processId)}
  }), [selectedProduct, processes, processesLoading, processesError, selectedProcess]);

  return (
    <HandleProcessSelectionContext.Provider value={value}>
      {children}
    </HandleProcessSelectionContext.Provider>
  );
};

export const useNodeContext = () => useContext(HandleProcessSelectionContext);

export { HandleProcessSelectionContext };
