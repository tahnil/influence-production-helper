import React, { useState, useEffect } from 'react';
import { usePouchDB } from '@/contexts/PouchDBContext';
import Modal from '@/components/ui/modal';
import useInfluenceProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessDetails from '@/hooks/useProcessDetails';

interface ConfigNode {
  id: string;
  type: string;
  data: {
    productId?: string;
    processId?: string;
    productDetails?: { name: string; id: string };
    processDetails?: { name: string; id: string };
    amount?: number;
    totalWeight?: number;
    totalVolume?: number;
    totalRuns?: number;
    totalDuration?: number;
    [key: string]: any;  // Allow for other properties
  };
}

interface ProductionChainConfig {
  _id: string;
  _rev: string; // Add this line
  focalProductId: string;
  createdAt: string;
  nodeCount: number;
  nodes: ConfigNode[];
}

const PouchDBViewer: React.FC = () => {
  const { db } = usePouchDB();
  const [configs, setConfigs] = useState<ProductionChainConfig[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getProductDetails } = useInfluenceProductDetails();
  const { getProcessDetails } = useProcessDetails();

  useEffect(() => {
    const fetchConfigs = async () => {
      if (db) {
        try {
          const result = await db.allDocs({ include_docs: true });
          const fetchedConfigs = result.rows
            .map(row => row.doc)
            .filter((doc): doc is ProductionChainConfig => 
              doc !== null && 
              typeof doc === 'object' && 
              'nodes' in doc && 
              Array.isArray(doc.nodes)
            );
          
          const updatedConfigs = await Promise.all(fetchedConfigs.map(async (config) => {
            const updatedNodes = await Promise.all(config.nodes.map(async (node: ConfigNode) => {
              if (node.type === 'productNode' && node.data.productId) {
                const productDetails = await getProductDetails(node.data.productId);
                return { ...node, data: { ...node.data, productDetails } };
              } else if (node.type === 'processNode' && node.data.processId) {
                const processDetails = await getProcessDetails(node.data.processId);
                return { ...node, data: { ...node.data, processDetails } };
              }
              return node;
            }));
            return { ...config, nodes: updatedNodes };
          }));

          const sortedConfigs = updatedConfigs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          setConfigs(sortedConfigs);
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

    changes?.on('change', fetchConfigs);

    return () => {
      changes?.cancel();
    };
  }, [db, getProductDetails, getProcessDetails]);

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

  const getNodesInfo = (nodes: ConfigNode[]) => {
    const productNodes = nodes.filter(node => node.type === 'productNode');
    const processNodes = nodes.filter(node => node.type === 'processNode');

    return (
      <div>
        <p className="font-semibold">Products:</p>
        <ul className="list-disc pl-5">
          {productNodes.map(node => (
            <li key={node.id}>
              {node.data.productDetails?.name || 'Unknown'} (ID: {node.data.productDetails?.id})
              {node.data.amount !== undefined && ` - Amount: ${node.data.amount}`}
              {node.data.totalWeight !== undefined && ` - Total Weight: ${node.data.totalWeight}`}
              {node.data.totalVolume !== undefined && ` - Total Volume: ${node.data.totalVolume}`}
            </li>
          ))}
        </ul>
        <p className="font-semibold mt-2">Processes:</p>
        <ul className="list-disc pl-5">
          {processNodes.map(node => (
            <li key={node.id}>
              {node.data.processDetails?.name || 'Unknown'} (ID: {node.data.processDetails?.id})
              {node.data.totalRuns !== undefined && ` - Total Runs: ${node.data.totalRuns}`}
              {node.data.totalDuration !== undefined && ` - Total Duration: ${node.data.totalDuration}`}
            </li>
          ))}
        </ul>
      </div>
    );
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
            {config.nodes && getNodesInfo(config.nodes)}
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