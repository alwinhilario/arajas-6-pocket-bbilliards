import React from "react";
import { INVENTORY_OPTS, NAME_OPTS, OTHER_ORDERS } from "@/app/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InputSelect } from "@/components/ui/input-select";
import { TInventoryList, TOptions, TOtherOrdersOpts, TOtherOrdersOptsData } from "../tables/types";
import Payment from "../payment";
import dayjs from "dayjs";
import storage from "@/lib/localforage";
import { isEmpty } from "lodash";

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
        onValueChange={async (v) => {
          const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;
          const dataExists = !isEmpty(pendingPayment?.find((x) => x?.id === data?.id));

          await storage.setItem(
            "pending_payment",
            dataExists
              ? pendingPayment?.map((x) => {
                  if (x?.id === data?.id) {
                    return {
                      ...data,
                      name: v,
                      date: x?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                    };
                  }

                  return x;
                })
              : [
                  ...(pendingPayment || []),
                  {
                    ...data,
                    name: v,
                    date: data?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                  },
                ],
          );

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
        onValueChange={async (v) => {
          const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;
          const dataExists = !isEmpty(pendingPayment?.find((x) => x?.id === data?.id));
          const getAmount = inventoryOpts?.find((x) => x?.value === v);

          await storage.setItem(
            "pending_payment",
            dataExists
              ? pendingPayment?.map((x) => {
                  if (x?.id === data?.id) {
                    return {
                      ...data,
                      item: v,
                      amount: (() => {
                        if (getAmount?.amount !== x?.amount && getAmount?.amount) {
                          return getAmount?.amount || "";
                        }

                        return x?.amount || "";
                      })(),
                      date: x?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                    };
                  }

                  return x;
                })
              : [
                  ...pendingPayment,
                  {
                    ...data,
                    item: v,
                    amount: (() => {
                      if (getAmount?.amount !== data?.amount && getAmount?.amount) {
                        return getAmount?.amount || "";
                      }

                      return data?.amount || "";
                    })(),
                    date: data?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                  },
                ],
          );

          // @ts-expect-error
          setOtherOrders((prevState) =>
            prevState?.map((x, y) => {
              const getAmount = inventoryOpts?.find((x) => x?.value === v);

              if (y === key) {
                return {
                  ...x,
                  item: v,
                  amount: (() => {
                    if (getAmount?.amount !== x?.amount && getAmount?.amount) {
                      return getAmount?.amount || "";
                    }

                    return x?.amount || "";
                  })(),
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
          const xx = async (amount: string) => {
            const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;
            const dataExists = !isEmpty(pendingPayment?.find((x) => x?.id === data?.id));
            await storage.setItem(
              "pending_payment",
              dataExists
                ? pendingPayment?.map((x) => {
                    if (x?.id === data?.id) {
                      return {
                        ...data,
                        amount,
                        date: x?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                      };
                    }

                    return x;
                  })
                : [
                    ...pendingPayment,
                    {
                      ...data,
                      amount,
                      date: data?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                    },
                  ],
            );
          };

          setOtherOrders((prevState) =>
            prevState?.map((x, y) => {
              if (y === key) {
                xx(v.target.value);

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
        onPayClick={async (type) => {
          const xx = async (v: TOtherOrdersOpts) => {
            await storage.setItem(
              "pending_payment",
              v?.filter(
                (x) =>
                  (!x?.mop || x?.mop?.length <= 0) &&
                  (x?.amount?.length > 0 ||
                    x?.item?.length > 0 ||
                    x?.name?.length > 0 ||
                    x?.remarks?.length > 0),
              ),
            );
          };

          setOtherOrders((prevState) => {
            const v = prevState?.map((x, y) => {
              if (y === key) {
                return {
                  ...x,
                  mop: type,
                  date: x?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                };
              }

              return x;
            });

            xx(v);

            return v;
          });
        }}
      />

      {otherOrders?.length === key + 1 && (
        <div className='flex items-center gap-0.5'>
          <Button
            className='w-20 font-bold cursor-pointer'
            onClick={async () => {
              const v = {
                ...OTHER_ORDERS[0],
                id: dayjs().format("YYYY/MM/DD HH:mm:ss.SSS"),
              };

              setOtherOrders((prevState) => [...prevState, v]);
            }}
          >
            <span>Add</span>
          </Button>
          <Button
            variant={"outline"}
            className='w-20 font-bold cursor-pointer'
            onClick={async () => {
              const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;

              await storage.setItem(
                "pending_payment",
                pendingPayment?.filter((x) => x?.id === data?.id),
              );

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
          onClick={async () => {
            const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;

            await storage.setItem(
              "pending_payment",
              pendingPayment?.filter((x) => x?.id === data?.id),
            );

            setOtherOrders((prevState) => prevState?.filter((x, y) => y !== key));
          }}
        >
          <span>Remove</span>
        </Button>
      )}
    </div>
  );
}
