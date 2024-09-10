import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowProvider } from '@/contexts/FlowContext';
import TreeRenderer from './TreeRenderer';

const TreeRendererContainer: React.FC = () => {
    return (
        <ReactFlowProvider>
            <FlowProvider>
                <TreeRenderer />
            </FlowProvider>
        </ReactFlowProvider>
    );
};

export default TreeRendererContainer;