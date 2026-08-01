import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DailyReport({ data }: { data: any }) {
  return (
    <div className='space-y-8'>
      {/* Orders */}
      <section className='border rounded p-4 border-black/30'>
        <h2 className='mb-2 text-lg font-semibold'>Orders</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>MOP</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.orders.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>₱{row.amount}</TableCell>
                <TableCell>{row.mop || "-"}</TableCell>
                <TableCell>{row.remarks || "-"}</TableCell>
                <TableCell>{row.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Expenses */}
      <section className='border rounded p-4 border-black/30'>
        <h2 className='mb-2 text-lg font-semibold'>Expenses</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.expenses.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>{row.label}</TableCell>
                <TableCell>₱{row.amount}</TableCell>
                <TableCell>{row.remarks || "-"}</TableCell>
                <TableCell>{row.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Remarks */}
      <section className='border rounded p-4 border-black/30'>
        <h2 className='mb-2 text-lg font-semibold'>Remarks</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.remarks.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>{row.label}</TableCell>
                <TableCell>{row.remarks}</TableCell>
                <TableCell>{row.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Plasada */}
      <section className='border rounded p-4 border-black/30'>
        <h2 className='mb-2 text-lg font-semibold'>Plasada</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.plasada.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>{row.label || "-"}</TableCell>
                <TableCell>{row.amount || "-"}</TableCell>
                <TableCell>{row.remarks}</TableCell>
                <TableCell>{row.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Table History */}
      <section className='border rounded p-4 border-black/30'>
        <h2 className='mb-2 text-lg font-semibold'>Table History</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Time Out</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Others</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.tableHistory.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>{row.label}</TableCell>
                <TableCell>{row.in}</TableCell>
                <TableCell>{row.out}</TableCell>
                <TableCell>{row.hours}</TableCell>
                <TableCell>₱{row.table_rates}</TableCell>

                <TableCell className='min-w-40'>
                  {row.others.length ? (
                    <div className='space-y-1'>
                      {row.others.map((o: any, i: number) => (
                        <div key={i}>
                          {o.item} - ₱{o.amount}
                        </div>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>

                <TableCell className='font-medium'>₱{row.amount}</TableCell>

                <TableCell>{row.remarks || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Pending Payments */}
      <section className='border rounded p-4 border-black/30'>
        <h2 className='mb-2 text-lg font-semibold'>Pending Payments</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.pendingPayment.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>₱{row.amount}</TableCell>
                <TableCell>{row.remarks || "-"}</TableCell>
                <TableCell>{row.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
