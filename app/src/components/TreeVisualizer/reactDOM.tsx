// components/TreeVisualizer/reactDom.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import ProductNodeContent from '@/components/TreeVisualizer/ProductNodeContent';
import ProcessNodeContent from '@/components/TreeVisualizer/ProcessNodeContent';
import { D3TreeNode } from '@/types/d3Types';
import { NodeContextProvider } from '@/contexts/NodeContext';

const rootMap = new Map<HTMLElement, ReturnType<typeof createRoot>>();

export const renderReactComponent = (node: D3TreeNode, container: HTMLElement) => {
    let Component: React.ComponentType<{ node: D3TreeNode }>;
    switch (node.type) {
        case 'product':
            console.log(`[renderReactComponent] node:`, node);
            console.log('[renderReactComponent] container', container);
            Component = ProductNodeContent as React.ComponentType<{ node: D3TreeNode }>;
            break;
        case 'process':
            Component = ProcessNodeContent as React.ComponentType<{ node: D3TreeNode }>;
            break;
        default:
            // Render a fallback if the node type is unknown
            const fallbackRoot = createRoot(container);  // Create root for fallback
            fallbackRoot.render(<div>Unknown Node Type</div>);
            return;
    }

    // Get or create a root instance for the container
    let root = rootMap.get(container);
    if (!root) {
        root = createRoot(container);  // Create a new root if one does not exist
        rootMap.set(container, root);
    }

    // Render the component within the root using the context provider
    root.render(
        <NodeContextProvider>
            <Component node={node} />
        </NodeContextProvider>
    );
};
