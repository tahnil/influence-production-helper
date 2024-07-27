// components/TreeVisualizer/ProductNodeContent.tsx
import React, { useContext } from 'react';
import { ProductNode } from '@/types/d3Types';
import { InfluenceProcess } from '@/types/influenceTypes';
import ProcessSelector from '@/components/TreeVisualizer/ProcessSelector';

interface NodeContentProps {
    node: ProductNode;
    processes: InfluenceProcess[];
    handleProcessSelection: (processId: string, parentId: string, source: ExtendedD3HierarchyNode) => void;
}

const ProductNodeContent: React.FC<NodeContentProps> = ({
    node,
    processes,
    handleProcessSelection,
}) => {
    const { id: parentId } = node;
    console.log(`[ProductNodeContent] node: ${JSON.stringify(node)}`);
    console.log(`[ProductNodeContent] processes: ${JSON.stringify(processes)}`);
    return (
        <>
            <div><strong>{node.influenceProduct.name}</strong></div>
            <div>Type: {node.influenceProduct.type}</div>
            <div>Weight: {node.influenceProduct.massKilogramsPerUnit} kg</div>
            <div>Volume: {node.influenceProduct.volumeLitersPerUnit} L</div>
            <div>Units: {node.amount}</div>
            <ProcessSelector
                processes={processes}
                onSelect={(processId) => handleProcessSelection(processId, parentId, node)}
            />
        </>
    );
};

export default ProductNodeContent;
