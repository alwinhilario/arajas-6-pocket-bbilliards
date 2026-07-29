import React from "react";
import { Button } from "../ui/button";
import clsx from "clsx";
import { IoChevronDownOutline } from "react-icons/io5";

interface IProps {
  mop: string;
  variant?: "default" | "table";
  onPayClick: (arg: string) => void;
  withBorder?: boolean;
  className: string;
}

export default function Payment({
  className = "",
  mop,
  onPayClick,
  variant = "default",
  withBorder = true,
}: IProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const onPay = (type: string) => {
    setIsOpen(!isOpen);

    onPayClick(type);
  };

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className='relative' ref={dropdownRef}>
      {isOpen && (
        <div className='absolute top-[-78px] left-0 w-full bg-white border-2 border-yellow-500 rounded mt-0.5 z-10 overflow-hidden border-b-2 border-gray-100 rounded-b-none'>
          {mop !== "gcash" && (
            <button
              className='p-2 py-1.5 w-full cursor-pointer font-bold bg-[#0479f7] text-white'
              type='button'
              onClick={() => onPay("gcash")}
            >
              Gcash
            </button>
          )}

          {mop !== "maya" && (
            <button
              className='p-2 py-1.5 w-full  cursor-pointer font-bold bg-black text-[#1aec96]'
              type='button'
              onClick={() => onPay("maya")}
            >
              Maya
            </button>
          )}

          {mop !== "cash" && (
            <button
              className='p-2 py-1.5 w-full  cursor-pointer font-bold text-blue-600'
              type='button'
              onClick={() => onPay("cash")}
            >
              Cash
            </button>
          )}

          {mop !== "" && (
            <button
              className='p-2 py-1.5 w-full border-t cursor-pointer font-bold'
              type='button'
              onClick={() => onPay("")}
            >
              MOP
            </button>
          )}
        </div>
      )}

      <Button
        variant={"outline"}
        size={"xl"}
        className={clsx(
          variant === "default" ? "w-24" : "min-w-28 flex-1",
          "font-bold cursor-pointer flex items-center gap-2 rounded",
          { "border-0": !withBorder },
          {
            gcash: "bg-[#0479f7] text-white hover:bg-[#0479f7] hover:text-white",
            maya: "bg-black text-[#1aec96] hover:bg-black hover:text-[#1aec96]",
            cash: "text-blue-600",
          }?.[mop],
          {
            "rounded-t-none border-yellow-500 border-2 border-t-0": isOpen,
          },
          className,
        )}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <div className='flex-1 text-left pl-1.5'>
          {{
            gcash: "Gcash",
            maya: "Maya",
            cash: "Cash",
          }?.[mop] || "MOP"}
        </div>
        <div>
          <IoChevronDownOutline className='h-4 w-4' />
        </div>
      </Button>
    </div>
  );
}
