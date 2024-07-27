// components/TreeVisualizer/reactDom.tsx
import React from 'react';
import ProductNodeContent from '@/components/TreeVisualizer/ProductNodeContent';
import ProcessNodeContent from '@/components/TreeVisualizer/ProcessNodeContent';
import { D3TreeNode } from '@/types/d3Types';
import ReactDOM from 'react-dom';

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
            // Render a fallback or nothing if the type is unknown
            ReactDOM.render(<div>Unknown Node Type</div>, container);
            return; // Stop further execution
    }

    // Render using ReactDOM directly into the container as a portal target
    ReactDOM.render(<Component node={node} container={container} />, container);
};
