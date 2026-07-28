import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import storage from "@/lib/localforage";
import { TOtherOrdersOpts, TPendingPaymentOpts } from "../tables/types";
import { OTHER_ORDERS } from "@/app/constants";
import dayjs from "dayjs";
import Payment from "../payment";
import { FaTrash } from "react-icons/fa";

export default function NotPaidList() {
  const [tables, setTables] = React.useState<TOtherOrdersOpts>([]);

  React.useEffect(() => {
    const load = async () => {
      const data = ((await storage.getItem("pending_payment")) || OTHER_ORDERS) as TOtherOrdersOpts;

      setTables(data);
    };

    load();
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      const load = async () => {
        const x = ((await storage.getItem("pending_payment")) || OTHER_ORDERS) as TOtherOrdersOpts;

        setTables(x);
      };
      load();
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  const result = Object.values(
    tables.reduce((acc, { item, name, mop, amount, date, remarks, id }) => {
      if (!acc[name]) {
        acc[name] = {
          name,
          total: 0,
          items: [],
          mop,
          date,
          remarks,
        };
      }

      acc[name].items.push({ id, item, amount, date, mop, remarks });
      if (!mop || mop?.length <= 0) {
        acc[name].total = parseInt(acc[name].total || "0") + parseInt(amount || "0");
      }

      return acc;
    }, {}),
  )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.item.localeCompare(b.item)),
    })) as TPendingPaymentOpts;

  const [myResult, setMyResult] = React.useState<TPendingPaymentOpts>(result);

  React.useEffect(() => {
    setMyResult(result);
  }, [JSON.stringify(result)]);

  return (
    <Card className='pt-0'>
      <div className='text-lg font-bold p-5 pb-0'>Pending Payment </div>

      <div className='px-5 flex flex-col'>
        <div className='flex items-center gap-2 pb-5'>
          <div className='w-32 font-black p-0.5 px-3 text-gray-600'>NAME</div>
          <div className='w-28 font-black p-0.5 px-5 text-gray-600'>ITEM</div>
          <div className='w-28 font-black p-0.5 px-7 text-gray-600'>AMOUNT</div>
          <div className='w-80 font-black p-0.5 px-5 text-gray-600'>REMARKS</div>
          <div className='w-48 font-black p-0.5 px-5 text-gray-600'>DATE</div>
          <div className='w-24 font-black p-0.5 px-5 text-gray-600'>MOP</div>
        </div>

        <div className='space-y-6 divide-y flex flex-col '>
          {myResult?.map((item, key) => {
            return (
              <div className='border rounded-sm self-start drop-shadow-accent' key={key}>
                <div className='flex divide-x '>
                  <div className='w-36 p-3 px-3.5 font-bold'>{item?.name}</div>
                  <div className=''>
                    <div className='divide-x divide-y border-b '>
                      {item?.items?.map((x, key) => (
                        <div className='flex items-center divide-x ' key={key}>
                          <div className='w-32 p-2 px-3'>{x?.item}</div>
                          <div className='w-28 p-2 px-3'>{x?.amount}</div>
                          <div className='w-80 p-2 px-3'>{x?.remarks || "--"}</div>
                          <div className='w-48 p-2 px-3 text-gray-500'>
                            {dayjs(x?.date).isValid() ? dayjs(x?.date)?.format("MMM DD, YYYY hh:mm A") : "--"}
                          </div>
                          <div className='p-1.5'>
                            <Payment
                              // withBorder={x?.mop === "cash" ? true : false}
                              mop={x?.mop}
                              onPayClick={async (type) => {
                                const pp = ((await storage.getItem("pending_payment")) ||
                                  OTHER_ORDERS) as TOtherOrdersOpts;

                                await storage.setItem(
                                  "pending_payment",
                                  pp?.map((xx) => {
                                    if (xx?.id === x?.id) {
                                      return {
                                        ...xx,
                                        mop: type,
                                      };
                                    }

                                    return xx;
                                  }),
                                );

                                // @ts-expect-error
                                setTables((prevState) =>
                                  prevState?.map((xx) => {
                                    if (xx?.id === x?.id) {
                                      return {
                                        ...xx,
                                        mop: type,
                                      };
                                    }

                                    return xx;
                                  }),
                                );
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className='flex items-center gap-2  p-1.5'>
                      <div className='flex gap-2 font-bold  flex-1'>
                        <div className='w-28 p-0.5 px-1.5'>Total</div>
                        <div className='p-0.5 px-3.5'>PHP {item?.total}.00</div>
                      </div>

                      <div className='pr-2'>
                        <FaTrash className='h-4 w-4 text-red-400 cursor-pointer' />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* <Table>
        <TableHeader className='bg-gray-100/80'>
          <TableRow>
            <TableHead className='font-bold px-2 text-gray-600'>NAME</TableHead>
            <TableHead className='font-bold px-2 text-gray-600'>ITEM</TableHead>
            <TableHead className='font-bold px-2 text-gray-600'>AMOUNT</TableHead>
            <TableHead className='font-bold px-2 text-gray-600'>REMARKS</TableHead>
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
      </Table> */}
    </Card>
  );
}
