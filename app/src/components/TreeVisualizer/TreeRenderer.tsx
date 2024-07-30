import React, { useState, useRef, useEffect } from 'react';
import ProductSelector from './ProductSelector';
import useInfluenceProducts from '@/hooks/useInfluenceProducts';

const TreeRenderer: React.FC = () => {
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const d3RenderContainer = useRef<HTMLDivElement | null>(null);
    const { influenceProducts, loading, error } = useInfluenceProducts();

    if (loading) return <div>Loading products...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="tree-renderer">
            <ProductSelector
                products={influenceProducts}
                onSelect={setSelectedProduct}
            />
            <div className="d3-render-area">
                <div ref={d3RenderContainer} />
            </div>
        </div>
    );
};

export default TreeRenderer;
