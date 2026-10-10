import dayjs from "dayjs";

export const getEffectiveOutTime = (inValue: string, outValue: string) => {
  const inTime = dayjs(inValue);
  const outTime = dayjs(outValue);

  if (
    inTime.isValid() &&
    outTime.isValid() &&
    outTime.isBefore(inTime) &&
    outTime.isSame(inTime, "day")
  ) {
    return outTime.add(1, "day");
  }

  return outTime;
};

export const getTableDuration = (inValue: string, outValue: string) => {
  const inTime = dayjs(inValue);
  const outTime = getEffectiveOutTime(inValue, outValue);

  if (!inTime.isValid() || !outTime.isValid()) {
    return { hours: 0, minutes: 0, totalMinutes: 0 };
  }

  const totalMinutes = Math.max(0, outTime.diff(inTime, "minute"));
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  };
};

export const combineOutTime = (inValue: string, timeValue: string) => {
  const inTime = dayjs(inValue);
  if (!inTime.isValid() || !timeValue) return "";

  const [hours, minutes, seconds = "00"] = timeValue.split(":");
  let outTime = inTime
    .hour(Number(hours))
    .minute(Number(minutes))
    .second(Number(seconds))
    .millisecond(0);

  if (outTime.isBefore(inTime)) outTime = outTime.add(1, "day");
  return outTime.format("YYYY/MM/DD HH:mm:ss");
};
