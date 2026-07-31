import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import storage from "@/lib/localforage";
import { TTableOpts } from "../tables/types";
import { Badge } from "@/components/ui/badge";
import { filterObject } from "@/lib/utils";
import { SESSION_CONTEXT } from "@/app/provider";
import dayjs from "dayjs";

export default function AllTableList() {
  const [tables, setTables] = React.useState<TTableOpts>([]);

  React.useEffect(() => {
    const load = async () => {
      const data = ((await storage.getItem("all_tables_list")) || []) as TTableOpts;
      setTables(data?.sort((a, b) => dayjs(a?.in).diff(dayjs(b?.in))));
    };

    load();
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      const update = async () => {
        const x = ((await storage.getItem("all_tables_list")) || []) as TTableOpts;

        await storage.setItem("all_tables_list", x);

        setTables(x?.sort((a, b) => dayjs(a?.in).diff(dayjs(b?.in))));
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
  });

  return (
    <Card className='pt-0'>
      <div className='text-lg font-bold p-5 pb-0'>Table History </div>

      <div className='max-h-[290px] overflow-y-auto relative'>
        <Table>
          <TableHeader className='bg-gray-100/80'>
            <TableRow>
              <TableHead className='font-bold px-2 text-gray-600'>TABLE NO.</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>IN</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>OUT</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>MOP</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>AMOUNT</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>STATUS</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>REMARKS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered?.length > 0 ? (
              filtered.map((user, key) => (
                <TableRow key={key}>
                  <TableCell className='font-medium'>{user.label}</TableCell>
                  <TableCell>
                    <div className=''>
                      {dayjs(user.in)?.isValid() ? dayjs(user.in).format("MMM DD, YYYY - hh:mm A") : "--"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className=''>
                      {dayjs(user.out)?.isValid() ? dayjs(user.out).format("MMM DD, YYYY - hh:mm A") : "--"}
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
                  <TableCell>{user.remarks || "--"}</TableCell>
                </TableRow>
              ))
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
