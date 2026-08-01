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

  const [isOpen, setIsOpen] = React.useState(false);
  const [state, setState] = React.useState({
    remarks: "",
    label: "",
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
                <div className='text-2xl font-bold'>Add Plasada</div>
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

        <div className='flex gap-3 items-center'>
          <div className='text-lg font-bold'>Remarks Daily</div>
          <Button
            size={"xl"}
            className='w-20 font-bold cursor-pointer py-3'
            onClick={() => {
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
                    const res = (await storage.getItem("remarks_list")) || [];
                    await storage.setItem(
                      "remarks_list",
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
      </Card>
    </div>
  );
}
