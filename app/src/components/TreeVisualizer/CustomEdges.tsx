// components/TreeVisualizer/CustomEdges.tsx
import React from 'react';
import { EdgeProps, getSmoothStepPath } from '@xyflow/react';

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data
}) => {
    
  // Use smooth step path for main flow connections
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      style={{
        stroke: '#DDD', // Light color that stands out on dark background
        strokeWidth: 2.5,
        ...style,
      }}
    />
  );
};

export default CustomEdge;