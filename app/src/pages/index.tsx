// pages/index.tsx
import React from 'react';
import TreeRendererContainer from '@/components/TreeVisualizer/TreeRendererContainer';

const TreeViewPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <TreeRendererContainer />
        </div>
    );
};

export default TreeViewPage;
