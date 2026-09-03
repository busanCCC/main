/**
 * 의존성 없는 최소 XLSX(Office Open XML) 생성기.
 *
 * 관리자 내보내기에 필요한 기능(다중 시트, 굵은 머리글, 문자/숫자 셀, 열 너비,
 * 머리글 고정 + 자동 필터)만 담았다. 스프레드시트 라이브러리를 추가하지 않기 위해
 * ZIP(무압축 store) 컨테이너와 시트 XML을 직접 만든다.
 */

export type CellValue = string | number | null | undefined;

export interface SheetData {
  name: string;
  /** 첫 행은 머리글로 취급되어 굵게 표시되고 고정된다 */
  rows: CellValue[][];
  /** 열 너비(문자 수). 생략하면 엑셀 기본 너비를 사용한다 */
  columnWidths?: number[];
}

// --- ZIP 포맷 상수 (PKZIP APPNOTE 4.3) ---
const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50;
const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const END_OF_CENTRAL_DIR_SIZE = 22;
const ZIP_VERSION = 20;
const UTF8_FILENAME_FLAG = 0x0800;
const STORE_NO_COMPRESSION = 0;
const DOS_EPOCH_YEAR = 1980;

/** 엑셀 시트 이름 제한 */
const MAX_SHEET_NAME_LENGTH = 31;
const INVALID_SHEET_NAME_CHARS = /[\\/?*[\]:]/g;

/** XML 1.0이 허용하지 않는 제어 문자 (탭/개행/캐리지리턴 제외) */
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

/** styles.xml의 cellXfs 인덱스 */
const STYLE_HEADER = 1;

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let crc = -1;
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function toDosDateTime(date: Date): { time: number; date: number } {
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      ((date.getFullYear() - DOS_EPOCH_YEAR) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  };
}

interface ZipEntry {
  path: string;
  data: Buffer;
}

function createZip(entries: ZipEntry[]): Buffer {
  const { time, date } = toDosDateTime(new Date());
  const fileChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.path, "utf8");
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = Buffer.alloc(LOCAL_HEADER_SIZE + nameBuf.length);
    local.writeUInt32LE(LOCAL_HEADER_SIGNATURE, 0);
    local.writeUInt16LE(ZIP_VERSION, 4);
    local.writeUInt16LE(UTF8_FILENAME_FLAG, 6);
    local.writeUInt16LE(STORE_NO_COMPRESSION, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, LOCAL_HEADER_SIZE);
    fileChunks.push(local, entry.data);

    const central = Buffer.alloc(CENTRAL_HEADER_SIZE + nameBuf.length);
    central.writeUInt32LE(CENTRAL_HEADER_SIGNATURE, 0);
    central.writeUInt16LE(ZIP_VERSION, 4);
    central.writeUInt16LE(ZIP_VERSION, 6);
    central.writeUInt16LE(UTF8_FILENAME_FLAG, 8);
    central.writeUInt16LE(STORE_NO_COMPRESSION, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(size, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra field length
    central.writeUInt16LE(0, 32); // file comment length
    central.writeUInt16LE(0, 34); // disk number start
    central.writeUInt16LE(0, 36); // internal attributes
    central.writeUInt32LE(0, 38); // external attributes
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, CENTRAL_HEADER_SIZE);
    centralChunks.push(central);

    offset += local.length + size;
  }

  const centralDirectory = Buffer.concat(centralChunks);
  const end = Buffer.alloc(END_OF_CENTRAL_DIR_SIZE);
  end.writeUInt32LE(END_OF_CENTRAL_DIR_SIGNATURE, 0);
  end.writeUInt16LE(0, 4); // 디스크 번호
  end.writeUInt16LE(0, 6); // 중앙 디렉터리 시작 디스크
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20); // 주석 길이

  return Buffer.concat([...fileChunks, centralDirectory, end]);
}

function escapeXml(value: string): string {
  return value
    .replace(INVALID_XML_CHARS, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 0 → "A", 25 → "Z", 26 → "AA" */
function columnName(index: number): string {
  let remaining = index + 1;
  let name = "";
  while (remaining > 0) {
    const rest = (remaining - 1) % 26;
    name = String.fromCharCode(65 + rest) + name;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return name;
}

function sanitizeSheetName(name: string, index: number): string {
  const cleaned = name.replace(INVALID_SHEET_NAME_CHARS, " ").trim();
  if (!cleaned) return `Sheet${index + 1}`;
  return cleaned.slice(0, MAX_SHEET_NAME_LENGTH);
}

function renderCell(value: CellValue, ref: string, isHeader: boolean): string {
  const style = isHeader ? ` s="${STYLE_HEADER}"` : "";
  if (value === null || value === undefined || value === "") {
    return `<c r="${ref}"${style}/>`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"${style}><v>${value}</v></c>`;
  }
  const text = escapeXml(String(value));
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
}

function renderSheet(sheet: SheetData): string {
  const columnCount = sheet.rows.reduce((max, row) => Math.max(max, row.length), 0);
  const hasHeader = sheet.rows.length > 0;

  const cols = sheet.columnWidths?.length
    ? `<cols>${sheet.columnWidths
        .map(
          (width, i) =>
            `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`
        )
        .join("")}</cols>`
    : "";

  // 긴 명단을 스크롤해도 항목명이 보이도록 머리글 행을 고정한다
  const sheetViews = hasHeader
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : "";

  const rows = sheet.rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) =>
          renderCell(value, `${columnName(colIndex)}${rowIndex + 1}`, rowIndex === 0)
        )
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  const autoFilter =
    hasHeader && columnCount > 0
      ? `<autoFilter ref="A1:${columnName(columnCount - 1)}1"/>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${sheetViews}${cols}<sheetData>${rows}</sheetData>${autoFilter}</worksheet>`;
}

const CONTENT_TYPE_SHEET =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml";
const RELATIONSHIP_NS =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`;

/** 시트 목록으로 xlsx 파일 바이트를 만든다. */
export function buildXlsx(sheets: SheetData[]): Buffer {
  if (sheets.length === 0) {
    throw new Error("xlsx 파일에는 최소 한 개의 시트가 필요합니다.");
  }

  const names = sheets.map((sheet, i) => sanitizeSheetName(sheet.name, i));
  const stylesRelId = `rId${sheets.length + 1}`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="${CONTENT_TYPE_SHEET}"/>`
    )
    .join("")}</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RELATIONSHIP_NS}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${RELATIONSHIP_NS}"><sheets>${names
    .map(
      (name, i) =>
        `<sheet name="${escapeXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
    )
    .join("")}</sheets></workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="${RELATIONSHIP_NS}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join(
      ""
    )}<Relationship Id="${stylesRelId}" Type="${RELATIONSHIP_NS}/styles" Target="styles.xml"/></Relationships>`;

  const entries: ZipEntry[] = [
    { path: "[Content_Types].xml", data: Buffer.from(contentTypes, "utf8") },
    { path: "_rels/.rels", data: Buffer.from(rootRels, "utf8") },
    { path: "xl/workbook.xml", data: Buffer.from(workbook, "utf8") },
    { path: "xl/_rels/workbook.xml.rels", data: Buffer.from(workbookRels, "utf8") },
    { path: "xl/styles.xml", data: Buffer.from(STYLES_XML, "utf8") },
    ...sheets.map((sheet, i) => ({
      path: `xl/worksheets/sheet${i + 1}.xml`,
      data: Buffer.from(renderSheet(sheet), "utf8"),
    })),
  ];

  return createZip(entries);
}
