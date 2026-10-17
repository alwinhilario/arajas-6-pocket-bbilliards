import { HOURLY_RATE } from "@/app/constants";
import type { TMembershipUser, TMembershipUserList } from "@/components/me/tables/types";
import { updateStorageItem } from "@/lib/localforage";

export const MEMBERSHIP_USERS_STORAGE_KEY = "membership_users";
export const MEMBERSHIP_DISCOUNT_STAMP_GOAL = 10;
export const MEMBERSHIP_FREE_HOUR_STAMP_GOAL = 15;

export type MembershipReward = "discount" | "free_hour";

export const getAvailableMembershipRewards = (user: TMembershipUser) => ({
  discounts: Math.max(
    0,
    Math.floor(user.stamps / MEMBERSHIP_DISCOUNT_STAMP_GOAL) -
      (user.discountClaimsSinceReset ?? user.redeemedDiscounts ?? 0),
  ),
  freeHours: Math.max(
    0,
    Math.floor(user.stamps / MEMBERSHIP_FREE_HOUR_STAMP_GOAL) -
      (user.freeHourClaimsSinceReset ?? user.redeemedFreeHours ?? 0),
  ),
});

export const applyMembershipRewardToRate = (rate: number, reward?: MembershipReward) => {
  if (reward === "discount") return Math.max(0, rate - 50);
  if (reward === "free_hour") return Math.max(0, rate - HOURLY_RATE);
  return rate;
};

const updateRewardClaim = async (
  userId: string,
  reward: MembershipReward,
  amount: 1 | -1,
  source: "table" | "membership",
) => {
  let updated = false;
  await updateStorageItem<TMembershipUserList>(
    MEMBERSHIP_USERS_STORAGE_KEY,
    (users) =>
      users.map((user) => {
        if (user.id !== userId) return user;
        if (amount === 1) {
          const available = getAvailableMembershipRewards(user);
          if (reward === "discount" && available.discounts <= 0) return user;
          if (reward === "free_hour" && available.freeHours <= 0) return user;
        }
        updated = true;
        return reward === "discount"
          ? {
              ...user,
              redeemedDiscounts: Math.max(0, (user.redeemedDiscounts || 0) + amount),
              discountClaimsSinceReset: Math.max(
                0,
                (user.discountClaimsSinceReset ?? user.redeemedDiscounts ?? 0) + amount,
              ),
              rewardAuditLog: updateRewardAuditLog(user, reward, amount, source),
            }
          : {
              ...user,
              redeemedFreeHours: Math.max(0, (user.redeemedFreeHours || 0) + amount),
              freeHourClaimsSinceReset: Math.max(
                0,
                (user.freeHourClaimsSinceReset ?? user.redeemedFreeHours ?? 0) + amount,
              ),
              rewardAuditLog: updateRewardAuditLog(user, reward, amount, source),
            };
      }),
    [],
  );
  return updated;
};

const updateRewardAuditLog = (
  user: TMembershipUser,
  reward: MembershipReward,
  amount: 1 | -1,
  source: "table" | "membership",
) => {
  const log = user.rewardAuditLog || [];
  if (amount === 1) return [...log, { reward, redeemedAt: new Date().toISOString(), source }];

  let rollbackIndex = -1;
  for (let index = log.length - 1; index >= 0; index -= 1) {
    if (log[index].reward === reward && log[index].source === source) {
      rollbackIndex = index;
      break;
    }
  }
  return rollbackIndex < 0 ? log : log.filter((_, index) => index !== rollbackIndex);
};

export const claimMembershipReward = (
  userId: string,
  reward: MembershipReward,
  source: "table" | "membership" = "membership",
) => updateRewardClaim(userId, reward, 1, source);

export const releaseMembershipReward = (
  userId: string,
  reward: MembershipReward,
  source: "table" | "membership" = "table",
) => updateRewardClaim(userId, reward, -1, source);

export const resetMembershipStamps = async (userId: string) => {
  let updated = false;
  await updateStorageItem<TMembershipUserList>(
    MEMBERSHIP_USERS_STORAGE_KEY,
    (users) =>
      users.map((user) => {
        if (user.id !== userId) return user;
        updated = true;
        return {
          ...user,
          stamps: 0,
          discountClaimsSinceReset: 0,
          freeHourClaimsSinceReset: 0,
        };
      }),
    [],
  );
  return updated;
};
