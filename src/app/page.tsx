"use client";

import React from "react";
import Tables from "@/components/me/tables/tables";
import dayjs from "dayjs";
import AllTableList from "@/components/me/all-table-list";
import OtherOrders from "@/components/me/other-orders";
import NotPaidList from "@/components/me/not-paid-list";
import InventoryList from "@/components/me/inventory-list";
import NameList from "@/components/me/name-list";
import OutList from "@/components/me/out-list";
import Version from "@/components/me/version";

export default function Home() {
  const [currentDay, setCurrentDay] = React.useState(dayjs().add(1, "second"));

  React.useEffect(() => {
    const t = setInterval(() => {
      setCurrentDay(dayjs().add(1, "second"));
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  return (
    <div className='p-5 py-2.5 bg-gray-100 flex flex-col'>
      <div className='flex items-center gap-3'>
        <div className='flex-1'>
          <button type='button' className='px-2 p-1 rounded hover:text-yellow-600 font-medium cursor-pointer'>
            Home
          </button>
          <button type='button' className='px-2 p-1 rounded hover:text-yellow-600 font-medium cursor-pointer'>
            Others
          </button>
          <button type='button' className='px-2 p-1 rounded hover:text-yellow-600 font-medium cursor-pointer'>
            Statistics
          </button>
          <button type='button' className='px-2 p-1 rounded hover:text-yellow-600 font-medium cursor-pointer'>
            Pending Payment
          </button>
          <button type='button' className='px-2 p-1 rounded hover:text-yellow-600 font-medium cursor-pointer'>
            Inventory
          </button>
          <button type='button' className='px-2 p-1 rounded hover:text-yellow-600 font-medium cursor-pointer'>
            Table History
          </button>
          <button type='button' className='px-2 p-1 rounded hover:text-yellow-600 font-medium cursor-pointer'>
            Out
          </button>
        </div>
        <div className='font-black text-right'>
          <div className='text-xl'>{dayjs(currentDay).format("MMMM DD, YYYY")}</div>
          <div className='text-5xl text-green-500'>{dayjs(currentDay).format("hh:mm:ss A")}</div>
        </div>
      </div>
      <br />
      <Tables />
      <br />
      <OtherOrders />
      <br />
      <NotPaidList />
      <br />
      <OutList />
      <br />
      <AllTableList />
      <br />
      <InventoryList />
      <br />
      <NameList />
      <br />

      <Version />
      <br />
      <br />
      <br />
    </div>
  );
}
