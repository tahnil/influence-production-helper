import React, { useState, useEffect } from 'react';
import { usePouchDB } from '@/contexts/PouchDBContext';

const PouchDBViewer: React.FC = () => {
  const { db } = usePouchDB();
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      if (db) {
        try {
          const result = await db.allDocs({ include_docs: true });
          setDocs(result.rows.map(row => row.doc));
        } catch (error) {
          console.error('Error fetching docs:', error);
        }
      }
    };

    fetchDocs();

    // Set up changes listener
    const changes = db?.changes({
      since: 'now',
      live: true,
      include_docs: true
    });

    changes?.on('change', () => fetchDocs());

    return () => {
      changes?.cancel();
    };
  }, [db]);

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">PouchDB Contents</h3>
      <div className="max-h-60 overflow-y-auto bg-gray-800 p-2 rounded">
        {docs.map((doc, index) => (
          <div key={index} className="mb-2 p-2 bg-gray-700 rounded">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(doc, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PouchDBViewer;
