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

export default function OutList() {
  const [otherOrders, setOtherOrders] = React.useState<TOutList>([]);
  const { value } = React.useContext(SESSION_CONTEXT);

  React.useEffect(() => {
    const load = async () => {
      const item = ((await storage.getItem("out_list")) || OUT_LIST) as TOutList;

      setOtherOrders(item);
    };

    load();
  }, []);

  React.useEffect(() => {
    if (!Array.isArray(otherOrders) || (otherOrders || [])?.length <= 0) return;

    const update = async () => {
      (await storage.setItem("out_list", otherOrders)) as TOutList;
    };
    update();
  }, [JSON.stringify(otherOrders)]);

  const totalAmount = otherOrders?.reduce((acc, item) => acc + parseInt(item?.amount || "0"), 0);

  const filtered = filterObject({
    object: otherOrders,
    filter_from: value?.date?.date_from,
    filter_to: value?.date?.date_to,
    propertyName: "date",
  });

  return (
    <div>
      <Card className='p-5 w-full'>
        <div className='flex gap-2'>
          <div className='text-lg font-bold'>Expenses </div>
          <Button
            className='w-20 font-bold cursor-pointer'
            onClick={() => {
              setOtherOrders((prevState) => [...prevState, OUT_LIST[0]]);
            }}
          >
            <FaPlus className='h-5 w-5' />

            <div>Add</div>
          </Button>
        </div>

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
                  value={item?.remarks}
                  onChange={(v) => {
                    setOtherOrders((prevState) =>
                      prevState?.map((x, y) => {
                        if (item?.id === x?.id) {
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
                <Input placeholder='Date' className='w-40' value={item?.date} disabled />

                {otherOrders?.length === key + 1 && (
                  <div className='flex items-center gap-0.5'>
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
                                label: "",
                                remarks: "",
                                date: "",
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
                      setOtherOrders((prevState) => prevState?.filter((x, y) => item?.id === x?.id));
                    }}
                  >
                    <span>Remove</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className='flex flex-col gap-0.5 font-semibold'>
          <div className='w-40'>Total Expense</div>
          <div className='text-green-500 text-2xl font-bold'>
            {totalAmount > 0 ? `PHP ${`${totalAmount}`}.00` : "--"}
          </div>
        </div>
      </Card>
    </div>
  );
}
