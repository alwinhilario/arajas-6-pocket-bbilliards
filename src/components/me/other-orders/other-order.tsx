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
  // const [state, setState] = React.useState(data);

  // React.useEffect(() => {
  //   setState(data);
  // }, [JSON.stringify(data)]);

  return (
    <div className='flex items-center gap-2'>
      <InputSelect
        placeholder='Name'
        className='w-40'
        value={data?.name}
        options={nameOpts}
        disabled={data?.mop}
        onAddClick={async (add) => {
          const v = [
            ...(nameOpts || []),
            {
              id: dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS"),
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
                      item: x?.item,
                    };
                  }

                  return x;
                })
              : (() => {
                  if (!data?.mop) {
                    return [
                      ...(pendingPayment || []),
                      {
                        ...data,
                        name: v,
                        date: data?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                      },
                    ];
                  }

                  return pendingPayment;
                })(),
          );

          // @ts-expect-error
          setOtherOrders((prevState) =>
            prevState?.map((x, y) => {
              if (x?.id === data?.id) {
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
        className='!w-80'
        value={data?.item}
        disabled={data?.mop}
        options={inventoryOpts}
        onAddClick={async (add) => {
          const v = [
            ...(inventoryOpts || []),
            {
              id: dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS"),
              label: capitalizeFirstLetter(add),
              value: dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS"),
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
                      item: inventoryOpts?.find((xxx) => xxx?.value === v)?.label,
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
              : (() => {
                  if (!data?.mop) {
                    return [
                      ...pendingPayment,
                      {
                        ...data,
                        item: inventoryOpts?.find((xxx) => xxx?.value === v)?.label,
                        amount: (() => {
                          if (getAmount?.amount !== data?.amount && getAmount?.amount) {
                            return getAmount?.amount || "";
                          }

                          return data?.amount || "";
                        })(),
                        date: data?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                      },
                    ];
                  }

                  return pendingPayment;
                })(),
          );

          // @ts-expect-error
          setOtherOrders((prevState) =>
            prevState?.map((x, y) => {
              const getAmount = inventoryOpts?.find((x) => x?.value === v);

              if (x?.id === data?.id) {
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
        disabled={data?.mop}
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
                        item: x?.item,
                      };
                    }

                    return x;
                  })
                : (() => {
                    if (!data?.mop) {
                      return [
                        ...pendingPayment,
                        {
                          ...data,
                          amount,
                          date: data?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                        },
                      ];
                    }

                    return pendingPayment;
                  })(),
            );
          };

          setOtherOrders((prevState) =>
            prevState?.map((x, y) => {
              if (x?.id === data?.id) {
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
      <Input
        placeholder='Remarks...'
        className='w-60'
        disabled={data?.mop}
        value={data?.remarks}
        onChange={(v) => {
          const xx = async (remarks: string) => {
            const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;
            const dataExists = !isEmpty(pendingPayment?.find((x) => x?.id === data?.id));
            await storage.setItem(
              "pending_payment",
              dataExists
                ? pendingPayment?.map((x) => {
                    if (x?.id === data?.id) {
                      return {
                        ...data,
                        remarks,
                        date: x?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                        item: x?.item,
                      };
                    }

                    return x;
                  })
                : (() => {
                    if (!data?.mop) {
                      return [
                        ...pendingPayment,
                        {
                          ...data,
                          remarks,
                          date: data?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                        },
                      ];
                    }

                    return pendingPayment;
                  })(),
            );
          };

          setOtherOrders((prevState) =>
            prevState?.map((x, y) => {
              if (x?.id === data?.id) {
                xx(v.target.value);

                return {
                  ...x,
                  remarks: v.target.value,
                  date: x?.date || dayjs().format("YYYY/MM/DD hh:mm A"),
                };
              }

              return x;
            }),
          );
        }}
      />
      <Input value={data?.date} placeholder='Date' className='w-48' disabled />

      <Payment
        mop={data?.mop}
        // readOnly={data?.mop}
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
              if (x?.id === data?.id) {
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

      {/* {otherOrders?.length === key + 1 && (
        <div className='flex items-center gap-0.5'>
          {/* <Button
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
          </Button> */}
      {/* <Button
            size={"xl"}
            variant={"outline"}
            className='w-20 font-bold cursor-pointer'
            onClick={() => {
              const xx = async () => {
                const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;

                await storage.setItem(
                  "pending_payment",
                  pendingPayment?.filter((x) => x?.id !== data?.id),
                );
              };

              xx();

              setOtherOrders((prevState) =>
                prevState?.map((x, y) => {
                  if (y === key) {
                    return {
                      ...x,
                      amount: "",
                      date: "",
                      name: "",
                      remarks: "",
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
          </Button> */}
      {/* </div> */}
      {/* // )} */}

      {/* {otherOrders?.length !== key + 1 && ( */}
      <Button
        variant='destructive'
        size={"xl"}
        className='w-20 font-bold cursor-pointer'
        onClick={async () => {
          const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;

          await storage.setItem(
            "pending_payment",
            pendingPayment?.filter((x) => x?.id !== data?.id),
          );

          const res = (await storage.getItem("other_orders")) || [];
          await storage.setItem(
            "other_orders",
            res?.filter((x, y) => x?.id !== data?.id),
          );
          setOtherOrders((prevState) => prevState?.filter((x, y) => x?.id !== data?.id));
        }}
      >
        <span>Remove</span>
      </Button>
      {/* // )} */}
    </div>
  );
}
