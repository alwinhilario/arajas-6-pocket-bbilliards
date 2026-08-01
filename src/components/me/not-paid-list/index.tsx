import React from "react";
import { Card } from "@/components/ui/card";
import storage from "@/lib/localforage";
import { TInventoryList, TOtherOrdersOpts, TPendingPaymentOpts, TTableOpts } from "../tables/types";
import { INVENTORY_OPTS, OTHER_ORDERS } from "@/app/constants";
import dayjs from "dayjs";
import Payment from "../payment";
import { FaTrash } from "react-icons/fa";
import { filterObject } from "@/lib/utils";
import { SESSION_CONTEXT } from "@/app/provider";
import { Button } from "@/components/ui/button";
import Table from "../tables/table";
import clsx from "clsx";
import { isEmpty } from "lodash";
import { IoWarning } from "react-icons/io5";

export default function NotPaidList() {
  const [tables, setTables] = React.useState<TOtherOrdersOpts>([]);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const { value } = React.useContext(SESSION_CONTEXT);
  const [inventoryOpts, setInventoryOpts] = React.useState<TInventoryList>(INVENTORY_OPTS);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      const data = ((await storage.getItem("pending_payment")) || OTHER_ORDERS) as TOtherOrdersOpts;
      const data1 = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;

      setTables(data);
      setInventoryOpts(data1);
    };

    load();
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      const load = async () => {
        const x = ((await storage.getItem("pending_payment")) || OTHER_ORDERS) as TOtherOrdersOpts;

        setTables(x);
      };
      load();
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  const totalAmount = tables?.reduce((acc, item) => acc + parseInt(item?.amount || "0"), 0);

  const result = Object.values(
    filterObject({
      object: tables,
      filter_from: value?.date?.date_from,
      filter_to: value?.date?.date_to,
      propertyName: "date",
      filterDate: true,
    }).reduce((acc, { item, name, mop, amount, date, remarks, id, is_table }) => {
      if (!acc[name]) {
        acc[name] = {
          name,
          total: 0,
          items: [],
          mop,
          date,
          remarks,
          id,
          is_table,
        };
      }

      acc[name].items.push({ id, item, amount, date, mop, remarks, is_table });

      if (!mop || mop?.length <= 0) {
        acc[name].total = parseInt(acc[name].total || "0") + parseInt(amount || "0");
      }

      return acc;
    }, {}),
  )
    .sort((a, b) => (a?.name || "")?.localeCompare(b.name))
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.item.localeCompare(b.item)),
    })) as TPendingPaymentOpts;

  const [myResult, setMyResult] = React.useState<TPendingPaymentOpts>(result);
  const getTable = async (id: string) => {
    const data = ((await storage.getItem("all_tables_list")) || []) as TTableOpts;

    return data?.find((x) => x?.id === id);
  };
  const [currentView, setCurrentView] = React.useState({});
  const [isResetOpen, setIsResetOpen] = React.useState(false);
  React.useEffect(() => {
    setMyResult(result);
  }, [JSON.stringify(result)]);

  return (
    <Card className='pt-0'>
      {isResetOpen && (
        <div
          className='fixed bg-black/90 top-0 left-0 h-screen w-screen flex justify-center items-start cursor-pointer z-50 pt-60'
          onClick={() => {
            setIsOpen((prevState) => !prevState);
          }}
        >
          <Card
            className='p-5 cursor-default'
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className='font-black text-orange-400 text-2xl'>Warning:</div>
            <div className='text-base pb-5'>
              <div>
                Are you sure you want to permanently delete <b>Pending Payments?</b>
              </div>
              <div className='text-gray-500'>
                <small>
                  <i>This is only used for early testing.</i>
                </small>
              </div>
            </div>

            <div className='flex gap-2'>
              <Button
                size={"xl"}
                className={"cursor-pointer flex-1"}
                onClick={async () => {
                  await storage.setItem("pending_payment", []);
                  setIsResetOpen(!isResetOpen);
                }}
              >
                Confirm
              </Button>
              <Button
                size={"xl"}
                className={"cursor-pointer flex-1"}
                variant={"outline"}
                onClick={() => {
                  setIsResetOpen(!isResetOpen);
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className='flex items-center gap-2 text-lg font-bold p-5 pb-0'>
        <div className='flex-1'>Pending Payment Daily </div>
        <div>
          <Button
            variant={"warning"}
            className={"cursor-pointer font-bold"}
            size={"xl"}
            onClick={() => {
              setIsResetOpen(!isResetOpen);
            }}
          >
            <IoWarning className='h-5 w-5' />
            <div>Reset</div>
          </Button>
        </div>
      </div>

      {isOpen && (
        <div
          className='fixed bg-black/90 top-0 left-0 h-screen w-screen flex justify-center items-start cursor-pointer z-50 pt-60'
          onClick={() => {
            setIsOpen((prevState) => !prevState);
          }}
        >
          <Card
            className='p-5 cursor-default w-[380px]'
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className=' pb-4'>
              <div className='text-base'>
                Are you sure you want to clear <b>{currentView?.name}</b>? Remaining balance is{" "}
                <b>{`PHP ${parseInt(currentView?.total || "0")}.00`}</b>
              </div>
              <br />
              <span className='text-gray-400'>
                <i>This will return to Others list, for that specific date.</i>
              </span>
            </div>

            <div className='flex gap-2'>
              <Button
                size='xl'
                className={"cursor-pointer flex-1"}
                onClick={async () => {
                  let res = (await storage.getItem("other_orders")) as TOtherOrdersOpts;
                  await storage.setItem(
                    "other_orders",
                    (() => {
                      if (
                        res?.length === 1 &&
                        !res?.[0]?.amount &&
                        !res?.[0]?.item &&
                        !res?.[0]?.name &&
                        !res?.[0]?.mop &&
                        !res?.[0]?.date &&
                        !res?.[0]?.remarks
                      ) {
                        return (currentView?.items || [])?.map((x) => ({ ...x, name: currentView?.name }));
                      }

                      (currentView?.items || [])?.map((x) => {
                        if (!res?.some((y) => x?.id === y?.id)) {
                          res = [
                            ...res,
                            {
                              ...x,
                              name: currentView?.name,
                            },
                          ];
                        }
                      });

                      return res?.map((xxx) => {
                        const exists = (currentView?.items || [])?.find((y) => y?.id === xxx?.id);

                        if (!isEmpty(exists)) {
                          return {
                            ...xxx,
                            ...exists,
                          };
                        }

                        return xxx;
                      });
                    })(),
                  );

                  const res2 = await storage.getItem("pending_payment");
                  await storage.setItem(
                    "pending_payment",
                    res2?.filter((xxx) => !(currentView?.items || [])?.some((asd) => asd?.id === xxx?.id)),
                  );
                  setTables(
                    res2?.filter((xxx) => !(currentView?.items || [])?.some((asd) => asd?.id === xxx?.id)),
                  );

                  setIsOpen(!isOpen);
                }}
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
      )}

      {isViewOpen && (
        <div
          className='fixed bg-black/90 top-0 left-0 h-screen w-screen flex justify-center items-start cursor-pointer z-50 pt-60'
          onClick={() => {
            setIsViewOpen((prevState) => !prevState);
          }}
        >
          <div
            className='w-96 cursor-default'
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Table data={currentView} isView />
          </div>
        </div>
      )}

      <div className='px-5 flex flex-col'>
        <div className='flex items-center gap-2 pb-5'>
          <div className='w-32 font-black p-0.5 px-3 text-gray-600'>NAME</div>
          <div className='w-68 font-black p-0.5 px-5 text-gray-600'>ITEM</div>
          <div className='w-28 font-black p-0.5 px-7 text-gray-600'>AMOUNT</div>
          <div className='w-80 font-black p-0.5 px-5 text-gray-600'>REMARKS</div>
          <div className='w-48 font-black p-0.5 px-5 text-gray-600'>DATE</div>
          <div className='w-24 font-black p-0.5 px-5 text-gray-600'>MOP</div>
        </div>

        {myResult?.length > 0 ? (
          <div className='space-y-6 divide-y flex flex-col '>
            {myResult?.map((item, key) => {
              return (
                <div className='border rounded-sm self-start drop-shadow-accent' key={key}>
                  <div className='flex divide-x '>
                    <div className='w-36 p-3 px-3.5 font-bold'>{item?.name}</div>
                    <div className=''>
                      <div className='divide-x divide-y border-b '>
                        {item?.items?.map((x, key) => (
                          <div className='flex items-center divide-x ' key={key}>
                            <div className='w-68 p-2 px-3'>
                              {(() => {
                                const exists = !isEmpty(inventoryOpts?.find((xx) => xx?.value === x?.item));

                                if (x?.item && exists) {
                                  return inventoryOpts?.find((xx) => xx?.value === x?.item)?.label;
                                } else if (x?.item) {
                                  return x?.item;
                                }

                                return "--";
                              })()}
                            </div>
                            <div className='w-28 p-2 px-3'>{x?.amount}</div>
                            <div className='w-80 p-2 px-3'>{x?.remarks || "--"}</div>
                            <div className='w-48 p-2 px-3 text-gray-500'>
                              {dayjs(x?.date).isValid()
                                ? dayjs(x?.date)?.format("MMM DD, YYYY hh:mm A")
                                : "--"}
                            </div>
                            <div
                              className={clsx("p-1.5 flex items-center gap-2", {
                                " w-56": (item?.name || "")?.toLowerCase()?.includes("table"),
                              })}
                            >
                              <Payment
                                // withBorder={x?.mop === "cash" ? true : false}
                                mop={x?.mop}
                                onPayClick={async (type) => {
                                  const pp = ((await storage.getItem("pending_payment")) ||
                                    OTHER_ORDERS) as TOtherOrdersOpts;

                                  await storage.setItem(
                                    "pending_payment",
                                    pp?.map((xx) => {
                                      if (xx?.id === x?.id) {
                                        return {
                                          ...xx,
                                          mop: type,
                                        };
                                      }

                                      return xx;
                                    }),
                                  );

                                  // @ts-expect-error
                                  setTables((prevState) =>
                                    prevState?.map((xx) => {
                                      if (xx?.id === x?.id) {
                                        return {
                                          ...xx,
                                          mop: type,
                                        };
                                      }

                                      return xx;
                                    }),
                                  );
                                }}
                              />

                              {(item?.name || "")?.toLowerCase()?.includes("table") && (
                                <Button
                                  size={"xl"}
                                  className='cursor-pointer'
                                  onClick={async () => {
                                    const res = await getTable(x?.id);
                                    setCurrentView(res);
                                    setIsViewOpen(!isViewOpen);
                                  }}
                                >
                                  View details
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className='flex items-center gap-2  p-1.5'>
                        <div className='flex gap-2 font-bold  flex-1'>
                          <div className='w-28 p-0.5 px-1.5'>Total</div>
                          <div className='p-0.5 px-3.5'>PHP {item?.total}.00</div>
                        </div>

                        {item?.items?.every((xx) => xx?.mop && xx?.mop?.length > 0) && (
                          <div className='pr-2'>
                            <FaTrash
                              className='h-4 w-4 text-red-400 cursor-pointer'
                              onClick={() => {
                                setIsOpen(!isOpen);
                                setCurrentView(item);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>No Data found...</>
        )}
      </div>

      <div className='p-5 pt-2 pb-0'>
        <div className='flex flex-col gap-0.5 font-semibold'>
          <div className='w-40'>Total Amount</div>
          <div className='text-green-500 text-2xl font-bold'>
            {totalAmount > 0 ? `PHP ${`${totalAmount}`}.00` : "--"}
          </div>
        </div>
      </div>
    </Card>
  );
}
