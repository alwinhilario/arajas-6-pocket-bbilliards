import React from "react";
import { Card } from "@/components/ui/card";
import storage from "@/lib/localforage";
import { TOptions } from "../tables/types";

import { TableBody, TableCell, TableHead, Table, TableHeader, TableRow } from "@/components/ui/table";
import { NAME_OPTS } from "@/app/constants";
import { FaTrash } from "react-icons/fa";
import { Button } from "@/components/ui/button";

export default function NameList() {
  const [otherOrders, setOtherOrders] = React.useState<TOptions>([]);

  React.useEffect(() => {
    const load = async () => {
      const data = ((await storage.getItem("name_list")) || NAME_OPTS) as TOptions;

      setOtherOrders(data);
    };

    load();
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      const update = async () => {
        const x = ((await storage.getItem("name_list")) || NAME_OPTS) as TOptions;

        await storage.setItem("name_list", x);

        setOtherOrders(x);
      };

      update();
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<TOptions[0]>();

  return (
    <div>
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
            <div className='text-base pb-5'>
              Are you sure you want to permanently remove {selectedUser?.label}?
            </div>

            <div className='flex gap-2'>
              <Button
                size='xl'
                className={"cursor-pointer flex-1"}
                onClick={async () => {
                  const il = ((await storage.getItem("name_list")) || NAME_OPTS) as TOptions;
                  await storage.setItem(
                    "name_list",
                    il?.filter((x) => x?.id !== selectedUser?.id),
                  );
                  setIsOpen(!isOpen);
                }}
                // disabled={!state?.mop?.some((x) => x?.amount)}
              >
                Confirm
              </Button>
              <Button
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

      <Card className='pt-0'>
        <div className='text-lg font-bold p-5 pb-0'>Names </div>

        <Table>
          <TableHeader className='bg-gray-100/80'>
            <TableRow>
              <TableHead className='font-bold px-2 text-gray-600'>NAME</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {otherOrders.map((user, key) => (
              <TableRow key={key}>
                <TableCell className='font-medium flex items-center gap-3'>
                  <div>{user.label || "--"}</div>

                  <button
                    type='button'
                    onClick={() => {
                      setIsOpen(!isOpen);
                      setSelectedUser(user);
                    }}
                  >
                    <FaTrash className='text-red-400 h-3.5 w-3.5 cursor-pointer' />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
