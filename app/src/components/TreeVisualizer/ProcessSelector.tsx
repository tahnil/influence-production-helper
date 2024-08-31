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

interface ProcessSelectorProps {
  processes: InfluenceProcess[];
  selectedProcessId: string | null;
  onProcessSelect: (processId: string) => void;
  className?: string;
  style?: React.CSSProperties; // Add a style prop for custom inline styles
}

const ProcessSelector: React.FC<ProcessSelectorProps> = ({
  processes,
  selectedProcessId,
  onProcessSelect,
  className,
  style,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const filteredProcesses = processes.filter((process) =>
    process.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const selectedProcess = processes.find(
    (process) => process.id === selectedProcessId
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          style={style} // Apply custom styles
        >
          {selectedProcess ? selectedProcess.name : '…'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={className} style={style}>
        <Command>
          <CommandInput
            placeholder="Search process..."
            value={inputValue}
            onValueChange={(value) => setInputValue(value)}
            style={style}
          />
          <CommandList>
            {filteredProcesses.length === 0 ? (
              <CommandEmpty>No processes found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredProcesses.map((process) => (
                  <CommandItem
                    key={process.id}
                    onSelect={() => {
                      onProcessSelect(process.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedProcessId === process.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {process.name}
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

export default ProcessSelector;
