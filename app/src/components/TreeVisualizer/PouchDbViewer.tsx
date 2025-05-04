// components/TreeVisualizer/PouchDbViewer.tsx

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { EyeIcon, Trash2Icon, RefreshCwIcon } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useFlow } from '@/contexts/FlowContext';
import { usePouchDB } from '@/contexts/PouchDBContext';
import useInfluenceProductDetails from '@/hooks/useInfluenceProductDetails';
import useProcessDetails from '@/hooks/useProcessDetails';
import { NodePlan } from '@/types/nodePlanTypes';

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
  nodePlans?: NodePlan[]; // Add support for the new format
}

interface PouchDBViewerProps {
  handleSelectProcess: (processId: string, nodeId: string) => void;
  handleSerialize: (focalNodeId: string) => Promise<void>;
}

const PouchDBViewer: React.FC<PouchDBViewerProps> = ({ handleSelectProcess, handleSerialize }) => {
  const { memoryDb } = usePouchDB();
  const [configs, setConfigs] = useState<ProductionChainConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ProductionChainConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getProductDetails } = useInfluenceProductDetails();
  const { getProcessDetails } = useProcessDetails();
  const {
    desiredAmount,
    dispatch
  } = useFlow();
  const { toast } = useToast();

  // Fetch configurations from PouchDB
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
              'focalProductId' in doc &&
              'nodeCount' in doc
            );

          // Enhance configs with product and process details
          const updatedConfigs = await Promise.all(fetchedConfigs.map(async (config) => {
            // Load nodes from attachment if they're not in the document
            if (!config.nodes) {
              try {
                const attachment = await memoryDb.getAttachment(config._id, 'nodes');
                if (attachment instanceof Blob) {
                  config.nodes = JSON.parse(await attachment.text());
                }
              } catch (error) {
                console.warn(`No nodes attachment for config ${config._id}`);
                config.nodes = [];
              }
            }

            // Update node details with product/process info
            const updatedNodes = await Promise.all((config.nodes || []).map(async (node: ConfigNode) => {
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

    // Set up changes listener
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

  // View configuration details
  const viewDetails = (config: ProductionChainConfig) => {
    setSelectedConfig(config);
    setIsModalOpen(true);
  };

  // Get info about the focal product
  const getFocalProductInfo = (config: ProductionChainConfig) => {
    const focalNode = config.nodes.find(node =>
      node.type === 'productNode' &&
      node.data.productDetails?.id === config.focalProductId
    );

    const inflowProcess = config.nodes.find(node =>
      node.type === 'processNode' &&
      Array.isArray(node.data.outflowIds) &&
      node.data.outflowIds.includes(focalNode?.id || '')
    );

    return {
      productName: focalNode?.data.productDetails?.name || 'Unknown Product',
      processName: inflowProcess?.data.processDetails?.name || 'Unknown Process'
    };
  };

  // Delete configuration
  const deleteConfig = async (configId: string) => {
    if (memoryDb) {
      try {
        const doc = await memoryDb.get(configId);
        await memoryDb.remove(doc);
        setConfigs(configs.filter(config => config._id !== configId));
        toast({
          title: "Configuration Deleted",
          description: "The production chain configuration has been successfully deleted.",
          duration: 3000,
        });
      } catch (error) {
        console.error('Error deleting config:', error);
        toast({
          title: "Error",
          description: "Failed to delete the configuration. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  // Replace the current configuration with a saved one
  const replaceConfig = async (config: ProductionChainConfig) => {
    if (memoryDb) {
      try {
        console.log('[PouchDbViewer] Replacing configuration:', config);

        // Dispatch the load action with mode set to 'full'
        dispatch({
          type: 'LOAD_SAVED_CONFIG',
          payload: {
            nodeId: '', // Not needed for full replacements
            configId: config._id,
            mode: 'full'
          }
        });

        toast({
          title: "Configuration Replaced",
          description: `The production chain has been replaced with "${getFocalProductInfo(config).productName}"`,
          duration: 3000,
        });
      } catch (error) {
        console.error('Error replacing configuration:', error);
        toast({
          title: "Error",
          description: "Failed to replace the configuration. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  if (configs.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Saved Production Chains</h3>
      <div className="max-h-60 overflow-y-auto bg-gray-800 p-2 rounded space-y-2">
        {configs.map((config) => {
          const { productName, processName } = getFocalProductInfo(config);
          return (
            <div key={config._id} className="p-2 bg-gray-700 rounded grid grid-cols-[1fr,auto] gap-4 items-start">
              <div>
                <p className="font-semibold">{productName} ({processName})</p>
                <p className="text-sm">Nodes: {config.nodeCount}</p>
                <p className="text-sm">{new Date(config.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-center justify-center space-y-2">
                <EyeIcon
                  size={20}
                  onClick={() => viewDetails(config)}
                  className="text-falconWhite hover:text-fuscousGray-400 transition-colors cursor-pointer"
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <RefreshCwIcon
                      size={20}
                      className="text-falconWhite hover:text-fuscousGray-400 transition-colors cursor-pointer"
                    />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Replace current configuration?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will replace your current production chain with the saved configuration for {productName}.
                        This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => replaceConfig(config)}>Replace</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Trash2Icon
                      size={20}
                      className="text-falconWhite hover:text-fuscousGray-400 transition-colors cursor-pointer"
                    />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to delete this configuration?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the production chain configuration for {productName}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteConfig(config._id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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