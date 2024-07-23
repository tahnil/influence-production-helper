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
            return ReactDOMServer.renderToString(<ProductNodeComponent node={data as ProductNode} onSelectProcess={onSelectProcess} processes={processList[data.influenceProduct.id] || []} />);
        case 'process':
            return ReactDOMServer.renderToString(<ProcessNodeComponent node={data as ProcessNode} />);
        default:
            return `<div class="card unknown-node">Unknown Node Type</div>`;
    }
};
