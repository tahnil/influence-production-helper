// components/TreeVisualizer/reactDom.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProductNode, ProcessNode } from '@/types/d3Types';
import ProductNodeContent from '@/components/TreeVisualizer/ProductNodeContent';
import ProcessNodeContent from '@/components/TreeVisualizer/ProcessNodeContent';
import { NodeContextProvider } from '@/contexts/NodeContext';

export const renderReactComponent = (nodeData: ProductNode | ProcessNode, container: HTMLElement) => {
    const root = createRoot(container);
    console.log("[reactDOM] renderReactComponent triggered. Trying to render:", nodeData);
    
    if (nodeData.type === 'product') {
        root.render(
            <NodeContextProvider>
                <ProductNodeContent node={nodeData as ProductNode} container={container} />
            </NodeContextProvider>
        );
    } else if (nodeData.type === 'process') {
        root.render(
            <NodeContextProvider>
                <ProcessNodeContent node={nodeData as ProcessNode} container={container} />
            </NodeContextProvider>
        );
    } else {
        console.error('Unknown node type:', nodeData);
        root.unmount(); // Clean up if we encounter an unknown node type
    }
};
