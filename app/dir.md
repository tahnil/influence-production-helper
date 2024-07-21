.
├── README.md
├── components.json
├── dir.md
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── next.svg
│   └── vercel.svg
├── src
│   ├── assets
│   │   └── images
│   │       └── product_icon
│   ├── components
│   │   ├── AggregatedIngredientsTable.tsx
│   │   ├── CopyButton.tsx
│   │   ├── JsonOutputWithCopyButton.tsx
│   │   ├── ProcessConfigurator
│   │   │   ├── ProcessConfigurator.tsx
│   │   │   ├── ProcessInputs.tsx
│   │   │   └── ProcessSelector.tsx
│   │   ├── ProductList.tsx
│   │   ├── TreeVisualizer.tsx
│   │   └── ui
│   │       ├── button.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       └── table.tsx
│   ├── hooks
│   │   ├── useConfigureProductionChain.ts
│   │   ├── useInputsByProcessId.ts
│   │   ├── useProcessesByProductId.ts
│   │   └── useProducts.ts
│   ├── lib
│   │   ├── calculationHelpers.ts
│   │   ├── configureProcess.ts
│   │   ├── configureProductionChain.ts
│   │   ├── constructors.ts
│   │   ├── dataLoader.ts
│   │   ├── inputHelpers.ts
│   │   ├── processHelpers.ts
│   │   ├── processUtils.ts
│   │   ├── productUtils.ts
│   │   ├── uniqueId.ts
│   │   └── utils.ts
│   ├── pages
│   │   ├── _app.tsx
│   │   ├── api
│   │   │   ├── configureProductionChain.ts
│   │   │   ├── fetchProductionChains.ts
│   │   │   ├── inputs.ts
│   │   │   ├── processes.ts
│   │   │   ├── productionChains.ts
│   │   │   └── products.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── index.tsx
│   │   ├── layout.tsx
│   │   └── tree-view.tsx
│   ├── sdk
│   │   └── productionChains.json
│   ├── services
│   │   └── apiService.ts
│   ├── store
│   │   └── useProductionChainStore.ts
│   ├── styles
│   ├── types
│   │   └── types.ts
│   └── utils
│       ├── aggregateIngredients.ts
│       ├── errorHandler.ts
│       ├── logger.ts
│       └── transformToTreeData.ts
├── tailwind.config.ts
├── tsconfig.json
└── tsconfig.tsbuildinfo

20 directories, 62 files
