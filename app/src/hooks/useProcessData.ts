import { useCallback } from "react";
import useBuildingIcon from "./useBuildingIcon";
import useInputsByProcessId from "./useInputsByProcessId";
import useProcessDetails from "./useProcessDetails";
import { InfluenceProcess, ProcessInput } from "@/types/influenceTypes";

// hooks/useProcessData.ts
export function useProcessData() {
    const { getProcessDetails } = useProcessDetails();
    const { getInputsByProcessId } = useInputsByProcessId();
    const { getBuildingIcon } = useBuildingIcon();

    const fetchProcessData = useCallback(async (
        processId: string,
        parentProductId: string,
        parentAmount: number
    ) => {
        try {
            // First, fetch process details
            const processDetails = await getProcessDetails(processId) as InfluenceProcess;

            // Next, fetch input products and building icon concurrently
            const [inputProducts, buildingIcon] = await Promise.all([
                getInputsByProcessId(processId),
                getBuildingIcon(processDetails.buildingId)
            ]);

            // Calculate runs
            const output = processDetails.outputs.find(o => o.productId === parentProductId);
            const outputUnitsPerSR = output ? parseFloat(output.unitsPerSR) : 0;
            const totalRuns = parentAmount / outputUnitsPerSR || 1;

            // Separate main outflow from side products
            const mainOutflow = processDetails.outputs.find(o => o.productId === parentProductId);
            const sideProducts = processDetails.outputs.filter(o => o.productId !== parentProductId);

            return {
                processDetails,
                inputProducts: inputProducts as ProcessInput[],
                buildingIcon,
                totalRuns,
                totalDuration: totalRuns * parseFloat(processDetails.bAdalianHoursPerAction || '0'),
                mainOutflow,
                sideProducts,
                hasSideProducts: sideProducts.length > 0
            };
        } catch (error) {
            console.error('Error fetching process data:', error);
            return null;
        }
    }, [getProcessDetails, getInputsByProcessId, getBuildingIcon]);

    return { fetchProcessData };
}