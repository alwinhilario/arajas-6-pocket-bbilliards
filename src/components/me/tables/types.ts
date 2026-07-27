export type TTableOptsData = {
  id: string;
  label: string;
  value: string;
  in: string;
  out: string;
  hours: string;
  table_rates: string;
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
  is_open_time: false;
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

export type TOptions = { label: string; value: string }[];
export type TInventoryData = {
  label: string;
  value: string;
  amount: string;
  total_stock: string;
  remaining: string;
  remarks: string;
};
export type TInventoryList = TInventoryData[];
