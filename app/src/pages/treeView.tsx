// src/pages/treeView.tsx

import React from 'react';
import TreeRenderer from '@/components/TreeVisualizer/TreeRenderer'

const HomePage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-start h-full">
            <h1 className="text-2xl font-bold mb-4">Production Chain Configurator</h1>
            <div className="flex-grow w-full">
            <TreeRenderer />
        </div>
        </div>
    );
};

export default HomePage;
