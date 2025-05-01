import React from "react";
import { Node, NodeProps, Handle, Position } from "@xyflow/react";
import { BaseNodeData } from "@/types/reactFlowTypes";

export interface OutflowsCompoundNodeData extends BaseNodeData {
  width?: number;
  height?: number;
  processId?: string;
  childrenLayout?: {
    children: Node[];
    offsetX: number;
    offsetY: number;
  };
  label?: string;
}

export type OutflowsCompoundNode = Node<OutflowsCompoundNodeData>;

const OutflowsCompoundNode: React.FC<NodeProps<OutflowsCompoundNode>> = ({ data, id, width, height }) => {
  return (
    <div
      className="outflowsCompound-node"
      style={{
        position: "relative",
        background: "rgba(50, 70, 90, 0.1)", // Subtle background
        borderRadius: "8px",
        padding: "10px",
        border: "1px dashed rgba(100, 120, 140, 0.3)", // Subtle dashed border
        width: width,
        height: height,
      }}
    >
      {/* Handles for the outflowsCompound node */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          bottom: 0,  // Position at bottom edge
          left: "50%", // Center horizontally
          transform: "translate(-50%, 50%)" // Center the handle
        }}
        id={`outflowsCompound-target-${id}`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          bottom: 0,  // Position at bottom edge
          left: "50%", // Center horizontally
          transform: "translate(-50%, 50%)" // Center the handle
        }}
        id={`outflowsCompound-source-${id}`}
      />

      {/* Optional label */}
      {data.label && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%) translateY(-50%)",
            background: "rgba(50, 70, 90, 0.2)",
            padding: "5px 10px",
            borderRadius: "8px",
            fontSize: "0.8rem",
            fontWeight: "bold"
          }}
        >
          {data.label}<br />
          {id}
        </div>
      )}
    </div>
  );
};

export default OutflowsCompoundNode;