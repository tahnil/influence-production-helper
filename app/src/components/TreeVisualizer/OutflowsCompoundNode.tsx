import React from "react";
import { Node, NodeProps, Handle, Position } from "@xyflow/react";
import { BaseNodeData } from "@/types/reactFlowTypes";

export interface OutflowsCompoundNodeData extends BaseNodeData {
  width: number;
  height: number;
  processId?: string;
  childrenLayout?: {
    children: Node[];
    offsetX: number;
    offsetY: number;
  };
  label?: string;
}

export type OutflowsCompoundNode = Node<OutflowsCompoundNodeData>;

const OutflowsCompoundNode: React.FC<NodeProps<OutflowsCompoundNode>> = ({ data, id }) => {
  return (
    <div
      className="outflowsCompound-node"
      style={{
        position: "relative",
        width: data.width || 400,
        height: data.height || 200,
        background: "rgba(50, 70, 90, 0.1)", // Subtle background
        borderRadius: "8px",
        padding: "10px",
        border: "1px dashed rgba(100, 120, 140, 0.3)" // Subtle dashed border
      }}
    >
      {/* Handles for the outflowsCompound node */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#555" }}
        id={`outflowsCompound-source-${id}`}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#555" }}
        id={`outflowsCompound-target-${id}`}
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