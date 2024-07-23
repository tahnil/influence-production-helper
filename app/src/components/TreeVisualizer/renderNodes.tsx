// renderNodes.tsx
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { D3TreeNode } from '@/types/d3Types';
import ProductNodeComponent from '@/components/TreeVisualizer/ProductNodeComponent';
import ProcessNodeComponent from '@/components/TreeVisualizer/ProcessNodeComponent';
import { InfluenceProcess } from '@/types/influenceTypes';
import { ProductNode, ProcessNode } from '@/types/d3Types';

export const renderNodeHtml = (data: D3TreeNode, onSelectProcess: (processId: string, parentId: string) => void, processList: { [key: string]: InfluenceProcess[] }): string => {
    switch (data.type) {
        case 'product':
            const productNode = data as ProductNode;
            // console.log(`renderNodeHtml for ${productNode.name} with processes:`, productNode.processes);
            return ReactDOMServer.renderToString(
                <ProductNodeComponent 
                    node={productNode} 
                    processes={productNode.processes || []} 
                    onSelectProcess={onSelectProcess} 
                />
            );
        case 'process':
            return ReactDOMServer.renderToString(<ProcessNodeComponent node={data as ProcessNode} />);
        default:
            return `<div class="card unknown-node">Unknown Node Type</div>`;
    }
};
