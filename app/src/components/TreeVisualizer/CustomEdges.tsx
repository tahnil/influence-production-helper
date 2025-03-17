// components/TreeVisualizer/CustomEdge.tsx
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
}) => {
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
        stroke: '#DDD', // Light blue color that stands out on dark background
        strokeWidth: 2.5,    // Thicker line
        ...style,
      }}
    />
  );
};

export default CustomEdge;