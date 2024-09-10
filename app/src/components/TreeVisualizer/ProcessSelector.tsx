// components/TreeVisualizer/ProcessSelector.tsx

import React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InfluenceProcess } from "@/types/influenceTypes";

interface SavedConfig {
  _id: string;
  createdAt: string;
  nodeCount: number;
}

interface ProcessSelectorProps {
  processes: InfluenceProcess[];
  savedConfigurations: SavedConfig[];
  selectedId: string | null;
  onProcessSelect: (processId: string) => void;
  onConfigSelect: (configId: string) => void;
  className?: string;
  style?: React.CSSProperties;
  inputClassName?: string;
  groupHeadingClassName?: string;
  itemClassName?: string;
}

const ProcessSelector: React.FC<ProcessSelectorProps> = ({
  processes,
  savedConfigurations,
  selectedId,
  onProcessSelect,
  onConfigSelect,
  className,
  style,
  inputClassName,
  groupHeadingClassName,
  itemClassName,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const filteredConfigs = savedConfigurations.filter((config) =>
    config._id.toLowerCase().includes(inputValue.toLowerCase())
  );

  const filteredProcesses = processes.filter((process) =>
    process.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const selectedItem =
    savedConfigurations.find((config) => config._id === selectedId) ||
    processes.find((process) => process.id === selectedId);

  const getDisplayName = (item: SavedConfig | InfluenceProcess) => {
    if ('name' in item) {
      return item.name;
    }
    return `Config ${new Date(item.createdAt).toLocaleString()} (${item.nodeCount} nodes)`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          style={style}
        >
          {selectedItem ? getDisplayName(selectedItem) : '…'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", className)} style={style}>
        <Command>
          <CommandInput
            placeholder="Search process or config..."
            value={inputValue}
            onValueChange={(value) => setInputValue(value)}
            className={inputClassName}
          />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            {(filteredConfigs.length > 0 || filteredProcesses.length > 0) && (
              <>
                {filteredConfigs.length > 0 && (
                  <CommandGroup heading="Available configurations" className={groupHeadingClassName}>
                    {filteredConfigs.map((config) => (
                      <CommandItem
                        key={config._id}
                        onSelect={() => {
                          onConfigSelect(config._id);
                          setOpen(false);
                        }}
                        className={itemClassName}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedId === config._id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {getDisplayName(config)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {filteredProcesses.length > 0 && (
                  <CommandGroup heading="Processes" className={groupHeadingClassName}>
                    {filteredProcesses.map((process) => (
                      <CommandItem
                        key={process.id}
                        onSelect={() => {
                          onProcessSelect(process.id);
                          setOpen(false);
                        }}
                        className={itemClassName}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedId === process.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {process.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProcessSelector;