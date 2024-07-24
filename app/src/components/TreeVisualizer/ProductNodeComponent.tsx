// components/TreeVisualizer/ProductNodeComponent.tsx:

import React from 'react';
import { ExtendedD3HierarchyNode, ProductNode } from '../../types/d3Types';
import { InfluenceProcess } from '../../types/influenceTypes';
import ProcessSelector from './ProcessSelector';

interface ProductNodeComponentProps {
    node: ProductNode;
    processes: InfluenceProcess[];
    handleProcessSelection: (processId: string, parentId: string, source: ExtendedD3HierarchyNode) => void;
}

const ProductNodeComponent: React.FC<ProductNodeComponentProps> = ({ node, processes, handleProcessSelection }) => {
    console.log(`[function 'ProductNodeComponent' (ProductNodeComponent.tsx)]:\n#########\nRender ProductNodeComponent for ${node.name} with processes:`, processes,`.\n\nAnd here's the node object:`, node);
    return (
        <div className="border rounded-md p-2 bg-white shadow text-sm w-44">
            <div>PRODUCT</div>
            <div><strong>{node.name}</strong></div>
            <div>Type: {node.influenceProduct.type}</div>
            <div>Weight: <span className="number-format" data-value={node.influenceProduct.massKilogramsPerUnit}></span> kg</div>
            <div>Volume: <span className="number-format" data-value={node.influenceProduct.volumeLitersPerUnit}></span> L</div>
            <div>Units: <span className="number-format" data-value={node.amount}></span></div>
            <div>Total Weight: <span className="number-format" data-value={node.totalWeight}></span> kg</div>
            <div>Total Volume: <span className="number-format" data-value={node.totalVolume}></span> L</div>
            <ProcessSelector 
                processes={processes} 
                onSelect={(processId) => handleProcessSelection(processId, node.influenceProduct.id, node)} 
            />
        </div>
    );
};

export default ProductNodeComponent;
