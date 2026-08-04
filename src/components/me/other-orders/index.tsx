import React from "react";
import { Card } from "@/components/ui/card";
import storage from "@/lib/localforage";
import { TInventoryList, TOptions, TOtherOrdersOpts } from "../tables/types";

import OtherOrder, { capitalizeFirstLetter } from "./other-order";
import { INVENTORY_OPTS, NAME_OPTS, OTHER_ORDERS } from "@/app/constants";
import { filterObject } from "@/lib/utils";
import { SESSION_CONTEXT } from "@/app/provider";
import { Button } from "@/components/ui/button";
import { FaPlus } from "react-icons/fa";
import dayjs from "dayjs";
import { Input } from "@/components/ui/input";
import Payment from "../payment";
import { InputSelect } from "@/components/ui/input-select";
import { Textarea } from "@/components/ui/textarea";
import { IoWarning } from "react-icons/io5";

export default function OtherOrders() {
  const [otherOrders, setOtherOrders] = React.useState<TOtherOrdersOpts>([]);
  const [nameOpts, setNameOpts] = React.useState<TOptions>([]);
  const [inventoryOpts, setInventoryOpts] = React.useState<TOptions>([]);
  const { value } = React.useContext(SESSION_CONTEXT);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      const data = ((await storage.getItem("other_orders")) || []) as TOtherOrdersOpts;
      const data1 = ((await storage.getItem("name_list")) || NAME_OPTS) as TOptions;
      const data2 = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;

      setOtherOrders(data);
      setNameOpts(data1);
      setInventoryOpts(data2);
    };

    load();
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      const update = async () => {
        const data = ((await storage.getItem("other_orders")) || []) as TOtherOrdersOpts;
        const data1 = ((await storage.getItem("name_list")) || NAME_OPTS) as TOptions;
        const data2 = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;

        setOtherOrders(data);
        setNameOpts(data1);
        setInventoryOpts(data2);
      };

      update();
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  const filtered = filterObject({
    object: otherOrders,
    filter_from: value?.date?.date_from,
    filter_to: value?.date?.date_to,
    propertyName: "date",
  });

  const totalAmount = filtered?.reduce((acc, item) => acc + parseInt(item?.amount || "0"), 0);

  React.useEffect(() => {
    if (!Array.isArray(filtered) || (filtered || [])?.length <= 0) return;

    const update = async () => {
      (await storage.setItem("other_orders", filtered)) as TOtherOrdersOpts;
    };
    update();
  }, [JSON.stringify(filtered)]);

  const [isResetOpen, setIsResetOpen] = React.useState(false);
  const [state, setState] = React.useState({
    name: "",
    item: "",
    amount: "",
    remarks: "",
    mop: "",
  });

  return (
    <div>
      <Card className='p-5 w-full'>
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
                  Are you sure you want to permanently delete <b>Orders Daily?</b>
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
                    await storage.setItem("other_orders", []);
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

        {isOpen && (
          <div
            className='fixed bg-black/90 top-0 left-0 h-screen w-screen flex justify-center items-start cursor-pointer z-50 pt-60'
            onClick={() => {
              setIsOpen((prevState) => !prevState);
            }}
          >
            <Card
              className='p-5 cursor-default w-[420px]'
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className='space-y-3'>
                <div className='text-2xl font-bold'>Add Order</div>
                <br />
                <div className='space-y-1'>
                  <div className='font-semibold'>Name</div>
                  <InputSelect
                    placeholder='Name'
                    className='capitalize'
                    value={state?.name}
                    options={nameOpts}
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
                      // @ts-expect-error
                      setState((prevState) => ({
                        ...prevState,
                        name: v,
                      }));
                    }}
                  />
                </div>

                <div className='space-y-1'>
                  <div className='font-semibold'>Product Name</div>
                  <InputSelect
                    className=''
                    value={state?.item}
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
                      const getAmount = inventoryOpts?.find((x) => x?.value === v);

                      // @ts-expect-error
                      setState((prevState) => ({
                        ...prevState,
                        item: v,
                        amount: (() => {
                          if (getAmount?.amount !== prevState?.amount && getAmount?.amount) {
                            return getAmount?.amount || "";
                          }

                          return prevState?.amount || "";
                        })(),
                      }));
                    }}
                  />
                </div>

                <div className='space-y-1'>
                  <div className='font-semibold'>Amount</div>
                  <Input
                    placeholder='Amount'
                    className=''
                    type='number'
                    value={state?.amount}
                    onChange={(v) => {
                      setState((prevState) => ({ ...prevState, amount: v.target.value }));
                    }}
                  />
                </div>
                <div className='space-y-1'>
                  <div className='font-semibold'>Remarks</div>
                  <Textarea
                    placeholder='Remarks...'
                    className=''
                    value={state?.remarks}
                    onChange={(v) => {
                      setState((prevState) => ({
                        ...prevState,
                        remarks: v.target.value,
                      }));
                    }}
                  />
                </div>
                {/* <Input value={state?.date} placeholder='Date' className='' disabled /> */}

                <div className='space-y-1'>
                  <div className='font-semibold'>Mode of Payment</div>
                  <Payment
                    mop={state?.mop}
                    // readOnly={state?.mop}
                    onPayClick={async (type) => {
                      setState((prevState) => ({
                        ...prevState,
                        mop: type,
                      }));
                    }}
                  />
                </div>

                <br />
                <div className='flex gap-2 pt-3'>
                  <Button
                    size={"xl"}
                    className={"cursor-pointer flex-1"}
                    onClick={async () => {
                      const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;

                      if (!state?.mop) {
                        await storage.setItem("pending_payment", [...pendingPayment, state]);
                      }

                      setIsOpen(!isOpen);
                      setOtherOrders((prevState) => [...prevState, state]);
                      setState({
                        name: "",
                        item: "",
                        amount: "",
                        remarks: "",
                        mop: "",
                      });
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    size={"xl"}
                    className={"cursor-pointer flex-1"}
                    variant={"outline"}
                    onClick={() => {
                      setIsOpen(!isOpen);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className='flex items-center gap-2 text-lg font-bold'>
          <div className='flex flex-1 gap-3 items-center'>
            <div className='text-lg font-bold'>Orders Daily (Others) </div>
            <Button
              size={"xl"}
              className=' font-bold cursor-pointer py-3'
              onClick={async () => {
                // const v = {
                //   ...OTHER_ORDERS[0],
                //   id: dayjs().format("YYYY/MM/DD HH:mm:ss.SSS"),
                // };

                // setOtherOrders((prevState) => [...prevState, v]);

                setState((prevState) => ({
                  ...prevState,
                  date: dayjs().format("YYYY/MM/DD hh:mm A"),
                  id: dayjs().format("YYYY/MM/DD HH:mm:ss.SSS"),
                }));

                setIsOpen(!isOpen);
              }}
            >
              <FaPlus className='h-5 w-5' />
              <div>Add</div>
            </Button>
          </div>
          {filtered?.length > 0 && (
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
          )}
        </div>

        <div className='relative space-y-5 flex flex-col'>
          {filtered?.length > 0 && (
            <>
              <div>
                <div className='space-y-1'>
                  {filtered?.map((item, key) => {
                    return (
                      <OtherOrder
                        index={key}
                        key={key}
                        data={item}
                        setOtherOrders={setOtherOrders}
                        otherOrders={filtered}
                        nameOpts={nameOpts}
                        inventoryOpts={inventoryOpts}
                        setNameOpts={setNameOpts}
                        setInventoryOpts={setInventoryOpts}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {filtered?.length > 0 && (
          <div className='flex flex-col gap-0.5 font-semibold'>
            <div className='w-40'>Total Others</div>
            <div className='text-green-500 text-2xl font-bold'>
              {totalAmount > 0 ? `PHP ${`${totalAmount}`}.00` : "PHP 0.00"}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
