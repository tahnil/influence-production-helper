// utils/handleProcessSelection.ts
import { ExtendedD3HierarchyNode, ProcessNode, ProductNode } from '@/types/d3Types';
import { ProcessInput, InfluenceProcess } from '@/types/influenceTypes';
import { generateUniqueId } from '@/utils/generateUniqueId';

const fetchProcessesForProduct = async (productId: string) => {
    const response = await fetch(`/api/processes?outputProductId=${productId}`);
    if (!response.ok) throw new Error('Failed to fetch processes');
    const processes = await response.json();
    return processes;
};

const handleProcessSelection = async (
    processId: string,
    parentId: string,
    processList: { [key: string]: InfluenceProcess[] }
) => {
    const response = await fetch(`/api/inputs?processId=${processId}`);
    const inputs: ProcessInput[] = await response.json();
    const processesPromises = inputs.map(input => fetchProcessesForProduct(input.product.id));
    const productsWithProcesses = await Promise.all(processesPromises);

    const inputNodes = inputs.map((input, index) => ({
        id: input.product.id,
        name: input.product.name,
        type: 'product',
        influenceProduct: input.product,
        amount: parseFloat(input.unitsPerSR),
        totalWeight: 0,
        totalVolume: 0,
        children: [],
        processes: productsWithProcesses[index]
    }));

    const selectedProcess = processList[parentId]?.find(p => p.id === processId);
    if (!selectedProcess) {
        console.error('Selected process is undefined.');
        return null;
    }

    const newNode: ProcessNode = {
        uniqueNodeId: generateUniqueId(),
        id: selectedProcess.id,
        name: selectedProcess.name,
        type: 'process',
        influenceProcess: selectedProcess,
        totalDuration: 0,
        totalRuns: 0,
        children: inputNodes
    };

    return newNode;
};

export default handleProcessSelection;
