import React from "react";
import { Card } from "@/components/ui/card";
import storage, { onStorageChange } from "@/lib/localforage";
import { TOtherOrdersOpts, TOutList, TTableOpts } from "../tables/types";
import { filterObject } from "@/lib/utils";
import { SESSION_CONTEXT } from "@/app/provider";
import dayjs from "dayjs";

export default function MonthlyRevenue() {
  const [orders, setOrders] = React.useState<TOtherOrdersOpts>([]);
  const [expenses, setExpenses] = React.useState<TOutList>([]);
  const [tableHistory, setTableHistory] = React.useState<TTableOpts>([]);
  const [pendingPayment, setPendingPayment] = React.useState<TOtherOrdersOpts>([]);
  const [plasada, setPlasada] = React.useState<TOutList>();
  const [remarks, setRemarks] = React.useState<TOutList>();
  const { value } = React.useContext(SESSION_CONTEXT);

  const dateArray = React.useMemo(() => {
    const from = dayjs("July 15, 2026");
    const to = dayjs();
    const arr = [];
    let currentDate = from;

    while (currentDate.isBefore(to) || currentDate.isSame(to, "day")) {
      arr.push({
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
        raw: currentDate,
      });

      currentDate = currentDate.add(1, "day");
    }
    return arr;
  }, []);

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
            propertyName: "in",
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
      )
      ?.sort((a, b) => dayjs(b?.dateStringFrom2).diff(dayjs(a?.dateStringFrom2)));
  }, [dateArray, expenses, orders, pendingPayment, plasada, remarks, tableHistory]);

  React.useEffect(() => {
    const load = async () => {
      const orders = (await storage.getItem("other_orders")) as TOtherOrdersOpts;
      const expenses = (await storage.getItem("out_list")) as TOutList;
      const tableHistory = (await storage.getItem("all_tables_list")) as TTableOpts;
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
    return onStorageChange(
      ["other_orders", "out_list", "all_tables_list", "pending_payment", "plasada_list", "remarks_list"],
      () => {
        load();
      },
    );
  }, []);

  return (
    <div>
      <Card className='p-5'>
        <div className='text-xl font-bold'>Monthly Revenue</div>
      </Card>
    </div>
  );
}
