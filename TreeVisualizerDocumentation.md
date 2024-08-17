
# Tree Visualizer Documentation

The TreeVisualizer component is a React component that renders a tree visualization using the D3.js library. It handles both backend data transformation and frontend rendering, creating an interactive, zoomable, and expandable/collapsible tree visualization.

## Backend Data Handling

The backend data handling is managed by `api/configureProductionChainDynamic.ts`, which transforms legacy production chain data into a D3-compatible format.

### `configureProductionChainDynamic.ts`

This file contains the following key components:

- **Legacy Data Structure**: Defines the sample production chain data.
- **Helper Functions**:
  - `convertLegacyProductToInfluenceProduct`: Converts legacy product data to the `InfluenceProduct` type.
  - `transformProductionChain`: Transforms the entire production chain data into a format compatible with D3.
- **API Handler**:
  - The API handler processes POST requests, transforms the data using the helper functions, and returns the D3-compatible data as a JSON response.

### Example of API Handler

```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const updatedData = req.body;
      const transformedData = await transformProductionChain(sampleProductionChain);
      res.status(200).json(transformedData);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
```

## Frontend Handling

The frontend rendering and interaction are managed primarily in `TreeVisualizer.tsx` and `d3TreeUtils.ts`.

### `TreeVisualizer.tsx`

This file is the main component that initializes and handles the tree visualization.

#### Key Components

- **Refs and State**: Manages refs for the container, update function, root node, and state for tree data.
- **Utility Functions**:
  - `collapse`: Collapses the tree nodes.
  - `click`: Handles node click events to expand/collapse nodes.
- **Effects**:
  - `useEffect` to fetch data from the backend and initialize the tree.

#### Initialization

```typescript
useEffect(() => {
    const fetchData = async () => {
        const response = await fetch('/api/configureProductionChainDynamic', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product: 'Cement', amount: 200000 }),
        });
        const data = await response.json();
        setTreeData(data);
    };

    fetchData();
}, []);
```

### `d3TreeUtils.ts`

This file contains utility functions for creating and updating the D3 tree.

#### Key Components

- **createD3Tree**: Initializes the D3 tree.
- **updateD3Tree**: Updates the D3 tree with new data.
- **curvedLine**: Draws curved lines between nodes.
- **collapse**: Collapses the nodes.
- **Node Rendering**: Uses React components to render HTML content for nodes.

#### Example of Node Rendering

```typescript
.html(d => {
    switch (d.data.type) {
        case 'product':
            return ReactDOMServer.renderToString(<ProductNodeComponent node={d.data as ProductNode} />);
        case 'process':
            return ReactDOMServer.renderToString(<ProcessNodeComponent node={d.data as ProcessNode} />);
        case 'sideProduct':
            return ReactDOMServer.renderToString(<SideProductNodeComponent node={d.data as SideProductNode} />);
        default:
            return `<div class="card unknown-node">Unknown Node Type</div>`;
    }
});
```

### Node Components

Separate React components for rendering different node types:
- `ProductNodeComponent`
- `ProcessNodeComponent`
- `SideProductNodeComponent`

#### Example of `ProductNodeComponent`

```typescript
import React from 'react';
import { ProductNode } from '../../types/d3Types';

interface ProductNodeComponentProps {
    node: ProductNode;
}

const ProductNodeComponent: React.FC<ProductNodeComponentProps> = ({ node }) => {
    return (
        <div className="border rounded-md p-2 bg-white shadow text-sm w-44">
            <div>PRODUCT</div>
            <div><strong>{node.name}</strong></div>
            <div>Type: {node.type}</div>
            <div>Weight: <span className="number-format" data-value={node.influenceProduct.massKilogramsPerUnit}></span> kg</div>
            <div>Volume: <span className="number-format" data-value={node.influenceProduct.volumeLitersPerUnit}></span> L</div>
            <div>Units: <span className="number-format" data-value={node.amount}></span></div>
            <div>Total Weight: <span className="number-format" data-value={node.totalWeight}></span> kg</div>
            <div>Total Volume: <span className="number-format" data-value={node.totalVolume}></span> L</div>
        </div>
    );
};

export default ProductNodeComponent;
```

### Zoom and Pan

Zoom and pan behavior is enabled using D3's zoom functionality.

```typescript
const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform as any);
    });

svg.call(zoomBehavior);
```

## Conclusion

The TreeVisualizer component leverages D3.js for powerful and interactive tree visualizations, combining backend data transformation and React-based frontend rendering. The separation of concerns between data handling, tree creation, updating, and node rendering ensures a maintainable and extendable architecture.
