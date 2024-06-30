import React, { useState } from 'react';
import EndProductSelector from '../components/EndProductSelector';
import ProcessSelector from '../components/ProcessSelector';
import RawMaterialSelector from '../components/RawMaterialSelector';
import { Process, Product } from '../types/types';

interface Input {
  product: Product;
  unitsPerSR: string;
}

const HomePage: React.FC = () => {
  const [endProduct, setEndProduct] = useState<{ id: string; amount: number } | null>(null);
  const [selectedProcesses, setSelectedProcesses] = useState<Process[]>([]);
  const [selectedRawMaterials, setSelectedRawMaterials] = useState<Product[]>([]);
  const [inputs, setInputs] = useState<Input[]>([]);

  const handleEndProductSelect = (id: string, amount: number) => {
    setEndProduct({ id, amount });
    setSelectedProcesses([]);
    setSelectedRawMaterials([]);
    setInputs([]);
  };

  const handleProcessSelect = (process: Process) => {
    setSelectedProcesses((prevProcesses) => [...prevProcesses, process]);
  };

  const handleInputsLoaded = (inputs: Input[]) => {
    setInputs(inputs);
  };

  const handleRawMaterialSelect = (product: Product) => {
    setSelectedRawMaterials((prevMaterials) => [...prevMaterials, product]);
  };

  return (
    <div>
      <h1>Production Chain Generator</h1>
      {!endProduct && <EndProductSelector onSelect={handleEndProductSelect} />}
      {endProduct && selectedProcesses.length === 0 && (
        <ProcessSelector productId={endProduct.id} onSelect={handleProcessSelect} onInputsLoaded={handleInputsLoaded} />
      )}
      {inputs.map((input, index) => (
        <div key={index}>
          <h3>Input: {input.product.name} ({input.unitsPerSR} units)</h3>
          <ProcessSelector productId={input.product.id} onSelect={handleProcessSelect} onInputsLoaded={handleInputsLoaded} />
        </div>
      ))}
      {selectedProcesses.length > 0 && selectedRawMaterials.length === 0 && (
        <RawMaterialSelector onSelect={handleRawMaterialSelect} />
      )}
      {/* Display the selected chain */}
      {endProduct && (
        <div>
          <h2>Selected End Product: {endProduct.id} - {endProduct.amount}</h2>
          <h3>Processes:</h3>
          <ul>
            {selectedProcesses.map((process) => (
              <li key={process.id}>{process.name}</li>
            ))}
          </ul>
          <h3>Raw Materials:</h3>
          <ul>
            {selectedRawMaterials.map((material) => (
              <li key={material.id}>{material.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HomePage;
