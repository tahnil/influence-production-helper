import React, { useState } from 'react';
import { DagreConfig } from '@/hooks/useDagreConfig';
import { ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useFlow } from '@/contexts/FlowContext';

interface LayoutConfigPanelProps {
    dagreConfig: DagreConfig;
    updateDagreConfig: (newConfig: Partial<DagreConfig>) => void;
}

const LayoutConfigPanel: React.FC<LayoutConfigPanelProps> = ({ dagreConfig, updateDagreConfig }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { dispatch } = useFlow();

    const handleConfigUpdate = (newConfig: Partial<DagreConfig>) => {
        console.log("[LayoutConfigPanel | Dagre] Updating dagre config:", newConfig);
        updateDagreConfig(newConfig);
        
        // Request a layout with a 'CONFIG_CHANGE' trigger
        dispatch({
            type: 'REQUEST_LAYOUT',
            payload: { trigger: 'CONFIG_CHANGE' }
        });
    };

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
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] rankdir changed to:", e.target.value);
                            handleConfigUpdate({ rankdir: e.target.value });
                        }}
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
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] nodesep changed to:", e.target.value);
                            handleConfigUpdate({ nodesep: parseInt(e.target.value) });
                        }}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Rank Separation:
                    <input
                        type="number"
                        value={dagreConfig.ranksep}
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] ranksep changed to:", e.target.value);
                            handleConfigUpdate({ ranksep: parseInt(e.target.value) });
                        }}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Edge Separation:
                    <input
                        type="number"
                        value={dagreConfig.edgesep}
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] edgesep changed to:", e.target.value);
                            handleConfigUpdate({ edgesep: parseInt(e.target.value) });
                        }}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Horizontal Margin:
                    <input
                        type="number"
                        value={dagreConfig.marginx}
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] marginx changed to:", e.target.value);
                            handleConfigUpdate({ marginx: parseInt(e.target.value) });
                        }}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Vertical Margin:
                    <input
                        type="number"
                        value={dagreConfig.marginy}
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] marginy changed to:", e.target.value);
                            handleConfigUpdate({ marginy: parseInt(e.target.value) });
                        }}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Align:
                    <select
                        value={dagreConfig.align}
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] align changed to:", e.target.value);
                            handleConfigUpdate({ align: e.target.value });
                        }}
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
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] acyclicer changed to:", e.target.value);
                            handleConfigUpdate({ acyclicer: e.target.value });
                        }}
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
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] ranker changed to:", e.target.value);
                            handleConfigUpdate({ ranker: e.target.value });
                        }}
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
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] minlen changed to:", e.target.value);
                            handleConfigUpdate({ minlen: parseInt(e.target.value) });
                        }}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Weight:
                    <input
                        type="number"
                        value={dagreConfig.weight}
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] weight changed to:", e.target.value);
                            handleConfigUpdate({ weight: parseInt(e.target.value) });
                        }}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>

                <label className="flex flex-col text-xs text-falconWhite">
                    Label Position:
                    <select
                        value={dagreConfig.labelpos}
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] labelpos changed to:", e.target.value);
                            handleConfigUpdate({ labelpos: e.target.value });
                        }}
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
                        onChange={(e) => {
                            console.log("[LayoutConfigPanel | Dagre] labeloffset changed to:", e.target.value);
                            handleConfigUpdate({ labeloffset: parseInt(e.target.value) });
                        }}
                        className="bg-mako-800 text-falconWhite text-xs p-2 rounded mt-1"
                    />
                </label>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default LayoutConfigPanel;