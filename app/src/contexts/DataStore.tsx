/**
 * The DataStoreContext provides a centralized store for managing the state of the application, 
 * including the selected process ID, the selected product, and the list of processes.
 * 
 * The DataStoreProvider component wraps the application and provides the DataStoreContext to 
 * its children. It initializes the state and handles events related to process selection.
 * 
 * The useProcessId, useProductData, and useProcessData hooks can be used by child components 
 * to access the state and update it as needed.
 */
// src/contexts/DataStore.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { EventEmitter } from 'events';
import { InfluenceProcess, InfluenceProduct } from '@/types/influenceTypes';

export const eventEmitter = new EventEmitter();

const DataStoreContext = createContext<{
    selectedProcessId: string | null;
    setSelectedProcessId: React.Dispatch<React.SetStateAction<string | null>>;
    selectedProduct: InfluenceProduct | null;
    setSelectedProduct: React.Dispatch<React.SetStateAction<InfluenceProduct | null>>;
    processes: InfluenceProcess[];
    setProcesses: React.Dispatch<React.SetStateAction<InfluenceProcess[]>>;
} | null>(null);

export const DataStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<InfluenceProduct | null>(null);
    const [processes, setProcesses] = useState<InfluenceProcess[]>([]);

    useEffect(() => {
        const handleProcessSelection = (processId: string) => {
            setSelectedProcessId(processId);
        };
        eventEmitter.on('d3SendProcessIdToDataStore', handleProcessSelection);
        return () => {
            eventEmitter.off('d3SendProcessIdToDataStore', handleProcessSelection);
        };
    }, []);

    return (
        <DataStoreContext.Provider value={{ selectedProcessId, setSelectedProcessId }}>
            {children}
        </DataStoreContext.Provider>
    );
};

export const useProcessId = () => {
    const context = useContext(DataStoreContext);
    if (!context) {
        throw new Error('useProcessId must be used within a DataStoreProvider');
    }
    return context.selectedProcessId;
};

export const useProductData = () => {
    const context = useContext(DataStoreContext);
    if (!context) {
        throw new Error('useProductData must be used within a DataStoreProvider');
    }
    return {
        selectedProduct: context.selectedProduct,
        setSelectedProduct: context.setSelectedProduct,
    };
};

export const useProcessData = () => {
    const context = useContext(DataStoreContext);
    if (!context) {
        throw new Error('useProcessData must be used within a DataStoreProvider');
    }
    return {
        processes: context.processes,
        setProcesses: context.setProcesses,
    };
};