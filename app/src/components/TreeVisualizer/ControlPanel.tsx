import React from 'react';
import { ControlPanelProps } from '@/types/dagreTypes';

const ControlPanel: React.FC<ControlPanelProps> = ({ dagreConfig, updateDagreConfig }) => {
    return (
        <div className="control-panel space-y-4">
            <h3 className="text-lg font-semibold">Layout Configuration</h3>

            <label className="flex flex-col text-xs">
                Rank Direction:
                <select
                    value={dagreConfig.rankdir}
                    onChange={(e) => updateDagreConfig({ rankdir: e.target.value })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                >
                    <option value="TB">Top to Bottom</option>
                    <option value="BT">Bottom to Top</option>
                    <option value="LR">Left to Right</option>
                    <option value="RL">Right to Left</option>
                </select>
            </label>

            <label className="flex flex-col text-xs">
                Node Separation:
                <input
                    type="number"
                    value={dagreConfig.nodesep}
                    onChange={(e) => updateDagreConfig({ nodesep: parseInt(e.target.value) })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                />
            </label>

            <label className="flex flex-col text-xs">
                Rank Separation:
                <input
                    type="number"
                    value={dagreConfig.ranksep}
                    onChange={(e) => updateDagreConfig({ ranksep: parseInt(e.target.value) })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                />
            </label>

            <label className="flex flex-col text-xs">
                Edge Separation:
                <input
                    type="number"
                    value={dagreConfig.edgesep}
                    onChange={(e) => updateDagreConfig({ edgesep: parseInt(e.target.value) })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                />
            </label>

            <label className="flex flex-col text-xs">
                Horizontal Margin:
                <input
                    type="number"
                    value={dagreConfig.marginx}
                    onChange={(e) => updateDagreConfig({ marginx: parseInt(e.target.value) })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                />
            </label>

            <label className="flex flex-col text-xs">
                Vertical Margin:
                <input
                    type="number"
                    value={dagreConfig.marginy}
                    onChange={(e) => updateDagreConfig({ marginy: parseInt(e.target.value) })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                />
            </label>

            <label className="flex flex-col text-xs">
                Align:
                <select
                    value={dagreConfig.align}
                    onChange={(e) => updateDagreConfig({ align: e.target.value })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                >
                    <option value="UL">Up Left</option>
                    <option value="UR">Up Right</option>
                    <option value="DL">Down Left</option>
                    <option value="DR">Down Right</option>
                </select>
            </label>

            <label className="flex flex-col text-xs">
                Acyclicer:
                <select
                    value={dagreConfig.acyclicer}
                    onChange={(e) => updateDagreConfig({ acyclicer: e.target.value })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                >
                    <option value="undefined">None</option>
                    <option value="greedy">Greedy</option>
                </select>
            </label>

            <label className="flex flex-col text-xs">
                Ranker:
                <select
                    value={dagreConfig.ranker}
                    onChange={(e) => updateDagreConfig({ ranker: e.target.value })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                >
                    <option value="network-simplex">Network Simplex</option>
                    <option value="tight-tree">Tight Tree</option>
                    <option value="longest-path">Longest Path</option>
                </select>
            </label>

            <label className="flex flex-col text-xs">
                Minimum Length:
                <input
                    type="number"
                    value={dagreConfig.minlen}
                    onChange={(e) => updateDagreConfig({ minlen: parseInt(e.target.value) })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                />
            </label>

            <label className="flex flex-col text-xs">
                Weight:
                <input
                    type="number"
                    value={dagreConfig.weight}
                    onChange={(e) => updateDagreConfig({ weight: parseInt(e.target.value) })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                />
            </label>

            <label className="flex flex-col text-xs">
                Label Position:
                <select
                    value={dagreConfig.labelpos}
                    onChange={(e) => updateDagreConfig({ labelpos: e.target.value })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                >
                    <option value="l">Left</option>
                    <option value="c">Center</option>
                    <option value="r">Right</option>
                </select>
            </label>

            <label className="flex flex-col text-xs">
                Label Offset:
                <input
                    type="number"
                    value={dagreConfig.labeloffset}
                    onChange={(e) => updateDagreConfig({ labeloffset: parseInt(e.target.value) })}
                    className="bg-gray-800 text-white text-xs p-2 rounded mt-1"
                />
            </label>
        </div>
    );
};

export default ControlPanel;
