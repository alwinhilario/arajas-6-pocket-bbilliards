export type TAggregateData = { date: string };
export type TAggregateList = TAggregateData[];

export type TTableOptsData = {
  id: string;
  label: string;
  value: string;
  in: string;
  out: string;
  hours: string;
  table_rates: string;
  is_happy_hour: boolean;
  status: string;
  diff: {
    hours: number;
    minutes: number;
  };
  remaining_time: string;
  mop: [
    {
      label: string;
      amount: string;
      remarks: string;
    },
  ];
  result: string;
  is_open_time: boolean;
  timed_out_at: string;
  updated_at: string;
  amount: string;
  others: [
    {
      item: string;
      amount: string;
      remarks: string;
    },
  ];
  remarks: string;
};

export type TTableOpts = TTableOptsData[];

export type TOtherOrdersOptsData = {
  id: string;
  item: string;
  name: string;
  mop: string;
  amount: string;
  date: string;
  remarks: string;
};

export type TOtherOrdersOpts = TOtherOrdersOptsData[];
export type TPaidPendingPayment = TOtherOrdersOptsData & { paidAt: string };
export type TPaidPendingPaymentList = TPaidPendingPayment[];
export type TOutList = {
  id?: string;
  label: string;
  date: string;
  amount: string;
  remarks: string;
  is_all?: boolean;
}[];

export type TBaleEntry = {
  id: string;
  name: string;
  amount: string;
  date: string;
  remarks: string;
};

export type TBaleList = TBaleEntry[];

export type TUtangPaymentMethod = "Cash" | "Maya" | "GCash";
export type TUtangEntry = TBaleEntry & {
  mop?: TUtangPaymentMethod;
  paidAt?: string;
  paidAmount?: string;
};
export type TUtangList = TUtangEntry[];

export type TOptions = { id: string; label: string; value: string }[];
export type TInventoryData = {
  id: string;
  label: string;
  value: string;
  amount: string;
  total_stock: string;
  remaining: string;
  remarks: string;
};
export type TInventoryList = TInventoryData[];

export type TPendingPaymentData = {
  name: string;
  mop: string;
  items: TOtherOrdersOpts;
  total: number;
};
export type TPendingPaymentOpts = TPendingPaymentData[];
