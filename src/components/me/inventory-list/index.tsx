import React from "react";
import { Card } from "@/components/ui/card";
import storage from "@/lib/localforage";
import { TInventoryList } from "../tables/types";

import { TableBody, TableCell, TableHead, Table, TableHeader, TableRow } from "@/components/ui/table";

export default function InventoryList() {
  const [otherOrders, setOtherOrders] = React.useState<TInventoryList>([]);

  React.useEffect(() => {
    const load = async () => {
      const data = (await storage.getItem("inventory_list")) as TInventoryList;

      setOtherOrders(data);
    };

    load();
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      const update = async () => {
        const x = (await storage.getItem("inventory_list")) as TInventoryList;

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
        <div className='text-lg font-bold p-5 pb-0'>Inventory </div>

        <Table>
          <TableHeader className='bg-gray-100/80'>
            <TableRow>
              <TableHead className='font-bold px-2 text-gray-600'>ITEM NAME</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>AMOUNT</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL STOCK</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>REMAINING</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>REMARKS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {otherOrders?.map((user, key) => (
              <TableRow key={key}>
                <TableCell className='font-medium'>{user.label || "--"}</TableCell>
                <TableCell>{user.amount || "--"}</TableCell>
                <TableCell>{user.total_stock || "--"}</TableCell>
                <TableCell>{user.remaining || "--"}</TableCell>
                <TableCell>{user.remarks || "--"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
