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
export type TOutList = {
  label: string;
  date: string;
  amount: string;
  remarks: string;
}[];

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
