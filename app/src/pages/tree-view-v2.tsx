// src/pages/tree-view-v2.tsx

import React from 'react';
import TreeRenderer from '@/components/TreeVisualizer/TreeRenderer';
import { NodeContextProvider } from '@/contexts/NodeContext';

const HomePage: React.FC = () => {
    return (
        <NodeContextProvider>
            <div className="p-4" style={{ position: 'relative', width: '100%', height: '100vh' }}>
                <h1 className="text-2xl font-bold mb-4">Production Chain Configurator</h1>
                <div id="d3-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <TreeRenderer />
                </div>
            </div>
        </NodeContextProvider>
    );
};

export default HomePage;
