import {
  BookOpen,
  Compass,
  HeartHandshake,
  Languages,
  MessageSquare,
  NotebookPen,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

// 빈 문자열이면 카드에 "스토어 출시 준비 중"으로 표시됩니다.
export const APP_STORE_URL =
  "https://apps.apple.com/kr/app/ccc-%EC%BB%A4%EB%AE%A4%EB%8B%88%ED%8B%B0/id6757016825";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.kimgarden.busancccapp&hl=ko";

export const SIAT_SUNJANG_URL = "https://ai.busanccc.com";

export type ServiceFeature = {
  icon: LucideIcon;
  text: string;
  /** 베타 등 작은 상태 라벨 */
  tag?: "beta";
  /** 기능 설명 보조 문구 */
  subtext?: string;
};

export type ServiceLink = {
  label: string;
  href: string;
};

export type Service = {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  features: ServiceFeature[];
  /** 카드 상단 강조선 · 아이콘 타일에 쓰는 밝은 gradient */
  accent: string;
  /** 흰 글씨/텍스트 대비가 필요한 태그라인·CTA 버튼용 진한 gradient */
  accentStrong: string;
  /** 마스코트 등 대표 이미지. 없으면 icon을 타일에 렌더 */
  image?: string;
  icon?: LucideIcon;
  /** 파티클·글로우 등 인터랙티브 배경용 hex 색상 */
  themeColor?: string;
  primaryLink?: ServiceLink;
  /** 스토어처럼 진입점이 여러 개인 경우 */
  storeLinks?: ServiceLink[];
  /** storeLinks가 모두 비어있을 때 보여줄 문구 */
  pendingLabel?: string;
};

export const services: Service[] = [
  {
    id: "siat-sunjang",
    name: "AI 씨앗순장",
    tagline: "CCC를 아는 AI 순장",
    badge: "서비스 운영중",
    description:
      "시중의 LLM 서비스는 CCC를 이해하고 그에 맞는 답을 주기에 한계가 있습니다. 그래서 CCC 사람을 위한 전용 AI Agent, 씨앗순장을 만들었어요.",
    features: [
      { icon: Sparkles, text: "CCC 정체성을 지향하는 답변" },
      { icon: Compass, text: "CCC 사역과 용어에 대한 궁금증 해결" },
      { icon: HeartHandshake, text: "개인적인 신앙 질문 나눔" },
      { icon: BookOpen, text: "진로·고민까지 함께 생각하기" },
    ],
    accent: "from-amber-400 to-teal-500",
    accentStrong: "from-teal-700 to-emerald-600",
    image: "/siat-sunjang.png",
    themeColor: "#14b8a6",
    primaryLink: { label: "씨앗순장과 대화하기", href: SIAT_SUNJANG_URL },
  },
  {
    id: "community-app",
    name: "CCC 커뮤니티 앱",
    tagline: "순모임과 함께 자라가는 신앙생활",
    badge: "iOS · Android",
    description:
      "영성일기와 묵상을 순원들과 나누고, 채플 정보부터 AI 서비스까지 한 앱에서 누릴 수 있어요.",
    features: [
      { icon: NotebookPen, text: "영성일기 작성·공유와 QT 묵상 나눔" },
      { icon: Users, text: "순모임을 만들어 순원들과 함께 나눔" },
      { icon: MessageSquare, text: "채플 정보 및 AI 요약 서비스" },
      {
        icon: Languages,
        text: "채플 실시간 AI 통번역",
        tag: "beta",
        subtext: "지구채플·일부 캠퍼스부터 순차 확대 중",
      },
      { icon: Trophy, text: "업적 시스템으로 영적으로 함께 성장" },
    ],
    accent: "from-blue-500 to-indigo-500",
    accentStrong: "from-blue-700 to-indigo-700",
    image: "/icon.png",
    themeColor: "#6366f1",
    storeLinks: [
      { label: "App Store", href: APP_STORE_URL },
      { label: "Google Play", href: PLAY_STORE_URL },
    ],
    pendingLabel: "스토어 출시 준비 중",
  },
];
