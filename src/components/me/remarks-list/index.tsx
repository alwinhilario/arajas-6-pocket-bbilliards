import React from "react";
import { Card } from "@/components/ui/card";
import storage from "@/lib/localforage";
import { TOutList } from "../tables/types";
import { REMARKS_LIST } from "@/app/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { FaPlus } from "react-icons/fa";
import { filterObject } from "@/lib/utils";
import { SESSION_CONTEXT } from "@/app/provider";

export default function RemarksList() {
  const [otherOrders, setOtherOrders] = React.useState<TOutList>([]);
  const { value } = React.useContext(SESSION_CONTEXT);

  React.useEffect(() => {
    const load = async () => {
      const item = ((await storage.getItem("remarks_list")) || REMARKS_LIST) as TOutList;

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

  React.useEffect(() => {
    if (!Array.isArray(filtered) || (filtered || [])?.length <= 0) return;

    const update = async () => {
      (await storage.setItem("remarks_list", filtered)) as TOutList;
    };
    update();
  }, [JSON.stringify(filtered)]);

  return (
    <div>
      <Card className='p-5 w-full'>
        <div className='flex gap-3 items-center'>
          <div className='text-lg font-bold'>Remarks Daily</div>
          <Button
            size={"xl"}
            className='w-20 font-bold cursor-pointer py-3'
            onClick={() => {
              setOtherOrders((prevState) => [
                ...prevState,
                { ...REMARKS_LIST[0], id: dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS") },
              ]);
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
                  className='w-40 uppercase'
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
                  placeholder='Remarks...'
                  className='w-68'
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
      </Card>
    </div>
  );
}
