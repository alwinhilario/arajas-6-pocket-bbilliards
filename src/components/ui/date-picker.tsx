"use client";

import * as React from "react";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import dayjs from "dayjs";
import clsx from "clsx";

interface IProps {
  value: Date;
  className: string;
  buttonProps: any;
}

export function DatePicker({ value, className, buttonProps = {} }: IProps) {
  const [date, setDate] = React.useState<Date>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant='outline'
            id='date-picker-simple'
            className={clsx("justify-start font-normal", className)}
            {...buttonProps}
          >
            {date ? dayjs(date).format("MMM DD, YYYY") : <span>Pick a date</span>}
          </Button>
        }
      />
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar mode='single' selected={date} onSelect={setDate} defaultMonth={date} />
      </PopoverContent>
    </Popover>
  );
}
