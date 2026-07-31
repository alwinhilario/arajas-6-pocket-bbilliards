import React from "react";
import { Card } from "../ui/card";
import storage from "@/lib/localforage";
import { convertCurrency, filterObject, getTotalAmount } from "@/lib/utils";
import { SESSION_CONTEXT } from "@/app/provider";
import { TOtherOrdersOpts, TOutList, TTableOpts } from "./tables/types";

export default function DailyRevenue() {
  const [orders, setOrders] = React.useState<TOtherOrdersOpts>([]);
  const [expenses, setExpenses] = React.useState<TOutList>([]);
  const [tableHistory, setTableHistory] = React.useState<TTableOpts>([]);
  const [pendingPayment, setPendingPayment] = React.useState<TOtherOrdersOpts>([]);
  const [plasada, setPlasada] = React.useState<TOutList>();
  const [remarks, setRemarks] = React.useState<TOutList>();
  const { value } = React.useContext(SESSION_CONTEXT);

  React.useEffect(() => {
    const t = setInterval(() => {
      const load = async () => {
        const orders = (await storage.getItem("other_orders")) as TOtherOrdersOpts;
        const expenses = (await storage.getItem("out_list")) as TOutList;
        const tableHistory = (await storage.getItem("all_tables_list")) as TTableOpts; // brb
        const pendingPayment = (await storage.getItem("pending_payment")) as TOtherOrdersOpts;
        const plasada = (await storage.getItem("plasada_list")) as TOutList;
        const remarks = (await storage.getItem("remarks_list")) as TOutList;

        setRemarks(
          filterObject({
            object: remarks,
            filter_from: value?.date?.date_from,
            filter_to: value?.date?.date_to,
            propertyName: "date",
          }),
        );
        setOrders(
          filterObject({
            object: orders,
            filter_from: value?.date?.date_from,
            filter_to: value?.date?.date_to,
            propertyName: "date",
          }),
        );
        setExpenses(
          filterObject({
            object: expenses,
            filter_from: value?.date?.date_from,
            filter_to: value?.date?.date_to,
            propertyName: "date",
          }),
        );
        setTableHistory(
          filterObject({
            object: tableHistory,
            filter_from: value?.date?.date_from,
            filter_to: value?.date?.date_to,
            propertyName: "out",
          }),
        );
        setPendingPayment(
          filterObject({
            object: pendingPayment,
            filter_from: value?.date?.date_from,
            filter_to: value?.date?.date_to,
            propertyName: "date",
          }),
        );
        setPlasada(
          filterObject({
            object: plasada,
            filter_from: value?.date?.date_from,
            filter_to: value?.date?.date_to,
            propertyName: "date",
          }),
        );
      };
      load();
    }, 1000);

    return () => clearInterval(t);
  }, [value?.date?.date_from, value?.date?.date_to]);

  const totalAmount = getTotalAmount(plasada) + getTotalAmount(orders) + getTotalAmount(tableHistory);
  const totalExpenses = getTotalAmount(expenses);
  const totalPendingPayments = getTotalAmount(pendingPayment);
  const totalPlasada = getTotalAmount(plasada);

  return (
    <Card className='p-8 border-2 border-black border-dashed '>
      <div className='text-xl font-bold'>Daily Revenue</div>

      <div className='flex items-start gap-2 divide-x text-base'>
        <div className='space-y-1 py-2'>
          <div className='flex items-center gap-2'>
            <div className='w-68'>Total Table Rates</div>
            <div className='pr-7 font-semibold'>{convertCurrency(getTotalAmount(tableHistory))}</div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='w-68'>Total Orders (Others) </div>
            <div className='pr-7 font-semibold'>{convertCurrency(getTotalAmount(orders))}</div>
          </div>

          <div className='flex items-center gap-2'>
            <div className='w-68'>Plasada</div>
            <div className='pr-7 font-semibold'>{convertCurrency(totalPlasada)}</div>
          </div>

          <div className='flex flex-col gap-0.5'>
            <div className='w-40'>Total Amount</div>
            <div className='text-3xl font-black'>{convertCurrency(totalAmount)}</div>
          </div>

          <div className='py-3'>
            <hr />
          </div>

          <div className='flex items-center gap-2'>
            <div className='w-68'>Pending Payments Daily</div>
            <div className='pr-7 font-semibold text-yellow-600/70'>
              {convertCurrency(totalPendingPayments)}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-68 '>Expenses Daily</div>
            <div className='pr-7 text-yellow-600/70 font-semibold'>{convertCurrency(totalExpenses)}</div>
          </div>

          <div className='py-3'>
            <hr />
          </div>

          <div className='flex flex-col gap-0.5'>
            <div className='w-40'>Total Daily Income</div>
            <div className='text-4xl font-black text-green-500'>
              {convertCurrency(totalAmount - totalPendingPayments - totalExpenses)}
            </div>
          </div>
        </div>

        <div className='pl-3'>
          <div>Remarks</div>
          <div>
            {remarks?.length > 0 && remarks?.every((x) => x?.remarks && x?.label)
              ? remarks?.map((x, y) => (
                  <div className='flex items-center gap-2' key={y}>
                    <div className='w-32 uppercase'>{x?.label}</div>
                    <div>{x?.remarks}</div>
                  </div>
                ))
              : "--"}
          </div>
        </div>
      </div>
    </Card>
  );
}
