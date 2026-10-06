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

const getAmount = (amount: string | number | undefined) => Number.parseInt(String(amount || "0"), 10) || 0;
const sumAmounts = (items: Array<{ amount?: string | number }>) =>
  items.reduce((total, item) => total + getAmount(item.amount), 0);

export default function MonthlyRevenue() {
  const [myMonths, setMyMonths] = React.useState<MonthBreakdown[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState<MonthBreakdown | null>(null);
  const [selectedExpense, setSelectedExpense] = React.useState<TOutList[number] | null>(null);

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

  const ledgerEvents = React.useMemo<LedgerEvent[]>(() => {
    if (!selectedMonth) return [];

    return [
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
      ...selectedMonth.filteredPendingPayments.map((record) => ({
        date: record.date,
        type: "Pending payments" as const,
        description: [record.name, record.item].filter(Boolean).join(" - ") || "Pending payment",
        amount: getAmount(record.amount),
        kind: "pending" as const,
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
    ].sort((first, second) => dayjs(second.date).valueOf() - dayjs(first.date).valueOf());
  }, [selectedMonth]);

  const previousExpense = selectedExpense
    ? selectedMonth?.filteredExpenses
        .filter((expense) => dayjs(expense.date).isBefore(dayjs(selectedExpense.date)))
        .sort((first, second) => dayjs(second.date).valueOf() - dayjs(first.date).valueOf())[0]
    : undefined;

  const getExpenseAuditEvents = React.useCallback((expense: TOutList[number]) => {
    const expenseDate = dayjs(expense.date);
    const previousExpense = selectedMonth?.filteredExpenses
      .filter((item) => dayjs(item.date).isBefore(expenseDate))
      .sort((first, second) => dayjs(second.date).valueOf() - dayjs(first.date).valueOf())[0];
    const previousExpenseDate = previousExpense ? dayjs(previousExpense.date) : null;

    return ledgerEvents.filter(
      (event) =>
        event.kind !== "expense" &&
        dayjs(event.date).isValid() &&
        (!previousExpenseDate || dayjs(event.date).isAfter(previousExpenseDate)) &&
        !dayjs(event.date).isAfter(expenseDate),
    );
  }, [ledgerEvents, selectedMonth]);

  const expenseAuditEvents = React.useMemo(() => {
    if (!selectedExpense) return [];
    return getExpenseAuditEvents(selectedExpense);
  }, [getExpenseAuditEvents, selectedExpense]);

  const expenseAuditRows = React.useMemo(() => {
    if (!selectedExpense) return [];
    const previousExpenseDate = previousExpense ? dayjs(previousExpense.date) : null;
    let currentAmount = ledgerEvents.reduce((total, event) => {
      const eventDate = dayjs(event.date);
      if (!eventDate.isValid() || (previousExpenseDate && eventDate.isAfter(previousExpenseDate))) {
        return total;
      }
      if (event.kind === "income") return total + event.amount;
      if (event.kind === "expense") return total - event.amount;
      return total;
    }, 0);

    return [...expenseAuditEvents]
      .sort((first, second) => dayjs(first.date).valueOf() - dayjs(second.date).valueOf())
      .map((event) => {
        if (event.kind === "income") currentAmount += event.amount;
        return { ...event, currentAmount };
      })
      .reverse();
  }, [expenseAuditEvents, ledgerEvents, previousExpense, selectedExpense]);

  const expenseAuditTotal = selectedExpense
    ? ledgerEvents.reduce((total, event) => {
        const eventDate = dayjs(event.date);
        if (previousExpense && !eventDate.isAfter(dayjs(previousExpense.date))) return total;
        if (eventDate.isAfter(dayjs(selectedExpense.date))) return total;
        if (event.kind === "income") return total + event.amount;
        if (event.kind === "expense") return total - event.amount;
        return total;
      }, 0)
    : 0;
  const amountBeforePreviousExpense = previousExpense
    ? ledgerEvents.reduce((total, event) => {
        const eventDate = dayjs(event.date);
        if (!eventDate.isValid() || eventDate.isAfter(dayjs(previousExpense.date))) return total;
        if (event.kind === "income") return total + event.amount;
        if (event.kind === "expense") return total - event.amount;
        return total;
      }, 0)
    : 0;
  const currentAmountAfterExpense = amountBeforePreviousExpense + expenseAuditTotal;

  const getCurrentAmountAtExpense = (expense: TOutList[number]) => {
    const expenseDate = dayjs(expense.date);
    return ledgerEvents.reduce((total, event) => {
      const eventDate = dayjs(event.date);
      if (!eventDate.isValid() || eventDate.isAfter(expenseDate)) return total;
      if (event.kind === "income") return total + event.amount;
      if (event.kind === "expense") return total - event.amount;
      return total;
    }, 0);
  };

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
                    <TableCell className='font-bold'>{convertCurrency(totalPendingPayments, false)}</TableCell>
                    <TableCell className='text-red-400 font-bold'>
                      -{convertCurrency(totalExpenses, false)}
                    </TableCell>
                    <TableCell className='text-green-400 font-bold'>
                      +{convertCurrency(totalAmount - totalExpenses, false)}
                    </TableCell>
                    <TableCell>
                      <Button
                        className='cursor-pointer'
                        onClick={() => {
                          setSelectedExpense(null);
                          setSelectedMonth(item);
                        }}
                      >
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
          if (!open) {
            setSelectedMonth(null);
            setSelectedExpense(null);
          }
        }}
      >
        <DialogContent className='max-h-[90vh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto sm:max-w-5xl'>
          <DialogHeader>
            <DialogTitle>
              {selectedExpense ? `${selectedExpense.label || "Expense"} Audit` : `${selectedMonth?.label} Expense Audits`}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense
                ? `${previousExpense ? `Changes since ${dayjs(previousExpense.date).format("MMM D, YYYY h:mm A")}` : "Changes since the start of the month"} through ${dayjs(selectedExpense.date).format("MMM D, YYYY h:mm A")}.`
                : "Select an expense to view income and pending-payment changes since the previous expense."}
            </DialogDescription>
          </DialogHeader>

          {selectedMonth && (
            <>
              {selectedExpense ? (
                <>
                  <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3'>
                    <div>
                      <div className='font-semibold'>{selectedExpense.label || selectedExpense.remarks || "Expense"}</div>
                      <div className='text-sm text-muted-foreground'>
                        {dayjs(selectedExpense.date).format("MMM D, YYYY h:mm A")} · Expense{" "}
                        {convertCurrency(getAmount(selectedExpense.amount))}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm text-muted-foreground'>Current amount after expense</div>
                      <div className='font-bold text-green-500'>
                        {convertCurrency(currentAmountAfterExpense)}
                      </div>
                    </div>
                  </div>
                  <Button variant='outline' onClick={() => setSelectedExpense(null)}>
                    Back to expense audits
                  </Button>
                  <div className='max-h-[55vh] overflow-auto'>
                    <Table>
                      <TableHeader className='sticky top-0 bg-gray-100/95'>
                        <TableRow>
                          <TableHead>Date &amp; time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className='text-right'>Amount</TableHead>
                          <TableHead className='text-right'>Current amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseAuditRows.length > 0 ? (
                          expenseAuditRows.map((event, index) => (
                            <TableRow key={`${event.type}-${event.date}-${index}`}>
                              <TableCell>{dayjs(event.date).format("MMM D, YYYY h:mm A")}</TableCell>
                              <TableCell>{event.type}</TableCell>
                              <TableCell className='max-w-72 whitespace-normal'>{event.description}</TableCell>
                              <TableCell
                                className={`text-right font-medium ${
                                  event.kind === "income" ? "text-green-600" : "text-amber-600"
                                }`}
                              >
                                {convertCurrency(event.amount, false)}
                              </TableCell>
                              <TableCell className='text-right font-semibold text-green-500'>
                                {convertCurrency(event.currentAmount)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className='py-8 text-center text-muted-foreground'>
                              No income or pending-payment records before this expense.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
              <div className='max-h-[55vh] overflow-auto'>
                <Table>
                  <TableHeader className='sticky top-0 bg-gray-100/95'>
                    <TableRow>
                      <TableHead>Date &amp; time</TableHead>
                      <TableHead>Expense</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                      <TableHead className='text-right'>Current amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMonth.filteredExpenses.length > 0 ? (
                      [...selectedMonth.filteredExpenses]
                        .sort((first, second) => dayjs(second.date).valueOf() - dayjs(first.date).valueOf())
                        .map((expense, index) => {
                          const auditEventCount = getExpenseAuditEvents(expense).length;

                          return (
                            <TableRow key={`${expense.date}-${expense.label}-${index}`}>
                              <TableCell>{dayjs(expense.date).format("MMM D, YYYY h:mm A")}</TableCell>
                              <TableCell className='max-w-72 whitespace-normal'>
                                {expense.label || expense.remarks || "Expense"}
                              </TableCell>
                              <TableCell className='text-right font-medium text-red-500'>
                                -{convertCurrency(getAmount(expense.amount), false)}
                              </TableCell>
                              <TableCell className='text-right font-semibold text-green-500'>
                                {convertCurrency(getCurrentAmountAtExpense(expense))}
                              </TableCell>
                              <TableCell className='text-right'>
                                {auditEventCount > 0 && (
                                  <Button size='sm' onClick={() => setSelectedExpense(expense)}>
                                    View details ({auditEventCount})
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className='py-8 text-center text-muted-foreground'>
                          No expenses to audit for this month.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
