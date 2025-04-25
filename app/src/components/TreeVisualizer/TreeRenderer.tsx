// components/TreeVisualizer/TreeRenderer.tsx

import React, { useEffect } from 'react';
import { useNodesInitialized } from '@xyflow/react';
import { useFlow } from '@/contexts/FlowContext';
import { useReactFlowSetup } from '@/hooks/useReactFlowSetup';
import { useDagreConfig } from '@/hooks/useDagreConfig';
import '@xyflow/react/dist/style.css';

const TreeRenderer: React.FC = () => {
    const { nodes, edges } = useReactFlowSetup();
    const { dagreConfig } = useDagreConfig();
    const {
        nodesRef,
        needsLayout,
        layoutTrigger,
        dispatch
    } = useFlow();

    const nodesInitialized = useNodesInitialized();

    // Track node changes and update reference
    useEffect(() => {
        if (nodes.length !== nodesRef.current.length) {
            nodesRef.current = nodes;
            console.log(`Node count changed to ${nodes.length}, updating nodesRef`);
            
            // Request layout when node count changes
            dispatch({
                type: 'REQUEST_LAYOUT',
                payload: { trigger: 'NODE_CHANGE' }
            });
        }
    }, [nodes, nodesRef, dispatch]);

    // Check if all nodes have measurements
    useEffect(() => {
        if (nodesInitialized && nodes.every(node => node.measured?.width && node.measured?.height)) {
            dispatch({
                type: 'REQUEST_LAYOUT',
                payload: { trigger: 'MEASUREMENTS_READY' }
            });
        }
    }, [nodesInitialized, nodes, dispatch]);

    // Apply layout when needed
    useEffect(() => {
        if (needsLayout && layoutTrigger) {
            console.log(`Applying layout with trigger: ${layoutTrigger}, node count: ${nodes.length}`);
            dispatch({
                type: 'APPLY_LAYOUT',
                payload: {
                    nodes,
                    edges,
                    dagreConfig,
                    layoutTrigger: layoutTrigger
                }
            });
        }
    }, [nodes, edges, dagreConfig, layoutTrigger, needsLayout, dispatch]);

    return null;
};

export default TreeRenderer;