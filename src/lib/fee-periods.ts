export type FeePeriodType = "WEEKLY" | "MONTHLY";

export type FeePeriodWindow = {
  type: FeePeriodType;
  key: string;
  start: Date;
  end: Date;
};

function parseDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function getFeePeriodWindow(type: FeePeriodType, reference = new Date()): FeePeriodWindow {
  const date = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));

  if (type === "MONTHLY") {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    return { type, key: `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}`, start, end };
  }

  const mondayOffset = date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1;
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - mondayOffset);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { type, key: `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`, start, end };
}

export function getReferenceDate(value: string | null) {
  return parseDate(value || undefined);
}
