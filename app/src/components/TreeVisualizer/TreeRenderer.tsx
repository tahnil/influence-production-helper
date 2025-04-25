// components/TreeVisualizer/TreeRenderer.tsx

import React, { useEffect, useRef } from 'react';
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
        layoutStatus,
        dispatch
    } = useFlow();

    const nodesInitialized = useNodesInitialized();
    const lastLayoutTimeRef = useRef(0);
    const measurementRequestedRef = useRef(false);

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

    // Check if all nodes have measurements - with debounce and safeguards
    useEffect(() => {
        // Avoid repeated measurement requests in short succession
        if (nodesInitialized &&
            nodes.length > 0 &&
            !measurementRequestedRef.current &&
            nodes.every(node => node.measured?.width && node.measured?.height)) {

            // Add 500ms minimum interval between layout requests to avoid loops
            const now = Date.now();
            if (now - lastLayoutTimeRef.current > 500) {
                measurementRequestedRef.current = true;

                dispatch({
                    type: 'REQUEST_LAYOUT',
                    payload: { trigger: 'MEASUREMENTS_READY' }
                });

                // Reset after a short delay
                setTimeout(() => {
                    measurementRequestedRef.current = false;
                }, 500);
            }
        }
    }, [nodesInitialized, nodes, dispatch]);

    // Apply layout when needed
    useEffect(() => {
        if (needsLayout && layoutTrigger) {
            console.log(`Applying layout with trigger: ${layoutTrigger}, node count: ${nodes.length}`);

            // Update the timestamp reference before dispatching
            lastLayoutTimeRef.current = Date.now();

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