// services/ProcessDataService.ts
import { InfluenceProcess } from '@/types/influenceTypes';

export interface ProcessDataFetcher {
  getProcessDetails: (processId: string) => Promise<InfluenceProcess>;
  getInputsByProcessId: (processId: string) => Promise<any[]>;
  getBuildingIcon: (buildingId: string) => Promise<string>;
}

export const ProcessDataService = {
  /**
   * Fetches and prepares process data
   * @param processId ID of the process to fetch
   * @param parentProductId ID of the parent product this process produces
   * @param parentAmount Amount of the parent product needed
   * @param fetcher Object with data fetching methods
   * @param outflowsCompoundId Optional ID of the outflows compound for this process
   * @returns Process data object
   */
  async fetchProcessData(
    processId: string,
    parentProductId: string,
    parentAmount: number,
    fetcher: ProcessDataFetcher,
    outflowsCompoundId?: string
  ): Promise<any> {
    // 1. Fetch process details and related data
    const [processDetails, inputProducts, buildingIcon] = await Promise.all([
      fetcher.getProcessDetails(processId),
      fetcher.getInputsByProcessId(processId),
      fetcher.getBuildingIcon((await fetcher.getProcessDetails(processId)).buildingId)
    ]);
    
    // 2. Calculate process metrics
    const output = processDetails.outputs.find(o => o.productId === parentProductId);
    const outputUnitsPerSR = output ? parseFloat(output.unitsPerSR) : 0;
    const totalRuns = parentAmount / outputUnitsPerSR || 1;
    const totalDuration = totalRuns * parseFloat(processDetails.bAdalianHoursPerAction || '0');
    
    // 3. Prepare the process data object
    return {
      processDetails,
      inputProducts,
      buildingIcon,
      totalRuns,
      totalDuration,
      mainOutflow: output,
      outflowsCompoundId,
      sideProducts: processDetails.outputs.filter(o => o.productId !== parentProductId),
      hasSideProducts: processDetails.outputs.length > 1
    };
  }
};

export default ProcessDataService;