import React, { useState, useEffect } from 'react';
import { usePouchDB } from '@/contexts/PouchDBContext';
import Modal from '@/components/ui/modal';
import useInfluenceProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessDetails from '@/hooks/useProcessDetails';
import { EyeIcon } from 'lucide-react';

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
    [key: string]: any;
  };
}

interface ProductionChainConfig {
  _id: string;
  _rev: string;
  focalProductId: string;
  createdAt: string;
  nodeCount: number;
  nodes: ConfigNode[];
}

const PouchDBViewer: React.FC = () => {
  const { memoryDb } = usePouchDB();
  const [configs, setConfigs] = useState<ProductionChainConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ProductionChainConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getProductDetails } = useInfluenceProductDetails();
  const { getProcessDetails } = useProcessDetails();

  useEffect(() => {
    const fetchConfigs = async () => {
      if (memoryDb) {
        try {
          const result = await memoryDb.allDocs({ include_docs: true });
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

    const changes = memoryDb?.changes({
      since: 'now',
      live: true,
      include_docs: true
    });

    changes?.on('change', fetchConfigs);

    return () => {
      changes?.cancel();
    };
  }, [memoryDb, getProductDetails, getProcessDetails]);

  const viewDetails = (config: ProductionChainConfig) => {
    setSelectedConfig(config);
    setIsModalOpen(true);
  };

  const getFocalProductInfo = (config: ProductionChainConfig) => {
    const focalNode = config.nodes.find(node => node.data.productDetails?.id === config.focalProductId);
    const ancestorProcess = config.nodes.find(node =>
      node.type === 'processNode' && node.data.descendantIds?.includes(focalNode?.id || '')
    );
    return {
      productName: focalNode?.data.productDetails?.name || 'Unknown Product',
      processName: ancestorProcess?.data.processDetails?.name || 'Unknown Process'
    };
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Saved Production Chains</h3>
      <div className="max-h-60 overflow-y-auto bg-gray-800 p-2 rounded space-y-2">
        {configs.map((config) => {
          const { productName, processName } = getFocalProductInfo(config);
          return (
            <div key={config._id} className="p-2 bg-gray-700 rounded grid grid-cols-[1fr,auto] gap-4 items-center">
              <div>
                <p className="font-semibold">{productName} ({processName})</p>
                <p className="text-sm">Nodes: {config.nodeCount}</p>
                <p className="text-sm">{new Date(config.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-center w-8 h-8">
                <EyeIcon
                  size={20}
                  onClick={() => viewDetails(config)}
                  className="text-falconWhite hover:text-fuscousGray-400 transition-colors cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configuration Details"
      >
        {selectedConfig && (
          <div className="whitespace-pre-wrap bg-lunarGreen-900 p-4 rounded">
            <p><strong>ID:</strong> {selectedConfig._id}</p>
            <p><strong>Focal Product:</strong> {selectedConfig.focalProductId}</p>
            <p><strong>Created:</strong> {new Date(selectedConfig.createdAt).toLocaleString()}</p>
            <p><strong>Nodes:</strong> {selectedConfig.nodeCount}</p>
            <h4 className="font-semibold mt-4 mb-2">Products:</h4>
            <ul className="list-disc pl-5">
              {selectedConfig.nodes.filter(node => node.type === 'productNode').map(node => (
                <li key={node.id}>
                  {node.data.productDetails?.name || 'Unknown'} (ID: {node.data.productDetails?.id})
                  {node.data.amount !== undefined && ` - Amount: ${node.data.amount}`}
                  {node.data.totalWeight !== undefined && ` - Total Weight: ${node.data.totalWeight}`}
                  {node.data.totalVolume !== undefined && ` - Total Volume: ${node.data.totalVolume}`}
                </li>
              ))}
            </ul>
            <h4 className="font-semibold mt-4 mb-2">Processes:</h4>
            <ul className="list-disc pl-5">
              {selectedConfig.nodes.filter(node => node.type === 'processNode').map(node => (
                <li key={node.id}>
                  {node.data.processDetails?.name || 'Unknown'} (ID: {node.data.processDetails?.id})
                  {node.data.totalRuns !== undefined && ` - Total Runs: ${node.data.totalRuns}`}
                  {node.data.totalDuration !== undefined && ` - Total Duration: ${node.data.totalDuration}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PouchDBViewer;