// utils/TreeVisualizer/getMatchingConfigurations.ts

import PouchDB from 'pouchdb';

interface SavedConfig {
  _id: string;
  _rev: string;
  focalProductId: string;
  createdAt: string;
  nodeCount: number;
  nodes: Array<{
    id: string;
    type: string;
    data: {
      productDetails?: {
        id: string;
      };
      processId?: string;
      isRoot: boolean;
    }
  }>;
}

export const getMatchingConfigurations = async (db: PouchDB.Database, productId: string): Promise<SavedConfig[]> => {
  try {
    const result = await db.allDocs({
      include_docs: true,
      attachments: false
    });

    console.log(`Total documents in PouchDB: ${result.rows.length}`);

    // Log all documents
    console.log('All documents in PouchDB:', result.rows.map(row => row.doc));

    const matchingConfigs = result.rows
      .map(row => row.doc)
      .filter((doc): doc is SavedConfig => {
        if (!doc || typeof doc !== 'object') {
          console.log('Document is null or not an object:', doc);
          return false;
        }

        const isMatch =
          '_id' in doc &&
          '_rev' in doc &&
          'focalProductId' in doc &&
          'createdAt' in doc &&
          'nodeCount' in doc &&
          'nodes' in doc &&
          Array.isArray(doc.nodes) &&
          doc.focalProductId === productId;

        // Log each document and whether it matches
        console.log(`Document ${doc._id}:`, doc);
        console.log(`Matches criteria: ${isMatch}`);

        if (!isMatch) {
          console.log('Reason for not matching:', {
            hasId: '_id' in doc,
            hasRev: '_rev' in doc,
            hasFocalProductId: 'focalProductId' in doc,
            hasCreatedAt: 'createdAt' in doc,
            hasNodeCount: 'nodeCount' in doc,
            hasNodes: 'nodes' in doc,
            nodesIsArray: Array.isArray((doc as any).nodes),
            rootProductIdMatches: (doc as any).focalProductId === productId
          });
        }

        return isMatch;
      });

    console.log(`Matching configurations found: ${matchingConfigs.length}`);
    console.log('Matching configurations:', matchingConfigs);

    return matchingConfigs;
  } catch (error) {
    console.error('Error retrieving matching configurations:', error);
    return [];
  }
};