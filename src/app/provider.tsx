"use client";

import dayjs from "dayjs";
import React from "react";

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

  return (
    <SESSION_CONTEXT.Provider
      value={{
        value,
        setValue,
      }}
    >
      {children}
    </SESSION_CONTEXT.Provider>
  );
};
