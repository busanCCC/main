import { Footer, FooterBottom } from "@/components/ui/footer";

export default function FooterSection() {
  return (
    <footer className="w-full bg-background px-4">
      <div className="mx-auto max-w-container">
        <Footer className="pt-0">
          <FooterBottom className="mt-0 flex flex-col items-center gap-4 sm:flex-col md:flex-row">
            <div>© 2025 Busan CCC Media Team. All rights reserved</div>
            <div className="flex items-center gap-4">
              <a href="#">로그인</a> | <a href="#">회원가입</a>
            </div>
          </FooterBottom>
        </Footer>
      </div>
    </footer>
  );
}
