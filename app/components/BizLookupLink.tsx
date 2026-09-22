"use client";

const BIZ_LOOKUP_URL =
  "https://www.ftc.go.kr/bizCommPop.do?wrkr_no=6211425692";

export function BizLookupLink() {
  return (
    <a
      href={BIZ_LOOKUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        const popup = window.open(
          BIZ_LOOKUP_URL,
          "bizCommPop",
          "width=750,height=700,scrollbars=yes,resizable=yes"
        );
        if (popup) {
          event.preventDefault();
          popup.focus();
        }
      }}
      className="text-foreground/80 underline underline-offset-2 hover:text-foreground"
    >
      [사업자 번호 조회]
    </a>
  );
}
