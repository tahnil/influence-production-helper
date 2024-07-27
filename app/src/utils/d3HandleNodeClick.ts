// utils/d3HandleNodeClick.ts
import { ExtendedD3HierarchyNode } from '@/types/d3Types';

const handleNodeClick = (
    updateRef: React.MutableRefObject<(source: ExtendedD3HierarchyNode | null) => void>
) => (event: React.MouseEvent, d: ExtendedD3HierarchyNode): void => {
    if (d.children) {
        d._children = d.children;
        d.children = undefined;
    } else {
        d.children = d._children;
        d._children = undefined;
    }
    updateRef.current(d);
};

export default handleNodeClick;
