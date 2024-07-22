import React, { useRef, useEffect, useCallback } from 'react';
import useFetchTreeData from '../hooks/useFetchTreeData';
import { ExtendedD3HierarchyNode } from '../types/d3Types';
import { createD3Tree, updateD3Tree, collapse } from '../utils/d3TreeUtils';

const TreeVisualizer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const updateRef = useRef<(source: ExtendedD3HierarchyNode) => void>(() => {}); // Initialize with a placeholder function
    const rootRef = useRef<ExtendedD3HierarchyNode | null>(null);
    const iRef = useRef(0);
    const { treeData, loading, error } = useFetchTreeData('Cement', 200000);

    const click = useCallback((event: React.MouseEvent, d: ExtendedD3HierarchyNode): void => {
        if (d.children) {
            d._children = d.children;
            d.children = undefined;
        } else {
            d.children = d._children;
            d._children = undefined;
        }
        updateRef.current?.(d);
    }, []);

    const update = useCallback((source: ExtendedD3HierarchyNode): void => {
        updateD3Tree(source, containerRef, rootRef, { top: 20, right: 90, bottom: 30, left: 90 }, updateRef, click);
    }, [click]);

    updateRef.current = update;

    useEffect(() => {
        if (treeData) {
            createD3Tree(containerRef, treeData, rootRef, iRef, update, click);
        }
    }, [treeData, update, click]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return <div id="tree-container" ref={containerRef}></div>;
};

export default TreeVisualizer;
