// src/globalState.ts
import { InfluenceProduct, InfluenceProcess } from "@/types/influenceTypes";

interface GlobalState {
  selectedProduct: InfluenceProduct | null;
  processes: InfluenceProcess[];
  processId: string | null;
}

class GlobalState {
  private static instance: GlobalState;
  public selectedProduct: InfluenceProduct | null = null;
  public processes: InfluenceProcess[] = [];
  public processId: string | null = null;
  private listeners: Function[] = [];

  private constructor() { }

  public static getInstance(): GlobalState {
    if (!GlobalState.instance) {
      GlobalState.instance = new GlobalState();
    }
    return GlobalState.instance;
  }

  subscribe(listener: Function): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  updateSelectedProduct(product: InfluenceProduct | null) {
    this.selectedProduct = product;
    this.listeners.forEach(listener => listener());
  }

  updateProcesses(processes: InfluenceProcess[]) {
    this.processes = processes;
    this.listeners.forEach(listener => listener());
  }

  updateSelectedProcessId(processId: string | null) {
    this.processId = processId
    this.listeners.forEach(listener => listener());
  }
}

export const globalState = GlobalState.getInstance();
