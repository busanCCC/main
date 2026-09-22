import { BizLookupLink } from "@/app/components/BizLookupLink";

export default function FooterSection() {
  return (
    <footer className="w-full border-t bg-background px-4">
      <div className="mx-auto max-w-7xl py-8 text-xs leading-6 text-muted-foreground">
        <p className="font-medium text-foreground">
          좋은공간 미디어 | 대표 : 윤성현
        </p>
        <p>부산광역시 북구 낙동북로 772번가길 28, 지하 1층(구포동)</p>
        <p>
          사업자 등록번호 : 621-14-25692 <BizLookupLink />
        </p>
        <p>통신판매번호 : 2018-부산북구-0094</p>
        <p>
          이메일 문의 :{" "}
          <a
            href="mailto:ccc9020@hanmail.net"
            className="underline underline-offset-2 hover:text-foreground"
          >
            ccc9020@hanmail.net
          </a>
        </p>
        <p className="mt-3">© 2026 좋은공간 미디어. All rights reserved.</p>
      </div>
    </footer>
  );
}
