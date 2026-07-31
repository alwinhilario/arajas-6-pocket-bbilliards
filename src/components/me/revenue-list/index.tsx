import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import storage from "@/lib/localforage";
import { TOtherOrdersOpts, TOutList, TTableOpts } from "../tables/types";
import { Badge } from "@/components/ui/badge";
import { convertCurrency, filterObject, getTotalAmount } from "@/lib/utils";
import { SESSION_CONTEXT } from "@/app/provider";
import dayjs from "dayjs";
import { isEmpty } from "lodash";
import { OTHER_ORDERS } from "@/app/constants";
import { Button } from "@/components/ui/button";

export default function RevenueList() {
  const [orders, setOrders] = React.useState<TOtherOrdersOpts>([]);
  const [expenses, setExpenses] = React.useState<TOutList>([]);
  const [tableHistory, setTableHistory] = React.useState<TTableOpts>([]);
  const [pendingPayment, setPendingPayment] = React.useState<TOtherOrdersOpts>([]);
  const [plasada, setPlasada] = React.useState<TOutList>();
  const [remarks, setRemarks] = React.useState<TOutList>();
  const { value } = React.useContext(SESSION_CONTEXT);

  const from = dayjs("July 15, 2026");
  const to = dayjs();
  const dateArray = [];
  let currentDate = from;

  // Loop until currentDate passes the "to" date
  while (currentDate.isBefore(to) || currentDate.isSame(to, "day")) {
    dateArray.push({
      // Formats as "July 1, 2026"
      dateStringFrom: currentDate.set("hour", 8).set("minute", 0).set("second", 0),
      dateStringFrom2: currentDate
        .set("hour", 8)
        .set("minute", 0)
        .set("second", 0)
        .format("MMM DD, YYYY hh:mm A"),
      dateStringTo: currentDate.add(1, "day").set("hour", 8).set("minute", 0).set("second", 0),
      dateStringto2: currentDate
        .add(1, "day")
        .set("hour", 8)
        .set("minute", 0)
        .set("second", 0)
        .format("MMM DD, YYYY hh:mm A"),
      // Keeps the raw Day.js object if you need to manipulate it later
      raw: currentDate,
    });

    // Move to the next day
    currentDate = currentDate.add(1, "day");
  }

  const dateArrayMemo = React.useMemo(() => {
    return dateArray
      ?.map((item) => ({
        ...item,
        items: {
          remarks: filterObject({
            filterDate: true,
            object: remarks,
            filter_from: dayjs(item?.dateStringFrom),
            filter_to: dayjs(item?.dateStringTo),
            propertyName: "date",
          }),
          orders: filterObject({
            filterDate: true,
            object: orders,
            filter_from: dayjs(item?.dateStringFrom),
            filter_to: dayjs(item?.dateStringTo),
            propertyName: "date",
          }),
          expenses: filterObject({
            filterDate: true,
            object: expenses,
            filter_from: dayjs(item?.dateStringFrom),
            filter_to: dayjs(item?.dateStringTo),
            propertyName: "date",
          }),
          tableHistory: filterObject({
            filterDate: true,
            object: tableHistory,
            filter_from: dayjs(item?.dateStringFrom),
            filter_to: dayjs(item?.dateStringTo),
            propertyName: "out",
          }),
          pendingPayment: filterObject({
            filterDate: true,
            object: pendingPayment,
            filter_from: dayjs(item?.dateStringFrom),
            filter_to: dayjs(item?.dateStringTo),
            propertyName: "date",
          }),
          plasada: filterObject({
            filterDate: true,
            object: plasada,
            filter_from: dayjs(item?.dateStringFrom),
            filter_to: dayjs(item?.dateStringTo),
            propertyName: "date",
          }),
        },
      }))
      ?.filter(
        (x) =>
          x?.items?.remarks?.length > 0 ||
          x?.items?.orders?.length > 0 ||
          x?.items?.expenses?.length > 0 ||
          x?.items?.tableHistory?.length > 0 ||
          x?.items?.pendingPayment?.length > 0 ||
          x?.items?.plasada?.length > 0,
      );
  }, [dateArray, expenses, orders, pendingPayment, plasada, remarks, tableHistory]);

  React.useEffect(() => {
    const t = setInterval(() => {
      const load = async () => {
        const orders = (await storage.getItem("other_orders")) as TOtherOrdersOpts;
        const expenses = (await storage.getItem("out_list")) as TOutList;
        const tableHistory = (await storage.getItem("all_tables_list")) as TTableOpts; // brb
        const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;
        const plasada = (await storage.getItem("plasada_list")) as TOutList;
        const remarks = (await storage.getItem("remarks_list")) as TOutList;

        setRemarks(remarks);
        setOrders(orders);
        setExpenses(expenses);
        setTableHistory(tableHistory);
        setPendingPayment(pendingPayment);
        setPlasada(plasada);
      };
      load();
    }, 1000);

    return () => clearInterval(t);
  }, [value?.date?.date_from, value?.date?.date_to]);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className='pt-0'>
      {isOpen && (
        <div
          className='fixed bg-black/90 top-0 left-0 h-screen w-screen flex justify-center items-start cursor-pointer z-50 pt-60'
          onClick={() => {
            setIsOpen((prevState) => !prevState);
          }}
        >
          <Card
            className='p-5 cursor-default'
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className='text-base pb-5'>Are you sure you want to permanently delete Revenue History?</div>

            <div className='flex gap-2'>
              <Button
                size={"xl"}
                className={"cursor-pointer flex-1"}
                onClick={async () => {
                  await storage.setItem("all_tables_list", []);
                  await storage.setItem("pending_payment", OTHER_ORDERS);
                  setIsOpen(!isOpen);
                }}
              >
                Confirm
              </Button>
              <Button
                size={"xl"}
                className={"cursor-pointer flex-1"}
                variant={"outline"}
                onClick={() => {
                  setIsOpen(!isOpen);
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className='flex items-center gap-2 text-lg font-bold p-5 pb-0'>
        <div className='flex-1'>Revenue History </div>
        <div>
          <Button
            variant={"destructive"}
            className={"cursor-pointer font-bold"}
            size={"xl"}
            onClick={() => {
              setIsOpen(!isOpen);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className='max-h-[290px] overflow-y-auto relative'>
        <Table>
          <TableHeader className='bg-gray-100/80'>
            <TableRow>
              <TableHead className='font-bold px-2 text-gray-600'>DATE FROM</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>DATE TO</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TABLE RATES</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>ORDERS</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>PLASADA</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL AMOUNT</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>PENDING PAYMENTS</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>EXPENSES</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL INCOME</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {dateArrayMemo?.length > 0 ? (
              dateArrayMemo.map((item, key) => {
                const totalAmount =
                  getTotalAmount(item?.items?.plasada) +
                  getTotalAmount(item?.items?.orders) +
                  getTotalAmount(item?.items?.tableHistory);

                return (
                  <TableRow key={key}>
                    <TableCell>{item?.dateStringFrom2}</TableCell>
                    <TableCell>{item?.dateStringto2}</TableCell>
                    <TableCell>{convertCurrency(getTotalAmount(item?.items?.tableHistory))}</TableCell>
                    <TableCell>{convertCurrency(getTotalAmount(item?.items?.orders))}</TableCell>
                    <TableCell>{convertCurrency(getTotalAmount(item?.items?.plasada))}</TableCell>
                    <TableCell>{convertCurrency(totalAmount)}</TableCell>
                    <TableCell>{convertCurrency(getTotalAmount(item?.items?.pendingPayment))}</TableCell>
                    <TableCell>{convertCurrency(getTotalAmount(item?.items?.expenses))}</TableCell>
                    <TableCell>
                      {convertCurrency(
                        totalAmount -
                          getTotalAmount(item?.items?.pendingPayment) -
                          getTotalAmount(item?.items?.expenses),
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className='text-center pt-5 text-gray-400'>
                  No data found...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
