// components/TreeVisualizer/ProductNodeComponent.tsx:

import React from 'react';
import { ProductNode } from '../../types/d3Types';
import ProcessSelector from './ProcessSelector';
import { InfluenceProcess } from '../../types/influenceTypes';

interface ProductNodeComponentProps {
    node: ProductNode;
    processes: InfluenceProcess[];
    onSelectProcess: (processId: string, parentId: string) => void;
}

const ProductNodeComponent: React.FC<ProductNodeComponentProps> = ({ node, processes, onSelectProcess }) => {
    console.log(`ProductNodeComponent for ${node.name} with processes:`, processes);
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
            <ProcessSelector processes={processes} onSelect={(processId) => onSelectProcess(processId, node.influenceProduct.id)} />
        </div>
    );
};

export default ProductNodeComponent;
