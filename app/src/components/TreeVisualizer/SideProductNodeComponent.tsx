// components/TreeVisualizer/SideProductNodeComponent.tsx

import React from 'react';
import { SideProductNode } from '../../types/d3Types';

interface SideProductNodeComponentProps {
    node: SideProductNode;
}

const SideProductNodeComponent: React.FC<SideProductNodeComponentProps> = ({ node }) => {
    return (
        <div className="border rounded-md p-2 bg-white shadow text-sm w-44">
            <div>SIDE PRODUCT</div>
            <div><strong>{node.name}</strong></div>
            <div>Type: {node.type}</div>
            <div>Weight: <span className="number-format" data-value={node.influenceProduct.massKilogramsPerUnit}></span> kg</div>
            <div>Volume: <span className="number-format" data-value={node.influenceProduct.volumeLitersPerUnit}></span> L</div>
            <div>Units: <span className="number-format" data-value={node.amount}></span></div>
            <div>Total Weight: <span className="number-format" data-value={node.totalWeight}></span> kg</div>
            <div>Total Volume: <span className="number-format" data-value={node.totalVolume}></span> L</div>
        </div>
    );
};

export default SideProductNodeComponent;
