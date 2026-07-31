import React from "react";
import { Card } from "@/components/ui/card";
import storage from "@/lib/localforage";
import { TOutList } from "../tables/types";
import { PLASADA_LIST } from "@/app/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { FaPlus } from "react-icons/fa";
import { filterObject } from "@/lib/utils";
import { SESSION_CONTEXT } from "@/app/provider";

export default function PlasadaList() {
  const [otherOrders, setOtherOrders] = React.useState<TOutList>([]);
  const { value } = React.useContext(SESSION_CONTEXT);

  React.useEffect(() => {
    const load = async () => {
      const item = ((await storage.getItem("plasada_list")) || PLASADA_LIST) as TOutList;

      setOtherOrders(item);
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
      (await storage.setItem("plasada_list", filtered)) as TOutList;
    };
    update();
  }, [JSON.stringify(filtered)]);

  return (
    <div>
      <Card className='p-5 w-full'>
        <div className='flex gap-3 items-center'>
          <div className='text-lg font-bold'>Plasada Daily</div>
          <Button
            size={"xl"}
            className='w-20 font-bold cursor-pointer py-3'
            onClick={() => {
              setOtherOrders((prevState) => [
                ...prevState,
                { ...PLASADA_LIST[0], id: dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS") },
              ]);
            }}
          >
            <FaPlus className='h-5 w-5' />

            <div>Add</div>
          </Button>
        </div>

        <div className='space-y-3'>
          <div className='flex gap-2'>
            <div className='w-60 font-black uppercase text-gray-600'>Versus</div>
            <div className='w-40 font-black uppercase text-gray-600'>Parada</div>
            <div className='w-40 font-black uppercase text-gray-600'>Amount</div>
            <div className='w-48 font-black uppercase text-gray-600'>Date</div>
          </div>
          <div className='space-y-1'>
            {filtered?.map((item, key) => (
              <div className='flex gap-2' key={key}>
                <Input
                  placeholder='Versus'
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
                <Input
                  placeholder='Parada'
                  type='number'
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

                <Input placeholder='Date' className='w-48' value={item?.date} disabled />

                {otherOrders?.length === key + 1 && (
                  <div className='flex items-center gap-0.5'>
                    <Button
                      size={"xl"}
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
                    size={"xl"}
                    variant='destructive'
                    className='w-20 font-bold cursor-pointer'
                    onClick={() => {
                      setOtherOrders((prevState) => prevState?.filter((x, y) => item?.id !== x?.id));
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
          <div className='w-40'>Total Plasada</div>
          <div className='text-green-500 text-2xl font-bold'>
            {totalAmount > 0 ? `PHP ${`${totalAmount}`}.00` : "--"}
          </div>
        </div>
      </Card>
    </div>
  );
}
