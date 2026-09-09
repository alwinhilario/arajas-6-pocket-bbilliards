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
import { TABLE_OPTS } from "./constants";
import { TTableOpts } from "@/components/me/tables/types";
import duration from "dayjs/plugin/duration";
import clsx from "clsx";

dayjs.extend(duration);

const formatRemaining = (ms: number) => {
  const safe = Math.max(0, ms);
  const d = dayjs.duration(safe);
  const hours = Math.floor(safe / 3_600_000);

  return `${String(hours).padStart(2, "0")}:${String(d.minutes()).padStart(2, "0")}:${String(d.seconds()).padStart(2, "0")}`;
};

const RemainingTableTime = () => {
  const [now, setNow] = React.useState<dayjs.Dayjs | null>(null);
  const [tables, setTables] = React.useState<TTableOpts>([]);

  React.useEffect(() => {
    const tick = async () => {
      const data = ((await storage.getItem("tables")) || TABLE_OPTS) as TTableOpts;
      setTables(data || []);
      setNow(dayjs());
    };

    tick();
    const t = setInterval(tick, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  if (!now) return null;

  const upcoming = (tables || [])
    .filter((item) => item?.out && !item?.is_open_time)
    .map((item) => ({
      ...item,
      remainingMs: dayjs(item.out).diff(now),
    }))
    .sort((a, b) => a.remainingMs - b.remainingMs);

  if (upcoming.length === 0) return null;

  return (
    <div className='mb-3 rounded-lg border border-gray-200 bg-white p-3'>
      <div className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>About to timeout</div>
      <div className='flex flex-wrap gap-2'>
        {upcoming.map((item) => {
          const isOut = item.remainingMs <= 0;
          const isSoon = item.remainingMs > 0 && item.remainingMs < 15 * 60 * 1000;

          return (
            <div
              key={item.value}
              className={clsx("flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm", {
                "border-red-400 bg-red-100 text-red-800": isOut,
                "border-yellow-400 bg-yellow-100 text-yellow-800": isSoon,
                "border-gray-200 bg-gray-50 text-gray-800": !isOut && !isSoon,
              })}
            >
              <span className='font-semibold'>{item.label}</span>
              <span className='font-mono tabular-nums'>
                {isOut ? "Timed out" : formatRemaining(item.remainingMs)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

  const download = async () => {
    const keys = await storage.keys();
    const data = {};
    for (const key of keys) {
      data[key] = await storage.getItem(key);
    }

    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ipad-localforage-export.json";
    a.click();
  };
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
                <div className='text-xl'>{currentDay ? dayjs(currentDay).format("MMMM DD, YYYY") : "-"}</div>
                <div className='pl-2 font-normal text-sm'>(8AM - 8AM)</div>
              </div>
              <div className='text-5xl text-green-500'>
                {currentDay ? dayjs(currentDay).format("hh:mm:ss A") : "-"}
              </div>
            </div>
          </div>

          <div>
            <div className='text-gray-400 flex items-center gap-2 !-mb-24 mt-3 text-xs'>{storageUsed}</div>
          </div>
          <div>
            <RemainingTableTime />
          </div>
          {/* <div className='text-gray-400 flex items-center gap-2'>
            <div>{storageUsed}</div>
            <button
              type='button'
              onClick={() => download()}
              className='bg-blue-600 text-white rounded-md p-2 px-3 cursor-pointer'
            >
              {" "}
              export{" "}
            </button>
          </div> */}
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
          <AllTableList />
          <br />
          <DailyRevenue />
          <br />
          <NotPaidList />
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
