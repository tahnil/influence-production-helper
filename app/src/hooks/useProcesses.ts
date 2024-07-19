import { useState, useEffect } from 'react';
import axios from 'axios';
import { Process } from '../types/types';

const useProcesses = (id?: string) => {
  const [processes, setProcesses] = useState<Process[]>([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(id ? `/api/processes?id=${id}` : '/api/processes');
        setProcesses(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setError('Failed to fetch processes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { processes, loading, error };
};

export default useProcesses;
