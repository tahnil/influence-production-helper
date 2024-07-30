// hooks/useFetchTreeData.ts
import { useState, useEffect } from 'react';
import { D3TreeNode } from '../types/d3Types';

const useFetchTreeData = (product: string, amount: number) => {
    const [treeData, setTreeData] = useState<D3TreeNode | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/configureProductionChainDynamic', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ product, amount }),
                });
                const data = await response.json();
                setTreeData(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [product, amount]);

    return { treeData, loading, error };
};

export default useFetchTreeData;
