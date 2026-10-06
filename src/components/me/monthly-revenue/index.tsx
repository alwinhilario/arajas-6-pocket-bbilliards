import React from "react";
import dayjs from "dayjs";
import { Card } from "@/components/ui/card";
import storage, { onStorageChange } from "@/lib/localforage";
import { convertCurrency, filterObject } from "@/lib/utils";
import { TOtherOrdersOpts, TOutList, TTableOpts } from "../tables/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PENDING_PAYMENT_CHECK_STORAGE_KEY, type PendingPaymentSnapshot } from "./pending-payment-monitor";

type MonthBreakdown = {
  label: string;
  from: dayjs.Dayjs;
  to: dayjs.Dayjs;
  filteredOrders: TOtherOrdersOpts;
  filteredExpenses: TOutList;
  filteredTableHistory: TTableOpts;
  filteredPendingPayments: TOtherOrdersOpts;
  filteredPlasada: TOutList;
  pendingSnapshots: PendingPaymentSnapshot[];
};

type LedgerEvent = {
  date: string;
  type: "Table rates" | "Orders" | "Plasada" | "Expenses" | "Pending payments";
  description: string;
  amount: number;
  kind: "income" | "expense" | "pending";
};

type LedgerRow = LedgerEvent & { currentTotal: number; isVisible: boolean };

const getAmount = (amount: string | number | undefined) => Number.parseInt(String(amount || "0"), 10) || 0;
const sumAmounts = (items: Array<{ amount?: string | number }>) =>
  items.reduce((total, item) => total + getAmount(item.amount), 0);

export default function MonthlyRevenue() {
  const [myMonths, setMyMonths] = React.useState<MonthBreakdown[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState<MonthBreakdown | null>(null);

  React.useEffect(() => {
    const load = async () => {
      const startDate = dayjs("2026-07-01");
      const now = dayjs();

      const [orders, expenses, tableHistory, pendingPayment, plasada, pendingSnapshots] = await Promise.all([
        storage.getItem<TOtherOrdersOpts>("other_orders"),
        storage.getItem<TOutList>("out_list"),
        storage.getItem<TTableOpts>("all_tables_list"),
        storage.getItem<TOtherOrdersOpts>("pending_payment"),
        storage.getItem<TOutList>("plasada_list"),
        storage.getItem<PendingPaymentSnapshot[]>(PENDING_PAYMENT_CHECK_STORAGE_KEY),
      ]);
      const months: MonthBreakdown[] = [];

      let month = startDate.startOf("month");

      while (month.isBefore(now, "month") || month.isSame(now, "month")) {
        const from = month.startOf("month");
        const to = month.isSame(now, "month") ? now : month.endOf("month");

        const filteredOrders = filterObject({
          object: orders?.filter((x) => x?.mop && x?.mop?.length > 0),
          filter_from: from.toDate(),
          filter_to: to.toDate(),
          propertyName: "date",
        });
        const filteredExpenses = filterObject({
          object: expenses?.filter((expense) => Number.parseInt(expense.amount || "0", 10) > 0),
          filter_from: from.toDate(),
          filter_to: to.toDate(),
          propertyName: "date",
        });
        const filteredTableHistory = filterObject({
          object: tableHistory?.filter((x) => x?.mop?.every((payment) => payment?.amount?.length > 0)),
          filter_from: from.toDate(),
          filter_to: to.toDate(),
          propertyName: "in",
        });
        const filteredPendingPayments = filterObject({
          object: pendingPayment,
          filter_from: from.toDate(),
          filter_to: to.toDate(),
          propertyName: "date",
        });
        const filteredPlasada = filterObject({
          object: plasada,
          filter_from: from.toDate(),
          filter_to: to.toDate(),
          propertyName: "date",
        });
        const filteredPendingSnapshots = filterObject({
          object: pendingSnapshots,
          filter_from: from.toDate(),
          filter_to: to.toDate(),
          propertyName: "date",
        });

        months.push({
          label: month.format("MMMM YYYY"),
          from,
          to,
          filteredOrders,
          filteredExpenses,
          filteredTableHistory,
          filteredPendingPayments,
          filteredPlasada,
          pendingSnapshots: filteredPendingSnapshots,
        });
        month = month.add(1, "month");
      }

      setMyMonths(months);
      setSelectedMonth((selected) =>
        selected ? months.find((item) => item.label === selected.label) || selected : null,
      );
    };
    load();

    return onStorageChange(
      [
        "other_orders",
        "out_list",
        "all_tables_list",
        "pending_payment",
        "plasada_list",
        PENDING_PAYMENT_CHECK_STORAGE_KEY,
      ],
      () => {
        load();
      },
    );
  }, []);

  const ledgerRows = React.useMemo<LedgerRow[]>(() => {
    if (!selectedMonth) return [];

    const events: LedgerEvent[] = [
      ...selectedMonth.filteredTableHistory.map((record) => ({
        date: record.in,
        type: "Table rates" as const,
        description: record.value?.replaceAll("_", " ") || "Table",
        amount: getAmount(record.amount),
        kind: "income" as const,
      })),
      ...selectedMonth.filteredOrders.map((record) => ({
        date: record.date,
        type: "Orders" as const,
        description: [record.name, record.item].filter(Boolean).join(" - ") || "Order",
        amount: getAmount(record.amount),
        kind: "income" as const,
      })),
      ...selectedMonth.filteredPlasada.map((record) => ({
        date: record.date,
        type: "Plasada" as const,
        description: record.label || "Plasada",
        amount: getAmount(record.amount),
        kind: "income" as const,
      })),
      ...selectedMonth.filteredExpenses.map((record) => ({
        date: record.date,
        type: "Expenses" as const,
        description: record.label || record.remarks || "Expense",
        amount: getAmount(record.amount),
        kind: "expense" as const,
      })),
      ...selectedMonth.pendingSnapshots.map((snapshot) => ({
        date: snapshot.date,
        type: "Pending payments" as const,
        description:
          snapshot.items
            .map((payment) => [payment.name, payment.item].filter(Boolean).join(" - "))
            .filter(Boolean)
            .join(", ") || "Outstanding payments",
        amount: snapshot.amount,
        kind: "pending" as const,
      })),
    ].sort((first, second) => dayjs(first.date).valueOf() - dayjs(second.date).valueOf());

    let grossIncome = 0;
    let expenses = 0;
    let pending = 0;

    return events
      .map((event) => {
      if (event.kind === "income") grossIncome += event.amount;
      if (event.kind === "expense") expenses += event.amount;
      if (event.kind === "pending") pending = event.amount;

      return {
        ...event,
        currentTotal: grossIncome - expenses - pending,
        isVisible: event.kind === "expense" || (event.kind === "pending" && event.amount > 0),
      };
      })
      .reverse();
  }, [selectedMonth]);

  const selectedTotals = selectedMonth
    ? {
        tableRates: sumAmounts(selectedMonth.filteredTableHistory),
        orders: sumAmounts(selectedMonth.filteredOrders),
        plasada: sumAmounts(selectedMonth.filteredPlasada),
        expenses: sumAmounts(selectedMonth.filteredExpenses),
        pending: selectedMonth.pendingSnapshots[selectedMonth.pendingSnapshots.length - 1]?.amount || 0,
      }
    : null;
  const selectedGross =
    (selectedTotals?.tableRates || 0) + (selectedTotals?.orders || 0) + (selectedTotals?.plasada || 0);

  return (
    <Card className='space-y-5 p-5'>
      <h2 className='mb-2 text-lg font-bold'>Monthly Breakdown</h2>

      <div className='max-h-72.5 overflow-y-auto relative -mx-5'>
        <Table>
          <TableHeader className='bg-gray-100/80'>
            <TableRow>
              <TableHead className='font-bold px-2 text-gray-600'>MONTH</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL TABLE RATES</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL ORDERS</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL PLASADA</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL AMOUNT</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL PENDING PAYMENTS</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL EXPENSES</TableHead>
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL INCOME</TableHead>
              <TableHead className='font-bold px-2 '></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {myMonths?.length > 0 ? (
              myMonths.map((item, key) => {
                const totalTableRates = sumAmounts(item.filteredTableHistory);
                const totalPlasada = sumAmounts(item.filteredPlasada);
                const totalOrders = sumAmounts(item.filteredOrders);
                const totalPendingPayments = sumAmounts(item.filteredPendingPayments);
                const totalExpenses = sumAmounts(item.filteredExpenses);

                const totalAmount = totalPlasada + totalOrders + totalTableRates;

                return (
                  <TableRow key={key}>
                    <TableCell className='uppercase'>{item?.label}</TableCell>
                    <TableCell>{convertCurrency(totalTableRates)}</TableCell>
                    <TableCell>{convertCurrency(totalOrders)}</TableCell>
                    <TableCell>{convertCurrency(totalPlasada)}</TableCell>
                    <TableCell>{convertCurrency(totalAmount)}</TableCell>
                    <TableCell className='text-red-400 font-bold'>
                      -{convertCurrency(totalPendingPayments, false)}
                    </TableCell>
                    <TableCell className='text-red-400 font-bold'>
                      -{convertCurrency(totalExpenses, false)}
                    </TableCell>
                    <TableCell className='text-green-400 font-bold'>
                      +{convertCurrency(totalAmount - totalPendingPayments - totalExpenses, false)}
                    </TableCell>
                    <TableCell>
                      <Button className='cursor-pointer' onClick={() => setSelectedMonth(item)}>
                        View details
                      </Button>
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
      <Dialog
        open={selectedMonth !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMonth(null);
        }}
      >
        <DialogContent className='max-h-[90vh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto sm:max-w-5xl'>
          <DialogHeader>
            <DialogTitle>{selectedMonth?.label} Details</DialogTitle>
            <DialogDescription>
              Expense and pending-payment audit from the start of the month. Pending payments are snapshotted
              every two hours while the app is open.
            </DialogDescription>
          </DialogHeader>

          {selectedMonth && selectedTotals && (
            <>
              <div className='max-h-[55vh] overflow-auto'>
                <Table>
                  <TableHeader className='sticky top-0 bg-gray-100/95'>
                    <TableRow>
                      <TableHead>Date &amp; time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                      <TableHead className='text-right'>Current total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerRows.filter((row) => row.isVisible).length > 0 ? (
                      ledgerRows
                        .filter((row) => row.isVisible)
                        .map((row, index) => (
                          <TableRow key={`${row.type}-${row.date}-${index}`}>
                            <TableCell>{dayjs(row.date).format("MMM D, YYYY h:mm A")}</TableCell>
                            <TableCell>{row.type}</TableCell>
                            <TableCell className='max-w-72 whitespace-normal'>{row.description}</TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                row.kind === "income" ? "text-green-600" : "text-red-500"
                              }`}
                            >
                              {row.kind === "income" ? "+" : "-"}
                              {convertCurrency(row.amount, false)}
                            </TableCell>
                            <TableCell className='text-right font-semibold'>
                              {convertCurrency(row.currentTotal)}
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className='py-8 text-center text-muted-foreground'>
                          No expenses or pending payments to audit for this month.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <tfoot>
                    <TableRow>
                      <TableCell colSpan={4} className='text-right font-bold'>
                        Cumulative total
                      </TableCell>
                      <TableCell className='text-right font-bold text-green-600'>
                        {convertCurrency(selectedGross - selectedTotals.expenses - selectedTotals.pending)}
                      </TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
