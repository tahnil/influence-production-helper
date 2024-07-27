// contexts/NodeContext.tsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import { globalState } from '@/globalState';  // Ensure globalState is correctly imported

// Define the structure of the context's value for better TypeScript support
interface NodeContextType {
  selectedProduct: InfluenceProduct | null;
  setSelectedProduct: (product: InfluenceProduct | null) => void;
  processes: InfluenceProcess[];
  processesLoading: boolean;
  processesError: string | null;
}

export const HandleProcessSelectionContext = createContext<NodeContextType>({
  selectedProduct: null,
  setSelectedProduct: () => { },
  processes: [],
  processesLoading: false,
  processesError: null
});

export const NodeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(null);
  const { processes, loading: processesLoading, error: processesError } = useProcessesByProductId(selectedProduct?.id || '');

  // Update global state whenever local state updates
  useEffect(() => {
    globalState.updateProcesses(processes);
    // If additional state management is needed, handle it similarly
  }, [processes]);

  // Subscribe to global state updates
  useEffect(() => {
    const unsubscribe = globalState.subscribe(() => {
      setSelectedProduct(globalState.selectedProduct);  // Ensure selectedProduct is managed globally if necessary
    });
    return () => unsubscribe();
  }, []);

  const contextValue = useMemo(() => ({
    selectedProduct,
    setSelectedProduct,
    processes: globalState.processes, // Directly use processes from global state
    processesLoading,
    processesError
  }), [selectedProduct, globalState.processes, processesLoading, processesError]);

  return (
    <HandleProcessSelectionContext.Provider value={contextValue}>
      {children}
    </HandleProcessSelectionContext.Provider>
  );
};

export const useNodeContext = () => useContext(HandleProcessSelectionContext);
