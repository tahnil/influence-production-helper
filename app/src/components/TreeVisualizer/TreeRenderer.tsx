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
        desiredAmount,
        selectedProductId,
        processSelections,
        needsLayout,
        layoutTrigger,
        dispatch
    } = useFlow();

    const nodesInitialized = useNodesInitialized();

    useEffect(() => {
        if (nodes.length !== nodesRef.current.length) {
            nodesRef.current = nodes;

            // Request layout when node count changes
            dispatch({
                type: 'REQUEST_LAYOUT',
                payload: { trigger: 'NODE_CHANGE' }
            });
        }
    }, [nodes, nodesRef, dispatch]);

    useEffect(() => {
        if (nodesInitialized && nodes.every(node => node.measured?.width && node.measured?.height)) {
            dispatch({
                type: 'REQUEST_LAYOUT',
                payload: { trigger: 'MEASUREMENTS_READY' }
            });
        }
    }, [nodesInitialized, nodes, dispatch]);

    useEffect(() => {
        if (needsLayout && layoutTrigger) {
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
    }, [nodes, edges, dagreConfig, needsLayout, layoutTrigger, dispatch]);

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

    useEffect(() => {
        const lastProcessedSelection = processSelections[processSelections.length - 1];
        if (lastProcessedSelection) {
          const { nodeId: parentNodeId, processId } = lastProcessedSelection;
          
          if (processId && parentNodeId) {
            dispatch({
              type: 'REQUEST_PROCESS_NODE_CREATION',
              payload: {
                processId,
                parentNodeId
              }
            });
          }
        }
      }, [processSelections, dispatch]);

    return null;
};

export default TreeRenderer;
