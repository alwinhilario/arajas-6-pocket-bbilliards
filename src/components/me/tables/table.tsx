"use client";

import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import React from "react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import clsx from "clsx";
import dayjs from "dayjs";
import { TOtherOrdersOpts, TTableOpts, TTableOptsData } from "./types";
import { HOURLY_RATE, MID_THRESHOLD_RATE, TABLE_OPTS } from "@/app/constants";
import { MdEdit } from "react-icons/md";
import { FaClock, FaExchangeAlt } from "react-icons/fa";
import TableTimeout from "./table-timeout";
import storage from "@/lib/localforage";
import TableTransfer from "./table-transfer";
import Payment from "../payment";
import { isEmpty } from "lodash";

dayjs.extend(duration);
dayjs.extend(customParseFormat);

interface IProps {
  data: TTableOptsData;
  tables?: TTableOpts;
  isView?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  setTables?: React.Dispatch<React.SetStateAction<TTableOpts>>;
  setCurrentTable?: React.Dispatch<React.SetStateAction<TTableOptsData>>;
}

export default function Table({
  isView = false,
  data,
  setIsOpen,
  setCurrentTable,
  tables,
  setTables,
}: IProps) {
  const [isOpenTimeout, setIsOpenTimeout] = React.useState(false);
  const [isOpenTransfer, setIsOpenTransfer] = React.useState(false);

  const totalOthers = data?.others?.reduce((acc, item) => acc + parseInt(item?.amount), 0);

  const currentTime = dayjs();
  const outTime = dayjs(data?.out);
  const diff = outTime.diff(currentTime);
  const d = dayjs.duration(diff);

  // React.useEffect(() => {
  //   setTables((prevState) => {
  //     const y = prevState?.map((x) => {
  //       if (x?.value === "table_4") {
  //         return {
  //           ...x,
  //           // in: dayjs().subtract(1, "hour").format("YYYY/MM/DD HH:mm:ss"),
  //           // out: "",
  //           // table_rates: "",
  //           // amount: "",
  //           // is_open_time: true,
  //         };
  //       }

  //       return x;
  //     });

  //     const ff = async () => {
  //       await storage.setItem("tables", y);
  //     };

  //     ff();

  //     return y;
  //   });
  // }, []);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const hours = React.useMemo(() => {
    const currentTime = dayjs(data?.in);
    const outTime = dayjs(data?.out);
    const diff = outTime.diff(currentTime);
    const d = dayjs.duration(diff);

    let $v = "";

    if (d.hours() > 0) {
      $v = `${d.hours()} hour${d.hours() !== 1 ? "s" : ""}`;

      if (d.minutes() !== 0) {
        $v = $v.concat(` and ${d.minutes()} minute${d.minutes() !== 1 ? "s" : ""}`);
      }
    } else {
      if (d.minutes() !== 0) {
        $v = $v.concat(` ${d.minutes()} minute${d.minutes() !== 1 ? "s" : ""}`);
      }
    }

    return $v;
  }, [data?.in, data?.out]);

  const [remaining, setRemaining] = React.useState("");

  React.useEffect(() => {
    const t = setInterval(() => {
      const currentTime = dayjs();
      const outTime = dayjs(data?.out);
      const diff = outTime.diff(currentTime);
      const d = dayjs.duration(diff);

      setRemaining(
        `${String(d.hours()).padStart(2, "0")}:${String(d.minutes()).padStart(2, "0")}:${String(d.seconds()).padStart(2, "0")}`,
      );
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, [data?.out]);

  return (
    <>
      {isOpenTimeout && (
        <TableTimeout
          data={data}
          setIsOpen={setIsOpenTimeout}
          onConfirm={async (dataCb) => {
            if (!data?.out) {
              const getAmount = () => {
                const inTime = dayjs(data.in);
                const outTime = dayjs();
                const diff = outTime.diff(inTime);
                const d = dayjs.duration(diff);

                let value;
                const hourlyRate = d?.hours() * HOURLY_RATE;
                value = hourlyRate;

                const midRate = d?.minutes();

                if (midRate > 30 && midRate > 30 + MID_THRESHOLD_RATE) {
                  value = value + 150;
                } else if (midRate > MID_THRESHOLD_RATE && midRate < 30) {
                  value = value + 100;
                } else if (midRate > 30) {
                  value = value + 100;
                }

                return value;
              };

              const totalOthers = data?.others?.reduce((acc, item) => acc + parseInt(item?.amount), 0);

              const newTables = tables?.map((item) => {
                const currentTime = dayjs().format("YYYY/MM/DD HH:mm:ss");

                if (item?.value === data?.value) {
                  return {
                    ...item,
                    out: currentTime,
                    is_open_time: false,
                    amount:
                      getAmount() > 0 || totalOthers > 0 ? `${(getAmount() || 0) + (totalOthers || 0)}` : "",
                    table_rates: `${getAmount()}`,
                    id: data?.id || dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS"),
                  };
                }

                return item;
              });

              await storage.setItem("tables", newTables);
              setIsOpenTimeout(!isOpenTimeout);
              setTables(newTables);
              return;
            }

            const allListTable = ((await storage.getItem("all_tables_list")) || []) as TTableOpts;
            const exists = !isEmpty(allListTable?.find((x) => x?.id === data?.id));

            if (exists) {
              await storage.setItem(
                "all_tables_list",
                allListTable?.map((item) => {
                  if (data?.id === item?.id) {
                    return {
                      ...item,
                      ...dataCb,
                      status: "Timed out",
                    };
                  }

                  return item;
                }),
              );
            }

            const mopTotalAmount = dataCb?.mop?.reduce((acc, item) => acc + parseInt(item?.amount || "0"), 0);

            if (parseInt(data?.amount || "0") > mopTotalAmount) {
              const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;
              await storage.setItem("pending_payment", [
                ...pendingPayment,
                {
                  ...data,
                  name: data?.label,
                  value: data?.label,
                  item: "N/A",
                  amount: parseInt(data?.amount || "0") - mopTotalAmount,
                  date: dayjs().format("YYYY/MM/DD hh:mm A"),
                  remarks: dataCb?.remarks,
                  mop: "",
                  is_table: true,
                },
              ]);
            }

            const newTables = tables?.map((item) => {
              const myTable = TABLE_OPTS?.find((x) => x?.value === data?.value);

              if (item?.value === data?.value) {
                return myTable;
              }

              return item;
            });

            await storage.setItem("tables", newTables);
            setTables(newTables);
            setIsOpenTimeout(!isOpenTimeout);
          }}
        />
      )}

      {isOpenTransfer && (
        <TableTransfer
          data={data}
          tables={tables}
          setIsOpen={setIsOpenTransfer}
          onConfirm={async (newTable) => {
            const newTables = tables?.map((item) => {
              const myTable = TABLE_OPTS?.find((x) => x?.value === data?.value);

              if (item?.value === data?.value) {
                return myTable;
              }

              if (item?.value === newTable?.value) {
                return {
                  ...data,
                  label: newTable?.label,
                  value: newTable?.value,
                };
              }

              return item;
            });

            await storage.setItem("tables", newTables);
            setTables(newTables);
            setIsOpenTransfer(!isOpenTransfer);
          }}
        />
      )}
      <Card
        className={clsx("flex flex-col gap-5", {
          "bg-yellow-100/60 border-yellow-500 border-2":
            d.hours() <= 0 &&
            d.minutes() < 15 &&
            d.minutes() > 0 &&
            (data?.in || data?.out) &&
            !data?.is_open_time &&
            !isView,
          "bg-red-100/60 border-red-500 border-2":
            d.hours() <= 0 && d.minutes() <= 0 && (data?.in || data?.out) && !data?.is_open_time && !isView,
        })}
      >
        <div className='flex items-center gap-2 p-5 pb-0 pt-2 '>
          <div className='flex-1 text-2xl font-bold'>{data.label}</div>

          {!isView && (
            <div className='text-sm'>
              {data?.is_open_time ? (
                <div className='font-bold text-yellow-600'>OPEN TIME</div>
              ) : (
                <>
                  Remaining Time: <span className='font-semibold'>{remaining}</span>
                </>
              )}
            </div>
          )}
        </div>

        <hr />

        <div className='flex-1 px-5 text-base'>
          <div className='flex gap-2'>
            <div className='w-28'>In</div>
            <div>{data?.in ? dayjs(data?.in).format("hh:mm A") : "--"}</div>
          </div>
          <div className='flex gap-2'>
            <div className='w-28'>Out</div>
            <div>{data?.out ? dayjs(data?.out).format("hh:mm A") : "--"}</div>
          </div>
          <div className='flex gap-2'>
            <div className='w-28'>Hours</div>
            <div>{hours || "--"}</div>
          </div>

          <div className='flex gap-2 '>
            <div className='w-28'>Table Rates</div>
            <div className='font-bold'>
              {parseInt(data?.table_rates) > 0 ? `PHP ${data?.table_rates}.00` : "--"}
            </div>
          </div>
          <div className='flex gap-2 py-4'>
            <div className='w-28'>Others</div>
            <div>
              {totalOthers > 0
                ? data?.others?.map((item, key) => (
                    <div className='flex gap-2' key={key}>
                      <div className='min-w-[110px] capitalize'>{item?.item}</div>
                      <div className='font-bold'>PHP {item?.amount}.00</div>
                    </div>
                  ))
                : "--"}
            </div>
          </div>
          <div className='flex gap-2'>
            <div className='w-28'>Total Others</div>
            <div className='font-bold'>{totalOthers > 0 ? `PHP ${totalOthers}.00` : "--"}</div>
          </div>
          <div className='flex gap-2'>
            <div className='w-28'>MOP</div>
            <div className='capitalize'>
              {data?.mop?.some((x) => x?.amount?.length > 0)
                ? data?.mop?.map((item, key) => (
                    <div key={key}>
                      {item?.label} (PHP {item?.amount}.00)
                    </div>
                  ))
                : "--"}
            </div>
          </div>
          <div className='flex gap-2 pt-3'>
            <div className='w-28'>Remarks</div>
            <div className=''>{data?.remarks || "--"}</div>
          </div>
        </div>

        <div
          className={clsx("space-y-2.5 p-5 pb-1 pt-0 ", {
            // "!p-0 !-mt-3": !data?.in || !data?.out,
          })}
        >
          <div className='flex flex-col gap-0.5 font-semibold'>
            <div className='w-40'>Total Amount</div>
            <div className='text-green-500 text-2xl font-bold'>
              {parseInt(data?.amount) > 0 ? `PHP ${parseInt(`${data?.amount || "0"}`)}.00` : "--"}
            </div>
          </div>

          {!isView && (
            <div className='flex flex-col'>
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <Button
                    size='llg'
                    className={clsx("w-full cursor-pointer font-bold", {})}
                    onClick={() => {
                      setCurrentTable(data);
                      setIsOpen((prevState) => !prevState);
                    }}
                  >
                    {(data?.in || data?.out) && <MdEdit className='h-3 w-3' />}
                    {data?.in || data?.out ? "Manage" : "Time In"}
                  </Button>
                </div>

                {(data?.in || data?.out) && (
                  <>
                    <Button
                      size='llg'
                      className={clsx("flex-1 cursor-pointer font-bold", {})}
                      variant={"outline"}
                      onClick={async () => {
                        // if (!data?.out) {

                        //   return;
                        // }

                        setIsOpenTimeout((prevState) => !prevState);
                      }}
                    >
                      <FaClock className='h-3 w-3' />
                      {!data?.is_open_time ? "Time Out" : "Calculate"}
                    </Button>

                    {/* {!(d.hours() <= 0 && d.minutes() <= 0 && (data?.in || data?.out)) && ( */}
                    <Button
                      size='llg'
                      className={clsx("flex-1 cursor-pointer font-bold", {})}
                      variant={"outline"}
                      onClick={() => {
                        setIsOpenTransfer((prevState) => !prevState);
                      }}
                    >
                      <FaExchangeAlt className='h-3 w-3' />
                      Transfer
                    </Button>
                    {/* )} */}

                    {/* {d.hours() <= 0 && d.minutes() <= 0 && (data?.in || data?.out) && (
                    <Payment
                      mop={data?.mop}
                      onPayClick={async (type) => {
                        const newTables = tables?.map((item) => {
                          if (data?.value === item?.value) {
                            return {
                              ...data,
                              mop: type,
                            };
                          }

                          return item;
                        });

                        await storage.setItem("tables", newTables);
                        setTables(newTables);
                      }}
                      variant='table'
                    />
                  )} */}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
