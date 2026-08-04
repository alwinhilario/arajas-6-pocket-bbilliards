import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import storage from "@/lib/localforage";
import { TTableOpts, TTableOptsData } from "../tables/types";
import { Badge } from "@/components/ui/badge";
import { filterObject } from "@/lib/utils";
import { SESSION_CONTEXT } from "@/app/provider";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { IoWarning } from "react-icons/io5";
import TableEdit from "../tables/table-edit";

export default function AllTableList() {
  const [tables, setTables] = React.useState<TTableOpts>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      const data = ((await storage.getItem("all_tables_list")) || []) as TTableOpts;
      setTables(data?.filter((x) => x?.timed_out_at)?.sort((a, b) => dayjs(a?.out).diff(dayjs(b?.out))));
    };

    load();
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      const update = async () => {
        const x = ((await storage.getItem("all_tables_list")) || []) as TTableOpts;

        await storage.setItem("all_tables_list", x);

        setTables(x?.filter((x) => x?.timed_out_at)?.sort((a, b) => dayjs(a?.out).diff(dayjs(b?.out))));
      };

      update();
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  const { value } = React.useContext(SESSION_CONTEXT);
  const filtered = filterObject({
    object: tables,
    filter_from: value?.date?.date_from,
    filter_to: value?.date?.date_to,
    propertyName: "in",
    filterDate: true,
  });

  return (
    <Card className='pt-0'>
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
            <div className='font-black text-orange-400 text-2xl'>Warning:</div>
            <div className='text-base pb-5'>
              <div>
                Are you sure you want to permanently delete <b>Table History?</b>
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
                  await storage.setItem("all_tables_list", []);
                  setIsOpen(!isOpen);
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
          </Card>
        </div>
      )}

      <div className='flex items-center gap-2 text-lg font-bold p-5 pb-0'>
        <div className='flex-1'>Table History </div>
        <div>
          <Button
            variant={"warning"}
            className={"cursor-pointer font-bold"}
            size={"xl"}
            onClick={() => {
              setIsOpen(!isOpen);
            }}
          >
            <IoWarning className='h-5 w-5' />
            <div>Reset</div>
          </Button>
        </div>
      </div>

      <div className='max-h-[290px] overflow-y-auto relative'>
        <Table>
          <TableHeader className='bg-gray-100/80'>
            <TableRow>
              <TableHead className='font-bold px-2 text-gray-600'>TABLE NO.</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TIMED OUT AT</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>IN</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>OUT</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>MOP</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>AMOUNT</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>STATUS</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>UPDATED AT</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>REMARKS</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered?.length > 0 ? (
              filtered.map((user, key) => <TableData user={user} key={key} />)
            ) : (
              <TableRow>
                <TableCell colSpan={7} className='text-center pt-5 text-gray-400'>
                  No data found...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

const TableData = ({ user }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentTable, setCurrentTable] = React.useState<TTableOptsData>(user);

  return (
    <TableRow>
      <TableCell className='font-medium'>{user.label}</TableCell>

      <TableCell>
        {isOpen && (
          <TableEdit
            setIsOpen={setIsOpen}
            currentTable={currentTable}
            withPayment
            onConfirm={async (data) => {
              const allListTable = ((await storage.getItem("all_tables_list")) || []) as TTableOpts;

              await storage.setItem(
                "all_tables_list",
                allListTable?.map((item) => {
                  if (data?.id === item?.id) {
                    return {
                      ...item,
                      ...data,
                      updated_at: dayjs().format("YYYY/MM/DD - hh:mm A"),
                    };
                  }

                  return item;
                }),
              );
              setIsOpen(!isOpen);
            }}
          />
        )}
        <div className=''>{user?.timed_out_at || "--"}</div>
      </TableCell>
      <TableCell>
        <div className=''>
          {dayjs(user.out)?.isValid() ? dayjs(user.out).format("YYYY/MM/DD - hh:mm A") : "--"}
        </div>
      </TableCell>
      <TableCell>
        <div className=''>
          {dayjs(user.out)?.isValid() ? dayjs(user.out).format("YYYY/MM/DD - hh:mm A") : "--"}
        </div>
      </TableCell>

      <TableCell className='capitalize break-all'>
        <div className=''>
          {user.mop?.some((x) => parseInt(x?.amount || "0") > 0)
            ? user?.mop?.map((y) => `${y?.label} (PHP ${y?.amount}.00)`)?.join("/")
            : "--"}
        </div>
      </TableCell>
      <TableCell>{user.amount?.length > 0 ? `PHP ${user.amount}.00` : "--"}</TableCell>
      <TableCell>
        <div className=''>
          {{
            Active: <Badge variant={"success"}>{user.status}</Badge>,
            "Timed out": (
              <Badge className='text-gray-600' variant={"secondary"}>
                {user.status}
              </Badge>
            ),
          }?.[user.status] || "--"}
        </div>
      </TableCell>
      <TableCell>{user?.updated_at || "--"}</TableCell>
      <TableCell>{user.remarks || "--"}</TableCell>

      <TableCell>
        <Button
          className={"px-5 font-semibold cursor-pointer h-9"}
          onClick={() => {
            setCurrentTable(user);
            setIsOpen(!isOpen);
          }}
        >
          Edit
        </Button>
      </TableCell>
    </TableRow>
  );
};
