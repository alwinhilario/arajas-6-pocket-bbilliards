import React from "react";
import { Card } from "@/components/ui/card";
import storage from "@/lib/localforage";
import { TOutList } from "../tables/types";
import { OUT_LIST } from "@/app/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { FaPlus } from "react-icons/fa";
import { filterObject } from "@/lib/utils";
import { SESSION_CONTEXT } from "@/app/provider";

export default function OutListAll() {
  const [otherOrders, setOtherOrders] = React.useState<TOutList>([]);
  const { value } = React.useContext(SESSION_CONTEXT);

  React.useEffect(() => {
    const load = async () => {
      const item = ((await storage.getItem("out_list")) || OUT_LIST) as TOutList;

      setOtherOrders(item?.sort((a, b) => dayjs(a?.date).diff(dayjs(b?.date))));
    };

    load();
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
      (await storage.setItem(
        "out_list",
        filtered?.sort((a, b) => dayjs(a?.date).diff(dayjs(b?.date))),
      )) as TOutList;
    };
    update();
  }, [JSON.stringify(filtered)]);

  const [isOpen, setIsOpen] = React.useState(false);
  const [state, setState] = React.useState({
    remarks: "",
    label: "",
    amount: "",
  });

  return (
    <div>
      <Card className='p-5 w-full'>
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
                <div className='text-2xl font-bold'>Add Expenses (Out)</div>
                <br />

                <div className='space-y-1'>
                  <div className='font-semibold'>Description</div>
                  <Input
                    placeholder='Description'
                    value={state?.label}
                    onChange={(v) => {
                      setState((prevState) => ({ ...prevState, label: v.target.value }));
                    }}
                  />
                </div>

                <div className='space-y-1'>
                  <div className='font-semibold'>Amount</div>
                  <Input
                    placeholder='Amount'
                    type='number'
                    value={state?.amount}
                    onChange={(v) => {
                      setState((prevState) => ({ ...prevState, amount: v.target.value }));
                    }}
                  />
                </div>
                <div className='space-y-1'>
                  <div className='font-semibold'>Remarks</div>
                  <Input
                    placeholder='Remarks'
                    value={state?.remarks}
                    onChange={(v) => {
                      setState((prevState) => ({ ...prevState, remarks: v.target.value }));
                    }}
                  />
                </div>

                <br />

                <div className='flex gap-2 pt-3'>
                  <Button
                    size={"xl"}
                    className={"cursor-pointer flex-1"}
                    onClick={async () => {
                      setIsOpen(!isOpen);
                      setOtherOrders((prevState) => [...prevState, state]);
                      setState({
                        remarks: "",
                        label: "",
                        amount: "",
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
            <div className='text-lg font-bold'>Expenses Daily (Out)</div>
            <Button
              size={"xl"}
              className=' font-bold cursor-pointer py-3'
              onClick={async () => {
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
        </div>

        {filtered?.length > 0 && (
          <>
            <div>
              <div className='space-y-1'>
                {filtered?.map((item, key) => (
                  <div className='flex gap-2' key={key}>
                    <Input
                      placeholder='Label'
                      className='w-40'
                      value={item?.label}
                      onChange={(v) => {
                        setOtherOrders((prevState) =>
                          prevState?.map((x, y) => {
                            if (item?.id === x?.id) {
                              return {
                                ...x,
                                label: v.target.value,
                              };
                            }

                            return x;
                          }),
                        );
                      }}
                    />
                    <Input
                      placeholder='Amount'
                      className='w-40'
                      value={item?.amount}
                      type='number'
                      onChange={(v) => {
                        setOtherOrders((prevState) =>
                          prevState?.map((x, y) => {
                            if (item?.id === x?.id) {
                              return {
                                ...x,
                                amount: v.target.value,
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
                      value={item?.remarks}
                      onChange={(v) => {
                        setOtherOrders((prevState) =>
                          prevState?.map((x, y) => {
                            if (item?.id === x?.id) {
                              return {
                                ...x,
                                remarks: v.target.value,
                              };
                            }

                            return x;
                          }),
                        );
                      }}
                    />
                    <Input placeholder='Date' className='w-48' value={item?.date} disabled />

                    <Button
                      size={"xl"}
                      variant='destructive'
                      className='w-20 font-bold cursor-pointer'
                      onClick={async () => {
                        const res = (await storage.getItem("out_list")) || [];
                        await storage.setItem(
                          "out_list",
                          res?.filter((x, y) => item?.id !== x?.id),
                        );

                        setOtherOrders((prevState) => prevState?.filter((x, y) => item?.id !== x?.id));
                      }}
                    >
                      <span>Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className='flex flex-col gap-0.5 font-semibold'>
              <div className='w-40'>Total Expenses</div>
              <div className='text-green-500 text-2xl font-bold'>
                {totalAmount > 0 ? `PHP ${`${totalAmount}`}.00` : "PHP 0.00"}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
