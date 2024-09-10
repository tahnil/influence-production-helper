// hooks/useMatchingConfigurations.ts

import { useState, useEffect } from 'react';
import { usePouchDB } from '@/contexts/PouchDBContext';
import { getMatchingConfigurations } from '@/utils/TreeVisualizer/getMatchingConfigurations';

interface MatchingConfig {
  _id: string;
  focalProductId: string;
  createdAt: string;
  nodeCount: number;
}

const useMatchingConfigurations = (productId: string) => {
  const { memoryDb } = usePouchDB();
  const [matchingConfigs, setMatchingConfigs] = useState<MatchingConfig[]>([]);

  useEffect(() => {
    const fetchConfigs = async () => {
      if (memoryDb && productId) {
        // console.log(`Fetching configurations for productId: ${productId}`);
        const configs = await getMatchingConfigurations(memoryDb, productId);
        // console.log(`Fetched ${configs.length} matching configurations`);
        setMatchingConfigs(configs);
      }
    };

    fetchConfigs();
  }, [memoryDb, productId]);

  return matchingConfigs;
};

export default useMatchingConfigurations;