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
    syncStatus: 'pending' | 'active' | 'error' | 'complete' | null;
}

// Define the props type, including children
interface PouchDBProviderProps {
    children: ReactNode;
}

const PouchDBContext = createContext<PouchDBContextType>({
    memoryDb: null,
    localDb: null,
    syncStatus: 'pending'
});

export const usePouchDB = () => useContext(PouchDBContext);

export const PouchDBProvider: React.FC<PouchDBProviderProps> = ({ children }) => {
    const [memoryDb, setMemoryDb] = useState<PouchDB.Database | null>(null);
    const [localDb, setLocalDb] = useState<PouchDB.Database | null>(null);
    const [syncStatus, setSyncStatus] = useState<'pending' | 'active' | 'error' | 'complete'>('pending');

    useEffect(() => {
        console.log("Initializing PouchDB instances...");

        // Create the memory and local PouchDB instances
        const memoryDBInstance = new PouchDB('memory-db', { adapter: 'memory' });
        const localDBInstance = new PouchDB('local-db');

        console.log("PouchDB instances created.");

        localDBInstance.info()
            .then(info => {
                console.log("Local DB info:", info);

                if (info.doc_count > 0) {
                    console.log(`Local DB has ${info.doc_count} documents, replicating to memory....`);
                    return new Promise<void>((resolve, reject) => {
                        localDBInstance.replicate.to(memoryDBInstance)
                            .on('complete', () => {
                                console.log("Initial replication from local to memory complete");
                                resolve();
                            })
                            .on('error', (err) => {
                                console.error("Error during initial replication:", err);
                                reject(err);
                            });
                    });
                } else {
                    console.log("Local DB is empty, no replication needed.");
                    return Promise.resolve();
                }
            })
            .then(() => {
                console.log("Setting up bi-directional sync...");

                // Set up bi-directional sync
                const sync = PouchDB.sync(memoryDBInstance, localDBInstance, {
                    live: true,
                    retry: true,
                    batch_size: 50
                });

                sync.on('change', function (info) {
                    console.log('PouchDB sync change:', info);
                    if (info.direction === 'push') {
                        console.log(`Pushed ${info.change.docs_written} documents from memory to local DB`);
                    } else {
                        console.log(`Pulled ${info.change.docs_written} documents from local DB to memory`);
                    }
                });

                sync.on('active', function () {
                    console.log('PouchDB sync is active');
                    setSyncStatus('active');
                });

                sync.on('paused', function () {
                    console.log('PouchDB sync is paused - all changes synced');
                });

                sync.on('denied', function (err) {
                    console.error('PouchDB sync denied:', err);
                    setSyncStatus('error');
                });

                sync.on('error', function (err) {
                    console.error('PouchDB sync error:', err);
                    setSyncStatus('error');
                });

                setMemoryDb(memoryDBInstance);
                setLocalDb(localDBInstance);

                return () => {
                    console.log("Cleaning up PouchDB instances and sync...");
                    sync.cancel(); // Stop sync
                    memoryDBInstance.close().catch(err => console.error('Error closing memory DB:', err));
                    localDBInstance.close().catch(err => console.error('Error closing local DB:', err));
                };
            })
            .catch(err => {
                console.error("Error initializing PouchDB:", err);
                setSyncStatus('error');
            });
    }, []);

    // Add a utility to force an immediate sync if needed
    const forceSyncMemoryToLocal = async () => {
        if (memoryDb && localDb) {
            console.log("Forcing sync from memory to local...");
            try {
                const result = await memoryDb.replicate.to(localDb);
                console.log("Forced sync complete:", result);
                return result;
            } catch (error) {
                console.error("Force sync failed:", error);
                throw error;
            }
        }
    };

    return (
        <PouchDBContext.Provider value={{
            memoryDb,
            localDb,
            syncStatus
        }}>
            {children}
        </PouchDBContext.Provider>
    );
};