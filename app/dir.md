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
│   │   ├── TreeVisualizer
│   │   │   ├── ProcessNodeComponent.tsx
│   │   │   ├── ProductNodeComponent.tsx
│   │   │   ├── SideProductNodeComponent.tsx
│   │   │   ├── TreeVisualizer.tsx
│   │   │   └── renderNodes.tsx
│   │   ├── TreeVisualizerOld.tsx
│   │   └── ui
│   │       ├── button.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       └── table.tsx
│   ├── hooks
│   │   ├── useConfigureProductionChain.ts
│   │   ├── useFetchTreeData.ts
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
│   │   │   ├── configureProductionChainDynamic.ts
│   │   │   ├── inputs.ts
│   │   │   ├── processes.ts
│   │   │   ├── productionChains.ts
│   │   │   └── products.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── index.tsx
│   │   ├── layout.tsx
│   │   ├── tree-view-v2.tsx
│   │   └── tree-view.tsx
│   ├── sdk
│   │   └── productionChains.json
│   ├── services
│   │   └── apiService.ts
│   ├── styles
│   ├── types
│   │   ├── d3Types.ts
│   │   ├── influenceTypes.ts
│   │   ├── intermediateTypes.ts
│   │   ├── productionChainTypes.ts
│   │   └── types.ts
│   └── utils
│       ├── aggregateIngredients.ts
│       ├── d3TreeUtils.ts
│       ├── errorHandler.ts
│       └── logger.ts
├── tailwind.config.ts
├── tsconfig.json
└── tsconfig.tsbuildinfo

19 directories, 72 files
