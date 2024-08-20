import React from 'react';
import { ProductNode } from '@/types/d3Types';

interface ProductNodeComponentProps {
    nodeData: ProductNode;
    onSelectProcess?: (processId: string, node: ProductNode) => void;
}

const ProductNodeComponent: React.FC<ProductNodeComponentProps> = ({ nodeData, onSelectProcess }) => {
    return (
        <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-300">
            <div className="flex items-center mb-2">
                <img src={nodeData.imageBase64} alt={nodeData.name} className="w-12 h-12 mr-2" />
                <span className="text-lg font-semibold">{nodeData.name}</span>
            </div>
            <div className="text-sm text-gray-700 mb-2">
                <div>{nodeData.productData.category}</div>
                <div>{nodeData.amount} units</div>
                <div>{nodeData.totalWeight} kg</div>
                <div>{nodeData.totalVolume} L</div>
            </div>
            {onSelectProcess && (
                <div>
                    <select 
                        onChange={(e) => onSelectProcess(e.target.value, nodeData)} 
                        className="w-full p-1 border rounded-md bg-gray-100 text-gray-700"
                    >
                        <option value="">Select a Process</option>
                        {nodeData.processes.map(process => (
                            <option key={process.id} value={process.id}>
                                {process.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};

export default ProductNodeComponent;
