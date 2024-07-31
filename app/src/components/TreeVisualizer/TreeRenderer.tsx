// components/TreeRenderer.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ProductSelector from './ProductSelector';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';
import useProductNodeBuilder from './productNodeBuilder';

const TreeRenderer: React.FC = () => {
    const [selectedProductId, setSelectedProduct] = useState<string | null>(null);
    const d3RenderContainer = useRef<HTMLDivElement | null>(null);
    const { influenceProducts, loading, error } = useInfluenceProducts();

    // useCallback to stabilize the setSelectedProduct function
    const handleSelectProduct = useCallback((productId: string | null) => {
        console.log('[TreeRenderer] Product selected:', productId);
        setSelectedProduct(productId);
    }, []);

    const { productNode, productLoading, productError, processesLoading, processesError } = useProductNodeBuilder({ selectedProductId });

    useEffect(() => {
        if (productNode) {
            console.log('[TreeRenderer] Product Node:', productNode);
            // Your logic to render or use productNode here
        }
    }, [productNode]);

    if (loading || productLoading || processesLoading) return <div>Loading products...</div>;
    if (error || productError || processesError) return <div>Error: {error || productError || processesError}</div>;

    return (
        <div className="tree-renderer">
            <ProductSelector
                products={influenceProducts}
                selectedProductId={selectedProductId}
                onSelect={handleSelectProduct}
            />
            <div className="d3-render-area">
                <div ref={d3RenderContainer} />
            </div>
        </div>
    );
};

export default TreeRenderer;
