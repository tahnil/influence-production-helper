import React from "react";
import { Node, NodeProps } from "@xyflow/react";

export interface OutflowsCompoundNodeData {
    id: string;
    children: [];
    width: number;
    height: number;
    label?: string;
    [key: string]: unknown; // Allow for additional properties
}

export type OutflowsCompoundNode = Node<OutflowsCompoundNodeData>;

const OutflowsCompoundNode: React.FC<NodeProps<OutflowsCompoundNode>> = ({}) => {
    return (
        <div
            className="outflowsCompound-node"
            style={{
                position: "relative",
                width: 200,
                height: 100,
                borderRadius: "8px",
                padding: "10px",
            }}
        >
        </div>
    );
}