"use client";

import React from "react";
import dayjs from "dayjs";
import { FaPlus } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Payment from "../payment";
import { convertCurrency } from "@/lib/utils";
import storage, { onStorageChange, updateStorageItem } from "@/lib/localforage";
import type { TUtangEntry, TUtangList, TUtangPaymentMethod } from "../tables/types";

const STORAGE_KEY = "utang_list";

const toDateInput = (date: string) => {
  const parsedDate = dayjs(date);
  return parsedDate.isValid() ? parsedDate.format("YYYY-MM-DDTHH:mm") : "";
};

export default function UtangList() {
  const [items, setItems] = React.useState<TUtangList>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newItem, setNewItem] = React.useState({ name: "", amount: "", date: "", remarks: "" });

  React.useEffect(() => {
    const load = async () => {
      setItems((await storage.getItem<TUtangList>(STORAGE_KEY)) || []);
    };
    void load();
    return onStorageChange(STORAGE_KEY, (key, value) => {
      if (Array.isArray(value)) setItems(value as TUtangList);
      else void load();
    });
  }, []);

  const saveUpdate = async (update: (current: TUtangList) => TUtangList) => {
    const updatedItems = await updateStorageItem<TUtangList>(STORAGE_KEY, update, []);
    setItems(updatedItems);
  };

  const addItem = async () => {
    if (
      !newItem.name.trim() ||
      !newItem.amount.trim() ||
      !Number.isFinite(Number(newItem.amount)) ||
      Number(newItem.amount) <= 0
    )
      return;

    const item: TUtangEntry = {
      ...newItem,
      id: dayjs().format("YYYY/MM/DD HH:mm:ss.SSS"),
      date: dayjs().format("YYYY/MM/DD hh:mm A"),
    };
    await saveUpdate((current) => [...current, item]);
    setNewItem({ name: "", amount: "", date: "", remarks: "" });
    setIsAdding(false);
  };

  const updateItem = (id: string, changes: Partial<TUtangEntry>) => {
    void saveUpdate((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  };

  const removeItem = (id: string) => {
    void saveUpdate((current) => current.filter((item) => item.id !== id));
  };

  const markAsPaid = async (item: TUtangEntry, method: string) => {
    if (!method) {
      await saveUpdate((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, mop: undefined, paidAt: undefined, paidAmount: undefined }
            : currentItem,
        ),
      );
      return;
    }

    const mop: TUtangPaymentMethod | null =
      method === "Cash" || method === "cash"
        ? "Cash"
        : method === "Maya" || method === "maya"
          ? "Maya"
          : method === "GCash" || method === "gcash"
            ? "GCash"
            : null;
    if (!mop) return;

    await saveUpdate((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? currentItem.paidAt
            ? { ...currentItem, mop }
            : { ...currentItem, mop, paidAt: dayjs().toISOString(), paidAmount: currentItem.amount }
          : currentItem,
      ),
    );
  };

  const total = items.reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0);
  const canAdd =
    newItem.name.trim().length > 0 &&
    newItem.amount.trim().length > 0 &&
    Number.isFinite(Number(newItem.amount)) &&
    Number(newItem.amount) > 0;

  return (
    <Card className='space-y-4 p-5'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='text-lg font-bold'>Utang</h2>
        <Button
          size='xl'
          onClick={() => {
            setNewItem({ name: "", amount: "", date: "", remarks: "" });
            setIsAdding(true);
          }}
        >
          <FaPlus className='h-4 w-4' />
          Add
        </Button>
      </div>

      {isAdding && (
        <div
          className='fixed inset-0 z-50 flex h-screen w-screen items-start justify-center overflow-y-auto bg-black/90 px-4 pt-24 sm:pt-60'
          onClick={() => setIsAdding(false)}
        >
          <Card className='w-full max-w-105 cursor-default p-5' onClick={(event) => event.stopPropagation()}>
            <div className='space-y-3'>
              <div className='text-2xl font-bold'>Add Utang</div>
              <div className='space-y-1'>
                <div className='font-semibold'>Name</div>
                <Input
                  required
                  placeholder='Name'
                  value={newItem.name}
                  onChange={(event) => setNewItem((item) => ({ ...item, name: event.target.value }))}
                />
              </div>
              <div className='space-y-1'>
                <div className='font-semibold'>Amount</div>
                <Input
                  required
                  placeholder='Amount'
                  type='number'
                  min='0'
                  value={newItem.amount}
                  onChange={(event) => setNewItem((item) => ({ ...item, amount: event.target.value }))}
                />
              </div>
              <div className='space-y-1'>
                <div className='font-semibold'>Remarks</div>
                <Input
                  placeholder='Remarks'
                  value={newItem.remarks}
                  onChange={(event) => setNewItem((item) => ({ ...item, remarks: event.target.value }))}
                />
              </div>
              <div className='flex gap-2 pt-3'>
                <Button size='xl' className='flex-1' disabled={!canAdd} onClick={() => void addItem()}>
                  Confirm
                </Button>
                <Button size='xl' className='flex-1' variant='outline' onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow className='font-bold px-2 text-gray-600'>
              <TableHead className='font-bold px-2 bg-gray-100'>Name</TableHead>
              <TableHead className='font-bold px-2 bg-gray-100'>Amount</TableHead>
              <TableHead className='font-bold px-2 bg-gray-100'>Remarks</TableHead>
              <TableHead className='font-bold px-2 bg-gray-100'>Date &amp; time</TableHead>
              <TableHead className='font-bold px-2 bg-gray-100'>MOP</TableHead>
              <TableHead className='font-bold px-2 bg-gray-100'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Input
                    aria-label='Utang name'
                    value={item.name}
                    onChange={(event) => updateItem(item.id, { name: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label='Utang amount'
                    className='min-w-28 text-right'
                    type='number'
                    min='0'
                    value={item.amount}
                    onChange={(event) => updateItem(item.id, { amount: event.target.value })}
                    disabled={Boolean(item.paidAt)}
                  />
                </TableCell>

                <TableCell>
                  <Input
                    aria-label='Utang remarks'
                    value={item.remarks}
                    onChange={(event) => updateItem(item.id, { remarks: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label='Utang date and time'
                    className='min-w-56'
                    type='datetime-local'
                    value={toDateInput(item.date)}
                    disabled
                  />
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Payment
                      className=''
                      mop={item.mop?.toLowerCase() || ""}
                      portal
                      onPayClick={(method) => void markAsPaid(item, method)}
                    />
                    {/* {item.paidAt && <span className='text-xs font-semibold text-green-600'>Paid</span>} */}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant='destructive' onClick={() => removeItem(item.id)}>
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='py-8 text-center text-muted-foreground'>
                  No utang entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='font-bold text-blue-500 text-xl'>Total Utang: -{convertCurrency(total, false)}</div>
    </Card>
  );
}
