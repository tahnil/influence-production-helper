// components/TreeVisualizer/ProductSelector.tsx
// 
// — Dropdown for Product Selection: Renders a dropdown list of products.
// — Event Handling: Calls onSelect with the selected product ID when a product is selected.

import React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import useInfluenceProducts from '@/hooks/useInfluenceProducts';

interface ProductSelectorProps {
  selectedProductId: string | null,
  onProductSelect: (productId: string) => void;  // Update the type to pass the productId
  className?: string;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProductId,
  onProductSelect,
  className,
}) => {
  const { influenceProducts, loading, error } = useInfluenceProducts();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  if (loading) return <div>Loading products...</div>;
  if (error) return <div>Error loading products: {error}</div>;

  const filteredProducts = influenceProducts.filter((product) =>
    product.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const selectedProduct = influenceProducts.find(
    (product) => product.id === selectedProductId
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedProduct ? selectedProduct.name : 'Select product...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={className}>
        <Command>
          <CommandInput
            placeholder="Search product..."
            value={inputValue}
            onValueChange={(value) => setInputValue(value)}
          />
          <CommandList>
            {filteredProducts.length === 0 ? (
              <CommandEmpty>No products found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => {
                      if (product.id !== selectedProductId) {
                        onProductSelect(product.id);
                      }
                      setOpen(false);
                      // console.log(`selectedProductId: `,selectedProductId);
                      // console.log(`product.id: `,product.id);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedProductId === product.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {product.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProductSelector;
