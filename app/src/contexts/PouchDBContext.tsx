// contexts/PouchDBContext.tsx

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';
import PouchDBFind from 'pouchdb-find';

// Register the memory adapter
PouchDB.plugin(memoryAdapter);
PouchDB.plugin(PouchDBFind);

// Define the shape of your context
interface PouchDBContextType {
    memoryDb: PouchDB.Database | null;
    localDb: PouchDB.Database | null;
}

// Define the props type, including children
interface PouchDBProviderProps {
    children: ReactNode;
}

const PouchDBContext = createContext<PouchDBContextType>({ memoryDb: null, localDb: null });

export const usePouchDB = () => useContext(PouchDBContext);

export const PouchDBProvider: React.FC<PouchDBProviderProps> = ({ children }) => {
    const [memoryDb, setMemoryDb] = useState<PouchDB.Database | null>(null);
    const [localDb, setLocalDb] = useState<PouchDB.Database | null>(null);

    useEffect(() => {
        const memoryDBInstance = new PouchDB('memory-db', { adapter: 'memory' });
        const localDBInstance = new PouchDB('local-db');

        setMemoryDb(memoryDBInstance);
        setLocalDb(localDBInstance);

        // Set up sync
        const sync = PouchDB.sync(memoryDBInstance, localDBInstance, {
            live: true,
            retry: true
        }).on('error', function (err) {
            console.error('Sync error:', err);
        });

        return () => {
            sync.cancel(); // Stop sync
            memoryDBInstance.close().catch(err => console.error('Error closing memory DB:', err));
            localDBInstance.close().catch(err => console.error('Error closing local DB:', err));
        };
    }, []);

    return (
        <PouchDBContext.Provider value={{ memoryDb, localDb }}>
            {children}
        </PouchDBContext.Provider>
    );
};