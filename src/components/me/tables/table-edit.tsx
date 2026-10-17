import React from "react";
import dayjs from "dayjs";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import { InputSelect } from "../../ui/input-select";
import { isEmpty } from "lodash";
import { HOURLY_RATE, INVENTORY_OPTS, MID_THRESHOLD_RATE } from "@/app/constants";
import { Textarea } from "@/components/ui/textarea";
import { TInventoryList, TMembershipUserList, TTableOptsData } from "./types";
import storage, { onStorageChange } from "@/lib/localforage";
import { capitalizeFirstLetter } from "../other-orders/other-order";
import { HiSparkles } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import clsx from "clsx";
import Payment from "../payment";
import { combineOutTime, getEffectiveOutTime, getTableDuration } from "./time-utils";
import {
  applyMembershipRewardToRate,
  claimMembershipReward,
  getAvailableMembershipRewards,
  MEMBERSHIP_USERS_STORAGE_KEY,
  releaseMembershipReward,
  resetMembershipStamps,
} from "@/lib/membership-rewards";
import type { MembershipReward } from "@/lib/membership-rewards";

dayjs.extend(duration);
dayjs.extend(customParseFormat);

interface IProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentTable?: TTableOptsData;
  onConfirm: (data: TTableOptsData) => void | Promise<void>;
  withPayment?: boolean;
}

export default function TableEdit({ setIsOpen, currentTable, onConfirm, withPayment = false }: IProps) {
  const currentTime = dayjs().format("YYYY/MM/DD HH:mm:ss");
  const [state, setState] = React.useState({
    id: "",
    in: "",
    out: "",
    remarks: "",
    status: "",
    membership_user_id: "",
    membership_user_name: "",
    membership_reward: undefined as MembershipReward | undefined,
    is_happy_hour: "",
    table_rates: "",
    hours: "",
    diff: {
      hours: 0,
      minutes: 0,
    },
    others: [
      {
        item: "",
        amount: "",
        remarks: "",
      },
    ],
    mop: [
      {
        label: "",
        amount: "",
        remarks: "",
      },
    ],
  });

  const [inventoryOpts, setInventoryOpts] = React.useState<TInventoryList>([]);
  const [membershipUsers, setMembershipUsers] = React.useState<TMembershipUserList>([]);
  const [saveError, setSaveError] = React.useState("");
  const [showMembershipSection, setShowMembershipSection] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      const data2 = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;
      setInventoryOpts(data2);
      setMembershipUsers((await storage.getItem<TMembershipUserList>(MEMBERSHIP_USERS_STORAGE_KEY)) || []);
    };

    void load();
    return onStorageChange(MEMBERSHIP_USERS_STORAGE_KEY, (key, value) => {
      if (Array.isArray(value)) setMembershipUsers(value as TMembershipUserList);
      else void load();
    });
  }, []);

  const d = getTableDuration(state.in, state.out);
  const ref = React.useRef(false);
  const hasExistingMembershipReward = Boolean(currentTable?.membership_reward);
  const selectedMember = membershipUsers.find((user) => user.id === state.membership_user_id);
  const availableRewards = selectedMember ? getAvailableMembershipRewards(selectedMember) : null;
  const membershipOptions = React.useMemo(
    () =>
      membershipUsers.map((user) => ({
        value: user.id,
        label: `${user.name}${user.phone ? ` · ${user.phone}` : ""} · ${user.stamps} stamps`,
      })),
    [membershipUsers],
  );

  const result = React.useMemo(() => {
    let $v = "";

    if (d.hours > 0) {
      $v = `${d.hours} hour${d.hours !== 1 ? "s" : ""}`;

      if (d.minutes !== 0) {
        $v = $v.concat(` and ${d.minutes} minute${d.minutes !== 1 ? "s" : ""}`);
      }
    } else {
      if (d.minutes !== 0) {
        $v = $v.concat(` ${d.minutes} minute${d.minutes !== 1 ? "s" : ""}`);
      }
    }

    return $v;
  }, [d]);

  React.useEffect(() => {
    if (ref.current) return;

    if (isEmpty(currentTable)) return;

    // @ts-expect-error
    setState((prevState) => ({
      ...prevState,
      in: currentTable?.in || currentTime,
      out:
        currentTable?.in && currentTable?.out
          ? getEffectiveOutTime(currentTable.in, currentTable.out).format("YYYY/MM/DD HH:mm:ss")
          : currentTable?.out,
      id: currentTable?.id,
      mop: currentTable?.mop,
      others: currentTable?.others,
      value: currentTable?.value,
      hours: currentTable?.hours,
      diff: currentTable?.diff,
      table_rates: currentTable?.table_rates,
      remarks: currentTable?.remarks,
      membership_user_id: currentTable?.membership_reward ? currentTable.membership_user_id || "" : "",
      membership_user_name: currentTable?.membership_reward ? currentTable.membership_user_name || "" : "",
      membership_reward: currentTable?.membership_reward,
      is_happy_hour: currentTable?.is_happy_hour,
      status: currentTable?.status,
    }));

    ref.current = true;
  }, [currentTable, currentTime]);

  React.useEffect(() => {
    if (isEmpty(currentTable)) return;

    setState((prevState) => ({
      ...prevState,
      hours: result,
      diff: { hours: d.hours, minutes: d.minutes },
      table_rates: currentTable?.table_rates,
    }));
  }, [result]);

  React.useEffect(() => {
    if (withPayment) return;

    const t = setInterval(() => {
      setState((prevState) => {
        const newInTime = dayjs(prevState?.in).add(1, "second").format("YYYY/MM/DD HH:mm:ss");
        const newOutTime = dayjs(prevState?.out).add(1, "second").format("YYYY/MM/DD HH:mm:ss");

        return {
          ...prevState,
          in: newInTime,
          out: prevState?.out?.length > 0 ? newOutTime : prevState?.out,
        };
      });
    }, 1000);

    return () => {
      clearInterval(t);
    };
  }, []);

  return (
    <div
      className='fixed bg-black/90 top-0 left-0 h-screen w-screen flex justify-center items-start cursor-pointer z-50 max-h-screen overflow-scroll pt-10'
      onClick={() => {
        setIsOpen((prevState) => !prevState);
      }}
    >
      <Card
        className='min-w-md p-5 cursor-default'
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className='flex flex-col gap-3 flex-1'>
          <div className='space-y-3'>
            {!withPayment && (
              <div className='rounded-md border p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-semibold'>Membership</span>
                  <Button
                    type='button'
                    size='sm'
                    variant='ghost'
                    onClick={() => setShowMembershipSection((visible) => !visible)}
                    aria-expanded={showMembershipSection}
                  >
                    {showMembershipSection ? "Hide membership" : "Show membership"}
                  </Button>
                </div>
                {showMembershipSection && (
                  <div className='mt-2 space-y-2'>
                    <label className='block space-y-1'>
                      {/* <span className='font-semibold'>Membership user</span> */}
                      <InputSelect
                        value={state.membership_user_id}
                        options={membershipOptions}
                        placeholder='Select membership user'
                        searchPlaceholder='Search membership users...'
                        emptyMessage='No membership user found.'
                        allowCreate={false}
                        clearOnReselect
                        disabled={hasExistingMembershipReward}
                        onValueChange={(userId) => {
                          const member = membershipUsers.find((user) => user.id === userId);
                          setState((previous) => ({
                            ...previous,
                            membership_user_id: member?.id || "",
                            membership_user_name: member?.name || "",
                            membership_reward: undefined,
                          }));
                        }}
                      />
                    </label>
                    {selectedMember && (
                      <div className='space-y-2'>
                        {/* <p className='text-sm font-medium'>{selectedMember.name}</p> */}
                        {/* <p className='text-sm text-muted-foreground'>
                          {selectedMember.stamps} {selectedMember.stamps === 1 ? "stamp" : "stamps"}
                        </p> */}
                        <div className='flex flex-wrap gap-2'>
                          <Button
                            type='button'
                            size='sm'
                            variant={state.membership_reward === "discount" ? "default" : "outline"}
                            disabled={
                              hasExistingMembershipReward ||
                              !availableRewards ||
                              availableRewards.discounts <= 0 ||
                              state.membership_reward === "discount"
                            }
                            onClick={() =>
                              setState((previous) => ({ ...previous, membership_reward: "discount" }))
                            }
                          >
                            Discount ₱50
                          </Button>
                          <Button
                            type='button'
                            size='sm'
                            variant={state.membership_reward === "free_hour" ? "default" : "outline"}
                            disabled={
                              hasExistingMembershipReward ||
                              !availableRewards ||
                              availableRewards.freeHours <= 0 ||
                              state.membership_reward === "free_hour"
                            }
                            onClick={() =>
                              setState((previous) => ({ ...previous, membership_reward: "free_hour" }))
                            }
                          >
                            Free hour
                          </Button>
                        </div>
                      </div>
                    )}
                    {state.membership_reward && (
                      <div className='rounded bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-900'>
                        {hasExistingMembershipReward ? "Claimed: " : "Selected reward: "}
                        {state.membership_reward === "discount" ? "₱50 discount" : "Free hour"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className='text-lg font-black pb-1'>IN:</div>

            <Input
              type='time'
              id='time-picker-optional'
              step='1'
              defaultValue={currentTime}
              value={dayjs(state?.in).format("HH:mm:ss")}
              className='h-14 !text-4xl appearance-none bg-gray-100 font-bold [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
              onChange={(e) =>
                setState((prevState) => ({
                  ...prevState,
                  in: `${dayjs(prevState.in).format("YYYY/MM/DD")} ${e.target.value}`,
                }))
              }
            />

            <div className='flex gap-2'>
              <Button
                // size='sm'
                className={"cursor-pointer bg-gray-700"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.in).add(2, "minute").format("YYYY/MM/DD HH:mm:ss");
                    const newOut = dayjs(prevState?.out).add(2, "minute").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      in: newTime,
                      out: prevState?.out && prevState?.out?.length > 0 ? newOut : prevState?.out,
                    };
                  });
                }}
              >
                +2 minutes
              </Button>
              <Button
                // size='sm'
                className={"cursor-pointer bg-gray-700"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.in).add(3, "minute").format("YYYY/MM/DD HH:mm:ss");
                    const newOut = dayjs(prevState?.out).add(3, "minute").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      in: newTime,
                      out: prevState?.out && prevState?.out?.length > 0 ? newOut : prevState?.out,
                    };
                  });
                }}
              >
                +3 minutes
              </Button>
              <Button
                // size='sm'
                className={"cursor-pointer bg-gray-700"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.in).add(5, "minute").format("YYYY/MM/DD HH:mm:ss");
                    const newOut = dayjs(prevState?.out).add(5, "minute").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      in: newTime,
                      out: prevState?.out && prevState?.out?.length > 0 ? newOut : prevState?.out,
                    };
                  });
                }}
              >
                +5 minutes
              </Button>
              <Button
                // size='sm'
                // variant={"warning"}
                className={clsx("cursor-pointer bg-flex gap-2 !bg-orange-500/80 text-white font-bold", {
                  " !bg-orange-50 border-orange-400 text-orange-400": state?.is_happy_hour,
                })}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = !state?.is_happy_hour
                      ? dayjs().set("hour", 8).set("minute", 0).set("second", 0).format("YYYY/MM/DD HH:mm:ss")
                      : dayjs().format("YYYY/MM/DD HH:mm:ss");
                    const newOut = !state?.is_happy_hour
                      ? dayjs()
                          .set("hour", 15)
                          .set("minute", 0)
                          .set("second", 0)
                          .format("YYYY/MM/DD HH:mm:ss")
                      : "";

                    return {
                      ...prevState,
                      in: newTime,
                      out: newOut,
                      is_happy_hour: !state?.is_happy_hour,
                    };
                  });
                }}
              >
                <HiSparkles className='h-3 w-3' />
                <div>Happy hour</div>
                {state?.is_happy_hour && <IoClose />}
              </Button>
            </div>
          </div>

          <div className='space-y-3 pt-5'>
            <div className='text-lg font-black pb-1'>OUT:</div>

            <Input
              type='time'
              id='time-picker-optional'
              step='1'
              defaultValue=''
              value={dayjs(state?.out).format("HH:mm:ss")}
              onChange={(e) =>
                setState((prevState) => ({
                  ...prevState,
                  out: combineOutTime(prevState.in, e.target.value),
                }))
              }
              className='h-14 !text-4xl appearance-none bg-gray-100 font-bold [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
            />

            <div className='flex gap-2'>
              <Button
                // size='sm'
                className={"cursor-pointer bg-gray-700"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.in).add(1, "hour").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      out: newTime,
                    };
                  });
                }}
              >
                1 hour
              </Button>
              <Button
                // size='sm'
                className={"cursor-pointer bg-gray-700"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.in).add(2, "hour").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      out: newTime,
                    };
                  });
                }}
              >
                2 hours
              </Button>
              <Button
                // size='sm'
                className={"cursor-pointer bg-gray-700"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.in).add(3, "hour").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      out: newTime,
                    };
                  });
                }}
              >
                3 hours
              </Button>
            </div>
            <div className='flex gap-2 !-mt-1.5'>
              <Button
                // size='sm'
                className={"cursor-pointer bg-gray-500"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.out).add(2, "minute").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      out: newTime,
                    };
                  });
                }}
              >
                +2 minutes
              </Button>
              <Button
                // size='sm'
                className={"cursor-pointer bg-gray-500"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.out).add(3, "minute").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      out: newTime,
                    };
                  });
                }}
              >
                +3 minutes
              </Button>
              <Button
                // size='sm'
                className={"cursor-pointer bg-gray-500"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.out).add(5, "minute").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      out: newTime,
                    };
                  });
                }}
              >
                +5 minutes
              </Button>
              <Button
                // size='sm'
                className={"cursor-pointer bg-gray-500"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.out ? prevState?.out : prevState?.in)
                      .add(30, "minute")
                      .format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      out: newTime,
                    };
                  });
                }}
              >
                +30 minutes
              </Button>
            </div>
          </div>
        </div>

        <div className='py-5'>
          <hr />
        </div>

        <div className='space-y-3'>
          <div className='flex gap-2'>
            <div className='w-24 font-semibold'>Others:</div>

            <div className='space-y-4'>
              {state?.others?.map((item, key) => {
                return (
                  <div className='flex items-center gap-2' key={key}>
                    <InputSelect
                      className='!w-80'
                      value={item?.item}
                      options={inventoryOpts}
                      onAddClick={async (add) => {
                        const v = [
                          ...(inventoryOpts || []),
                          {
                            id: dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS"),
                            label: capitalizeFirstLetter(add),
                            value: dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS"),
                          },
                        ];

                        await storage.setItem("inventory_list", v);
                        setInventoryOpts(v);
                      }}
                      onValueChange={(v) => {
                        // @ts-expect-error
                        setState((prevState) => ({
                          ...prevState,
                          others: prevState?.others?.map((x, y) => {
                            const getAmount = inventoryOpts?.find((x) => x?.value === v);

                            if (y === key) {
                              return {
                                ...x,
                                item: inventoryOpts?.find((xxx) => xxx?.value === v)?.label,
                                amount: (() => {
                                  if (getAmount?.amount !== x?.amount && getAmount?.amount) {
                                    return getAmount?.amount || "";
                                  }

                                  return x?.amount || "";
                                })(),
                              };
                            }

                            return x;
                          }),
                        }));
                      }}
                    />
                    <Input
                      placeholder='Amount'
                      className='w-24'
                      type='number'
                      value={item?.amount}
                      onChange={(v) => {
                        setState((prevState) => ({
                          ...prevState,
                          others: prevState?.others?.map((x, y) => {
                            if (y === key) {
                              return {
                                ...x,
                                amount: v.target.value,
                              };
                            }

                            return x;
                          }),
                        }));
                      }}
                    />
                    {state?.others?.length === key + 1 && (
                      <Button
                        size={"xl"}
                        className='w-20 font-bold cursor-pointer'
                        onClick={() => {
                          setState((prevState) => ({
                            ...prevState,
                            others: [
                              ...prevState?.others,
                              {
                                item: "",
                                amount: "",
                                remarks: "",
                              },
                            ],
                          }));
                        }}
                      >
                        <span>Add</span>
                      </Button>
                    )}
                    {state?.others?.length !== key + 1 && (
                      <Button
                        size={"xl"}
                        variant='destructive'
                        className='w-20 font-bold cursor-pointer'
                        onClick={() => {
                          setState((prevState) => ({
                            ...prevState,
                            others: prevState?.others?.filter((x, y) => y !== key),
                          }));
                        }}
                      >
                        <span>Remove</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* {withPayment && (
            <>
              <br />

              <div className='flex gap-2'>
                <div className='w-24 font-semibold'>Payment:</div>

                <div className='flex flex-col flex-1'>
                  {state?.mop?.map((item, key) => (
                    <div className='flex items-center gap-2' key={key}>
                      <div className='flex flex-col'>
                        <Input
                          placeholder='Amount'
                          className='!w-80'
                          type='number'
                          value={item?.amount}
                          onChange={(v) => {
                            // @ts-expect-error
                            setState((prevState) => ({
                              ...prevState,
                              mop: prevState?.mop?.map((x, y) => {
                                if (y === key) {
                                  return {
                                    ...x,
                                    amount: v.target.value,
                                  };
                                }

                                return x;
                              }),
                            }));
                          }}
                        />
                        <small className='pt-px text-red-500 opacity-0'>RA</small>
                      </div>
                      <div className='flex flex-col'>
                        <Payment
                          mop={item?.label}
                          className={clsx({
                            "border-red-500":
                              parseInt(item?.amount || "0") > 0 && (item?.label || "")?.length <= 0,
                          })}
                          onPayClick={(type) => {
                            // @ts-expect-error
                            setState((prevState) => ({
                              ...prevState,
                              mop: prevState?.mop?.map((x, y) => {
                                if (y === key) {
                                  return {
                                    ...x,
                                    label: type,
                                  };
                                }

                                return x;
                              }),
                            }));
                          }}
                        />
                        {parseInt(item?.amount || "0") > 0 && (item?.label || "")?.length <= 0 ? (
                          <small className='pt-px text-red-500'>MOP is required.</small>
                        ) : (
                          <small className='pt-px text-red-500 opacity-0'>RA</small>
                        )}
                      </div>

                      <div className='flex flex-col'>
                        {state?.mop?.length === key + 1 && (
                          <Button
                            size={"xl"}
                            className='w-20 font-bold cursor-pointer'
                            onClick={() => {
                              // @ts-expect-error
                              setState((prevState) => ({
                                ...prevState,
                                mop: [
                                  ...prevState?.mop,
                                  {
                                    label: "",
                                    amount: "",
                                    remarks: "",
                                  },
                                ],
                              }));
                            }}
                          >
                            <span>Add</span>
                          </Button>
                        )}
                        {state?.mop?.length !== key + 1 && (
                          <Button
                            variant='destructive'
                            size={"xl"}
                            className='w-20 font-bold cursor-pointer'
                            onClick={() => {
                              // @ts-expect-error
                              setState((prevState) => ({
                                ...prevState,
                                mop: prevState?.mop?.filter((x, y) => y !== key),
                              }));
                            }}
                          >
                            <span>Remove</span>
                          </Button>
                        )}
                        <small className='pt-px text-red-500 opacity-0'>RA</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )} */}

          <div className='flex gap-2'>
            <div className='w-24 font-semibold'>Remarks:</div>
            <div className='flex-1'>
              <Textarea
                placeholder='Type your message here.'
                className='w-full'
                value={state?.remarks}
                onChange={(v) => {
                  setState((prevState) => ({
                    ...prevState,
                    remarks: v.target.value,
                  }));
                }}
              />
            </div>
          </div>
        </div>
        <br />
        <div className='flex flex-wrap items-center gap-2 pb-2 text-base'>
          <div className='w-24 font-semibold'>Total Hours:</div>
          <div className=''>{result || "0"}</div>
        </div>

        {saveError && (
          <p role='alert' className='pb-2 text-sm font-semibold text-red-600'>
            {saveError}
          </p>
        )}

        <div className='flex gap-2'>
          <Button
            size='xl'
            className={"flex-1 cursor-pointer"}
            onClick={async () => {
              setSaveError("");
              const getBaseAmount = () => {
                const d = getTableDuration(state.in, state.out);

                let value;
                const hourlyRate = d.hours * HOURLY_RATE;
                value = hourlyRate;

                const midRate = d.minutes;

                if (midRate >= 30 && midRate >= 30 + MID_THRESHOLD_RATE) {
                  value = value + 150;
                } else if (midRate > MID_THRESHOLD_RATE && midRate <= 30) {
                  value = value + 100;
                } else if (midRate >= 30) {
                  value = value + 100;
                }

                return value;
              };

              const totalOthers = state?.others?.reduce(
                (acc, item) => acc + (Number.parseInt(item?.amount || "0", 10) || 0),
                0,
              );
              const baseAmount = state?.is_happy_hour ? 750 : getBaseAmount();
              const $amt = applyMembershipRewardToRate(baseAmount, state.membership_reward);
              const $amount = $amt > 0 || totalOthers > 0 ? `${($amt || 0) + (totalOthers || 0)}` : "";
              const reward = state.membership_reward;
              const memberId = state.membership_user_id || currentTable?.membership_user_id || "";
              let claimedReward = false;

              try {
                if (reward && !memberId) {
                  setSaveError("Select a membership user before applying a reward.");
                  return;
                }

                if (reward && !currentTable?.membership_reward && !withPayment) {
                  claimedReward = await claimMembershipReward(memberId, reward, "table");
                  if (!claimedReward) {
                    setSaveError("This member no longer has that reward available. Refresh and try again.");
                    return;
                  }
                }

                await onConfirm({
                  ...state,
                  membership_user_id: memberId,
                  membership_user_name:
                    selectedMember?.name ||
                    state.membership_user_name ||
                    currentTable?.membership_user_name ||
                    "",
                  membership_reward: reward || currentTable?.membership_reward,
                  amount: $amount,
                  table_rates: `${$amt}`,
                  id: state?.id || dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS"),
                  status: state?.status || "Active",
                });
                claimedReward = false;
                if (reward === "free_hour" && !withPayment) {
                  try {
                    const stampsReset = await resetMembershipStamps(memberId);
                    if (!stampsReset) {
                      setSaveError("The table was saved, but the member's stamps could not be reset.");
                    }
                  } catch (error) {
                    console.error("The table was saved, but membership stamps could not be reset.", error);
                    setSaveError("The table was saved, but the member's stamps could not be reset.");
                  }
                }
              } catch (error) {
                if (claimedReward && reward) {
                  await releaseMembershipReward(memberId, reward);
                }
                console.error("Unable to save the table session.", error);
                setSaveError("Unable to save the session. Please try again.");
              }
            }}
          >
            Confirm
          </Button>
          <Button
            size='xl'
            className={"flex-1 cursor-pointer"}
            variant={"outline"}
            onClick={() => {
              setIsOpen((prevState) => !prevState);
            }}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
