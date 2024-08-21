// components/TreeVisualizer/ProductNodeComponent.tsx

import React from 'react';
import { ProductNodeData } from '@/types/reactFlowTypes';

interface ProductNodeComponentProps {
    data: ProductNodeData;
    id: string;
    buildProcessNodeCallback?: (selectedProcessId: string, parentNodeId: string) => void;
}

const ProductNodeComponent: React.FC<ProductNodeComponentProps> = ({ data, id, buildProcessNodeCallback }) => {
    const {
        name,
        productData,
        amount,
        totalWeight,
        totalVolume,
        processes,
        imageBase64,
    } = data;

    console.log("ProductNodeComponent data:", data);

    const handleProcessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedProcessId = e.target.value;
        console.log("selectedProcessId:", selectedProcessId);
        // Send id of this product node as parent node to buildProcessNodeCallback
        if (typeof buildProcessNodeCallback === 'function') {
            buildProcessNodeCallback(selectedProcessId, id);
        } else {
            console.error("buildProcessNodeCallback is not a function or undefined");
        }
    };

    if (!productData) {
        return <div>Error: Product data is missing</div>;
    }

    return (
        <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-300">
            <div className="flex items-center mb-2">
                <img src={imageBase64} alt={name} className="w-12 h-12 mr-2" />
                <span className="text-lg font-semibold">{name}</span>
            </div>
            <div className="text-sm text-gray-700 mb-2">
                <div>{productData.category || 'Unknown Category'}</div>
                <div>{amount} units</div>
                <div>{totalWeight} kg</div>
                <div>{totalVolume} L</div>
            </div>
            <div>
                <select className="w-full p-1 border rounded-md bg-gray-100 text-gray-700" onChange={handleProcessChange}>
                    <option value="">Select a Process</option>
                    {processes.map((process) => (
                        <option key={process.id} value={process.id}>
                            {process.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ProductNodeComponent;
