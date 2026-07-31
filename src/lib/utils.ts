import { clsx, type ClassValue } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.extend(customParseFormat);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface IProps {
  object: any;
  propertyName: string;
  filter_from: Date;
  filter_to: Date;
}

export const filterObject = ({ object = [], filter_from, filter_to, propertyName }: IProps) => {
  const filteredData = object
    ?.filter((item) => item?.[propertyName])
    .filter((item) => {
      return dayjs(item?.[propertyName]).isBetween(filter_from, filter_to, "second", "[]");
    })
    .sort((a, b) => dayjs(a?.[propertyName]).diff(dayjs(b?.[propertyName])));

  return filteredData;
};

export const getTotalAmount = (arr = [], propertyName = "amount") => {
  return arr?.reduce((acc, item) => acc + parseInt(item?.[propertyName] || "0"), 0);
};

export const convertCurrency = (amount = 0) => {
  return amount
    .toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      currencyDisplay: "code",
    })
    .replace(/\u00A0/g, " "); // Replace non-breaking space with normal space
};
