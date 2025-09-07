import type { Meta, StoryObj } from "@storybook/react";
import PrayerChainCard from "./PrayerChainCard";

const meta: Meta<typeof PrayerChainCard> = {
  title: "Components/PrayerChainCard",
  component: PrayerChainCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    date: {
      control: "text",
      description: "기도제목 날짜 (예: 2024.06.13)",
    },
    day: {
      control: "text",
      description: "요일 (예: 목)",
    },
    campus: {
      control: "text",
      description: "캠퍼스 이름 (예: 부산대 캠퍼스)",
    },
    prayers: {
      control: "object",
      description: "기도제목 리스트",
    },
    prayingCount: {
      control: "number",
      description: "기도할게요 누른 사람 수",
    },
    disabled: {
      control: "boolean",
      description: "버튼 비활성화 여부",
    },
    onPray: {
      action: "prayed",
      description: "기도할게요 버튼 클릭 핸들러",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    date: "2024.06.13",
    day: "목",
    campus: "부산대 캠퍼스",
    prayers: [
      "새로운 학기를 시작하며 주님의 인도하심을 구합니다",
      "시험 기간 동안 집중력과 지혜를 주시길 기도합니다",
      "교수님들과 동료들과의 관계가 더욱 좋아지길 기도합니다",
      "건강한 몸과 마음으로 학업에 임할 수 있도록 기도합니다",
      "하나님의 뜻을 따라 진로를 선택할 수 있도록 기도합니다",
    ],
    prayingCount: 12,
    disabled: false,
  },
};

export const LongPrayers: Story = {
  args: {
    date: "2024.06.14",
    day: "금",
    campus: "서울대 캠퍼스",
    prayers: [
      "새로운 학기를 시작하며 주님의 인도하심을 구합니다. 모든 일이 하나님의 뜻대로 이루어지길 기도합니다.",
      "시험 기간 동안 집중력과 지혜를 주시길 기도합니다. 특히 어려운 과목들에 대한 이해력이 높아지길 기도합니다.",
      "교수님들과 동료들과의 관계가 더욱 좋아지길 기도합니다. 서로를 존중하고 사랑하는 마음이 자라나길 기도합니다.",
      "건강한 몸과 마음으로 학업에 임할 수 있도록 기도합니다. 스트레스 없이 즐겁게 공부할 수 있도록 기도합니다.",
      "하나님의 뜻을 따라 진로를 선택할 수 있도록 기도합니다. 미래에 대한 확신과 평안을 주시길 기도합니다.",
      "가족들과의 관계가 더욱 돈독해지길 기도합니다. 서로를 이해하고 사랑하는 마음이 자라나길 기도합니다.",
      "교회 생활이 더욱 열심히 되길 기도합니다. 예배와 기도에 충실한 삶을 살 수 있도록 기도합니다.",
    ],
    prayingCount: 25,
    disabled: false,
  },
};

export const ShortPrayers: Story = {
  args: {
    date: "2024.06.15",
    day: "토",
    campus: "경기대 캠퍼스",
    prayers: ["새로운 시작을 위한 기도", "건강한 하루", "평안한 마음"],
    prayingCount: 5,
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    date: "2024.06.16",
    day: "일",
    campus: "인하대 캠퍼스",
    prayers: [
      "주일 예배를 위한 기도",
      "새로운 한 주를 위한 기도",
      "가족들의 건강을 위한 기도",
    ],
    prayingCount: 8,
    disabled: true,
  },
};

export const ManyPrayers: Story = {
  args: {
    date: "2024.06.17",
    day: "월",
    campus: "연세대 캠퍼스",
    prayers: [
      "새로운 한 주를 시작하며 주님의 인도하심을 구합니다",
      "시험 준비를 위한 집중력과 지혜를 주시길 기도합니다",
      "교수님들과의 좋은 관계를 유지할 수 있도록 기도합니다",
      "동료들과의 우정이 더욱 깊어지길 기도합니다",
      "건강한 몸과 마음으로 학업에 임할 수 있도록 기도합니다",
      "하나님의 뜻을 따라 진로를 선택할 수 있도록 기도합니다",
      "가족들과의 관계가 더욱 돈독해지길 기도합니다",
      "교회 생활이 더욱 열심히 되길 기도합니다",
      "예배와 기도에 충실한 삶을 살 수 있도록 기도합니다",
      "하나님의 사랑을 나누는 삶을 살 수 있도록 기도합니다",
    ],
    prayingCount: 35,
    disabled: false,
  },
};
