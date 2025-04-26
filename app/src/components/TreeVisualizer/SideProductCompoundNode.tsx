import React from 'react';
import { Node, NodeProps, Handle, Position } from '@xyflow/react';
import { InfluenceNode } from '@/types/reactFlowTypes';

export interface SideProductCompoundNodeData {
  id: string;
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

export type SideProductCompoundNode = Node<SideProductCompoundNodeData>;

const SideProductCompoundNode: React.FC<NodeProps<SideProductCompoundNode>> = ({ data, id }) => {
  return (
    <div
      className="sideProductCompound-node"
      style={{
        position: 'relative',
        width: data.width,
        height: data.height,
        background: 'rgba(0, 0, 0, 0.2)', // Very subtle background
        borderRadius: '8px',
        padding: '10px'
      }}
    >
      {/* Handles for the sideProductCompound node */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
        id={`sideProductCompound-target-${id}`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
        id={`sideProductCompound-source-${id}`}
      />
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
          {data.label}<br />
          {id}
        </div>
      )}
    </div>
  );
};

export default SideProductCompoundNode;