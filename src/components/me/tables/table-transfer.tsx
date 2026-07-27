import React from "react";
import clsx from "clsx";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { TTableOpts, TTableOptsData } from "./types";
import { isEmpty } from "lodash";

interface IProps {
  data: TTableOptsData;
  tables: TTableOpts;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: (arg: TTableOptsData) => void;
}

export default function TableTransfer({ data, setIsOpen, onConfirm, tables }: IProps) {
  const [state, setState] = React.useState<{ selectedTable: TTableOptsData }>({
    selectedTable: {},
  });

  return (
    <div
      className='fixed bg-black/90 top-0 left-0 h-screen w-screen flex justify-center items-center cursor-pointer z-50'
      onClick={() => {
        setIsOpen((prevState) => !prevState);
      }}
    >
      <Card
        className='min-w-xs p-5 cursor-default'
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className='text-base'>
          Where would you like to transfer Table #{data?.value?.split("_")?.[1]}?
        </div>
        <br />

        <div className='grid grid-cols-3 gap-3 items-center justify-center flex-1'>
          {tables?.map((item, key) => (
            <button
              type='button'
              key={key}
              className={clsx(
                "rounded-full border-2 h-24 w-24 flex items-center justify-center m-auto border-black text-black font-bold ",
                {
                  "opacity-50 invisible cursor-not-allowed": item?.value === data?.value,
                  "opacity-50 !cursor-not-allowed hover:!bg-transparent hover:!text-black":
                    item?.value === data?.value || item?.in?.length > 0 || item?.out?.length > 0,
                  "cursor-pointer hover:bg-black hover:text-white transition-all duration-100":
                    item?.value !== data?.value,
                  "bg-black text-white": state?.selectedTable?.value === item?.value,
                },
              )}
              disabled={item?.value === data?.value || item?.in?.length > 0 || item?.out?.length > 0}
              onClick={() => {
                setState({
                  selectedTable: item,
                });
              }}
            >
              <div>
                {item?.label} {(item?.in?.length > 0 || item?.out?.length > 0) && "(Occupied)"}
              </div>
            </button>
          ))}
        </div>

        <br />
        <div className='flex gap-2'>
          <Button
            size='xl'
            className={"cursor-pointer flex-1"}
            onClick={() => {
              onConfirm(state?.selectedTable);
            }}
            disabled={isEmpty(state?.selectedTable)}
          >
            Confirm
          </Button>
          <Button
            size='xl'
            className={"cursor-pointer flex-1"}
            variant={"outline"}
            onClick={() => {
              setIsOpen((prevState) => !prevState);
            }}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
