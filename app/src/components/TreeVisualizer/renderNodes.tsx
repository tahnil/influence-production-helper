// renderNodes.tsx
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { D3TreeNode, ExtendedD3HierarchyNode } from '@/types/d3Types';
import { InfluenceProcess } from '@/types/influenceTypes';
import { ProductNode, ProcessNode } from '@/types/d3Types';
import ProductNodeComponent from '@/components/TreeVisualizer/ProductNodeComponent';
import ProcessNodeComponent from '@/components/TreeVisualizer/ProcessNodeComponent';

export const renderNodeHtml = (
    data: D3TreeNode, 
    handleProcessSelection: (processId: string, parentId: string, source: ExtendedD3HierarchyNode) => void, 
    processList: { [key: string]: InfluenceProcess[] }
): string => {
    switch (data.type) {
        case 'product':
            const productNode = data as ProductNode;
            // console.log(`renderNodeHtml for ${productNode.name} with processes:`, productNode.processes);
            return ReactDOMServer.renderToString(
                <ProductNodeComponent 
                    node={productNode} 
                    processes={productNode.processes || []} 
                    handleProcessSelection={handleProcessSelection} 
                />
            );
        case 'process':
            return ReactDOMServer.renderToString(<ProcessNodeComponent node={data as ProcessNode} />);
        default:
            return `<div class="card unknown-node">Unknown Node Type</div>`;
    }
};
