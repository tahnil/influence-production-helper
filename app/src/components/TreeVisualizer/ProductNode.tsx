// components/TreeVisualizer/ProductNode.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { Node, Edge, Handle, Position } from '@xyflow/react';
import useProcessesByProductId from '@/hooks/useProcessesByProductId';
import { generateUniqueId } from '@/utils/generateUniqueId';
import { InfluenceProcess } from '@/types/influenceTypes';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';

interface ProductNodeProps {
  selectedProductId: string | null;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedProcessId: (processId: string | null) => void;
  setParentNodeId: (parentNodeId: string | null) => void;
}

const ProductNode: React.FC<ProductNodeProps> = ({
  selectedProductId,
  setNodes,
  setEdges,
  setSelectedProcessId,
  setParentNodeId,
}) => {
  const [productNode, setProductNode] = useState<Node | null>(null);
  const { getProcessesByProductId } = useProcessesByProductId();
  const { influenceProducts } = useInfluenceProducts();

  useEffect(() => {
    if (!selectedProductId) {
      console.log('No product selected, selectedProductId is null or empty');
      return;
    };

    const createRootNode = async () => {
      const rootNodeId = generateUniqueId();
      const selectedProduct = influenceProducts.find(product => product.id === selectedProductId);

      if (!selectedProduct) {
        console.error(`Product with id ${selectedProductId} not found`);
        return;
      }

      try {
        const processes = await getProcessesByProductId(selectedProductId);

        const rootNode: Node = {
          id: rootNodeId,
          type: 'productNode',
          position: { x: 0, y: 0 },
          data: {
            InfluenceProduct: selectedProduct, // Store the detailed product data
            ProductionChainData: {}, // Initialize empty ProductionChainData (to be defined later)
            processes, // Store the fetched processes in the node data
            onProcessSelected: async (processId: string) => {
              setSelectedProcessId(processId); // Trigger process creation
              setParentNodeId(rootNodeId); // Set the parent node ID for the process
            },
          },
        };

        console.log('A new Root ProductNode has been created:\n', rootNode);

        setNodes([rootNode]);
        setEdges([]);
        setProductNode(rootNode);

      } catch (error) {
        console.error('Error fetching processes for product with id:' + selectedProductId);
        console.error(error);
      }
    };

    createRootNode();
  }, [selectedProductId, getProcessesByProductId, setNodes, setEdges, setSelectedProcessId, setParentNodeId]);

  const handleSelectProcess = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedProcessId = event.target.value;
      if (selectedProcessId && productNode) {
        productNode.data.onProcessSelected(selectedProcessId);
      }
    },
    [productNode]
  );

  if (!productNode) return null;

  const { InfluenceProduct, processes } = productNode.data;

  return (
    <div className="product-node">
      <Handle type="target" position={Position.Top} />
      <div>
        <label htmlFor={`process-select-${productNode.id}`}>
          Select Process for {InfluenceProduct.name}:
        </label>
        <select id={`process-select-${productNode.id}`} onChange={handleSelectProcess}>
          <option value="">Select a process</option>
          {processes.map((process: InfluenceProcess) => (
            <option key={process.id} value={process.id}>
              {process.name}
            </option>
          ))}
        </select>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ left: 10 }} />
    </div>
  );
};

export default ProductNode;
