import React from 'react';
import { ProductNode } from '@/types/d3Types';

interface ProductNodeComponentProps {
    nodeData: ProductNode;
    onSelectProcess?: (processId: string, node: ProductNode) => void;
}

const ProductNodeComponent: React.FC<ProductNodeComponentProps> = ({ nodeData, onSelectProcess }) => {
    return (
        <div className="product-node-card">
            <div className="title-section">
                <img src={nodeData.imageBase64} alt={nodeData.name} />
                <span>{nodeData.name}</span>
            </div>
            <div className="stats-section">
                <div>{nodeData.productData.category}</div>
                <div>{nodeData.amount} units</div>
                <div>{nodeData.totalWeight} kg</div>
                <div>{nodeData.totalVolume} L</div>
            </div>
            {onSelectProcess && (
                <div className="process-select">
                    <select onChange={(e) => onSelectProcess(e.target.value, nodeData)}>
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
