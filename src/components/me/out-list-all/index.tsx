import React from "react";
import { Card } from "@/components/ui/card";
import storage, { onStorageChange, updateStorageItem } from "@/lib/localforage";
import { TOutList } from "../tables/types";
import { OUT_LIST } from "@/app/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { FaPlus } from "react-icons/fa";

export default function OutListAll() {
  const [otherOrders, setOtherOrders] = React.useState<TOutList>([]);

  React.useEffect(() => {
    const load = async () => {
      const item = (await storage.getItem<TOutList>("out_list")) || OUT_LIST;
      setOtherOrders([...item].sort((a, b) => dayjs(b?.date).diff(dayjs(a?.date))));
    };

    void load();
    return onStorageChange("out_list", (key, value) => {
      if (Array.isArray(value)) {
        setOtherOrders([...(value as TOutList)].sort((a, b) => dayjs(b?.date).diff(dayjs(a?.date))));
      } else {
        void load();
      }
    });
  }, []);

  const filtered = otherOrders?.filter((x) => x?.is_all);
  const totalAmount = filtered?.reduce((acc, item) => acc + parseInt(item?.amount || "0"), 0);

  const updateExpense = (id: string | undefined, changes: Partial<TOutList[number]>) => {
    if (!id) return;
    void updateStorageItem<TOutList>(
      "out_list",
      (current) =>
        (Array.isArray(current) ? current : []).map((item) =>
          item?.id === id ? { ...item, ...changes } : item,
        ),
      [],
    );
  };

  const [isOpen, setIsOpen] = React.useState(false);
  const [state, setState] = React.useState<TOutList[number]>({
    id: "",
    remarks: "",
    label: "",
    amount: "",
    date: "",
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
              className='p-5 cursor-default w-105'
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
                      await updateStorageItem<unknown[]>(
                        "aggregate_list",
                        (current) => [
                          ...(Array.isArray(current) ? current : []),
                          {
                            date: dayjs().format("MMM DD, YYYY hh:mm A"),
                            id: state.id,
                          },
                        ],
                        [],
                      );

                      setIsOpen(!isOpen);
                      await updateStorageItem<TOutList>(
                        "out_list",
                        (current) => [
                          { ...state, is_all: true },
                          ...(Array.isArray(current) ? current : []),
                        ],
                        [],
                      );
                      setState({
                        id: "",
                        remarks: "",
                        label: "",
                        amount: "",
                        date: "",
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
            <div className='text-lg font-bold'>Expenses Overall</div>
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
                        updateExpense(item.id, { label: v.target.value });
                      }}
                    />
                    <Input
                      placeholder='Amount'
                      className='w-40'
                      value={item?.amount}
                      type='number'
                      onChange={(v) => {
                        updateExpense(item.id, { amount: v.target.value });
                      }}
                    />
                    <Input
                      placeholder='Remarks...'
                      className='w-60'
                      value={item?.remarks}
                      onChange={(v) => {
                        updateExpense(item.id, { remarks: v.target.value });
                      }}
                    />
                    <Input placeholder='Date' className='w-48' value={item?.date} disabled />

                    <Button
                      size={"xl"}
                      variant='destructive'
                      className='w-20 font-bold cursor-pointer'
                      onClick={async () => {
                        await updateStorageItem<TOutList>(
                          "out_list",
                          (current) => (Array.isArray(current) ? current : []).filter((x) => item?.id !== x?.id),
                          [],
                        );
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
