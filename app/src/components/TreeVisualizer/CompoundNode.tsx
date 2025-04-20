import React from 'react';
import { Node, NodeProps, Handle, Position } from '@xyflow/react';

export interface CompoundNodeData {
    id: string;
    width: string | number;
    height: string | number;
    children: []
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
          position={Position.Top}
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
      </div>
    );
  };

  export default CompoundNode;