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
import { SessionProvider } from "./provider";
import DailyRevenue from "@/components/me/daily-revenue";
import PlasadaList from "@/components/me/plasada-list";
import RemarksList from "@/components/me/remarks-list";
import RevenueList from "@/components/me/revenue-list";
import localforage from "localforage";
import storage from "@/lib/localforage";

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

  const [storageUsed, setStorageUsed] = React.useState("");

  React.useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        const usedSpace = estimate.usage; // Bytes used
        const totalQuota = estimate.quota; // Total bytes allowed
        const percentageUsed = (usedSpace / totalQuota) * 100;

        setStorageUsed(`Used: ${usedSpace} of ${totalQuota} bytes (${percentageUsed.toFixed(2)}%)`);
      });
    }
  }, []);

  // React.useEffect(() => {
  //   const download = async () => {
  //     const keys = await storage.keys();
  //     const data = {};
  //     for (const key of keys) {
  //       data[key] = await storage.getItem(key);
  //     }

  //     const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = "ipad-localforage-export.json";
  //     a.click();
  //   };

  //   download();
  // }, []);

  return (
    <SessionProvider>
      <div className='p-5 py-2.5 bg-gray-100 flex flex-col'>
        <br />

        <div className='flex items-center gap-3'>
          <div className='flex-1'>
            <div className='font-black'>
              <div className='flex items-end'>
                <div className='text-xl'>{dayjs(currentDay).format("MMMM DD, YYYY")}</div>
                <div className='pl-2 font-normal text-sm'>(8AM - 8AM)</div>
              </div>
              <div className='text-5xl text-green-500'>{dayjs(currentDay).format("hh:mm:ss A")}</div>
            </div>
          </div>
          <div className='text-gray-400'>
            <div>{storageUsed}</div>
          </div>
        </div>

        <br />

        <div>
          <Tables />
          <br />
          <OtherOrders />
          <br />
          <PlasadaList />
          <br />
          <OutList />
          <br />
          <RemarksList />
          <br />
          <DailyRevenue />
          <br />
          <NotPaidList />
          <br />
          <AllTableList />
          <br />
          <RevenueList />
          <br />
          <InventoryList />
          <br />
          <NameList />
        </div>

        <br />

        <Version />
        <br />
        <br />
        <br />
      </div>
    </SessionProvider>
  );
}
