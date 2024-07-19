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

4. **Production Chain Visualization**:
   - Once the production chain is fully configured, users can submit it and view a detailed JSON representation of the entire chain, including all products and processes involved.

## Technologies Used

- **Next.js**: A React framework for server-side rendering and generating static websites.
- **TypeScript**: A statically typed superset of JavaScript.
- **Tailwind CSS**: A utility-first CSS framework.
- **Zustand**: A small, fast, and scalable barebones state-management solution.
- **Axios**: A promise-based HTTP client for the browser and Node.js.
- **React Hook Form**: A performant, flexible, and extensible form library for React.
- **Zod**: A TypeScript-first schema declaration and validation library.

## Project Structure

- **`components/`**: Contains all the reusable React components.
  - **`CopyButton.tsx`**: A button component for copying text to the clipboard.
  - **`ProcessConfigurator/`**: Components related to process configuration.
    - **`ProcessConfigurator.tsx`**: Main component for configuring processes.
    - **`ProcessInputs.tsx`**: Component for displaying and configuring process inputs.
    - **`ProcessSelector.tsx`**: Component for selecting a process.
  - **`ProductList.tsx`**: Component for displaying and selecting products.
  - **`ui/`**: Common UI components.
    - **`button.tsx`**: Button component.
    - **`form.tsx`**: Form component.
    - **`input.tsx`**: Input component.
    - **`label.tsx`**: Label component.
    - **`select.tsx`**: Select component.

- **`lib/`**: Contains utility functions and data handling logic.
  - **`constructors.ts`**: Functions for creating data structures.
  - **`dataLoader.ts`**: Functions for loading data.
  - **`uniqueId.ts`**: Utility for generating unique IDs.
  - **`utils.ts`**: General utility functions.

- **`pages/`**: Contains Next.js page components and API routes.
  - **`_app.js`**: Custom App component for initializing pages.
  - **`api/`**: API route handlers.
    - **`configureProductionChain.ts`**: API handler for configuring production chains.
    - **`inputs.ts`**: API handler for fetching process inputs.
    - **`processes.ts`**: API handler for fetching processes.
    - **`products.ts`**: API handler for fetching products.
  - **`index.tsx`**: Main page component.
  - **`layout.tsx`**: Layout component for the application.
  - **`globals.css`**: Global CSS styles.

- **`services/`**: Contains services for making API calls.
  - **`apiService.ts`**: Service for interacting with the backend API.

- **`store/`**: Contains state management logic using Zustand.
  - **`useProductionChainStore.ts`**: Zustand store for managing production chain state.

- **`types/`**: Contains TypeScript type definitions.
  - **`types.ts`**: Type definitions for the application.

- **`utils/`**: Contains utility functions.
  - **`errorHandler.ts`**: Utility for handling errors.
  - **`logger.ts`**: Utility for logging.

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