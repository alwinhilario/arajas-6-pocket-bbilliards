"use client";

import dayjs from "dayjs";
import React from "react";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);
interface TState {
  date: {
    date_from: Date;
    date_to: Date;
  };
}

interface IContextProps {
  value: TState;
  setValue: React.Dispatch<React.SetStateAction<TState>>;
}

interface IProviderProps {
  children: React.ReactNode;
}

const STATE = {
  date: {
    date_from: dayjs().set("hour", 8).set("minute", 0).set("second", 0),
    date_to: dayjs().add(1, "day").set("hour", 8).set("minute", 0).set("second", 0),
  },
};
export const SESSION_CONTEXT = React.createContext<IContextProps>(STATE);

export const SessionProvider = ({ children }: IProviderProps) => {
  const [value, setValue] = React.useState<TState>(STATE);

  const $v = React.useMemo(() => {
    const isPastOrEqual8AM = dayjs().isSameOrAfter(
      dayjs().hour(8).minute(0).second(0).millisecond(0),
      "second",
    );

    return {
      ...value,
      date: {
        date_from: (() => {
          if (isPastOrEqual8AM) {
            return dayjs().set("hour", 8).set("minute", 0).set("second", 0);
          }

          return dayjs().subtract(1, "day").set("hour", 8).set("minute", 0).set("second", 0);
        })(),
        date_to: (() => {
          if (isPastOrEqual8AM) {
            return dayjs().add(1, "day").set("hour", 8).set("minute", 0).set("second", 0);
          }

          return dayjs().set("hour", 8).set("minute", 0).set("second", 0);
        })(),
      },
    };
  }, [value]);

  return (
    <SESSION_CONTEXT.Provider
      value={{
        value: $v,
        setValue,
      }}
    >
      {children}
    </SESSION_CONTEXT.Provider>
  );
};
