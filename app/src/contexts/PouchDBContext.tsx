import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';

// Register the memory adapter
PouchDB.plugin(memoryAdapter);

// Define the shape of your context
interface PouchDBContextType {
    db: PouchDB.Database | null;
}

// Define the props type, including children
interface PouchDBProviderProps {
    children: ReactNode;
}

const PouchDBContext = createContext<PouchDBContextType>({ db: null });

export const usePouchDB = () => {
    return useContext(PouchDBContext);
};

export const PouchDBProvider: React.FC<PouchDBProviderProps> = ({ children }) => {
    const [db, setDb] = useState<PouchDB.Database | null>(null);

    useEffect(() => {
        // Initialize PouchDB instance
        const pouchDBInstance = new PouchDB('mydb', { adapter: 'memory' });
        setDb(pouchDBInstance);

        // Optional: Clean up on unmount
        return () => {
            pouchDBInstance.close().catch(err => {
                console.error('Error closing PouchDB:', err);
            });
        };
    }, []);

    return (
        <PouchDBContext.Provider value={{ db }}>
            {children}
        </PouchDBContext.Provider>
    );
};
