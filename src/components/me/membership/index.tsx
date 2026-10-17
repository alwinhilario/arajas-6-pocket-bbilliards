"use client";

import React from "react";
import dayjs from "dayjs";
import { FaEye, FaIdCard, FaPlus, FaRedo, FaTrash } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import storage, { onStorageChange, updateStorageItem } from "@/lib/localforage";
import type { TMembershipUser, TMembershipUserList } from "../tables/types";
import {
  claimMembershipReward,
  getAvailableMembershipRewards,
  MEMBERSHIP_DISCOUNT_STAMP_GOAL,
  MEMBERSHIP_FREE_HOUR_STAMP_GOAL,
} from "@/lib/membership-rewards";

const STORAGE_KEY = "membership_users";

type Confirmation =
  | { kind: "delete"; user: TMembershipUser }
  | { kind: "reward"; user: TMembershipUser; reward: "discount" | "freeHour" }
  | { kind: "resetStamps"; user: TMembershipUser }
  | null;

export default function Membership() {
  const [users, setUsers] = React.useState<TMembershipUserList>([]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<TMembershipUser | null>(null);
  const [detailsUserId, setDetailsUserId] = React.useState<string | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      setUsers((await storage.getItem<TMembershipUserList>(STORAGE_KEY)) || []);
    };
    void load();
    return onStorageChange(STORAGE_KEY, (key, value) => {
      if (Array.isArray(value)) setUsers(value as TMembershipUserList);
      else void load();
    });
  }, []);

  const saveUpdate = async (update: (current: TMembershipUserList) => TMembershipUserList) => {
    const updated = await updateStorageItem<TMembershipUserList>(STORAGE_KEY, update, []);
    setUsers(updated);
  };

  const openForm = (user?: TMembershipUser) => {
    setEditingUser(user || null);
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setFormOpen(true);
  };

  const saveUser = async () => {
    const normalizedName = name.trim();
    if (!normalizedName) return;

    if (editingUser) {
      await saveUpdate((current) =>
        current.map((user) =>
          user.id === editingUser.id ? { ...user, name: normalizedName, phone: phone.trim() } : user,
        ),
      );
    } else {
      const user: TMembershipUser = {
        id: `${dayjs().format("YYYYMMDDHHmmssSSS")}-${Math.random().toString(36).slice(2, 8)}`,
        name: normalizedName,
        phone: phone.trim(),
        stamps: 0,
        redeemedDiscounts: 0,
        redeemedFreeHours: 0,
        discountClaimsSinceReset: 0,
        freeHourClaimsSinceReset: 0,
        createdAt: dayjs().toISOString(),
      };
      await saveUpdate((current) => [...current, user]);
    }

    setFormOpen(false);
    setEditingUser(null);
    setName("");
    setPhone("");
  };

  const updateStamps = async (userId: string, amount: number) => {
    await saveUpdate((current) =>
      current.map((user) =>
        user.id === userId ? { ...user, stamps: Math.max(0, user.stamps + amount) } : user,
      ),
    );
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    const action = confirmation;

    if (action.kind === "delete") {
      await saveUpdate((current) => current.filter((user) => user.id !== action.user.id));
    } else if (action.kind === "reward") {
      await claimMembershipReward(action.user.id, action.reward === "discount" ? "discount" : "free_hour");
    } else {
      await saveUpdate((current) =>
        current.map((user) =>
          user.id === action.user.id
            ? {
                ...user,
                stamps: 0,
                redeemedDiscounts: 0,
                redeemedFreeHours: 0,
                discountClaimsSinceReset: 0,
                freeHourClaimsSinceReset: 0,
              }
            : user,
        ),
      );
    }

    setConfirmation(null);
  };

  return (
    <Card className='space-y-5 p-5'>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit member" : "Add membership user"}</DialogTitle>
            <DialogDescription>
              Add a member and keep their loyalty stamps and reward claims here.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <label className='block space-y-1'>
              <span className='font-semibold'>Name</span>
              <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className='block space-y-1'>
              <span className='font-semibold'>Phone (optional)</span>
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!name.trim()} onClick={() => void saveUser()}>
              Save member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsUserId !== null} onOpenChange={(open) => !open && setDetailsUserId(null)}>
        <DialogContent className='max-h-[90vh] max-w-6xl overflow-y-auto'>
          {users
            .filter((user) => user.id === detailsUserId)
            .map((user) => {
              const rewards = getAvailableMembershipRewards(user);
              const claimedDiscounts = user.discountClaimsSinceReset ?? user.redeemedDiscounts ?? 0;
              const claimedFreeHours = user.freeHourClaimsSinceReset ?? user.redeemedFreeHours ?? 0;
              const redemptionAudit = [...(user.rewardAuditLog || [])].reverse();
              return (
                <React.Fragment key={user.id}>
                  <DialogHeader>
                    <DialogTitle>{user.name}</DialogTitle>
                    <DialogDescription>
                      {user.phone || "Membership stamp card"} · {user.stamps}{" "}
                      {user.stamps === 1 ? "stamp" : "stamps"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div className='grid grid-cols-5 justify-items-center gap-3'>
                      {Array.from({ length: MEMBERSHIP_FREE_HOUR_STAMP_GOAL }, (_, index) => {
                        const earned = index < user.stamps;
                        const canAdd = index === user.stamps;
                        const canRemove = index === user.stamps - 1;
                        const clickable = canAdd || canRemove;
                        return (
                          <button
                            type='button'
                            key={index}
                            aria-label={`Stamp ${index + 1}${earned ? ", earned" : ""}${
                              canAdd ? ", click to add" : canRemove ? ", click to remove" : ""
                            }`}
                            aria-pressed={earned}
                            disabled={!clickable}
                            onClick={() => void updateStamps(user.id, canAdd ? 1 : -1)}
                            className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold transition-colors ${
                              earned
                                ? "border-amber-400 bg-amber-400 text-gray-950"
                                : "border-dashed border-gray-300 bg-gray-50 text-gray-500"
                            } ${
                              clickable
                                ? "cursor-pointer hover:border-amber-600 hover:ring-2 hover:ring-amber-200"
                                : "cursor-not-allowed opacity-50"
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    <div className='flex flex-wrap gap-2 text-xs'>
                      <span className='rounded border border-amber-200 bg-amber-50 px-2 py-1 text-amber-900'>
                        ₱50 discounts available: {rewards.discounts}
                      </span>
                      <span className='rounded border border-amber-200 bg-amber-50 px-2 py-1 text-amber-900'>
                        Free hours available: {rewards.freeHours}
                      </span>
                    </div>
                    {redemptionAudit.length > 0 ? (
                      <div className='flex flex-wrap gap-2 text-xs'>
                        {redemptionAudit.map((entry, index) => (
                          <span
                            key={`${entry.redeemedAt}-${entry.reward}-${index}`}
                            className='rounded bg-emerald-100 px-2 py-1 font-semibold text-emerald-900'
                          >
                            Redeemed {entry.reward === "discount" ? "₱50 discount" : "free hour"} ·{" "}
                            {dayjs(entry.redeemedAt).format("MMM D, YYYY h:mm A")}
                            {entry.source === "table" ? " · Table" : ""}
                          </span>
                        ))}
                      </div>
                    ) : (claimedDiscounts > 0 || claimedFreeHours > 0) ? (
                      <div className='flex flex-wrap gap-2 text-xs'>
                        {claimedDiscounts > 0 && (
                          <span className='rounded bg-emerald-100 px-2 py-1 font-semibold text-emerald-900'>
                            Claimed ₱50 discount × {claimedDiscounts}
                          </span>
                        )}
                        {claimedFreeHours > 0 && (
                          <span className='rounded bg-emerald-100 px-2 py-1 font-semibold text-emerald-900'>
                            Claimed free hour × {claimedFreeHours}
                          </span>
                        )}
                      </div>
                    ) : null}
                    <div className='grid grid-cols-3 gap-5 border-t pt-4'>
                      {/* <Button
                        size='sm'
                        variant='secondary'
                        disabled={rewards.discounts === 0}
                        onClick={() => setConfirmation({ kind: "reward", user, reward: "discount" })}
                        className='cursor-pointer'
                      >
                        Redeem ₱50 off
                      </Button>
                      <Button
                        size='sm'
                        variant='secondary'
                        disabled={rewards.freeHours === 0}
                        onClick={() => setConfirmation({ kind: "reward", user, reward: "freeHour" })}
                        className='cursor-pointer'
                      >
                        Redeem free hour
                      </Button> */}

                      <Button
                        // size='sm'
                        variant='destructive'
                        disabled={user.stamps === 0}
                        onClick={() => setConfirmation({ kind: "resetStamps", user })}
                        className='cursor-pointer px-3'
                      >
                        <FaRedo /> Reset
                      </Button>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmation !== null} onOpenChange={(open) => !open && setConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmation?.kind === "delete"
                ? "Delete membership user?"
                : confirmation?.kind === "resetStamps"
                  ? "Refresh membership stamps?"
                  : confirmation?.reward === "discount"
                    ? "Redeem ₱50 discount?"
                    : "Redeem free hour?"}
            </DialogTitle>
            <DialogDescription>
              {confirmation?.kind === "delete"
                ? `This will permanently delete ${confirmation.user.name} and their membership records.`
                : confirmation?.kind === "resetStamps"
                  ? `This resets ${confirmation.user.name}'s stamps and claimed reward counts to zero.`
                  : confirmation
                    ? `${confirmation.user.name}'s stamp balance will stay the same. This reward can only be claimed once per earned stamp milestone.`
                    : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfirmation(null)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={() => void confirmAction()}>
              {confirmation?.kind === "delete"
                ? "Delete member"
                : confirmation?.kind === "resetStamps"
                  ? "Refresh stamps"
                  : "Confirm reward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='flex items-center gap-2 text-lg font-bold'>
            <FaIdCard className='text-amber-500' /> Membership
          </h2>
          <p className='text-sm text-muted-foreground'>
            Manage stamps manually. {MEMBERSHIP_DISCOUNT_STAMP_GOAL} stamps: ₱50 off ·{" "}
            {MEMBERSHIP_FREE_HOUR_STAMP_GOAL} stamps: 1 free hour.
          </p>
        </div>
        <Button onClick={() => openForm()}>
          <FaPlus className='h-4 w-4' /> Add member
        </Button>
      </div>

      {users.length > 0 ? (
        <div className='overflow-hidden rounded-md border'>
          <ul className='divide-y'>
            {users.map((user) => {
              const redemptionAudit = [...(user.rewardAuditLog || [])].reverse();
              const claimedDiscounts = user.discountClaimsSinceReset ?? user.redeemedDiscounts ?? 0;
              const claimedFreeHours = user.freeHourClaimsSinceReset ?? user.redeemedFreeHours ?? 0;
              return (
                <li
                  key={user.id}
                  className='flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3'
                >
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                      <p className='truncate font-semibold'>{user.name}</p>
                      <div
                        className='flex flex-wrap items-center gap-1'
                        aria-label={`${user.stamps} of ${MEMBERSHIP_FREE_HOUR_STAMP_GOAL} stamps`}
                      >
                        {Array.from({ length: MEMBERSHIP_FREE_HOUR_STAMP_GOAL }, (_, index) => (
                          <span
                            key={index}
                            aria-hidden='true'
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                              index < user.stamps
                                ? "border-amber-400 bg-amber-400 text-gray-950"
                                : "border-dashed border-gray-300 bg-gray-50 text-gray-500"
                            }`}
                          >
                            {index + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                    {user.phone && <p className='text-sm text-muted-foreground'>{user.phone}</p>}
                    <div className='mt-1 flex flex-wrap gap-1'>
                      {redemptionAudit.length > 0
                        ? redemptionAudit.map((entry, index) => (
                            <span
                              key={`${entry.redeemedAt}-${entry.reward}-${index}`}
                              className='rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-900'
                            >
                              Redeemed {entry.reward === "discount" ? "₱50" : "free hour"} ·{" "}
                              {dayjs(entry.redeemedAt).format("MMM D")}
                            </span>
                          ))
                        : (
                            <>
                              {claimedDiscounts > 0 && (
                                <span className='rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-900'>
                                  Claimed ₱50 × {claimedDiscounts}
                                </span>
                              )}
                              {claimedFreeHours > 0 && (
                                <span className='rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-900'>
                                  Claimed free hour × {claimedFreeHours}
                                </span>
                              )}
                            </>
                          )}
                    </div>
                  </div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Button size='sm' variant='outline' onClick={() => setDetailsUserId(user.id)}>
                      <FaEye /> View details
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => openForm(user)}>
                      Edit
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => setConfirmation({ kind: "delete", user })}
                    >
                      <FaTrash /> Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className='rounded-lg border border-dashed p-8 text-center text-muted-foreground'>
          No membership users yet. Add a member to start tracking stamps.
        </div>
      )}
    </Card>
  );
}
