// src/pages/index.tsx
import React from 'react';
import TreeRenderer from '@/components/TreeVisualizer/TreeRenderer'

const TreeViewPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <TreeRenderer />
        </div>
    );
};

export default TreeViewPage;
