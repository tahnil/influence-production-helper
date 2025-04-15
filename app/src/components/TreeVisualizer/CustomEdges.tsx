// components/TreeVisualizer/CustomEdges.tsx
import React from 'react';
import { EdgeProps, getSmoothStepPath, getBezierPath } from '@xyflow/react';

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
  // Check if this is a side product connection (data can be passed from edge creation)
  const isSideProductConnection = data?.isSideProductConnection || id.includes('sideProduct');
  
  // Use bezier path for side product connections
  if (isSideProductConnection) {
    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.5, // Adjust curvature as needed
    });

    return (
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: '#AAA', // Different color for side product connections
          strokeWidth: 1.5,
          strokeDasharray: '5, 5', // Dashed line for side products
          ...style,
        }}
      />
    );
  }
  
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