import React from "react";
import { SESSION_CONTEXT } from "@/app/provider";
import { Input } from "../ui/input";
import { DatePicker } from "../ui/date-picker";
import dayjs from "dayjs";

export default function MonthSelection() {
  const { value, setValue } = React.useContext(SESSION_CONTEXT);

  return (
    <div className='text-gray-600'>
      <div className='text-sm font-medium'>For the day of:</div>
      <div className='text-2xl font-bold'>{dayjs(value?.date?.date_from).format("MMM DD, YYYY hh:mm A")}</div>
      <div className='text-2xl font-bold'>{dayjs(value?.date?.date_to).format("MMM DD, YYYY hh:mm A")}</div>

      {/* <div className='flex bg-white p-2 gap-2'>
        <div>
          <DatePicker
            buttonProps={{
              size: "xl",
            }}
            className='text-xl font-bold cursor-pointer'
            value={value?.date?.date}
          />
        </div>

        <Input
          type='time'
          className='!h-11 !text-xl font-bold cursor-pointer'
          placeholder='Time from'
          value={value?.date?.time_from}
          defaultValue={value?.date?.time_from}
        />
        <Input
          type='time'
          placeholder='Time to'
          value={value?.date?.time_to}
          defaultValue={value?.date?.time_to}
          className='!h-11 !text-xl font-bold cursor-pointer'
        />
      </div> */}
    </div>
  );
}
