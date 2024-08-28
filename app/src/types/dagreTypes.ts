export interface DagreConfig {
    align: string;
    rankdir: string;
    nodesep: number;
    ranksep: number;
    edgesep: number;
    marginx: number;
    marginy: number;
    acyclicer: string;
    ranker: string;
    minlen: number;
    weight: number;
    labelpos: string;
    labeloffset: number;
    direction: string;
}

export interface ControlPanelProps {
    dagreConfig: DagreConfig;
    updateDagreConfig: (newConfig: Partial<DagreConfig>) => void;
}