import React from "react";
import { INVENTORY_OPTS, NAME_OPTS, OTHER_ORDERS } from "@/app/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputSelect } from "@/components/ui/input-select";
import { TInventoryList, TOptions, TOtherOrdersOpts, TOtherOrdersOptsData } from "../tables/types";
import Payment from "../payment";
import dayjs from "dayjs";
import storage from "@/lib/localforage";

export function capitalizeFirstLetter(str) {
  if (!str) return ""; // Handle empty strings safely
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function OtherOrder({
  setOtherOrders,
  otherOrders,
  data,
  index: key,
  nameOpts,
  inventoryOpts,
  setNameOpts,
  setInventoryOpts,
}: {
  setOtherOrders: React.Dispatch<React.SetStateAction<TOtherOrdersOpts>>;
  otherOrders: TOtherOrdersOpts;
  data: TOtherOrdersOptsData;
  index: number;
  nameOpts: TOptions;
  inventoryOpts: TInventoryList;
  setNameOpts: React.Dispatch<React.SetStateAction<TOptions>>;
  setInventoryOpts: React.Dispatch<React.SetStateAction<TInventoryList>>;
}) {
  return (
    <div className='flex items-center gap-2'>
      <InputSelect
        placeholder='Name'
        className='w-40'
        value={data?.name}
        options={nameOpts}
        onAddClick={async (add) => {
          const v = [
            ...(nameOpts || []),
            {
              label: capitalizeFirstLetter(add),
              value: capitalizeFirstLetter(add),
            },
          ];

          await storage.setItem("name_list", v);
          setNameOpts(v);
        }}
        onValueChange={(v) => {
          // @ts-expect-error
          setOtherOrders((prevState) =>
            prevState?.map((x, y) => {
              if (y === key) {
                return {
                  ...x,
                  name: v,
                  date: x?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                };
              }

              return x;
            }),
          );
        }}
      />
      <InputSelect
        className='!w-52'
        value={data?.item}
        options={inventoryOpts}
        onAddClick={async (add) => {
          const v = [
            ...(inventoryOpts || []),
            {
              label: capitalizeFirstLetter(add),
              value: capitalizeFirstLetter(add),
            },
          ];

          await storage.setItem("inventory_list", v);
          setInventoryOpts(v);
        }}
        onValueChange={(v) => {
          // @ts-expect-error
          setOtherOrders((prevState) =>
            prevState?.map((x, y) => {
              const getAmount = inventoryOpts?.find((x) => x?.value === v);

              if (y === key) {
                return {
                  ...x,
                  item: v,
                  amount: parseInt(getAmount?.amount || "0") > 0 ? getAmount?.amount : "",
                  date: x?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                };
              }

              return x;
            }),
          );
        }}
      />
      <Input
        placeholder='Amount'
        className='w-28'
        type='number'
        value={data?.amount}
        onChange={(v) => {
          setOtherOrders((prevState) =>
            prevState?.map((x, y) => {
              if (y === key) {
                return {
                  ...x,
                  amount: v.target.value,
                  date: x?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                };
              }

              return x;
            }),
          );
        }}
      />
      <Input value={data?.date} placeholder='Date' className='w-40' disabled />

      <Payment
        mop={data?.mop}
        onPayClick={(type) => {
          setOtherOrders((prevState) => {
            return prevState?.map((x, y) => {
              if (y === key) {
                return {
                  ...x,
                  mop: type,
                  date: x?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                };
              }

              return x;
            });
          });
        }}
      />

      {otherOrders?.length === key + 1 && (
        <div className='flex items-center gap-0.5'>
          <Button
            className='w-20 font-bold cursor-pointer'
            onClick={() => {
              setOtherOrders((prevState) => [...prevState, OTHER_ORDERS[0]]);
            }}
          >
            <span>Add</span>
          </Button>
          <Button
            variant={"outline"}
            className='w-20 font-bold cursor-pointer'
            onClick={() => {
              setOtherOrders((prevState) =>
                prevState?.map((x, y) => {
                  if (y === key) {
                    return {
                      ...x,
                      amount: "",
                      date: "",
                      name: "",
                      mop: "",
                      item: "",
                    };
                  }

                  return x;
                }),
              );
            }}
          >
            <span>Clear</span>
          </Button>
        </div>
      )}

      {otherOrders?.length !== key + 1 && (
        <Button
          variant='destructive'
          className='w-20 font-bold cursor-pointer'
          onClick={() => {
            setOtherOrders((prevState) => prevState?.filter((x, y) => y !== key));
          }}
        >
          <span>Remove</span>
        </Button>
      )}
    </div>
  );
}
