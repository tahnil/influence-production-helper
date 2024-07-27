// src/hooks/useProcessesByProductId.ts

import { useEffect, useReducer, useMemo } from 'react';

// Defining a reducer function for managing state
const reducer = (state: any, action: { type: any; payload: any; }) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PROCESSES':
      return { ...state, processes: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const useProcessesByProductId = (productId: string) => {
  const [state, dispatch] = useReducer(reducer, {
    processes: [],
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!productId) {
      console.log('No productId provided');
      dispatch({ type: 'SET_PROCESSES', payload: [] });
      return;
    }

    const fetchProcessesByProductId = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await fetch(`/api/processes?outputProductId=${productId}`);
        if (!response.ok) throw new Error('Failed to fetch processes');
        const data = await response.json();
        console.log(`[useProcessesByProductId] Fetched processes: `, data);
        dispatch({ type: 'SET_PROCESSES', payload: data });
      } catch (e: any) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
      }
    };

    fetchProcessesByProductId();
  }, [productId]);

  // Memoizing the returned object to prevent unnecessary re-renders of consumers
  return useMemo(() => ({
    processes: state.processes,
    loading: state.loading,
    error: state.error
  }), [state]);
};

export default useProcessesByProductId;
