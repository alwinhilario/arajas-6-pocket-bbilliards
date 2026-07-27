"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

// 1. Define the new Option type
export type InputSelectOption = {
  label: string;
  value: string;
  amount?: number;
};

type InputSelectProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options?: InputSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowCreate?: boolean;
  className?: string;
  onAddClick?: (arg: string) => void;
};

// Default options updated to match the new object structure

function InputSelect({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onAddClick,
  options = [],
  placeholder = "Select a product",
  searchPlaceholder = "Search or add new...",
  emptyMessage = "No option found.",
  allowCreate = true,
  className,
  disabled,
  ...inputProps
}: InputSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const value = valueProp ?? uncontrolledValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (valueProp === undefined) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, valueProp],
  );

  const onReset = () => {
    setSearch("");
  };
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        // Find the label for the current value to pre-fill the search if desired
        // Or keep it as the raw value if it's a custom created item
        const selected = options.find((opt) => opt.value === value);
        setSearch(selected ? selected.label : value);
      }
    },
    [value, options],
  );

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      setValue(selectedValue);
      setOpen(false);
    },
    [setValue],
  );

  // 2. Update filtering to check both label and value
  const filteredOptions = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;

    return options.filter(
      (option) => option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query),
    );
  }, [options, search]);

  // 3. Update showCreate to check against objects
  const showCreate =
    allowCreate &&
    search.trim().length > 0 &&
    !options.some(
      (option) =>
        option.label.toLowerCase() === search.trim().toLowerCase() ||
        option.value.toLowerCase() === search.trim().toLowerCase(),
    );

  const keepOpenOnInputInteraction = React.useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  // 4. Derive display value so the input shows "Apple" instead of "apple" when selected
  const selectedOption = React.useMemo(() => options.find((opt) => opt.value === value), [options, value]);
  const displayValue = selectedOption ? selectedOption.label : value;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        nativeButton={false}
        disabled={disabled}
        render={
          <InputGroup className={cn("w-full", className)}>
            <InputGroupInput
              value={displayValue}
              placeholder={placeholder}
              disabled={disabled}
              onChange={(event) => {
                setValue(event.target.value);
                setOpen(true); // Open automatically when the user starts typing
              }}
              {...inputProps}
              readOnly
            />
            <InputGroupAddon align='inline-end'>
              <ChevronsUpDown className='size-4 opacity-50' />
            </InputGroupAddon>
          </InputGroup>
        }
      />

      <PopoverContent
        data-slot='combobox-content'
        className='w-(--anchor-width) p-0'
        align='start'
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            onReset={onReset}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  data-checked={value === option.value}
                  onSelect={() => handleSelect(option.value)}
                  className='flex items-center justify-between'
                >
                  {/* 5. Render label and conditionally render amount */}
                  <span>{option.label}</span>
                  {option.amount !== undefined && (
                    <span className='text-muted-foreground text-xs'>PHP {option.amount}.00</span>
                  )}
                </CommandItem>
              ))}
              {showCreate && (
                <CommandItem
                  value={search}
                  onSelect={() => {
                    handleSelect(search.trim());
                    if (typeof onAddClick === "function") onAddClick(search.trim());
                  }}
                >
                  Add &quot;{search.trim()}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { InputSelect };
