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
  const { db } = usePouchDB();
  const [matchingConfigs, setMatchingConfigs] = useState<MatchingConfig[]>([]);

  useEffect(() => {
    const fetchConfigs = async () => {
      if (db && productId) {
        console.log(`Fetching configurations for productId: ${productId}`);
        const configs = await getMatchingConfigurations(db, productId);
        console.log(`Fetched ${configs.length} matching configurations`);
        setMatchingConfigs(configs);
      }
    };

    fetchConfigs();
  }, [db, productId]);

  return matchingConfigs;
};

export default useMatchingConfigurations;