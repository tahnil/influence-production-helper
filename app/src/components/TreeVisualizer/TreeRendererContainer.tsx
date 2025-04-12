import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowProvider } from '@/contexts/FlowContext';
import TreeRenderer from './TreeRenderer';
import ProductionChainCanvas from './ProductionChainCanvas';

const TreeRendererContainer: React.FC = () => {
    return (
        <ReactFlowProvider>
            <FlowProvider>
                <ProductionChainCanvas />
                <TreeRenderer />
            </FlowProvider>
        </ReactFlowProvider>
    );
};

export default TreeRendererContainer;