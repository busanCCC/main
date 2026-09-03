/** 출석 데이터는 항상 한국 시간으로 보여준다 */
const KST_TIME_ZONE = "Asia/Seoul";
const EMPTY_PLACEHOLDER = "-";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function format(formatter: Intl.DateTimeFormat, iso: string | null | undefined): string {
  if (!iso) return EMPTY_PLACEHOLDER;
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return EMPTY_PLACEHOLDER;
  return formatter.format(new Date(timestamp)).replace(/\.$/, "");
}

/** "2026. 03. 05. 11:00" */
export function formatKstDateTime(iso: string | null | undefined): string {
  return format(dateTimeFormatter, iso);
}

/** "2026. 03. 05." */
export function formatKstDate(iso: string | null | undefined): string {
  return format(dateFormatter, iso);
}

/** 파일명에 쓰는 "20260305" */
export function formatKstFileStamp(date: Date = new Date()): string {
  return dateFormatter
    .format(date)
    .replace(/[^0-9]/g, "");
}
