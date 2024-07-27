// utils/addNodeToTree.ts
import { D3TreeNode, ProcessNode, ProductNode } from '@/types/d3Types';

const addNodeToTree = (node: D3TreeNode, newNode: ProcessNode | ProductNode, parentId: string): D3TreeNode => {
    if (node.type === 'product' && node.id === parentId) {
        if (newNode.type === 'process') {
            if (!node.children) {
                node.children = [];
            }
            const existingProcessIndex = node.children.findIndex(child => child.type === 'process');
            if (existingProcessIndex !== -1) {
                if (node.children[existingProcessIndex].id === newNode.id) {
                    return node;
                } else {
                    node.children[existingProcessIndex] = newNode as ProcessNode;
                    return { ...node };
                }
            } else {
                node.children.push(newNode as ProcessNode);
                return { ...node };
            }
        }
    } else if (node.children) {
        node.children = node.children.map(child => addNodeToTree(child, newNode, parentId));
    }
    return node;
};

export default addNodeToTree;
