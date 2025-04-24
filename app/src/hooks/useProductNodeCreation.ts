// hooks/useProductNodeCreation.ts

import { useCallback } from "react";
import useProductNodeBuilder from "@/utils/TreeVisualizer/useProductNodeBuilder";
import { FlowAction } from '@/contexts/FlowContext';
import { ProductNode } from "@/components/TreeVisualizer/ProductNode";

export function useProductNodeCreation(dispatch: React.Dispatch<FlowAction>) {
    const { buildProductNode } = useProductNodeBuilder();

    return useCallback(async (
        productId: string,
        amount: number = 1,
        isRoot: boolean = false
    ): Promise<ProductNode | null> => {
        try {
            if (!productId) {
                throw new Error('Product ID is undefined');
            }

            const productNode = await buildProductNode(productId, amount);

            if (!productNode) {
                throw new Error(`Failed to build product node for product ID: ${productId}`);
            }

            // Add callbacks
            const enhancedNode = {
                ...productNode,
                data: {
                    ...productNode.data,
                    handleSelectProcess: (processId: string, nodeId: string) => {
                        dispatch({
                            type: 'SELECT_PROCESS',
                            payload: { nodeId, processId }
                        });
                    },
                    handleSerialize: (focalNodeId: string) => {
                        dispatch({
                            type: 'SAVE_PRODUCTION_CHAIN',
                            payload: { focalNodeId }
                        });
                    },
                    selectedProcessId: null,
                    isRoot,
                }
            } as ProductNode;

            return enhancedNode;
        } catch (error) {
            console.error('Error creating product node:', error);
            dispatch({
                type: 'NODE_CREATION_FAILED',
                payload: { error: String(error) }
            });
            return null;
        }
    }, [buildProductNode, dispatch]);
}