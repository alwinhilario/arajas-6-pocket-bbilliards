import React from "react";
import dayjs from "dayjs";
import { Card } from "@/components/ui/card";
import storage, { onStorageChange } from "@/lib/localforage";
import { convertCurrency } from "@/lib/utils";
import { TOtherOrdersOpts, TOutList, TTableOpts } from "../tables/types";

const getAmountForMonth = <T extends { amount: string }>(
  records: T[],
  getDate: (record: T) => string,
  month: dayjs.Dayjs,
) =>
  records
    .filter((record) => {
      const date = dayjs(getDate(record));
      return date.isValid() && date.isSame(month, "month");
    })
    .reduce((total, record) => total + Number.parseInt(record.amount || "0", 10), 0);

type MonthEntry = {
  month: dayjs.Dayjs;
  tableIncome: number;
  orderIncome: number;
  plasadaIncome: number;
  grossIncome: number;
  pending: number;
  expenses: number;
  netIncome: number;
};

export default function MonthlyRevenue() {
  const [orders, setOrders] = React.useState<TOtherOrdersOpts>([]);
  const [expenses, setExpenses] = React.useState<TOutList>([]);
  const [tableHistory, setTableHistory] = React.useState<TTableOpts>([]);
  const [pendingPayment, setPendingPayment] = React.useState<TOtherOrdersOpts>([]);
  const [plasada, setPlasada] = React.useState<TOutList>([]);

  React.useEffect(() => {
    const load = async () => {
      const [orders, expenses, tableHistory, pendingPayment, plasada] = await Promise.all([
        storage.getItem<TOtherOrdersOpts>("other_orders"),
        storage.getItem<TOutList>("out_list"),
        storage.getItem<TTableOpts>("all_tables_list"),
        storage.getItem<TOtherOrdersOpts>("pending_payment"),
        storage.getItem<TOutList>("plasada_list"),
      ]);

      setOrders(orders || []);
      setExpenses(expenses || []);
      setTableHistory(tableHistory || []);
      setPendingPayment(pendingPayment || []);
      setPlasada(plasada || []);
    };

    load();
    return onStorageChange(
      ["other_orders", "out_list", "all_tables_list", "pending_payment", "plasada_list"],
      load,
    );
  }, []);

  const monthlyData = React.useMemo(() => {
    const now = dayjs();
    const firstMonth = dayjs("August 1, 2026").startOf("month");
    const months: MonthEntry[] = [];

    for (let month = firstMonth; !month.isAfter(now, "month"); month = month.add(1, "month")) {
      const tableIncome = getAmountForMonth(tableHistory, (item) => item.in, month);
      const orderIncome = getAmountForMonth(orders, (item) => item.date, month);
      const plasadaIncome = getAmountForMonth(plasada, (item) => item.date, month);
      const grossIncome = tableIncome + orderIncome + plasadaIncome;
      const pending = getAmountForMonth(pendingPayment, (item) => item.date, month);
      const expenseTotal = expenses
        .filter((item) => {
          const date = dayjs(item.date);
          return date.isValid() && date.isSame(month, "month");
        })
        .reduce((total, item) => total + Number.parseInt(item.amount || "0", 10), 0);

      months.push({
        month,
        tableIncome,
        orderIncome,
        plasadaIncome,
        grossIncome,
        pending,
        expenses: expenseTotal,
        netIncome: grossIncome - pending - expenseTotal,
      });
    }

    let cumulativeRevenue = 0;
    let cumulativePending = 0;
    let cumulativeExpenses = 0;
    let cumulativeNetIncome = 0;

    return months.map((item, index) => {
      const previousNetIncome = months[index - 1]?.netIncome;
      cumulativeRevenue += item.grossIncome;
      cumulativePending += item.pending;
      cumulativeExpenses += item.expenses;
      cumulativeNetIncome += item.netIncome;

      return {
        ...item,
        cumulativeRevenue,
        cumulativePending,
        cumulativeExpenses,
        cumulativeNetIncome,
        profitGrowth: previousNetIncome === undefined ? null : item.netIncome - previousNetIncome,
        profitGrowthPercent:
          previousNetIncome && previousNetIncome > 0
            ? ((item.netIncome - previousNetIncome) / previousNetIncome) * 100
            : null,
      };
    });
  }, [expenses, orders, pendingPayment, plasada, tableHistory]);

  const currentMonth = monthlyData[monthlyData.length - 1];
  const cumulativeTotals = monthlyData[monthlyData.length - 1];
  const maxChartValue = Math.max(1, ...monthlyData.flatMap((item) => [item.grossIncome, item.expenses]));
  const chartWidth = Math.max(640, 70 * monthlyData.length + 64);
  const chartHeight = 260;
  const chartTop = 16;
  const chartBottom = 204;
  const chartPlotHeight = chartBottom - chartTop;
  const chartRight = chartWidth - 20;
  const chartLeft = 62;
  const chartPlotWidth = chartRight - chartLeft;
  const barWidth = Math.min(18, chartPlotWidth / monthlyData.length / 4);
  const cumulativeMin = Math.min(0, ...monthlyData.map((item) => item.cumulativeNetIncome));
  const cumulativeMax = Math.max(0, ...monthlyData.map((item) => item.cumulativeNetIncome));
  const cumulativeRange = Math.max(1, cumulativeMax - cumulativeMin);
  const cumulativeY = (amount: number) =>
    chartBottom - ((amount - cumulativeMin) / cumulativeRange) * chartPlotHeight;
  const formatAxisValue = (amount: number) => {
    if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}m`;
    if (amount >= 1_000) return `₱${Math.round(amount / 1_000)}k`;
    return `₱${Math.round(amount)}`;
  };

  return (
    <Card className='space-y-5 p-5'>
      <div>
        <div className='text-xl font-bold'>Monthly Income &amp; Expenses</div>
        <div className='text-sm text-muted-foreground'>
          Net income (tubo) = gross revenue − pending payments − expenses. Cumulative totals run from the first
          month shown through the current month.
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
        {[
          { label: "This Month · Tubo", amount: currentMonth?.netIncome || 0, color: "text-emerald-600" },
          { label: "Cumulative · Tubo", amount: cumulativeTotals?.cumulativeNetIncome || 0, color: "text-emerald-600" },
          { label: "Cumulative · Revenue", amount: cumulativeTotals?.cumulativeRevenue || 0, color: "text-foreground" },
          { label: "Cumulative · Pending", amount: cumulativeTotals?.cumulativePending || 0, color: "text-amber-600" },
          { label: "Cumulative · Expenses", amount: cumulativeTotals?.cumulativeExpenses || 0, color: "text-rose-600" },
        ].map((summary) => (
          <div className='rounded-lg border p-4' key={summary.label}>
            <div className='text-sm text-muted-foreground'>{summary.label}</div>
            <div className={`pt-1 text-2xl font-bold ${summary.color}`}>
              {convertCurrency(summary.amount)}
            </div>
          </div>
        ))}
      </div>

<div className="flex items-center gap-2">

      <section aria-label='Monthly income and expenses chart ' className="flex-1">
        <h2 className='mb-3 font-semibold'>Monthly Revenue vs. Expenses</h2>
        <div className='mb-3 flex flex-wrap gap-x-5 gap-y-2 text-sm'>
          <div className='flex items-center gap-2'>
            <span className='h-3 w-3 rounded-sm bg-emerald-500' />
            Gross revenue
          </div>
          <div className='flex items-center gap-2'>
            <span className='h-3 w-3 rounded-sm bg-rose-500' />
            Expenses
          </div>
        </div>
        <div className='overflow-x-auto'>
          <svg
            aria-label='Bar chart comparing gross revenue and expenses by month'
            className='block max-w-none'
            height={chartHeight}
            role='img'
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            width={chartWidth}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const y = chartBottom - fraction * chartPlotHeight;
              return (
                <g key={fraction}>
                  <line x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke='currentColor' opacity='0.12' />
                  <text
                    x={chartLeft - 8}
                    y={y + 4}
                    textAnchor='end'
                    className='fill-muted-foreground'
                    fontSize='11'
                  >
                    {formatAxisValue(maxChartValue * fraction)}
                  </text>
                </g>
              );
            })}
            {monthlyData.map((item, index) => {
              const center = chartLeft + ((index + 0.5) / monthlyData.length) * chartPlotWidth;
              const incomeHeight = (item.grossIncome / maxChartValue) * chartPlotHeight;
              const expenseHeight = (item.expenses / maxChartValue) * chartPlotHeight;

              return (
                <g key={item.month.format("YYYY-MM")}>
                  <rect
                    x={center - barWidth - 2}
                    y={chartBottom - incomeHeight}
                    width={barWidth}
                    height={incomeHeight}
                    rx='3'
                    className='fill-emerald-500'
                  >
                    <title>{`${item.month.format("MMMM YYYY")} gross revenue: ${convertCurrency(item.grossIncome)}`}</title>
                  </rect>
                  <rect
                    x={center + 2}
                    y={chartBottom - expenseHeight}
                    width={barWidth}
                    height={expenseHeight}
                    rx='3'
                    className='fill-rose-500'
                  >
                    <title>{`${item.month.format("MMMM YYYY")} expenses: ${convertCurrency(item.expenses)}`}</title>
                  </rect>
                  <text
                    x={center}
                    y={chartBottom + 20}
                    textAnchor='middle'
                    className='fill-muted-foreground'
                    fontSize='11'
                  >
                    {item.month.format("MMM YY")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      <section aria-label='Cumulative net income chart' className="flex-1">
        <div className='mb-3'>
          <h2 className='font-semibold'>Cumulative Tubo Growth</h2>
          <p className='text-sm text-muted-foreground'>
            Running net income after pending payments and expenses, month by month.
          </p>
        </div>
        <div className='overflow-x-auto'>
          <svg
            aria-label='Line chart showing cumulative net income by month'
            className='block max-w-none'
            height={chartHeight}
            role='img'
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            width={chartWidth}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const amount = cumulativeMin + fraction * cumulativeRange;
              const y = cumulativeY(amount);
              return (
                <g key={fraction}>
                  <line
                    x1={chartLeft}
                    x2={chartRight}
                    y1={y}
                    y2={y}
                    stroke='currentColor'
                    opacity={amount === 0 ? "0.35" : "0.12"}
                  />
                  <text
                    x={chartLeft - 8}
                    y={y + 4}
                    textAnchor='end'
                    className='fill-muted-foreground'
                    fontSize='11'
                  >
                    {formatAxisValue(amount)}
                  </text>
                </g>
              );
            })}
            {monthlyData.length > 1 && (
              <polyline
                points={monthlyData
                  .map((item, index) => {
                    const x = chartLeft + ((index + 0.5) / monthlyData.length) * chartPlotWidth;
                    return `${x},${cumulativeY(item.cumulativeNetIncome)}`;
                  })
                  .join(" ")}
                fill='none'
                stroke='currentColor'
                strokeWidth='3'
                className='text-emerald-600'
              />
            )}
            {monthlyData.map((item, index) => {
              const x = chartLeft + ((index + 0.5) / monthlyData.length) * chartPlotWidth;
              const y = cumulativeY(item.cumulativeNetIncome);
              return (
                <g key={item.month.format("YYYY-MM")}>
                  <circle cx={x} cy={y} r='5' className='fill-emerald-600'>
                    <title>
                      {`${item.month.format("MMMM YYYY")} cumulative tubo: ${convertCurrency(item.cumulativeNetIncome)}`}
                    </title>
                  </circle>
                  <text
                    x={x}
                    y={chartBottom + 20}
                    textAnchor='middle'
                    className='fill-muted-foreground'
                    fontSize='11'
                  >
                    {item.month.format("MMM YY")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>
</div>


      <section aria-label='Monthly income details'>
        <h2 className='mb-2 font-semibold'>Monthly Breakdown</h2>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-300 text-sm'>
            <thead>
              <tr className='border-b text-left text-muted-foreground'>
                <th className='p-2'>Month</th>
                <th className='p-2 text-right'>Table Rates</th>
                <th className='p-2 text-right'>Other Orders</th>
                <th className='p-2 text-right'>Plasada</th>
                <th className='p-2 text-right'>Gross Revenue</th>
                <th className='p-2 text-right'>Pending</th>
                <th className='p-2 text-right'>Expenses</th>
                <th className='p-2 text-right'>Monthly Tubo</th>
                <th className='p-2 text-right'>Revenue to Date</th>
                <th className='p-2 text-right'>Pending to Date</th>
                <th className='p-2 text-right'>Expenses to Date</th>
                <th className='p-2 text-right'>Cumulative Tubo</th>
                <th className='p-2 text-right'>Growth vs. Prior Month</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((item) => (
                <tr className='border-b last:border-0' key={item.month.format("YYYY-MM")}>
                  <td className='p-2 font-medium'>{item.month.format("MMMM YYYY")}</td>
                  <td className='p-2 text-right'>{convertCurrency(item.tableIncome)}</td>
                  <td className='p-2 text-right'>{convertCurrency(item.orderIncome)}</td>
                  <td className='p-2 text-right'>{convertCurrency(item.plasadaIncome)}</td>
                  <td className='p-2 text-right'>{convertCurrency(item.grossIncome)}</td>
                  <td className='p-2 text-right text-amber-600'>{convertCurrency(item.pending)}</td>
                  <td className='p-2 text-right text-rose-600'>{convertCurrency(item.expenses)}</td>
                  <td className='p-2 text-right font-semibold text-emerald-600'>
                    {convertCurrency(item.netIncome)}
                  </td>
                  <td className='p-2 text-right'>{convertCurrency(item.cumulativeRevenue)}</td>
                  <td className='p-2 text-right text-amber-600'>{convertCurrency(item.cumulativePending)}</td>
                  <td className='p-2 text-right text-rose-600'>{convertCurrency(item.cumulativeExpenses)}</td>
                  <td className='p-2 text-right font-semibold text-emerald-600'>
                    {convertCurrency(item.cumulativeNetIncome)}
                  </td>
                  <td
                    className={`p-2 text-right ${
                      (item.profitGrowth || 0) < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {item.profitGrowth === null
                      ? "—"
                      : `${item.profitGrowth > 0 ? "+" : ""}${convertCurrency(item.profitGrowth)}${
                          item.profitGrowthPercent === null ? "" : ` (${item.profitGrowthPercent.toFixed(1)}%)`
                        }`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Card>
  );
}
