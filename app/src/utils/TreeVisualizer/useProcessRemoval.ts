// utils/TreeVisualizer/useProcessRemoval.ts

import { useState, useCallback } from 'react';
import { useFlow } from '@/contexts/FlowContext';
import { toast } from '@/hooks/use-toast';

export const useProcessRemoval = () => {
  const { dispatch } = useFlow();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveProcess = useCallback((processNodeId: string) => {
    setIsRemoving(true);

    // Dispatch process removal action
    dispatch({ 
      type: 'REMOVE_PROCESS', 
      payload: { processNodeId }
    });
    
    // Force re-render cycle by scheduling a state reset
    setTimeout(() => {
      setIsRemoving(false);
      
      // Show feedback to user
      toast({
        title: "Process removed",
        description: "Process and all its inputs have been removed from the production chain.",
        duration: 3000,
      });
    }, 50);
  }, [dispatch]);

  return {
    isRemoving,
    handleRemoveProcess
  };
};

export default useProcessRemoval;