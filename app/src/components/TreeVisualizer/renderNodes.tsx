// renderNodes.tsx
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { D3TreeNode, ProductNode, ProcessNode, SideProductNode } from '@/types/d3Types';
import ProductNodeComponent from '@/components/TreeVisualizer/ProductNodeComponent';
import ProcessNodeComponent from '@/components/TreeVisualizer/ProcessNodeComponent';
import SideProductNodeComponent from '@/components/TreeVisualizer/SideProductNodeComponent';

export const renderNodeHtml = (data: D3TreeNode): string => {
    switch (data.type) {
        case 'product':
            return ReactDOMServer.renderToString(<ProductNodeComponent node={data as ProductNode} />);
        case 'process':
            return ReactDOMServer.renderToString(<ProcessNodeComponent node={data as ProcessNode} />);
        case 'sideProduct':
            return ReactDOMServer.renderToString(<SideProductNodeComponent node={data as SideProductNode} />);
        default:
            return `<div class="card unknown-node">Unknown Node Type</div>`;
    }
};
