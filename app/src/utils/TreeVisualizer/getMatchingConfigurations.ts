// utils/TreeVisualizer/getMatchingConfigurations.ts

import PouchDB from 'pouchdb';

interface SavedConfig {
  _id: string;
  focalProductId: string;
  createdAt: string;
  nodeCount: number;
  rootProductId: string;
  nodes: Array<{
    id: string;
    type: string;
    data: {
      productId?: string;
      processId?: string;
      isRoot: boolean;
    }
  }>;
}

export const getMatchingConfigurations = async (db: PouchDB.Database, productId: string): Promise<SavedConfig[]> => {
  try {
    const result = await db.allDocs({
      include_docs: true,
      attachments: false // We don't need attachments for this query
    });

    const matchingConfigs = result.rows
      .map(row => row.doc)
      .filter((doc): doc is SavedConfig => 
        doc !== null &&
        'focalProductId' in doc &&
        'createdAt' in doc &&
        'nodeCount' in doc &&
        'rootProductId' in doc &&
        doc.rootProductId === productId
      );

    return matchingConfigs;
  } catch (error) {
    console.error('Error retrieving matching configurations:', error);
    return [];
  }
};