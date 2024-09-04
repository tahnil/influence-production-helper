import React, { useState, useEffect } from 'react';
import { usePouchDB } from '@/contexts/PouchDBContext';
import Modal from '@/components/ui/modal';

const PouchDBViewer: React.FC = () => {
  const { db } = usePouchDB();
  const [configs, setConfigs] = useState<any[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      if (db) {
        try {
          const result = await db.allDocs({ include_docs: true });
          setConfigs(result.rows.map(row => row.doc));
        } catch (error) {
          console.error('Error fetching configs:', error);
        }
      }
    };

    fetchConfigs();

    const changes = db?.changes({
      since: 'now',
      live: true,
      include_docs: true
    });

    changes?.on('change', () => fetchConfigs());

    return () => {
      changes?.cancel();
    };
  }, [db]);

  const viewAttachment = async (docId: string) => {
    if (db) {
      try {
        const attachment = await db.getAttachment(docId, 'nodes');
        if (attachment instanceof Blob) {
          const text = await new Response(attachment).text();
          setSelectedAttachment(JSON.stringify(JSON.parse(text), null, 2));
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error('Error fetching attachment:', error);
      }
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Saved Production Chains</h3>
      <div className="max-h-60 overflow-y-auto bg-gray-800 p-2 rounded">
        {configs.map((config, index) => (
          <div key={index} className="mb-2 p-2 bg-gray-700 rounded">
            <p>ID: {config._id}</p>
            <p>Focal Product: {config.focalProductId}</p>
            <p>Created: {new Date(config.createdAt).toLocaleString()}</p>
            <p>Nodes: {config.nodeCount}</p>
            <button 
              onClick={() => viewAttachment(config._id)}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              View Attachment
            </button>
          </div>
        ))}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Attachment Data"
      >
        <pre className="whitespace-pre-wrap bg-lunarGreen-900 p-4 rounded">
          {selectedAttachment}
        </pre>
      </Modal>
    </div>
  );
};

export default PouchDBViewer;