import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import storage from "@/lib/localforage";
import { TOtherOrdersOpts } from "../tables/types";

export default function NotPaidList() {
  const [tables, setTables] = React.useState<TOtherOrdersOpts>([]);

  React.useEffect(() => {
    const t = setInterval(() => {
      const load = async () => {
        const x = (await storage.getItem("other_orders")) as TOtherOrdersOpts;

        setTables(
          x?.filter((x) => !x?.mop && (x?.amount?.length > 0 || x?.name?.length > 0 || x?.item?.length > 0)),
        );
      };
      load();
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  return (
    <Card className='pt-0'>
      <div className='text-lg font-bold p-5 pb-0'>Pending Payment </div>

      <Table>
        <TableHeader className='bg-gray-100/80'>
          <TableRow>
            <TableHead className='font-bold px-2 text-gray-600'>NAME</TableHead>
            <TableHead className='font-bold px-2 text-gray-600'>ITEM</TableHead>
            <TableHead className='font-bold px-2 text-gray-600'>AMOUNT</TableHead>
            <TableHead className='font-bold px-2 text-gray-600'>REMARKS</TableHead>
            <TableHead className='font-bold px-2 text-gray-600'>MOP</TableHead>
            <TableHead className='font-bold px-2 text-gray-600'>DATE</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {(tables || [])?.length > 0 ? (
            (tables || []).map((user, key) => (
              <TableRow key={key}>
                <TableCell className='font-medium'>{user.name || "--"}</TableCell>
                <TableCell>{user.item || "--"}</TableCell>
                <TableCell>
                  {parseInt(user.amount || "0") > 0 ? `PHP ${parseInt(user.amount || "0")}.00` : "--"}
                </TableCell>
                <TableCell>{user.remarks || "--"}</TableCell>
                <TableCell className='capitalize'>{user.mop || "--"}</TableCell>
                <TableCell className='capitalize'>{user.date || "--"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className='text-center pt-5 text-gray-400'>
                No data found...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
