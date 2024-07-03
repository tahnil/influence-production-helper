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
.
├── README.md
├── components
│   ├── CopyButton.tsx
│   ├── ProcessConfigurator
│   │   ├── ProcessConfigurator.tsx
│   │   ├── ProcessInputs.tsx
│   │   └── ProcessSelector.tsx
│   ├── ProductList.tsx
│   ├── index.js
│   └── ui
│   ├── button.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   └── select.tsx
├── hooks
│   └── useProducts.ts
├── lib
│   ├── constructors.ts
│   ├── dataLoader.ts
│   ├── uniqueId.ts
│   └── utils.ts
├── pages
│   ├── _app.js
│   ├── api
│   │   ├── configureProductionChain.ts
│   │   ├── inputs.ts
│   │   ├── processes.ts
│   │   └── products.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── index.tsx
│   └── layout.tsx
├── sdk
│   └── productionChains.json
├── services
│   └── apiService.ts
├── store
│   └── useProductionChainStore.ts
├── styles
├── types
│   └── types.ts
└── utils
└── errorHandler.ts

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