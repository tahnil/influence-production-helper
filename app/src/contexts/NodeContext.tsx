// contexts/NodeContext.tsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';
import { globalState } from '../globalState';

// Define the structure of the context's value for better TypeScript support
interface NodeContextType {
  selectedProduct: InfluenceProduct | null;
  setSelectedProduct: (product: InfluenceProduct | null) => void;
  processes: InfluenceProcess[];
  updateProcesses: (processes: InfluenceProcess[]) => void;
}

export const HandleProcessSelectionContext = createContext<NodeContextType>(null!);

export const NodeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState({
    selectedProduct: globalState.selectedProduct,
    processes: globalState.processes
  });

  useEffect(() => {
    const unsubscribe = globalState.subscribe(() => {
      setState({
        selectedProduct: globalState.selectedProduct,
        processes: globalState.processes
      });
    });
    return unsubscribe;
  }, []);

  const setSelectedProduct = (product: InfluenceProduct | null) => {
    globalState.updateSelectedProduct(product);
  };

  const updateProcesses = (processes: InfluenceProcess[]) => {
    globalState.updateProcesses(processes);
  };

  const contextValue = useMemo(() => ({
    selectedProduct: state.selectedProduct,
    setSelectedProduct,
    processes: state.processes,
    updateProcesses
  }), [state]);

  return (
    <HandleProcessSelectionContext.Provider value={contextValue}>
      {children}
    </HandleProcessSelectionContext.Provider>
  );
};

export const useNodeContext = () => useContext(HandleProcessSelectionContext);
