// hooks/useMatchingConfigurations.ts

import { useState, useEffect } from 'react';
import { usePouchDB } from '@/contexts/PouchDBContext';
import { getMatchingConfigurations } from '@/utils/TreeVisualizer/getMatchingConfigurations';
import { useFlow } from '@/contexts/FlowContext';

const useMatchingConfigurations = (productId: string) => {
  const { memoryDb } = usePouchDB();
  const { dispatch } = useFlow();

  console.log(`useMatchingConfigurations: productId: ${productId}`);

  useEffect(() => {
    const fetchConfigs = async () => {
      if (memoryDb && productId) {
        // console.log(`Fetching configurations for productId: ${productId}`);
        const configs = await getMatchingConfigurations(memoryDb, productId);
        dispatch({ type: 'SET_MATCHING_CONFIGS', payload: configs });
      }
    };

    fetchConfigs();
  }, [memoryDb, productId, dispatch]);

};

export default useMatchingConfigurations;