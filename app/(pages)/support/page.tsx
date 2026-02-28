import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "고객 지원 센터 | 부산CCC 앱",
  description:
    "부산CCC 앱 사용에 관한 자주 묻는 질문, 계정 관리 안내, 문의 방법을 확인하세요.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold text-teal-600 border-b-2 border-teal-600 pb-4 mb-8">
          고객 지원 센터
        </h1>
        <p className="text-gray-600 text-lg mb-10">
          부산CCC 앱 사용에 도움이 필요하신가요?
        </p>

        {/* 빠른 링크 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <a
            href="#faq"
            className="block p-5 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50/50 transition-colors"
          >
            <h3 className="font-semibold text-gray-800 mb-1">자주 묻는 질문</h3>
            <p className="text-sm text-gray-600">FAQ에서 답변을 확인하세요</p>
          </a>
          <a
            href="#account"
            className="block p-5 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50/50 transition-colors"
          >
            <h3 className="font-semibold text-gray-800 mb-1">계정 문제</h3>
            <p className="text-sm text-gray-600">계정·비밀번호 안내</p>
          </a>
          <a
            href="#contact"
            className="block p-5 rounded-lg border border-gray-200 hover:border-teal-500 hover:bg-teal-50/50 transition-colors"
          >
            <h3 className="font-semibold text-gray-800 mb-1">문의하기</h3>
            <p className="text-sm text-gray-600">담당자 연락처</p>
          </a>
        </div>

        {/* FAQ 섹션 */}
        <section id="faq" className="scroll-mt-8">
          <h2 className="text-2xl font-bold text-teal-600 border-b border-teal-200 pb-3 mb-6">
            자주 묻는 질문
          </h2>

          <div className="space-y-2">
            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                부산CCC 앱은 어떤 앱인가요?
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                부산CCC(부산지구 대학생 선교회) 공식 커뮤니티 앱입니다. 커뮤니티
                게시판, 기도제목, 영적일지, 그룹 활동, 주보·주간 소식 등 다양한
                기능을 제공합니다.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                앱은 어디서 다운로드할 수 있나요?
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                iOS는 App Store에서, Android는 Google Play Store에서
                &quot;부산CCC&quot; 또는 &quot;busanccc&quot;로 검색해
                다운로드할 수 있습니다.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                회원가입은 어떻게 하나요?
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                앱 실행 후 회원가입을 선택한 뒤, 이름·학번·캠퍼스·역할을 입력하고
                이메일과 비밀번호를 설정합니다. 이메일로 전송된 인증 코드를 입력해
                인증을 완료한 후, 이용약관 및 개인정보처리방침에 동의하면
                가입이 완료됩니다.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                비밀번호를 잊었어요
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                로그인 화면에서 &quot;비밀번호 찾기&quot;를 누르면 등록된 이메일로
                인증 코드가 발송됩니다. 해당 코드를 입력해 새 비밀번호를
                설정할 수 있습니다.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                이메일을 잊었어요
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                로그인 화면에서 &quot;이메일 찾기&quot;를 선택한 뒤, 가입 시
                입력한 정보를 입력하면 등록된 이메일을 확인할 수 있습니다.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                계정을 탈퇴하고 싶어요
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                앱 내 [프로필] → [설정] → [계정 탈퇴]에서 진행할 수 있습니다.
                비밀번호 확인 후 탈퇴가 처리되며, 탈퇴 시 모든 데이터가 영구
                삭제되므로 신중히 결정해 주세요.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                커뮤니티 게시글은 어떻게 작성하나요?
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                하단 [커뮤니티] 탭으로 이동한 뒤, 글쓰기 버튼을 눌러 제목과
                내용을 입력해 게시할 수 있습니다.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                기도제목은 어떻게 등록하나요?
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                하단 [기도] 탭에서 기도제목을 등록하고, 다른 회원들의 기도제목을
                확인하며 함께 기도할 수 있습니다.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                영적일지는 어떻게 작성하나요?
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                [홈] 탭에서 영적일지 관련 메뉴로 들어가 일지를 작성할 수
                있습니다. 캘린더에서 날짜를 선택해 과거 일지도 조회·수정할 수
                있습니다.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                알림이 오지 않아요
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                먼저 기기의 [설정] → [앱] → 부산CCC 앱에서 알림 권한이 켜져
                있는지 확인해 주세요. 앱 내 [설정] → [알림 설정]에서 푸시 알림
                항목이 활성화되어 있는지도 확인해 보세요.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                레벨/경험치 시스템이 뭔가요?
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                활동(글 작성, 댓글, 기도 참여 등)을 하면 경험치(XP)가 쌓이고,
                레벨이 올라갑니다. 특정 조건을 달성하면 업적을 획득할 수 있는
                게이미피케이션 요소입니다.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                앱이 실행되지 않아요
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                스토어에서 앱이 최신 버전인지 확인하고, 기기를 한 번 재시작해
                보세요. 문제가 계속되면 앱을 삭제한 뒤 다시 설치해 보시고, 그래도
                해결되지 않으면 아래 문의처로 연락해 주세요.
              </div>
            </details>

            <details className="group rounded-lg border border-gray-200 bg-gray-50/50">
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-800 hover:bg-gray-100/80 rounded-lg">
                오류가 계속 발생해요
              </summary>
              <div className="px-4 pb-4 pt-1 text-gray-700 leading-relaxed">
                앱 캐시 삭제 후 재실행하거나, 앱을 삭제하고 최신 버전으로 다시
                설치해 보세요. 동일한 오류가 반복되면 발생 상황(화면, 조작
                순서 등)을 적어 아래 문의처로 이메일 보내 주시면 도움을
                드리겠습니다.
              </div>
            </details>
          </div>
        </section>

        {/* 계정 관리 안내 섹션 */}
        <section id="account" className="scroll-mt-8 mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-teal-600 border-b border-teal-200 pb-3 mb-6">
            계정 관리 안내
          </h2>

          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                계정 삭제(탈퇴)
              </h3>
              <p className="leading-relaxed mb-2">
                앱 [프로필] → [설정] → [계정 탈퇴]에서 본인 확인(비밀번호 입력)
                후 탈퇴할 수 있습니다. 탈퇴 시 회원 정보, 게시글, 영적일지 등
                모든 데이터가 영구 삭제되며 복구할 수 없습니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                비밀번호 변경
              </h3>
              <p className="leading-relaxed">
                로그인한 상태에서 [프로필] → [설정] 메뉴에 들어가 비밀번호
                변경을 선택한 뒤, 현재 비밀번호와 새 비밀번호를 입력해
                변경할 수 있습니다.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                개인정보 수정
              </h3>
              <p className="leading-relaxed">
                [프로필] 화면에서 프로필 수정을 선택하면 이름, 프로필 사진 등
                개인정보를 수정할 수 있습니다. 이메일 변경이 필요한 경우
                고객 지원으로 문의해 주세요.
              </p>
            </div>
          </div>
        </section>

        {/* 연락처 / 문의하기 섹션 */}
        <section id="contact" className="scroll-mt-8 mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-teal-600 border-b border-teal-200 pb-3 mb-6">
            문의하기
          </h2>

          <p className="text-gray-700 mb-6 leading-relaxed">
            앱 사용 중 문의사항이나 오류 신고는 아래 담당자에게 연락해 주세요.
            이메일 문의를 권장드리며, 가능한 빠르게 답변 드리겠습니다.
          </p>

          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">
                개인정보 보호 책임자
              </h3>
              <ul className="space-y-1 text-gray-700">
                <li>성명: 배진일</li>
                <li>직책: PM</li>
                <li>
                  전화:{" "}
                  <a href="tel:010-5205-8769" className="text-teal-600 hover:underline">
                    010-5205-8769
                  </a>
                </li>
                <li>
                  이메일:{" "}
                  <a
                    href="mailto:varietyjin@naver.com"
                    className="text-teal-600 hover:underline"
                  >
                    varietyjin@naver.com
                  </a>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">개발팀 담당자</h3>
              <ul className="space-y-1 text-gray-700">
                <li>담당부서: 개발팀</li>
                <li>담당자명: 김정원</li>
                <li>
                  전화:{" "}
                  <a href="tel:010-8322-2489" className="text-teal-600 hover:underline">
                    010-8322-2489
                  </a>
                </li>
                <li>
                  이메일:{" "}
                  <a
                    href="mailto:mike03131313@gmail.com"
                    className="text-teal-600 hover:underline"
                  >
                    mike03131313@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 관련 링크 섹션 */}
        <section className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">관련 링크</h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              <Link
                href="/privacy-policy"
                className="text-teal-600 hover:underline"
              >
                개인정보처리방침
              </Link>
            </li>
            <li className="text-gray-600">앱 버전: v1.0.0</li>
          </ul>
        </section>

        {/* 푸터 */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            본 지원 페이지는 2026년 2월 28일부터 제공됩니다. 내용은 서비스
            변경에 따라 수정될 수 있습니다.
          </p>
        </footer>
      </div>
    </div>
  );
}
