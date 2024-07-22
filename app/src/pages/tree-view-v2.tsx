// src/pages/tree-view-v2.tsx

import React from 'react';
import TreeVisualizer from '@/components/TreeVisualizer/TreeVisualizer';

const HomePage: React.FC = () => {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Production Chain Configurator</h1>
            <TreeVisualizer />
        </div>
    );
};

export default HomePage;
