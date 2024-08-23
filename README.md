
# Production Chain Configurator

The Production Chain Configurator is a web application designed to help users configure and manage production chains for items in a computer game. The application allows users to select an end product and specify the desired amount, then configure all necessary processes to produce that product, including all intermediate products.

## Features

1. **Product Selection**:
   - Users can select an end product from a list of available products.
   - The selected product becomes the focal point for configuring the production chain.

2. **Amount Specification**:
   - Users can specify the amount of the end product they wish to produce.

3. **Process Configuration**:
   - For each product and intermediate product in the production chain, users can select appropriate processes from a list.
   - The configuration is recursive, allowing users to drill down into intermediate products and configure their production processes as well.

## Technologies Used

- **Next.js**: A React framework for server-side rendering and generating static websites.
- **TypeScript**: A statically typed superset of JavaScript.
- **Tailwind CSS**: A utility-first CSS framework.
- **Axios**: A promise-based HTTP client for the browser and Node.js.
- **React Hook Form**: A performant, flexible, and extensible form library for React.

## Project Structure

- **`components/`**: Contains all the reusable React components.
  - **`TreeVisualizer/`**: Components related to visualizing the production tree.
    - **`AmountInput.tsx`**: Component for inputting the desired amount of product.
    - **`ProductSelector.tsx`**: Component for selecting the main product.
    - **`ProductionInputs.tsx`**: Component for displaying production inputs.
    - **`TreeRenderer.tsx`**: Main component for rendering the D3 tree.
  - **`ui/`**: Common UI components.
    - **`button.tsx`**: Button component.
    - **`form.tsx`**: Form component.
    - **`input.tsx`**: Input component.
    - **`label.tsx`**: Label component.
    - **`select.tsx`**: Select component.

- **`hooks/`**: Contains custom React hooks for data fetching.
  - **`useInfluenceProducts.ts`**: Hook for fetching the list of products.
  - **`useProcessesByProductId.ts`**: Hook for fetching processes by product ID.
  - **`useInputsByProcessId.ts`**: Hook for fetching inputs by process ID.
  - **`useProcessDetails.ts`**: Hook for fetching detailed process information.
  - **`useProductNodeBuilder.ts`**: Hook for building product nodes in the tree.
  - **`useProcessNodeBuilder.ts`**: Hook for building process nodes in the tree.

- **`lib/`**: Contains utility functions and data handling logic.
  - **`dataLoader.ts`**: Functions for loading data.
  - **`processUtils.ts`**: Functions for handling processes.
  - **`productUtils.ts`**: Functions for handling product data.
  - **`utils.ts`**: General utility functions.

- **`pages/`**: Contains Next.js page components and API routes.
  - **`_app.tsx`**: Custom App component for initializing pages.
  - **`api/`**: API route handlers.
    - **`buildingIcon.ts`**: API handler for fetching building icons.
    - **`processes.ts`**: API handler for fetching processes.
    - **`productImage.ts`**: API handler for fetching product images.
    - **`products.ts`**: API handler for fetching products.
  - **`index.tsx`**: Main page component.
  - **`layout.tsx`**: Layout component for the application.
  - **`globals.css`**: Global CSS styles.

- **`sdk/`**: Contains JSON data related to the Influence SDK.
  - **`productionChains.json`**: JSON file containing production chain data.

- **`types/`**: Contains TypeScript type definitions.
  - **`d3Types.ts`**: Type definitions for D3 tree nodes.
  - **`influenceTypes.ts`**: Type definitions related to the Influence SDK.
  - **`types.ts`**: General type definitions.

- **`utils/`**: Contains utility functions.
  - **`TreeVisualizer/`**: Functions related to the TreeVisualizer components.
    - **`buildProductNode.ts`**: Function for building product nodes.
    - **`fetchBuildingIconBase64.ts`**: Function for fetching building icons in base64.
    - **`fetchProductImageBase64.ts`**: Function for fetching product images in base64.
    - **`useProcessNodeBuilder.ts`**: Utility for building process nodes.
    - **`useProductNodeBuilder.ts`**: Utility for building product nodes.
  - **`d3Tree.ts`**: Functions related to D3 tree manipulation.
  - **`errorHandler.ts`**: Utility for handling errors.
  - **`formatDuration.ts`**: Utility for formatting durations.
  - **`formatNumber.ts`**: Utility for formatting numbers.
  - **`generateUniqueId.ts`**: Utility for generating unique IDs.

## Installation

1. **Clone the repository**:
   ```sh
   git clone https://github.com/your-username/production-chain-configurator.git
   cd production-chain-configurator

2. **Install dependencies**:

    ```sh
    npm install

3. **Run the development server**:

    ```sh
    npm run dev

Open http://localhost:3000 with your browser to see the result.
