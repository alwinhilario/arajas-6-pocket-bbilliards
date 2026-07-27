import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import storage from "@/lib/localforage";
import { TTableOpts } from "../tables/types";
import { Badge } from "@/components/ui/badge";

export default function AllTableList() {
  const [tables, setTables] = React.useState<TTableOpts>([]);

  React.useEffect(() => {
    const load = async () => {
      const data = ((await storage.getItem("all-tables-list")) || []) as TTableOpts;
      setTables(data);
    };

    load();
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      const update = async () => {
        const x = ((await storage.getItem("all-tables-list")) || []) as TTableOpts;

        await storage.setItem("all-tables-list", x);

        setTables(x);
      };

      update();
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  return (
    <Card className='pt-0'>
      <div className='text-lg font-bold p-5 pb-0'>Table History </div>

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
          {tables?.length > 0 ? (
            tables.map((user, key) => (
              <TableRow key={key}>
                <TableCell className='font-medium'>{user.label}</TableCell>
                <TableCell>{user.in || "--"}</TableCell>
                <TableCell>{user.out || "--"}</TableCell>
                <TableCell className='capitalize break-all'>
                  {user.mop?.some((x) => parseInt(x?.amount || "0") > 0)
                    ? user?.mop?.map((y) => `${y?.label} (PHP ${y?.amount}.00)`)?.join("/")
                    : "--"}
                  <br />
                </TableCell>
                <TableCell>{user.amount?.length > 0 ? `PHP ${user.amount}.00` : "--"}</TableCell>
                <TableCell>
                  {{
                    Active: <Badge variant={"success"}>{user.status}</Badge>,
                    "Timed out": (
                      <Badge className='text-gray-600' variant={"secondary"}>
                        {user.status}
                      </Badge>
                    ),
                  }?.[user.status] || "--"}
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
    </Card>
  );
}
