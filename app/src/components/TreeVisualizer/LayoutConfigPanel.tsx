import React, { useState } from 'react';
import { DagreConfig } from '@/hooks/useDagreConfig';
import { ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LayoutConfigPanelProps {
    dagreConfig: DagreConfig;
    updateDagreConfig: (newConfig: Partial<DagreConfig>) => void;
}

const LayoutConfigPanel: React.FC<LayoutConfigPanelProps> = ({ dagreConfig, updateDagreConfig }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="layout-config-panel w-[350px] space-y-2 bg-mako-900 rounded-lg shadow-lg absolute top-4 right-4 z-10"
        >
            <div className="flex items-center justify-between space-x-4 px-4 py-2">
                <h3 className="text-lg font-semibold text-falconWhite">Layout Configuration</h3>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronDown className="h-4 w-4 text-falconWhite" />
                        <span className="sr-only">Toggle layout config</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4 px-4 pb-4">
                <label className="flex flex-col text-xs text-falconWhite">
                    Rank Direction:
                    <select
                        value={dagreConfig.rankdir}
                        onChange={(e) => updateDagreConfig({ rankdir: e.target.value })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    >
                        <option value="TB">Top to Bottom</option>
                        <option value="BT">Bottom to Top</option>
                        <option value="LR">Left to Right</option>
                        <option value="RL">Right to Left</option>
                    </select>
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Node Separation:
                    <input
                        type="number"
                        value={dagreConfig.nodesep}
                        onChange={(e) => updateDagreConfig({ nodesep: parseInt(e.target.value) })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Rank Separation:
                    <input
                        type="number"
                        value={dagreConfig.ranksep}
                        onChange={(e) => updateDagreConfig({ ranksep: parseInt(e.target.value) })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Edge Separation:
                    <input
                        type="number"
                        value={dagreConfig.edgesep}
                        onChange={(e) => updateDagreConfig({ edgesep: parseInt(e.target.value) })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Horizontal Margin:
                    <input
                        type="number"
                        value={dagreConfig.marginx}
                        onChange={(e) => updateDagreConfig({ marginx: parseInt(e.target.value) })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Vertical Margin:
                    <input
                        type="number"
                        value={dagreConfig.marginy}
                        onChange={(e) => updateDagreConfig({ marginy: parseInt(e.target.value) })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Align:
                    <select
                        value={dagreConfig.align}
                        onChange={(e) => updateDagreConfig({ align: e.target.value })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    >
                        <option value="UL">Up Left</option>
                        <option value="UR">Up Right</option>
                        <option value="DL">Down Left</option>
                        <option value="DR">Down Right</option>
                    </select>
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Acyclicer:
                    <select
                        value={dagreConfig.acyclicer}
                        onChange={(e) => updateDagreConfig({ acyclicer: e.target.value })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    >
                        <option value="undefined">None</option>
                        <option value="greedy">Greedy</option>
                    </select>
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Ranker:
                    <select
                        value={dagreConfig.ranker}
                        onChange={(e) => updateDagreConfig({ ranker: e.target.value })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    >
                        <option value="network-simplex">Network Simplex</option>
                        <option value="tight-tree">Tight Tree</option>
                        <option value="longest-path">Longest Path</option>
                    </select>
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Minimum Length:
                    <input
                        type="number"
                        value={dagreConfig.minlen}
                        onChange={(e) => updateDagreConfig({ minlen: parseInt(e.target.value) })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Weight:
                    <input
                        type="number"
                        value={dagreConfig.weight}
                        onChange={(e) => updateDagreConfig({ weight: parseInt(e.target.value) })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Label Position:
                    <select
                        value={dagreConfig.labelpos}
                        onChange={(e) => updateDagreConfig({ labelpos: e.target.value })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    >
                        <option value="l">Left</option>
                        <option value="c">Center</option>
                        <option value="r">Right</option>
                    </select>
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Label Offset:
                    <input
                        type="number"
                        value={dagreConfig.labeloffset}
                        onChange={(e) => updateDagreConfig({ labeloffset: parseInt(e.target.value) })}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default LayoutConfigPanel;