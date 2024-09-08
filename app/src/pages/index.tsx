// pages/index.tsx
import React from 'react';
import TreeRendererContainer from '@/components/TreeVisualizer/TreeRendererContainer';
import { Toaster } from '@/components/ui/toaster';

const TreeViewPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <TreeRendererContainer />
            <Toaster />
        </div>
    );
};

export default TreeViewPage;
