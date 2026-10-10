import dayjs from "dayjs";
import { updateStorageItem } from "@/lib/localforage";
import type { TOtherOrdersOpts, TPaidPendingPaymentList } from "@/components/me/tables/types";

export const PAID_PENDING_PAYMENT_STORAGE_KEY = "paid_pending_payment_audit";

export const recordPaidPendingPayments = async (payments: TOtherOrdersOpts) => {
  const paidAt = dayjs().toISOString();
  const paidPayments = payments
    .filter((payment) => Boolean(payment.mop))
    .map((payment) => ({ ...payment, paidAt }));

  if (paidPayments.length === 0) return;

  await updateStorageItem<TPaidPendingPaymentList>(
    PAID_PENDING_PAYMENT_STORAGE_KEY,
    (current) => {
      const recordedIds = new Set(current.map((payment) => payment.id));
      return [...current, ...paidPayments.filter((payment) => !recordedIds.has(payment.id))];
    },
    [],
  );
};
