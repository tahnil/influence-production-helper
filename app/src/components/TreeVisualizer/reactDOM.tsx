// components/TreeVisualizer/reactDom.tsx
import { createRoot } from 'react-dom/client';
import React from 'react';
import ProductNodeContent from '@/components/TreeVisualizer/ProductNodeContent';
import ProcessNodeContent from '@/components/TreeVisualizer/ProcessNodeContent';
import { D3TreeNode } from '@/types/d3Types';
import { InfluenceProcess } from '@/types/influenceTypes';
import { HandleProcessSelectionContext } from '@/contexts/NodeContext';

const rootMap = new Map<HTMLElement, ReturnType<typeof createRoot>>();

export const renderReactComponent = (node: D3TreeNode, container: HTMLElement, processList: { [key: string]: InfluenceProcess[] }) => {
    let Component;
    let element;
    switch (node.type) {
        case 'product':
            console.log(`[renderReactComponent] node:`, node);
            console.log(`[renderReactComponent] node:`, processList);
            Component = ProductNodeContent;
            element = (
                <HandleProcessSelectionContext.Consumer>
                    {({ handleProcessSelection }) => (
                        <Component node={node} processes={processList || []} handleProcessSelection={handleProcessSelection} />
                    )}
                </HandleProcessSelectionContext.Consumer>
            );
            break;
        case 'process':
            Component = ProcessNodeContent;
            element = <Component node={node} />;
            break;
        default:
            element = <div>Unknown Node Type</div>;
            break;
    }

    let root = rootMap.get(container);
    if (!root) {
        root = createRoot(container);
        rootMap.set(container, root);
    }

    root.render(element);
};
