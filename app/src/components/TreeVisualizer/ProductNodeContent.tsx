// components/TreeVisualizer/ProductNodeContent.tsx
import React, { useContext } from 'react';
import { ProductNode } from '@/types/d3Types';
import { HandleProcessSelectionContext } from '@/contexts/NodeContext';
import ProcessSelector from '@/components/TreeVisualizer/ProcessSelector';

interface NodeContentProps {
    node: ProductNode;
}

const ProductNodeContent: React.FC<NodeContentProps> = ({ node }) => {
  const { handleProcessSelection, processes } = useContext(HandleProcessSelectionContext);
  const nodeProcesses = processes.filter(process => process.outputs.some(output => output.productId === node.id));

    return (
        <>
            <div><strong>{node.influenceProduct.name}</strong></div>
            <div>Type: {node.influenceProduct.type}</div>
            <div>Weight: {node.influenceProduct.massKilogramsPerUnit} kg</div>
            <div>Volume: {node.influenceProduct.volumeLitersPerUnit} L</div>
            <div>Units: {node.amount}</div>
            <ProcessSelector
        processes={nodeProcesses}
        onSelect={(processId) => handleProcessSelection(processId, node.id, node)}
            />
        </>
    );
};

export default ProductNodeContent;
