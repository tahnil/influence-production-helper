// components/TreeVisualizer/ProcesssNodeComponent.tsx

import React, { useEffect, useState } from 'react';
import { Node, Edge, Handle, Position } from '@xyflow/react';
import useProcessDetails from '@/hooks/useProcessDetails';
import { generateUniqueId } from '@/utils/generateUniqueId';

interface ProcessNodeProps {
  selectedProcessId: string | null;
  parentNodeId: string | null;
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

const ProcessNode: React.FC<ProcessNodeProps> = ({
  selectedProcessId,
  parentNodeId,
  nodes,
  edges,
  setNodes,
  setEdges,
}) => {
  const [processNode, setProcessNode] = useState<Node | null>(null);
  const { getProcessDetails } = useProcessDetails();

  useEffect(() => {
    if (!selectedProcessId || !parentNodeId) {
      console.log('No process selected or no parentNodeId');
      return;
    };

    const removeNodeAndDescendants = (nodeId: string) => {
      const descendantEdges = nodes.filter(edge => edge.source === nodeId);

      descendantEdges.forEach(edge => {
        removeNodeAndDescendants(edge.target);
      });

      setNodes(nds => nds.filter(node => node.id !== nodeId));
      setEdges(eds => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    };

    const createProcessNode = async () => {
      if (!selectedProcess) {
        console.error(`Process with id ${selectedProcessId} not found`);
        return;
      }

      // Check if there is an existing process node connected to this parent product node
      const existingProcessNode = nodes.find((node) =>
        node.parentId === parentNodeId && node.type === 'processNode'
      );

      if (existingProcessNode) {
        removeNodeAndDescendants(existingProcessNode.id);
      }

      const processNodeId = generateUniqueId();
      const selectedProcess = await getProcessDetails(selectedProcessId);

      const processNode: Node = {
        id: processNodeId,
        type: 'processNode',
        position: { x: 200, y: 100 },
        data: {
          processName: selectedProcess.name,
          inputProducts: selectedProcess.inputs.map(input => input.productId),
        },
        parentId: parentNodeId,
      };

      setNodes((nds) => nds.concat(processNode));
      setProcessNode(processNode);

      const newEdge: Edge = {
        id: generateUniqueId(),
        source: parentNodeId,
        target: processNodeId,
      };

      setEdges((eds) => eds.concat(newEdge)); 
    };

    createProcessNode();
  }, [selectedProcessId, parentNodeId, getProcessDetails, nodes, edges, setNodes, setEdges]);

  if (!processNode) return null;

  const { processName, inputProducts } = processNode.data;

  return (
    <div className="process-node">
      <Handle type="target" position={Position.Top} />
      <div>
        <strong>{processName}</strong>
        <ul>
          {inputProducts.map((product) => (
            <li key={product}>{product}</li>
          ))}
        </ul>
      </div>
      <Handle type="source" position={Position.Bottom} id={`source-${processNode.id}`} />
    </div>
  );
};

export default ProcessNode;
