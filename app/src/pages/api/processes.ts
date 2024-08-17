// pages/api/processes.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchProcessById, fetchAllProcesses, fetchProcessesByProductId, fetchInputsByProcessId } from '../../lib/processUtils';
import { ApiError } from '../../types/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, outputProductId, processId } = req.query;

    if (processId) {
      // Handle fetching inputs for a given processId
      const inputs = await fetchInputsByProcessId(Array.isArray(processId) ? processId[0] : processId);
      return res.status(200).json(inputs);
    }
    
    if (outputProductId) {
      // Fetch processes that yield the specified product ID as output
      const productId = Array.isArray(outputProductId) ? outputProductId[0] : outputProductId;
      const processes = await fetchProcessesByProductId(productId);

      if (processes.length === 0) {
        return res.status(404).json({ error: 'No processes found for the given product ID as output' });
      }
      return res.status(200).json(processes);  // Return array of processes
    }
    
    if (id) {
      // Fetch a single process by ID
      const processId = Array.isArray(id) ? id[0] : id;
      const process = await fetchProcessById(processId);

      if (!process) {
        return res.status(404).json({ error: 'Process not found' });
      }
      return res.status(200).json([process]);  // Return array containing a single process
    }

    // If no ID is provided, fetch all processes
    const processes = await fetchAllProcesses();
    return res.status(200).json(processes);  // Return array of processes
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Error loading processes:', apiError.message);
    res.status(apiError.status || 500).json({
      error: 'Failed to load processes',
      message: apiError.message,
      code: apiError.code,
    });
  }
}
