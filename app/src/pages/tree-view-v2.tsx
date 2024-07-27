// src/pages/tree-view-v2.tsx

import React from 'react';
import TreeRenderer from '@/components/TreeVisualizer/TreeRenderer';
import { NodeContextProvider } from '@/contexts/NodeContext';

const HomePage: React.FC = () => {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Production Chain Configurator</h1>
            <NodeContextProvider>
                <TreeRenderer />
            </NodeContextProvider>
        </div>
    );
};

export default HomePage;
