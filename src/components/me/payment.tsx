import React from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import clsx from "clsx";
import { IoChevronDownOutline } from "react-icons/io5";

interface IProps {
  mop: string;
  variant?: "default" | "table";
  onPayClick: (arg: string) => void;
  readOnly?: boolean;
  withBorder?: boolean;
  className: string;
  portal?: boolean;
}

export default function Payment({
  className = "",
  mop,
  onPayClick,
  variant = "default",
  withBorder = true,
  readOnly = false,
  portal = false,
}: IProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<React.CSSProperties>();

  const onPay = (type: string) => {
    setIsOpen(false);
    onPayClick(type);
  };

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    if (!isOpen || !portal) return;

    const positionMenu = () => {
      const trigger = buttonRef.current?.getBoundingClientRect();
      if (!trigger) return;

      setMenuPosition({
        position: "fixed",
        left: trigger.left,
        bottom: window.innerHeight - trigger.top,
        width: trigger.width,
        maxHeight: Math.max(80, trigger.top - 8),
        overflowY: "auto",
        zIndex: 100,
      });
    };

    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [isOpen, portal]);

  const menu = isOpen ? (
    <div
      ref={menuRef}
      style={portal ? menuPosition : undefined}
      className={clsx(
        "bg-white border-2 border-yellow-500 rounded mt-0.5 z-10 overflow-hidden border-b-2 border-gray-100 rounded-b-none",
        portal ? "w-full" : "absolute top-[-78px] left-0 w-full",
      )}
    >
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
          className='p-2 py-1.5 w-full cursor-pointer font-bold bg-black text-[#1aec96]'
          type='button'
          onClick={() => onPay("maya")}
        >
          Maya
        </button>
      )}

      {mop !== "cash" && (
        <button
          className='p-2 py-1.5 w-full cursor-pointer font-bold text-blue-600'
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
  ) : null;

  return (
    <div className='relative' ref={dropdownRef}>
      {!portal && menu}

      <Button
        ref={buttonRef}
        variant={"outline"}
        size={"xl"}
        className={clsx(
          variant === "default" ? "w-24" : "min-w-28 flex-1",
          "font-bold cursor-pointer flex items-center gap-2 rounded",
          { "border-0": !withBorder },
          { "!cursor-default": readOnly },
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
          if (readOnly) return;

          if (!isOpen) setMenuPosition(undefined);
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
        {!readOnly && (
          <div>
            <IoChevronDownOutline className='h-4 w-4' />
          </div>
        )}
      </Button>
      {portal && menu && typeof document !== "undefined" ? createPortal(menu, document.body) : null}
    </div>
  );
}
