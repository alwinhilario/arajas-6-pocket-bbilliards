"use client";

import React from "react";
import dayjs from "dayjs";
import storage from "@/lib/localforage";
import { getTotalAmount } from "@/lib/utils";
import { TOtherOrdersOpts } from "../tables/types";

export const PENDING_PAYMENT_CHECK_STORAGE_KEY = "pending_payment_checks";
export const PENDING_PAYMENT_CHECK_INTERVAL = 2 * 60 * 60 * 1000;

export type PendingPaymentSnapshot = {
  date: string;
  amount: number;
  items: { name: string; item: string; amount: number }[];
};

export default function PendingPaymentMonitor() {
  React.useEffect(() => {
    let isChecking = false;

    const recordSnapshotIfDue = async () => {
      if (isChecking) return;
      isChecking = true;

      try {
        const [storedSnapshots, storedPayments] = await Promise.all([
          storage.getItem<PendingPaymentSnapshot[]>(PENDING_PAYMENT_CHECK_STORAGE_KEY),
          storage.getItem<TOtherOrdersOpts>("pending_payment"),
        ]);
        const snapshots = storedSnapshots || [];
        const now = dayjs();
        const latestSnapshot = snapshots.reduce<PendingPaymentSnapshot | undefined>(
          (latest, snapshot) =>
            !latest || dayjs(snapshot.date).isAfter(dayjs(latest.date)) ? snapshot : latest,
          undefined,
        );
        const latestSnapshotDate = latestSnapshot ? dayjs(latestSnapshot.date) : null;

        if (
          latestSnapshotDate?.isValid() &&
          now.isBefore(latestSnapshotDate.add(PENDING_PAYMENT_CHECK_INTERVAL, "millisecond"))
        ) {
          return;
        }

        const payments = (storedPayments || []).filter(
          (payment) => Number.parseInt(payment.amount || "0", 10) > 0,
        );
        const snapshot: PendingPaymentSnapshot = {
          date: now.format("YYYY/MM/DD HH:mm:ss.SSS"),
          amount: getTotalAmount(payments),
          items: payments.map((payment) => ({
            name: payment.name || "",
            item: payment.item || "",
            amount: Number.parseInt(payment.amount || "0", 10),
          })),
        };

        await storage.setItem(PENDING_PAYMENT_CHECK_STORAGE_KEY, [...snapshots, snapshot]);
      } finally {
        isChecking = false;
      }
    };

    void recordSnapshotIfDue().catch((error: unknown) => {
      console.error("Unable to save pending-payment snapshot.", error);
    });
    const interval = window.setInterval(() => {
      void recordSnapshotIfDue().catch((error: unknown) => {
        console.error("Unable to save pending-payment snapshot.", error);
      });
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
