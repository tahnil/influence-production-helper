// components/TreeVisualizer/ProductNodeComponent.tsx

import React from 'react';
import { ProductNode } from '@/types/d3Types';
import { formatNumber } from '@/utils/formatNumber';

interface ProductNodeComponentProps {
    nodeData: ProductNode;
    onSelectProcess: (processId: string, node: ProductNode) => void;
}

const ProductNodeComponent: React.FC<ProductNodeComponentProps> = ({ nodeData, onSelectProcess }) => {
    const units = formatNumber(nodeData.amount, { minimumFractionDigits: 0, maximumFractionDigits: 6, scaleForUnit: true, scaleType: 'units' });
    const weight = formatNumber(nodeData.totalWeight, { scaleForUnit: true, scaleType: 'weight' });
    const volume = formatNumber(nodeData.totalVolume, { scaleForUnit: true, scaleType: 'volume' });

    return (
        <div id="productNodeCard" className="flex flex-col items-center">
            <div className="w-72 shadow-lg rounded-lg overflow-hidden font-sans font-light">
                <div id="titleSection" className="p-2 bg-mako-900 flex justify-center items-center gap-2.5 grid grid-cols-3">
                    <div id="productIcon" className="p-2">
                        <img src={nodeData.imageBase64} alt={nodeData.name} />
                    </div>
                    <div id="productName" className="col-span-2">
                        <span className="text-detailText">{nodeData.name}</span>
                    </div>
                </div>
                <div id="productStatsSection" className="bg-mako-900 py-1 px-2.5 flex flex-wrap items-start content-start gap-1">
                    <div className="p-[2px] rounded bg-mako-950">{nodeData.productData.category}</div>
                    <div className="p-[2px] rounded bg-mako-950">{nodeData.productData.massKilogramsPerUnit} kg</div>
                    <div className="p-[2px] rounded bg-mako-950">{nodeData.productData.volumeLitersPerUnit} L</div>
                </div>
                <div id="outputSection" className="p-2 bg-mako-950 flex justify-center items-center gap-2.5 grid grid-cols-3">
                    <div id="units" className="flex flex-col items-center">
                        <div
                            className="border border-transparent border-2 border-dotted cursor-pointer"
                            data-value={nodeData.amount}
                        >
                            {units.formattedValue}
                        </div>
                        <div>{units.unit}</div>
                    </div>
                    <div id="weight" className="flex flex-col items-center">
                        <div
                            className="border border-transparent border-2 border-dotted cursor-pointer"
                            data-value={nodeData.totalWeight}
                        >
                            {weight.formattedValue}
                        </div>
                        <div>{weight.unit}</div>
                    </div>
                    <div id="volume" className="flex flex-col items-center">
                        <div>{volume.formattedValue}</div>
                        <div>{volume.unit}</div>
                    </div>
                </div>
                <div id="moreInfosSection" className="bg-lunarGreen-500 py-1 px-2.5 flex flex-wrap items-start content-start gap-1">
                    <select
                        className="mt-1 w-full bg-lunarGreen-500"
                        id={`process-select-${nodeData.id}`}
                        name="process-select"
                        onChange={(e) => onSelectProcess(e.target.value, nodeData)}
                    >
                        <option value="">-- Select a Process --</option>
                        {nodeData.processes.map(process => (
                            <option key={process.id} value={process.id}>{process.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ProductNodeComponent;
