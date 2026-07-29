import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { TTableOptsData } from "./types";
import Payment from "../payment";
import { Textarea } from "@/components/ui/textarea";
import clsx from "clsx";

interface IProps {
  data: TTableOptsData;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: (callback: TTableOptsData) => void;
}

export default function TableTimeout({ data, setIsOpen, onConfirm }: IProps) {
  const [state, setState] = React.useState<TTableOptsData>();

  React.useEffect(() => {
    setState(data);
  }, [JSON.stringify(data)]);

  return (
    <div
      className='fixed bg-black/90 top-0 left-0 h-screen w-screen flex justify-center items-start cursor-pointer z-50 pt-60'
      onClick={() => {
        setIsOpen((prevState) => !prevState);
      }}
    >
      <Card
        className='p-5 cursor-default'
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className='text-base pb-5'>
          {!state?.out ? (
            <>
              Are you sure you want to <strong>Calculate</strong> and end the <strong>Open Time</strong>?
            </>
          ) : (
            <>
              Are you sure you want to <strong>Time out Table #{state?.value?.split("_")?.[1]}</strong>?
            </>
          )}
        </div>

        {state?.out && parseInt(state?.amount || "0") > 0 && (
          <>
            <div className='flex gap-2'>
              <div className='w-32 font-semibold'>Total Amount:</div>
              <div className='flex-1'>
                {parseInt(state?.amount) > 0 ? `PHP ${parseInt(`${state?.amount || "0"}`)}.00` : "--"}
              </div>
            </div>

            <div className='flex gap-2'>
              <div className='w-32 font-semibold'>Payment:</div>

              <div className='flex flex-col gap-2 flex-1'>
                {state?.mop?.map((item, key) => (
                  <div className='flex items-center gap-2' key={key}>
                    <div className='flex flex-col'>
                      <Input
                        placeholder='Amount'
                        className='!w-48'
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

            <div className='flex gap-2'>
              <div className='w-32 font-semibold'>Remarks:</div>

              <div className='flex-1'>
                <Textarea
                  placeholder='Type your message here.'
                  className='w-full'
                  value={state?.remarks}
                  onChange={(v) => {
                    // @ts-expect-error
                    setState((prevState) => ({
                      ...prevState,
                      remarks: v.target.value,
                    }));
                  }}
                />
              </div>
            </div>
          </>
        )}

        <div className='flex gap-2'>
          <Button
            size='xl'
            className={"cursor-pointer flex-1"}
            onClick={() => {
              onConfirm(state);
            }}
            disabled={state?.mop?.some(
              (x) => parseInt(x?.amount || "0") > 0 && (x?.label || "")?.length <= 0,
            )}
          >
            Confirm
          </Button>
          <Button
            size='xl'
            className={"cursor-pointer flex-1"}
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
