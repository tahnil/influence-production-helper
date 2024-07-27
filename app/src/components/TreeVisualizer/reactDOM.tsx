// components/TreeVisualizer/reactDom.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import ProductNodeContent from '@/components/TreeVisualizer/ProductNodeContent';
import ProcessNodeContent from '@/components/TreeVisualizer/ProcessNodeContent';
import { D3TreeNode } from '@/types/d3Types';
import { NodeContextProvider } from '@/contexts/NodeContext';

export const renderReactComponent = (node: D3TreeNode, container: HTMLElement) => {
    let Component;
    switch (node.type) {
        case 'product':
            console.log(`[renderReactComponent] node:`, node);
            console.log('[renderReactComponent] container', container);
            Component = ProductNodeContent;
            break;
        case 'process':
            Component = ProcessNodeContent;
            break;
        default:
            ReactDOM.render(<div>Unknown Node Type</div>, container);
            return; // Stop further execution if container is not valid or the type is unknown
    }
    
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid or non-existent container for ReactDOM.render:', container);
        return;
    }

    // Render using ReactDOM directly into the container as a portal target
    ReactDOM.render(
        <NodeContextProvider>
            <Component node={node} />
        </NodeContextProvider>,
        container
    );
};
