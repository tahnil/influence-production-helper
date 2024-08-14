// components/ProductSelector.tsx
// 
// — Dropdown for Product Selection: Renders a dropdown list of products.
// — Event Handling: Calls onSelect with the selected product ID when a product is selected.

import * as React from "react"
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

// Define the interface for InfluenceProduct if not already defined
interface InfluenceProduct {
  id: string;
  name: string;
}

interface ProductSelectorProps {
  products: InfluenceProduct[];
  selectedProductId: string | null;
  onSelect: (productId: string | null) => void;
  className?: string;
}

export function ProductSelector({
  products,
  selectedProductId,
  onSelect,
  className,
}: ProductSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const filteredProducts = React.useMemo(() => {
    return products.filter((product) =>
    product.name.toLowerCase().includes(inputValue.toLowerCase())
  )
  }, [inputValue, products])

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedProduct ? selectedProduct.name : "Select product..."}
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
                    const newSelectedProductId =
                      product.id === selectedProductId ? null : product.id
                    onSelect(newSelectedProductId)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProductId === product.id ? "opacity-100" : "opacity-0"
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
  )
}

export default ProductSelector;