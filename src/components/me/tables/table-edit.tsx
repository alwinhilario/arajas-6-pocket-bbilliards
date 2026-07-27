import React from "react";
import dayjs from "dayjs";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import { InputSelect } from "../../ui/input-select";
import { isEmpty } from "lodash";
import { HOURLY_RATE, INVENTORY_OPTS, MID_THRESHOLD_RATE, NAME_OPTS } from "@/app/constants";
import Payment from "../payment";
import { Textarea } from "@/components/ui/textarea";
import { TInventoryList, TOptions, TTableOptsData } from "./types";
import storage from "@/lib/localforage";
import { capitalizeFirstLetter } from "../other-orders/other-order";

dayjs.extend(duration);
dayjs.extend(customParseFormat);

interface IProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentTable?: TTableOptsData;
  onConfirm: (data: TTableOptsData) => void;
}

export default function TableEdit({ setIsOpen, currentTable, onConfirm }: IProps) {
  const currentTime = dayjs().format("YYYY/MM/DD HH:mm:ss");
  const [state, setState] = React.useState({
    id: "",
    in: "",
    out: "",
    remarks: "",
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

  const [nameOpts, setNameOpts] = React.useState<TOptions>([]);
  const [inventoryOpts, setInventoryOpts] = React.useState<TOptions>([]);

  React.useEffect(() => {
    const load = async () => {
      const data1 = ((await storage.getItem("name_list")) || NAME_OPTS) as TOptions;
      const data2 = ((await storage.getItem("inventory_list")) || INVENTORY_OPTS) as TInventoryList;

      setNameOpts(data1);
      setInventoryOpts(data2);
    };

    load();
  }, []);

  const inTime = dayjs(state.in);
  const outTime = dayjs(state.out);
  const diff = outTime.diff(inTime);
  const d = dayjs.duration(diff);
  const ref = React.useRef(false);

  const result = React.useMemo(() => {
    let $v = "";

    if (d.hours() > 0) {
      $v = `${d.hours()} hour${d.hours() !== 1 ? "s" : ""}`;

      if (d.minutes() !== 0) {
        $v = $v.concat(` and ${d.minutes()} minute${d.minutes() !== 1 ? "s" : ""}`);
      }
    } else {
      if (d.minutes() !== 0) {
        $v = $v.concat(` ${d.minutes()} minute${d.minutes() !== 1 ? "s" : ""}`);
      }
    }

    return $v;
  }, [d]);

  React.useEffect(() => {
    if (ref.current) return;

    if (isEmpty(currentTable)) return;

    setState((prevState) => ({
      ...prevState,
      in: currentTable?.in || currentTime,
      out: currentTable?.out,
      id: currentTable?.id,
      mop: currentTable?.mop,
      others: currentTable?.others,
      value: currentTable?.value,
      hours: currentTable?.hours,
      diff: currentTable?.diff,
      table_rates: currentTable?.table_rates,
      remarks: currentTable?.remarks,
    }));

    ref.current = true;
  }, [currentTable, currentTime]);

  console.log({ state });

  React.useEffect(() => {
    if (isEmpty(currentTable)) return;

    setState((prevState) => ({
      ...prevState,
      hours: result,
      diff: {
        hours: d.hours(),
        minutes: d.minutes(),
      },
      table_rates: currentTable?.table_rates,
    }));
  }, [result]);

  React.useEffect(() => {
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
      className='fixed bg-black/90 top-0 left-0 h-screen w-screen flex justify-center items-center cursor-pointer z-50 max-h-screen overflow-scroll p-20'
      onClick={() => {
        setIsOpen((prevState) => !prevState);
      }}
    >
      <Card
        className='min-w-md p-5 cursor-default mt-28'
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className='flex flex-col gap-3 flex-1'>
          <div className='space-y-3'>
            <div className='text-lg font-black pb-1'>IN:</div>

            <Input
              type='time'
              id='time-picker-optional'
              step='1'
              defaultValue={currentTime}
              readOnly
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
                size='sm'
                variant={"outline"}
                className={"cursor-pointer bg-white hover:!bg-transparent"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.in).add(2, "minute").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      in: newTime,
                    };
                  });
                }}
              >
                +2 minutes
              </Button>
              <Button
                size='sm'
                variant={"outline"}
                className={"cursor-pointer bg-white hover:!bg-transparent"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.in).add(3, "minute").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      in: newTime,
                    };
                  });
                }}
              >
                +3 minutes
              </Button>
              <Button
                size='sm'
                variant={"outline"}
                className={"cursor-pointer bg-white hover:!bg-transparent"}
                onClick={() => {
                  setState((prevState) => {
                    const newTime = dayjs(prevState?.in).add(5, "minute").format("YYYY/MM/DD HH:mm:ss");

                    return {
                      ...prevState,
                      in: newTime,
                    };
                  });
                }}
              >
                +5 minutes
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
              readOnly
              value={dayjs(state?.out).format("HH:mm:ss")}
              onChange={(e) =>
                setState((prevState) => ({
                  ...prevState,
                  out: `${dayjs(prevState.out).format("YYYY/MM/DD")} ${e.target.value}`,
                }))
              }
              className='h-14 !text-4xl appearance-none bg-gray-100 font-bold [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
            />

            <div className='flex gap-2'>
              <Button
                size='sm'
                variant={"outline"}
                className={"cursor-pointer bg-white hover:!bg-transparent"}
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
                size='sm'
                variant={"outline"}
                className={"cursor-pointer bg-white hover:!bg-transparent"}
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
                size='sm'
                variant={"outline"}
                className={"cursor-pointer bg-white hover:!bg-transparent"}
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
              <Button
                size='sm'
                variant={"outline"}
                className={"cursor-pointer bg-white hover:!bg-transparent"}
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

        <br />

        <div className='space-y-3'>
          <div className='flex gap-2 pb-2'>
            <div className='w-24 font-semibold'>Total Hours:</div>
            <div className=''>{result || "0"}</div>
          </div>

          <div className='flex gap-2'>
            <div className='w-24 font-semibold'>Others:</div>

            <div className='space-y-1'>
              {state?.others?.map((item, key) => {
                return (
                  <div className='flex items-center gap-2' key={key}>
                    <InputSelect
                      className='!w-48'
                      value={item?.item}
                      options={inventoryOpts}
                      onAddClick={async (add) => {
                        const v = [
                          ...(inventoryOpts || []),
                          {
                            label: capitalizeFirstLetter(add),
                            value: capitalizeFirstLetter(add),
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
                                item: v,
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

          <div className='py-2'>
            <hr />
          </div>

          {state?.out && (
            <div className='flex gap-2'>
              <div className='w-24 font-semibold'>Payment:</div>

              <div className='flex flex-col gap-2'>
                {state?.mop?.map((item, key) => (
                  <div className='flex items-center gap-2' key={key}>
                    <Input
                      placeholder='Amount'
                      className='!w-48'
                      type='number'
                      value={item?.amount}
                      onChange={(v) => {
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
                    <Payment
                      mop={item?.label}
                      onPayClick={(type) => {
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

                    {state?.mop?.length === key + 1 && (
                      <Button
                        className='w-20 font-bold cursor-pointer'
                        onClick={() => {
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
                        className='w-20 font-bold cursor-pointer'
                        onClick={() => {
                          setState((prevState) => ({
                            ...prevState,
                            mop: prevState?.mop?.filter((x, y) => y !== key),
                          }));
                        }}
                      >
                        <span>Remove</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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

        <div className='flex gap-2'>
          <Button
            size='xl'
            className={"flex-1 cursor-pointer"}
            onClick={() => {
              const getAmount = () => {
                const inTime = dayjs(state.in);
                const outTime = dayjs(state.out);
                const diff = outTime.diff(inTime);
                const d = dayjs.duration(diff);

                let value;
                const hourlyRate = d?.hours() * HOURLY_RATE;
                value = hourlyRate;

                const midRate = d?.minutes();

                if (midRate >= 30 && midRate >= 30 + MID_THRESHOLD_RATE) {
                  value = value + 150;
                } else if (midRate > MID_THRESHOLD_RATE && midRate <= 30) {
                  value = value + 100;
                } else if (midRate >= 30) {
                  value = value + 100;
                }

                return value;
              };

              const totalOthers = state?.others?.reduce((acc, item) => acc + parseInt(item?.amount), 0);

              onConfirm({
                ...state,
                amount:
                  getAmount() > 0 || totalOthers > 0 ? `${(getAmount() || 0) + (totalOthers || 0)}` : "",
                table_rates: `${getAmount()}`,
                id: state?.id || dayjs().format("YYYY/MM/DD HH:mm:ss.SSSS"),
                status: state?.status || "Active",
              });
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
