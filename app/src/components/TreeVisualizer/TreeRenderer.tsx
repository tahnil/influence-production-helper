// components/TreeVisualizer/TreeRenderer.tsx

import React, {
    useCallback,
    useEffect,
    useRef
} from 'react';
import {
    useNodesInitialized,
} from '@xyflow/react';
import { useFlow } from '@/contexts/FlowContext';
import '@xyflow/react/dist/style.css';
import { useReactFlowSetup } from '@/hooks/useReactFlowSetup';
import { useDagreConfig } from '@/hooks/useDagreConfig';

const TreeRenderer: React.FC = () => {

    const {
        nodes,
        edges,
    } = useReactFlowSetup();

    const {
        dagreConfig,
    } = useDagreConfig();

    const {
        nodesRef,
        desiredAmount,
        nodesReady,
        needsLayout,
        selectedProductId,
        processSelections,
        dispatch
    } = useFlow();

    const layoutTriggerRef = useRef<boolean>(false);

    const prevNodesRef = useRef<number>(0);

    const nodesInitialized = useNodesInitialized();

    useEffect(() => {
        if (nodes.length !== nodesRef.current.length) {
            nodesRef.current = nodes;
        }
    }, [nodes, nodesRef]);

    useEffect(() => {
        if (nodesInitialized && nodes.every(node => node.measured?.width && node.measured?.height)) {
            dispatch({
                type: 'SET_NODES_READY',
                payload: true
            });
        } else {
            dispatch({
                type: 'SET_NODES_READY',
                payload: false
            });
        }
    }, [nodesInitialized, nodes, dispatch]);


    const applyLayoutIfNeeded = useCallback(() => {
        // Check if preliminary layout is needed
        if (prevNodesRef.current !== nodes.length || needsLayout) {

            // Use fallback dimensions for nodes without measurements
            const nodesWithFallbackDimensions = nodes.map(node => {
                if (!node.measured?.width || !node.measured?.height) {
                    return {
                        ...node,
                        measured: {
                            width: node.type === 'processNode' ? 250 : 300,
                            height: node.type === 'processNode' ? 120 : 150,
                            ...node.measured
                        }
                    };
                }
                return node;
            });

            // Dispatch the specialized layout action
            dispatch({
                type: 'APPLY_LAYOUT',
                payload: {
                    nodes: nodesWithFallbackDimensions,
                    edges,
                    dagreConfig,
                    needsReset: true
                }
            });

            prevNodesRef.current = nodes.length;
        }
        // Apply more precise layout once all measurements are ready
        else if (layoutTriggerRef.current && nodesReady) {

            // Dispatch the specialized layout action
            dispatch({
                type: 'APPLY_LAYOUT',
                payload: {
                    nodes,
                    edges,
                    dagreConfig,
                    needsReset: false
                }
            });

            layoutTriggerRef.current = false;
        }
    }, [nodesReady, dagreConfig, needsLayout, dispatch]);

    useEffect(() => {
        applyLayoutIfNeeded();
    }, [applyLayoutIfNeeded]);

    useEffect(() => {
        if (nodesReady) {
            layoutTriggerRef.current = true;
            applyLayoutIfNeeded(); // Apply layout immediately when triggered
        }
    }, [nodesReady, dagreConfig, applyLayoutIfNeeded]);

    useEffect(() => {
        if (selectedProductId) {
            dispatch({
                type: 'BATCH_UPDATE',
                payload: {
                    nodes: [],
                    edges: []
                }
            });

            dispatch({
                type: 'REQUEST_PRODUCT_NODE_CREATION',
                payload: {
                    productId: selectedProductId,
                    amount: desiredAmount,
                    isRoot: true
                }
            });
        }
    }, [selectedProductId, dispatch]);

    const lastProcessedSelectionRef = useRef<number>(0);

    useEffect(() => {
        // Only process selections we haven't seen yet
        if (processSelections.length > lastProcessedSelectionRef.current) {
            // Get only the newest selection
            const newSelection = processSelections[processSelections.length - 1];
            const { nodeId: parentNodeId, processId } = newSelection;

            if (processId && parentNodeId) {
                // Update our ref to mark this selection as processed
                lastProcessedSelectionRef.current = processSelections.length;

                // Request node creation through the reducer
                dispatch({
                    type: 'REQUEST_PROCESS_NODE_CREATION',
                    payload: {
                        processId,
                        parentNodeId
                    }
                });
            }
        }
    }, [processSelections]);

    return null;
};

TreeRenderer.displayName = 'TreeRenderer';

export default TreeRenderer;
