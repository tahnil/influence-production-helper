
# D3 Integration Documentation

This documentation provides an overview of the D3 integration in your app, covering backend data handling and frontend rendering.

## Backend Data Handling

### API Endpoint: `api/configureProductionChainDynamic.ts`

This file handles the transformation of legacy production chain data into a format suitable for D3 visualization.

#### Key Functions and Data Flow

1. **Data Fetching**:
   - The function `fetchInfluenceProductById` fetches detailed product data, ensuring numerical properties are correctly typed.
   
2. **Data Transformation**:
   - `transformProductionChain(data: LegacyProductionChain): Promise<ProductNode>` transforms the legacy data structure into a D3-compatible format.
   - The nested `transformProcess` function recursively processes each node in the production chain.

3. **API Handler**:
   - The API handler responds to POST requests by transforming the provided data and returning the D3-compatible format.

#### Example Code
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

### Main Component: `TreeVisualizer.tsx`

This React component handles the rendering of the D3 tree visualization.

#### Key Elements

1. **State and Refs**:
   - Uses `useState`, `useRef`, and `useEffect` to manage tree data and D3 updates.

2. **D3 Tree Creation and Update**:
   - `createD3Tree` initializes the SVG container and renders the initial tree structure.
   - `updateD3Tree` updates the tree structure when data changes, including node and link updates.

3. **Event Handling**:
   - Handles node click events to expand or collapse nodes.

#### Example Code
```tsx
const TreeVisualizer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const updateRef = useRef<(source: ExtendedD3HierarchyNode) => void>();
  const iRef = useRef(0);
  const rootRef = useRef<ExtendedD3HierarchyNode | null>(null);
  const [treeData, setTreeData] = useState<D3TreeNode | null>(null);

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

  useEffect(() => {
    if (treeData) {
      createD3Tree(containerRef, treeData, rootRef, iRef, updateRef.current!, click);
    }
  }, [treeData]);

  return <div id="tree-container" ref={containerRef}></div>;
};

export default TreeVisualizer;
```

### Utility Functions: `d3TreeUtils.ts`

Contains functions to manage D3 tree creation and updates, as well as rendering HTML for nodes.

#### Key Functions

1. **createD3Tree**:
   - Initializes the D3 tree with SVG setup and initial rendering.
2. **updateD3Tree**:
   - Handles tree updates on data changes, including node and link transitions.
3. **renderNodeHtml**:
   - Renders HTML for different node types using React components.

#### Example Code
```typescript
import { renderNodeHtml } from './renderNodes';

export const updateD3Tree = (
  source: ExtendedD3HierarchyNode,
  containerRef: React.RefObject<HTMLDivElement>,
  rootRef: React.MutableRefObject<ExtendedD3HierarchyNode | null>,
  margin: { top: number; right: number; bottom: number; left: number; },
  updateRef: React.MutableRefObject<(source: ExtendedD3HierarchyNode) => void>,
  click: (event: React.MouseEvent, d: ExtendedD3HierarchyNode) => void
) => {
  // ... D3 update logic ...
  nodeEnter.append('foreignObject')
    .attr('width', 1)
    .attr('height', 1)
    .attr('style', 'overflow: visible')
    .attr('x', -100)
    .attr('y', -50)
    .append('xhtml:div')
    .on('click', (event, d) => click(event as unknown as React.MouseEvent, d))
    .html(d => renderNodeHtml(d.data));
};
```

### React Components

- **ProductNodeComponent**: Renders product nodes.
- **ProcessNodeComponent**: Renders process nodes.
- **SideProductNodeComponent**: Renders side product nodes.

Each component is imported and used in `renderNodes.tsx` for rendering node HTML.

#### Example Code for a Component
```tsx
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
