// src/pages/treeView.tsx

import React from 'react';
import TreeRenderer from '@/components/TreeVisualizer/TreeRenderer'

const TreeViewPage: React.FC = () => {
    return (
        <div className="relative w-full h-full">
            <TreeRenderer />
        </div>
    );
};

export default TreeViewPage;
