// hooks/useProcessDetails.ts

import { useState, useCallback } from 'react';
import { InfluenceProcess } from '@/types/influenceTypes';

const fetchProcessDetails = async (id: string): Promise<InfluenceProcess> => {
    const response = await fetch(`/api/processes?id=${id}`);
  if (response.status !== 200) {
    throw new Error('Failed to fetch process details');
  }
    const data = await response.json();
    // console.log('[fetchProcessDetails] Fetched data:', data); // Add logging here
    return data[0]; // Adjust to return the first element of the array
};

const useProcessDetails = () => {
  const [processDetails, setProcessDetails] = useState<InfluenceProcess | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

    const getProcessDetails = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
            const data = await fetchProcessDetails(id);
            // console.log('[useProcessDetails] Fetched process details:', data); // Add logging here
      setProcessDetails(data);
      return data; // Return the fetched data
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError('Unexpected error occurred');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    processDetails,
    loading,
    error,
    getProcessDetails,
  };
};

export default useProcessDetails;