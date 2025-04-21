import React from 'react';
import { Node, NodeProps, Handle, Position } from '@xyflow/react';
import { InfluenceNode } from '@/types/reactFlowTypes';

export interface CompoundNodeData {
  id: string;
  children: [];
  width: number;
  height: number;
  childrenLayout?: {
    children: InfluenceNode[];
    offsetX: number;
    offsetY: number;
  };
  label?: string;
  [key: string]: unknown; // Allow for additional properties
}

export type CompoundNode = Node<CompoundNodeData>;

const CompoundNode: React.FC<NodeProps<CompoundNode>> = ({ data, id }) => {
  return (
    <div
      className="compound-node"
      style={{
        position: 'relative',
        width: data.width,
        height: data.height,
        background: 'rgba(0, 0, 0, 0.2)', // Very subtle background
        borderRadius: '8px',
        padding: '10px'
      }}
    >
      {/* Handles for the compound node */}
      <Handle
        type="target"
        position={Position.Bottom}
        style={{ background: '#555' }}
        id={`compound-target-${id}`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
        id={`compound-source-${id}`}
      />
      {/* Render children nodes */}
      {data.children}
      {/* Optional label */}
      {data.label && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '5px 10px',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          {data.label}
        </div>
      )}
    </div>
  );
};

export default CompoundNode;