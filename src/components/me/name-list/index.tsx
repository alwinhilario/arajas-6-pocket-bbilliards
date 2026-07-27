import React from "react";
import { Card } from "@/components/ui/card";
import storage from "@/lib/localforage";
import { TOptions } from "../tables/types";

import { TableBody, TableCell, TableHead, Table, TableHeader, TableRow } from "@/components/ui/table";
import { NAME_OPTS } from "@/app/constants";

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

  return (
    <div>
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
                <TableCell className='font-medium'>{user.label || "--"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
