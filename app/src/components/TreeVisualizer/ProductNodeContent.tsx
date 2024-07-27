// components/TreeVisualizer/ProductNodeContent.tsx
import React, { useContext } from 'react';
import ReactDOM  from 'react-dom';
import { ProductNode } from '@/types/d3Types';
import { HandleProcessSelectionContext } from '@/contexts/NodeContext';
import ProcessSelector from '@/components/TreeVisualizer/ProcessSelector';

interface NodeContentProps {
    node: ProductNode;
}

const ProductNodeContent: React.FC<NodeContentProps> = ({ node }) => {
    const { handleProcessSelection, processes } = useContext(HandleProcessSelectionContext);
    const container = document.querySelector('.react-container');
    const nodeProcesses = processes.filter(process => process.outputs.some(output => output.productId === node.id));
    console.log("[ProductNodeContent] Processes from context:", handleProcessSelection, processes);

    const content = (
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

    // Ensure the container exists before trying to use it as a portal target
    if (container) {
        return ReactDOM.createPortal(content, container);
    } else {
        console.error('The container for the portal is not found.');
        return null;
    }
};

export default ProductNodeContent;
