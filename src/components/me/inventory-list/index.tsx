import React from "react";
import { Card } from "@/components/ui/card";
import storage from "@/lib/localforage";
import { TInventoryData, TInventoryList } from "../tables/types";

import { TableBody, TableCell, TableHead, Table, TableHeader, TableRow } from "@/components/ui/table";
import { INVENTORY_OPTS } from "@/app/constants";
import { FaPlus, FaTrash } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { Input } from "@/components/ui/input";
import { IoClose } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";

export default function InventoryList() {
  const [otherOrders, setOtherOrders] = React.useState<TInventoryList>([]);

  React.useEffect(() => {
    const load = async () => {
      const data = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;

      setOtherOrders(data);
    };

    load();
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      const update = async () => {
        const x = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;

        await storage.setItem("inventory_list", x);

        setOtherOrders(x);
      };

      update();
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  return (
    <div>
      <Card className='pt-0'>
        <div className='flex gap-3 p-5 pb-0 items-center'>
          <div className='text-lg font-bold'>Inventory </div>
          <Button
            size={"xl"}
            className='flex items-center gap-1 cursor-pointer px-4 py-2'
            onClick={async () => {
              const il = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;
              await storage.setItem("inventory_list", [
                ...il,
                {
                  label: "",
                  value: dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS"),
                  id: dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS"),
                },
              ]);
            }}
          >
            <FaPlus className='h-5 w-5' />
            <div>Add</div>
          </Button>
        </div>

        <Table>
          <TableHeader className='bg-gray-100/80'>
            <TableRow>
              <TableHead className='font-bold px-2 text-gray-600'>ITEM NAME</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>AMOUNT</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL STOCK</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>REMAINING</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>REMARKS</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {otherOrders?.map((user, key) => (
              <Inventory index={key} user={user} key={key} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

interface IInventoryProps {
  index: number;
  user: TInventoryData;
}

const Inventory = ({ index, user }: IInventoryProps) => {
  const [isEdit, setIsEdit] = React.useState(false);
  const [state, setState] = React.useState<TInventoryData>();
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setState(user);
  }, [JSON.stringify(user)]);

  return (
    <>
      {isOpen && (
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
            <div className='text-base pb-5'>Are you sure you want to permanently remove {user?.label}?</div>

            <div className='flex gap-2'>
              <Button
                size={"xl"}
                size='xl'
                className={"cursor-pointer flex-1"}
                onClick={async () => {
                  const il = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;
                  await storage.setItem(
                    "inventory_list",
                    il?.filter((x) => x?.id !== user?.id),
                  );
                  setIsOpen(!isOpen);
                }}
                // disabled={!state?.mop?.some((x) => x?.amount)}
              >
                Confirm
              </Button>
              <Button
                size={"xl"}
                size='xl'
                className={"cursor-pointer flex-1"}
                variant={"outline"}
                onClick={() => {
                  setIsOpen(!isOpen);
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      <TableRow key={index}>
        <TableCell className='font-medium'>
          {isEdit ? (
            <div className='flex'>
              <Input
                value={state?.label}
                onChange={async (e) => {
                  const v = e.target.value;

                  // @ts-expect-error
                  setState((prevState) => ({
                    ...prevState,
                    label: v,
                  }));
                }}
              />
            </div>
          ) : (
            state?.label || "--"
          )}
        </TableCell>
        <TableCell>
          {isEdit ? (
            <div className='flex'>
              <Input
                value={state?.amount}
                onChange={async (e) => {
                  const v = e.target.value;

                  // @ts-expect-error
                  setState((prevState) => ({
                    ...prevState,
                    amount: v,
                  }));
                }}
              />
            </div>
          ) : (
            state?.amount || "--"
          )}
        </TableCell>
        <TableCell>
          {isEdit ? (
            <div className='flex'>
              <Input
                value={state?.total_stock}
                onChange={async (e) => {
                  const v = e.target.value;

                  // @ts-expect-error
                  setState((prevState) => ({
                    ...prevState,
                    total_stock: v,
                  }));
                }}
              />
            </div>
          ) : (
            state?.total_stock || "--"
          )}
        </TableCell>
        <TableCell>
          {isEdit ? (
            <div className='flex'>
              <Input
                value={state?.remaining}
                onChange={async (e) => {
                  const v = e.target.value;

                  // @ts-expect-error
                  setState((prevState) => ({
                    ...prevState,
                    remaining: v,
                  }));
                }}
              />
            </div>
          ) : (
            state?.remaining || "--"
          )}
        </TableCell>
        <TableCell>
          {isEdit ? (
            <div className='flex'>
              <Input
                value={state?.remarks}
                onChange={async (e) => {
                  const v = e.target.value;

                  // @ts-expect-error
                  setState((prevState) => ({
                    ...prevState,
                    remarks: v,
                  }));
                }}
              />
            </div>
          ) : (
            state?.remarks || "--"
          )}
        </TableCell>

        <TableCell>
          <div className='flex items-center gap-2'>
            {isEdit && (
              <Button
                size={"xl"}
                className='cursor-pointer text-white bg-blue-500'
                type='button'
                onClick={async () => {
                  const il = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;
                  await storage.setItem(
                    "inventory_list",
                    il?.map((x) => {
                      if (x?.id === user?.id) {
                        return {
                          ...x,
                          ...state,
                        };
                      }

                      return x;
                    }),
                  );
                  setIsEdit(!isEdit);
                }}
              >
                Save
              </Button>
            )}

            <Button
              size={"xl"}
              className='px-3.5 cursor-pointer'
              type='button'
              onClick={() => {
                setIsEdit(!isEdit);
                setState(user);
              }}
            >
              {isEdit ? <IoClose className='h-7 w-7' /> : <MdEdit className='h-6 w-6 ' />}
            </Button>

            <Button
              size={"xl"}
              className='cursor-pointer text-white bg-red-500 px-3.5'
              type='button'
              onClick={() => setIsOpen(!isOpen)}
            >
              <FaTrash className='h-4 w-4' />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
};
