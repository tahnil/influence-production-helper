// components/TreeVisualizer/TreeRenderer.tsx

import React, { useEffect, useRef } from 'react';
import { useNodesInitialized } from '@xyflow/react';
import { useFlow } from '@/contexts/FlowContext';
import { useReactFlowSetup } from '@/hooks/useReactFlowSetup';
import '@xyflow/react/dist/style.css';

const TreeRenderer: React.FC = () => {
    const { nodes, edges } = useReactFlowSetup();
    const {
        dispatch
    } = useFlow();

    const nodesInitialized = useNodesInitialized();
    const lastLayoutTimeRef = useRef(0);
    const measurementRequestedRef = useRef(false);

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

    return null;
};

export default TreeRenderer;