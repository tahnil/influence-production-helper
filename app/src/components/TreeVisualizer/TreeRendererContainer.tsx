import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowProvider } from '@/contexts/FlowContext';
import ProductionChainCanvas from './ProductionChainCanvas';

const TreeRendererContainer: React.FC = () => {
    return (
        <ReactFlowProvider>
            <FlowProvider>
                <ProductionChainCanvas />
            </FlowProvider>
        </ReactFlowProvider>
    );
};

export default TreeRendererContainer;