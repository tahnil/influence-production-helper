// components/TreeVisualizer/ProcessNodeComponent.tsx

import React from 'react';
import { ProcessNode } from '@/types/d3Types';
import { formatNumber } from '@/utils/formatNumber';
import { formatDuration } from '@/utils/formatDuration';

interface ProcessNodeComponentProps {
    nodeData: ProcessNode;
}

const ProcessNodeComponent: React.FC<ProcessNodeComponentProps> = ({ nodeData }) => {
    const formattedDuration = formatDuration(nodeData.totalRuns, nodeData.processData.mAdalianHoursPerSR);
    const runs = formatNumber(nodeData.totalRuns, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
        scaleForUnit: true,
        scaleType: 'runs'
    });

    const isResourceExtraction = nodeData.children.length === 0;

    return (
        <div id="processNodeCard" className="flex flex-col items-center">
            <div className={`w-${isResourceExtraction ? '64' : '72'} shadow-lg rounded-lg overflow-hidden font-sans font-light`}>
                <div id="titleSection" className="p-2 bg-falcon-800 flex justify-center items-center gap-2.5 grid grid-cols-3">
                    <div id="buildingIcon" className="p-2">
                        <img className="size-12 fill-falconWhite" src={nodeData.imageBase64} alt={nodeData.name} />
                    </div>
                    <div id="processName" className="col-span-2">
                        <span className="text-detailText">{nodeData.name}</span>
                    </div>
                </div>
                {isResourceExtraction ? (
                    <div id="noInputMsg" className="p-2 text-center text-sm text-gray-500 bg-mako-950">
                        No further inputs. This process extracts resources directly.
                    </div>
                ) : (
                    <div id="statsSection" className="p-2 bg-mako-950 flex justify-center items-center gap-2.5 grid grid-cols-2">
                        <div id="totalDuration" className="flex flex-col items-center">
                            <div>{formattedDuration}</div>
                            <div>duration</div>
                        </div>
                        <div id="totalRuns" className="flex flex-col items-center">
                            <div
                                className="border border-transparent border-2 border-dotted cursor-pointer"
                                data-value={nodeData.totalRuns}
                            >
                                {runs.formattedValue}
                            </div>
                            <div>{runs.unit}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProcessNodeComponent;
