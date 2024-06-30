export interface Product {
    id: string;
    name: string;
  }
  
  export interface EndProduct extends Product {
    amount: number;
  }
  
  export interface InputOutput {
    productId: string;
    unitsPerSR: string;
  }
  
  export interface Process {
    id: string;
    name: string;
    buildingId: string;
    inputs: InputOutput[];
    outputs: InputOutput[];
  }
  
  export interface ProductionChainProduct {
    product: Product;
    amount: number;
    process?: ProductionChainProcess;
  }
  
  export interface ProductionChainProcess {
    id: string;
    name: string;
    inputs: ProductionChainProduct[];
    requiredOutput: ProductionChainProduct[];
    otherOutput: ProductionChainProduct[];
  }
  
  export interface ProductionChain {
    endProduct: EndProduct;
    products: Product[];
    processes: Process[];
    productionChain: {
      process: ProductionChainProcess;
    };
  }
  