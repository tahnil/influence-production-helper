
# Production Chain Configurator

The Production Chain Configurator is a web application designed to help users configure and manage production chains for items in the Influence game. The application allows users to select an end product and specify the desired amount, then visualizes all necessary processes to produce that product, including all intermediate products.

## Features

1. **Product Selection**:
   - Users can select an end product from a list of available products.
   - The selected product becomes the focal point for visualizing the production chain.

2. **Amount Specification**:
   - Users can specify the amount of the end product they wish to produce.

3. **Process Visualization**:
   - The application automatically generates a visual representation of the entire production chain.
   - The visualization includes all intermediate products and processes required to produce the specified amount of the end product.
   - Users can interact with the visualization, expanding and collapsing nodes as needed.

## Technologies Used

- **Next.js**: A React framework for server-side rendering and generating static websites.
- **TypeScript**: A statically typed superset of JavaScript.
- **Tailwind CSS**: A utility-first CSS framework.
- **React Flow**: A library for building node-based editors and interactive diagrams.
- **Dagre**: A graph layout engine used in conjunction with React Flow.
- **ShadcnUI**: A collection of re-usable components built with Radix UI and Tailwind CSS.

## Project Structure

- **`components/`**: Contains all the reusable React components.
  - **`TreeVisualizer/`**: Components related to visualizing the production tree.
    - **`AmountInput.tsx`**: Component for inputting the desired amount of product.
    - **`ProductSelector.tsx`**: Component for selecting the main product.
    - **`ProductionInputs.tsx`**: Component for displaying production inputs.
    - **`TreeRenderer.tsx`**: Main component for rendering the React Flow tree.
  - **`ui/`**: Common UI components from ShadcnUI.

- **`hooks/`**: Contains custom React hooks for data fetching and tree building.
  - **`useInfluenceProductDetails.ts`**: Hook for fetching detailed product information.
  - **`useInfluenceProducts.ts`**: Hook for fetching the list of products.
  - **`useInputsByProcessId.ts`**: Hook for fetching inputs by process ID.
  - **`useProcessDetails.ts`**: Hook for fetching detailed process information.
  - **`useProcessesByProductId.ts`**: Hook for fetching processes by product ID.

- **`lib/`**: Contains utility functions and data handling logic.
  - **`dataLoader.ts`**: Functions for loading data.
  - **`processUtils.ts`**: Functions for handling processes.
  - **`productUtils.ts`**: Functions for handling product data.
  - **`utils.ts`**: General utility functions.

- **`pages/`**: Contains Next.js page components and API routes.
  - **`_app.tsx`**: Custom App component for initializing pages.
  - **`api/`**: API route handlers for various data fetching operations.
  - **`index.tsx`**: The main page of the application.

- **`types/`**: Contains TypeScript type definitions.
  - **`influenceTypes.ts`**: Types related to Influence game data.
  - **`reactFlowTypes.ts`**: Types related to React Flow nodes and edges.

- **`utils/`**: Contains utility functions for the TreeVisualizer.
  - **`TreeVisualizer/`**: Utility functions for building nodes and fetching icons/images.
  - **`formatDuration.ts`**: Utility for formatting time durations.
  - **`formatNumber.ts`**: Utility for formatting numbers with units.

## Installation

1. **Clone the repository**:
   ```sh
   git clone https://github.com/tahnil/influence-production-helper.git

2. **Install dependencies**:

    ```sh
    cd influence-production-helper/app
    npm install

3. **Run the development server**:

    ```sh
    npm run dev

Open http://localhost:3000 with your browser to see the result.
