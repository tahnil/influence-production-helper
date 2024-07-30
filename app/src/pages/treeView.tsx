// src/pages/treeView.tsx

import React from 'react';
import TreeRenderer from '@/components/TreeVisualizer/TreeRenderer';

const HomePage: React.FC = () => {
    return (
        <div className="p-4" style={{ position: 'relative', width: '100%', height: '100vh' }}>
            <h1 className="text-2xl font-bold mb-4">Production Chain Configurator</h1>
            <div id="d3-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                <TreeRenderer />
            </div>
        </div>
    );
};

export default HomePage;