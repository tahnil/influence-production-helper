// hooks/useDagreConfig.ts

import { useState, useCallback } from 'react';

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

export const useDagreConfig = () => {
    const [dagreConfig, setDagreConfig] = useState<DagreConfig>({
        align: 'DR',
        rankdir: 'TB',
        nodesep: 40,
        ranksep: 70,
        edgesep: 10,
        marginx: 0,
        marginy: 0,
        acyclicer: 'greedy',
        ranker: 'network-simplex',
        minlen: 2,
        weight: 1,
        labelpos: 'r',
        labeloffset: 10,
        direction: 'LR',
    });

    const updateDagreConfig = useCallback((newConfig: Partial<DagreConfig>) => {
        setDagreConfig(prevConfig => ({
            ...prevConfig,
            ...newConfig,
        }));
    }, []);

    return { dagreConfig, updateDagreConfig };
};