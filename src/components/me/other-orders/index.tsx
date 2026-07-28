import React from "react";
import { Card } from "@/components/ui/card";
import storage from "@/lib/localforage";
import { TInventoryList, TOptions, TOtherOrdersOpts } from "../tables/types";

import OtherOrder from "./other-order";
import { INVENTORY_OPTS, NAME_OPTS, OTHER_ORDERS } from "@/app/constants";
import { isEmpty } from "lodash";

export default function OtherOrders() {
  const [otherOrders, setOtherOrders] = React.useState<TOtherOrdersOpts>([]);
  const [nameOpts, setNameOpts] = React.useState<TOptions>([]);
  const [inventoryOpts, setInventoryOpts] = React.useState<TOptions>([]);

  React.useEffect(() => {
    const load = async () => {
      const data = ((await storage.getItem("other_orders")) || OTHER_ORDERS) as TOtherOrdersOpts;
      const data1 = ((await storage.getItem("name_list")) || NAME_OPTS) as TOptions;
      const data2 = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;

      setOtherOrders(data);
      setNameOpts(data1);
      setInventoryOpts(data2);
    };

    load();
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      const update = async () => {
        const data1 = ((await storage.getItem("name_list")) || NAME_OPTS) as TOptions;
        const data2 = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;

        setNameOpts(data1);
        setInventoryOpts(data2);
      };

      update();
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  React.useEffect(() => {
    if (!Array.isArray(otherOrders) || (otherOrders || [])?.length <= 0) return;

    const update = async () => {
      (await storage.setItem("other_orders", otherOrders)) as TOtherOrdersOpts;
    };
    update();
  }, [JSON.stringify(otherOrders)]);

  const totalAmount = otherOrders?.reduce((acc, item) => acc + parseInt(item?.amount || "0"), 0);

  return (
    <div>
      <Card className='p-5 w-full'>
        <div className='flex-1 text-lg font-bold'>Others</div>

        <div>
          <div className='space-y-1'>
            {otherOrders?.map((item, key) => (
              <OtherOrder
                index={key}
                key={key}
                data={item}
                setOtherOrders={setOtherOrders}
                otherOrders={otherOrders}
                nameOpts={nameOpts}
                inventoryOpts={inventoryOpts}
                setNameOpts={setNameOpts}
                setInventoryOpts={setInventoryOpts}
              />
            ))}
          </div>
        </div>

        <div className='flex flex-col gap-0.5 font-semibold'>
          <div className='w-40'>Total Others</div>
          <div className='text-green-500 text-2xl font-bold'>
            {totalAmount > 0 ? `PHP ${`${totalAmount}`}.00` : "--"}
          </div>
        </div>
      </Card>
    </div>
  );
}
