const JST_OFFSET_MINUTES = 9 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function toJstDate(date: Date): Date {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utcMs + JST_OFFSET_MINUTES * 60 * 1000);
}

export function getJstDateString(date = new Date()): string {
  const jst = toJstDate(date);
  const year = jst.getUTCFullYear();
  const month = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jst.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayJstDateString(date = new Date()): string {
  const jst = toJstDate(date);
  const yesterday = new Date(jst.getTime() - DAY_MS);
  const year = yesterday.getUTCFullYear();
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

