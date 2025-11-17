import dayjs from "dayjs";

export function formatIsoDate(
  iso?: string | null,
  fallbackIso?: string,
  fmt = "MMM D, YYYY"
) {
  const value = iso ?? fallbackIso ?? undefined;
  const d = dayjs(value);
  if (!d.isValid()) return dayjs(fallbackIso ?? undefined).format(fmt);
  return d.format(fmt);
}

export function startLabel(iso?: string | null, fallbackIso?: string) {
  const d = dayjs(iso ?? fallbackIso);
  const delta = d.diff(dayjs(), "day");
  if (delta > 0) return `Starts in ${delta} day${delta === 1 ? "" : "s"}`;
  return `Started ${Math.abs(delta)} day${
    Math.abs(delta) === 1 ? "" : "s"
  } ago`;
}

export function remainingDays(endIso?: string | null, fallbackIso?: string) {
  const e = dayjs(endIso ?? fallbackIso);
  const diff = e.diff(dayjs(), "day");
  return Math.max(0, diff);
}
