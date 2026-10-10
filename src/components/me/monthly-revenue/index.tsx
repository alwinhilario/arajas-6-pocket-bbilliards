import React from "react";
import dayjs from "dayjs";
import { Card } from "@/components/ui/card";
import storage, { onStorageChange } from "@/lib/localforage";
import { convertCurrency, filterObject } from "@/lib/utils";
import { TBaleList, TOtherOrdersOpts, TOutList, TTableOpts } from "../tables/types";
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
  filteredBale: TBaleList;
  pendingSnapshots: PendingPaymentSnapshot[];
};

type LedgerEvent = {
  date: string;
  type: "Table rates" | "Orders" | "Plasada" | "Bale" | "Expenses" | "Pending payments";
  description: string;
  amount: number;
  kind: "income" | "expense" | "pending" | "bale";
};

const getAmount = (amount: string | number | undefined) => Number.parseInt(String(amount || "0"), 10) || 0;
const sumAmounts = (items: Array<{ amount?: string | number }>) =>
  items.reduce((total, item) => total + getAmount(item.amount), 0);
const readStorageList = async <T,>(key: string): Promise<T[]> => {
  const value = await storage.getItem<unknown>(key);
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) {
    console.error(`Expected local storage key "${key}" to contain a list.`);
    return [];
  }
  return value.filter((item) => item !== null && typeof item === "object") as T[];
};

export default function MonthlyRevenue() {
  const [myMonths, setMyMonths] = React.useState<MonthBreakdown[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState<MonthBreakdown | null>(null);
  const [selectedExpense, setSelectedExpense] = React.useState<TOutList[number] | null>(null);

  React.useEffect(() => {
    const load = async () => {
      const startDate = dayjs("2026-07-01");
      const now = dayjs();

      const [orders, expenses, tableHistory, pendingPayment, plasada, bale, pendingSnapshots] =
        await Promise.all([
          readStorageList<TOtherOrdersOpts[number]>("other_orders"),
          readStorageList<TOutList[number]>("out_list"),
          readStorageList<TTableOpts[number]>("all_tables_list"),
          readStorageList<TOtherOrdersOpts[number]>("pending_payment"),
          readStorageList<TOutList[number]>("plasada_list"),
          readStorageList<TBaleList[number]>("bale_list"),
          readStorageList<PendingPaymentSnapshot>(PENDING_PAYMENT_CHECK_STORAGE_KEY),
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
        const filteredBale = filterObject({
          object: bale,
          filter_from: from.toDate(),
          filter_to: to.toDate(),
          propertyName: "date",
        });
        const filteredExpenses = filterObject({
          object: expenses.filter((expense) => Number.parseInt(expense?.amount || "0", 10) > 0),
          filter_from: from.toDate(),
          filter_to: to.toDate(),
          propertyName: "date",
        });
        const filteredTableHistory = filterObject({
          object: tableHistory.filter((record) => record?.status === "Timed out"),
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
          filteredBale,
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
        "bale_list",
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
      ...selectedMonth.filteredBale.map((record) => ({
        date: record.date,
        type: "Bale" as const,
        description: [record.name, record.remarks].filter(Boolean).join(" - ") || "Bale",
        amount: getAmount(record.amount),
        kind: "bale" as const,
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

  const getCurrentAmountThrough = React.useCallback(
    (date: string) => {
      const cutoff = dayjs(date);
      return ledgerEvents.reduce((total, event) => {
        const eventDate = dayjs(event.date);
        if (!eventDate.isValid() || eventDate.isAfter(cutoff)) return total;
        if (event.kind === "income") return total + event.amount;
        if (event.kind === "expense" || event.kind === "bale") return total - event.amount;
        return total;
      }, 0);
    },
    [ledgerEvents],
  );

  const previousExpense = selectedExpense
    ? selectedMonth?.filteredExpenses
        .filter((expense) => dayjs(expense.date).isBefore(dayjs(selectedExpense.date)))
        .sort((first, second) => dayjs(second.date).valueOf() - dayjs(first.date).valueOf())[0]
    : undefined;

  const getExpenseAuditEvents = React.useCallback(
    (expense: TOutList[number]) => {
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
    },
    [ledgerEvents, selectedMonth],
  );

  const expenseAuditEvents = React.useMemo(() => {
    if (!selectedExpense) return [];
    return getExpenseAuditEvents(selectedExpense);
  }, [getExpenseAuditEvents, selectedExpense]);

  const expenseAuditRows = React.useMemo(() => {
    if (!selectedExpense) return [];
    let currentAmount = previousExpense ? getCurrentAmountThrough(previousExpense.date) : 0;

    return [...expenseAuditEvents]
      .sort((first, second) => dayjs(first.date).valueOf() - dayjs(second.date).valueOf())
      .map((event) => {
        if (event.kind === "income") currentAmount += event.amount;
        if (event.kind === "bale") currentAmount -= event.amount;
        return { ...event, currentAmount };
      })
      .reverse();
  }, [expenseAuditEvents, getCurrentAmountThrough, previousExpense, selectedExpense]);
  const currentAmountAfterExpense = selectedExpense ? getCurrentAmountThrough(selectedExpense.date) : 0;

  const getCurrentAmountAtExpense = (expense: TOutList[number]) => {
    return getCurrentAmountThrough(expense.date);
  };

  const getCurrentAmountAtBale = (bale: TBaleList[number]) => {
    const baleDate = dayjs(bale.date);
    const previousExpense = selectedMonth?.filteredExpenses
      .filter((expense) => dayjs(expense.date).isBefore(baleDate))
      .sort((first, second) => dayjs(second.date).valueOf() - dayjs(first.date).valueOf())[0];

    if (!previousExpense) return getCurrentAmountThrough(bale.date);

    const balesSincePreviousExpense = selectedMonth.filteredBale
      .filter(
        (item) =>
          dayjs(item.date).isAfter(dayjs(previousExpense.date)) && !dayjs(item.date).isAfter(baleDate),
      )
      .reduce((total, item) => total + getAmount(item.amount), 0);

    return getCurrentAmountAtExpense(previousExpense) - balesSincePreviousExpense;
  };

  const monthlyAuditItems = selectedMonth
    ? [
        ...selectedMonth.filteredExpenses.map((expense, index) => ({
          type: "Expense" as const,
          date: expense.date,
          description: expense.label || expense.remarks || "Expense",
          amount: getAmount(expense.amount),
          currentAmount: getCurrentAmountAtExpense(expense),
          key: `expense-${expense.date}-${index}`,
          expense,
        })),
        ...selectedMonth.filteredBale.map((bale) => ({
          type: "Bale" as const,
          date: bale.date,
          description: [bale.name, bale.remarks].filter(Boolean).join(" - ") || "Bale",
          amount: getAmount(bale.amount),
          currentAmount: getCurrentAmountAtBale(bale),
          key: `bale-${bale.id}`,
          expense: null,
        })),
      ].sort((first, second) => dayjs(second.date).valueOf() - dayjs(first.date).valueOf())
    : [];

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
              <TableHead className='font-bold px-2 text-gray-600'>TOTAL BALE</TableHead>
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
                const totalBale = sumAmounts(item.filteredBale);
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
                    <TableCell className='font-bold text-red-400'>
                      -{convertCurrency(totalPendingPayments, false)}
                    </TableCell>
                    <TableCell className='font-bold text-blue-500'>
                      -{convertCurrency(totalBale, false)}
                    </TableCell>
                    <TableCell className='text-red-400 font-bold'>
                      -{convertCurrency(totalExpenses, false)}
                    </TableCell>
                    <TableCell className='text-green-400 font-bold'>
                      +{convertCurrency(totalAmount - totalExpenses - totalBale, false)}
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
                <TableCell colSpan={10} className='text-center pt-5 text-gray-400'>
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
              {selectedExpense
                ? `${selectedExpense.label || "Expense"} Audit`
                : `${selectedMonth?.label} Expense Audits`}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense ? (
                <>
                  {previousExpense ? (
                    <>
                      Changes since{" "}
                      <span className='text-blue-500'>
                        {dayjs(previousExpense.date).format("MMM D, YYYY h:mm A")}
                      </span>
                    </>
                  ) : (
                    "Changes since the start of the month"
                  )}{" "}
                  through{" "}
                  <span className='text-blue-500'>
                    {dayjs(selectedExpense.date).format("MMM D, YYYY h:mm A")}
                  </span>
                  .
                </>
              ) : (
                "Select an expense to view income and pending-payment changes since the previous expense."
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedMonth && (
            <>
              {selectedExpense ? (
                <>
                  <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3'>
                    <div>
                      <div className='font-semibold'>
                        {selectedExpense.label || selectedExpense.remarks || "Expense"}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        {dayjs(selectedExpense.date).format("MMM D, YYYY h:mm A")} · Expense{" "}
                        <span className='font-semibold text-red-500'>
                          -{convertCurrency(getAmount(selectedExpense.amount))}
                        </span>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm '>Current Amount after Expense</div>
                      <div className='font-bold text-green-500'>
                        {convertCurrency(currentAmountAfterExpense)}
                      </div>
                    </div>
                  </div>
                  <Button size='xl' onClick={() => setSelectedExpense(null)}>
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
                              <TableCell className='max-w-72 whitespace-normal'>
                                <div className='line-clamp-3' title={event.description}>
                                  {event.description}
                                </div>
                              </TableCell>
                              <TableCell
                                className={`text-right font-medium ${
                                  event.kind === "income"
                                    ? "text-green-600"
                                    : event.kind === "bale"
                                      ? "text-blue-500"
                                      : "text-amber-600"
                                }`}
                              >
                                {event.kind === "bale" ? "-" : "+"}
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
                <>
                  <div className='max-h-[55vh] overflow-auto'>
                    <Table>
                      <TableHeader className='sticky top-0 bg-gray-100/95'>
                        <TableRow>
                          <TableHead>Date &amp; time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className='text-right'>Amount</TableHead>
                          <TableHead className='text-right'>Current amount</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyAuditItems.length > 0 ? (
                          monthlyAuditItems.map((item) => {
                            const auditEventCount = item.expense
                              ? getExpenseAuditEvents(item.expense).length
                              : 0;

                            return (
                              <TableRow key={item.key}>
                                <TableCell>{dayjs(item.date).format("MMM D, YYYY h:mm A")}</TableCell>
                                <TableCell className={item.type === "Bale" ? "text-blue-500" : ""}>
                                  {item.type}
                                </TableCell>
                                <TableCell className='max-w-72 whitespace-normal'>
                                  {item.description}
                                </TableCell>
                                <TableCell
                                  className={`text-right font-medium ${
                                    item.type === "Bale" ? "text-blue-500" : "text-red-500"
                                  }`}
                                >
                                  -{convertCurrency(item.amount, false)}
                                </TableCell>
                                <TableCell className='text-right font-semibold text-green-500'>
                                  {convertCurrency(item.currentAmount)}
                                </TableCell>
                                <TableCell className='text-right'>
                                  {item.expense && auditEventCount > 0 && (
                                    <Button size='sm' onClick={() => setSelectedExpense(item.expense)}>
                                      View details ({auditEventCount})
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className='py-8 text-center text-muted-foreground'>
                              No expenses or bale entries for this month.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
