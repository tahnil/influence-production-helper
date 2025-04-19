import React from 'react';
import { Node, NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
// import { CompoundNode } from '@/types/reactFlowTypes';


export type CompoundNode = Node<{
    id: string;
    width: string | number;
    height: string | number;
    children: React.ReactNode;
}>;

const CompoundNode: React.FC<NodeProps<CompoundNode>> = ({ data }) => {
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
          id={`compound-target-${data.id}`}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: '#555' }}
          id={`compound-source-${data.id}`}
        />
        
        {/* Children (process node and its side products) are rendered inside */}
        {data.children}
      </div>
    );
  };

  export default CompoundNode;