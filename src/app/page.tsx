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
import storage, { onStorageChange } from "@/lib/localforage";
import { mergeTableOptions } from "./constants";
import { TTableOpts } from "@/components/me/tables/types";
import duration from "dayjs/plugin/duration";
import clsx from "clsx";
import MonthlyRevenue from "@/components/me/monthly-revenue";
import { IoHome, IoPeople, IoReceipt, IoWarning } from "react-icons/io5";
import { IoMdCart } from "react-icons/io";
import { TbCurrencyPeso } from "react-icons/tb";
import { FaPesoSign } from "react-icons/fa6";
import { FaCashRegister, FaMoneyBillWave } from "react-icons/fa";
import { PiNoteFill } from "react-icons/pi";
import { MdOutlineDoubleArrow, MdOutlineInventory, MdTableRestaurant } from "react-icons/md";
import OutListAll from "@/components/me/out-list-all";
import PendingPaymentMonitor from "@/components/me/monthly-revenue/pending-payment-monitor";
import BaleList from "@/components/me/bale-list";
import UtangList from "@/components/me/utang-list";
import { getEffectiveOutTime } from "@/components/me/tables/time-utils";

dayjs.extend(duration);

const formatRemaining = (ms: number) => {
  const safe = Math.max(0, ms);
  const d = dayjs.duration(safe);
  const hours = Math.floor(safe / 3_600_000);

  return `${String(hours).padStart(2, "0")}h ${String(d.minutes()).padStart(2, "0")}m`;
};

const LiveClock = React.memo(function LiveClock() {
  const [currentDay, setCurrentDay] = React.useState<dayjs.Dayjs | null>(null);

  React.useEffect(() => {
    setCurrentDay(dayjs());
    const t = setInterval(() => {
      setCurrentDay(dayjs());
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  return (
    <div className='font-black'>
      <div className='flex items-end'>
        <div className='text-xl'>{currentDay ? currentDay.format("MMMM DD, YYYY") : "-"}</div>
        <div className='pl-2 font-normal text-sm'>(8AM - 8AM)</div>
      </div>
      <div className='text-5xl text-green-500'>{currentDay ? currentDay.format("hh:mm:ss A") : "-"}</div>
    </div>
  );
});

const RemainingTableTime = ({ storageUsed }: { storageUsed: string }) => {
  const [now, setNow] = React.useState<dayjs.Dayjs | null>(null);
  const [tables, setTables] = React.useState<TTableOpts>([]);

  React.useEffect(() => {
    const loadTables = async () => {
      const data = await storage.getItem<TTableOpts>("tables");
      setTables(mergeTableOptions(data));
    };

    loadTables();
    return onStorageChange("tables", () => {
      loadTables();
    });
  }, []);

  React.useEffect(() => {
    setNow(dayjs());
    const t = setInterval(() => {
      setNow(dayjs());
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  if (!now) return null;

  const upcoming = (tables || [])
    .filter((item) => item?.out && !item?.is_open_time)
    .map((item) => {
      const outTime = getEffectiveOutTime(item.in || "", item.out);
      return {
        ...item,
        outTime,
        remainingMs: outTime.diff(now),
      };
    })
    .sort((a, b) => a.remainingMs - b.remainingMs);
  const openTimeTables = (tables || []).filter((item) => item?.is_open_time && item?.in);

  if (upcoming.length === 0 && openTimeTables.length === 0) return null;

  return (
    <div className='mb-3 rounded-lg border border-gray-200 bg-white p-1.5'>
      {/* <div className='flex items-center gap-2 mb-2'>
        <div className='text-xs font-semibold uppercase tracking-wide text-gray-700'>Timeout in order</div>
        <div className='text-gray-400/70 flex items-center text-xs'>{storageUsed}</div>
      </div> */}
      <div className='flex items-start justify-between gap-2'>
        <div className='flex flex-wrap gap-2'>
          {upcoming.map((item) => {
            const isOut = item.remainingMs <= 0;
            const isSoon = item.remainingMs > 0 && item.remainingMs < 15 * 60 * 1000;

            return (
              <div
                key={item.value}
                className={clsx("flex flex-col rounded-md border p-1.5 text-[0.80rem] leading-tight", {
                  "border-red-400 bg-red-100 text-red-800": isOut,
                  "border-yellow-400 bg-yellow-100/50 text-yellow-800": isSoon,
                  "border-gray-200 bg-gray-50 text-gray-800": !isOut && !isSoon,
                })}
              >
                <div className='font-semibold'>{item.label}</div>
                <div className='font-mono tabular-nums'>Out: {item.outTime.format("hh:mm A")}</div>
                <div className='font-mono tabular-nums text-blue-500'>
                  Remaining: {isOut ? "Timed out" : formatRemaining(item.remainingMs)}
                </div>
              </div>
            );
          })}
        </div>
        {openTimeTables.length > 0 && (
          <div className='flex flex-wrap justify-end gap-2 h-full'>
            {openTimeTables.map((item) => (
              <div
                key={item.value}
                className='rounded-md border border-yellow-400 bg-yellow-100/50 p-1.5 text-[0.80rem] font-semibold leading-tight text-yellow-800'
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const [storageUsed, setStorageUsed] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        const usedSpace = estimate.usage || 0; // Bytes used
        const totalQuota = estimate.quota || 1; // Total bytes allowed
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

  return (
    <SessionProvider>
      <PendingPaymentMonitor />
      <div className='p-5 py-3 bg-gray-100 flex flex-col'>
        <div className='flex items-bottom gap-3 pt-3'>
          <div className='flex-1'>
            {/* <LiveClock /> */}

            <div className='flex items-center gap-2'>
              <div className='flex-1'>
                <div className='text-sm flex items-center flex-wrap gap-1.5'>
                  <button
                    onClick={() => setPage(1)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 1,
                      },
                    )}
                  >
                    <IoHome className='h-4 w-4 text-gray-700' />
                    <div>Home</div>
                  </button>
                  <button
                    onClick={() => setPage(2)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 2,
                      },
                    )}
                  >
                    <IoReceipt className='h-4 w-4 text-gray-700' />
                    <div>Orders</div>
                  </button>
                  <button
                    onClick={() => setPage(3)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 3,
                      },
                    )}
                  >
                    <FaPesoSign className='h-4 w-4 text-gray-700' />
                    <div>Plasada</div>
                  </button>
                  <button
                    onClick={() => setPage(4)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 4,
                      },
                    )}
                  >
                    <FaMoneyBillWave className='h-5 w-5 text-gray-700' />
                    <div>Expenses</div>
                  </button>
                  <button
                    onClick={() => setPage(5)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 5,
                      },
                    )}
                  >
                    <PiNoteFill className='h-5 w-5 text-gray-700' />
                    <div>Remarks</div>
                  </button>
                  <button
                    onClick={() => setPage(6)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md animate-bounce",
                      {
                        "bg-white": page === 6,
                      },
                    )}
                  >
                    <div>
                      <IoWarning className='h-5 w-5 text-orange-500' />
                    </div>
                    <div>Pending Payment</div>
                  </button>
                </div>

                <div className='text-sm flex items-center flex-wrap gap-1.5 pt-2'>
                  <button
                    onClick={() => setPage(7)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 7,
                      },
                    )}
                  >
                    <FaCashRegister className='h-[13px] w-[13px] text-gray-700' />
                    <div>Revenue History</div>
                  </button>
                  <button
                    onClick={() => setPage(8)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 8,
                      },
                    )}
                  >
                    <MdTableRestaurant className='h-5 w-5 text-gray-700' />
                    <div>Table History</div>
                  </button>
                  <button
                    onClick={() => setPage(9)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 9,
                      },
                    )}
                  >
                    <MdOutlineInventory className='h-5 w-5 text-gray-700' />
                    <div>Inventory</div>
                  </button>
                  <button
                    onClick={() => setPage(10)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 10,
                      },
                    )}
                  >
                    <IoPeople className='h-5 w-5 text-gray-700' />
                    <div>Players</div>
                  </button>
                  <button
                    onClick={() => setPage(11)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 11,
                      },
                    )}
                  >
                    <FaMoneyBillWave className='h-4 w-4 text-blue-500' />
                    <div className='text-blue-500'>Bale</div>
                  </button>
                  <button
                    onClick={() => setPage(12)}
                    type='button'
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 cursor-pointer bg-gray-200/70 rounded-md",
                      {
                        "bg-white": page === 12,
                      },
                    )}
                  >
                    <FaMoneyBillWave className='h-4 w-4 text-blue-500' />
                    <div className='text-blue-500'>Utang</div>
                  </button>
                </div>
              </div>

              {/* <div>
                <button
                  type='button'
                  className='bg-blue-500 p-3 py-2 rounded text-white cursor-pointer'
                  onClick={() => {
                    download();
                  }}
                >
                  Export
                </button>
              </div> */}
            </div>
          </div>

          <div>
            <RemainingTableTime storageUsed={storageUsed} />
          </div>
        </div>

        <br />

        <div>
          {page === 1 && <Tables />}
          {page === 2 && <OtherOrders />}
          {page === 3 && <PlasadaList />}
          {page === 4 && (
            <>
              <OutList />
              <br />
              <OutListAll />
            </>
          )}
          {page === 5 && <RemarksList />}
          {page === 6 && <NotPaidList />}
          {page === 7 && (
            <>
              <RevenueList />
              <br />
              <MonthlyRevenue />
            </>
          )}
          {page === 8 && <AllTableList />}
          {page === 9 && <InventoryList />}
          {page === 10 && <NameList />}
          {page === 11 && <BaleList />}
          {page === 12 && <UtangList />}

          <br />
          <DailyRevenue />
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
