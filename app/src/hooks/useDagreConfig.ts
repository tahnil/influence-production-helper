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
    width: number;
    height: number;
    labelpos: string;
    labeloffset: number;
    direction: string;
}

export const useDagreConfig = () => {
    const [dagreConfig, setDagreConfig] = useState<DagreConfig>({
        align: 'DL',
        rankdir: 'TB',
        nodesep: 50,
        ranksep: 150,
        edgesep: 50,
        marginx: 0,
        marginy: 0,
        acyclicer: 'greedy',
        ranker: 'network-simplex',
        minlen: 1,
        weight: 1,
        width: 1,
        height: 1,
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