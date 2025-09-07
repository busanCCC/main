import type { Meta, StoryObj } from "@storybook/react";
import CustomEvent from "./CustomEvent";

const meta: Meta<typeof CustomEvent> = {
  title: "Worship Order/CustomEvent",
  component: CustomEvent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    postId: {
      control: "number",
      description: "페이지 ID (어떤 페이지의 글인지 식별)",
    },
    eventId: {
      control: "text",
      description: "이벤트 고유 ID",
    },
    index: {
      control: "number",
      description: "채플 내에서의 순서",
    },
    eventName: {
      control: "text",
      description: "이벤트명 (예: 기도, 찬양, 말씀 등)",
    },
    name: {
      control: "text",
      description: "해당하는 사람의 이름 (선택사항)",
    },
    description: {
      control: "text",
      description: "추가 설명 (선택사항)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    postId: 1,
    eventId: "prayer-001",
    index: 1,
    eventName: "기도",
    name: "김영희",
    description: "새벽기도회",
  },
};

export const PrayerEvent: Story = {
  args: {
    postId: 1,
    eventId: "prayer-002",
    index: 2,
    eventName: "기도",
    name: "박민수",
    description: "중보기도",
  },
};

export const PraiseEvent: Story = {
  args: {
    postId: 1,
    eventId: "praise-001",
    index: 3,
    eventName: "찬양",
    name: "이지은",
    description: "주일찬양",
  },
};

export const MessageEvent: Story = {
  args: {
    postId: 1,
    eventId: "message-001",
    index: 4,
    eventName: "말씀",
    name: "최성호 목사",
    description: "주일설교",
  },
};

export const WithoutName: Story = {
  args: {
    postId: 1,
    eventId: "custom-001",
    index: 5,
    eventName: "특별행사",
    description: "하나님의 사랑을 나누는 특별한 예배 시간",
  },
};

export const LongEventName: Story = {
  args: {
    postId: 1,
    eventId: "special-001",
    index: 6,
    eventName: "SPECIAL WORSHIP",
    name: "김예배",
    description: "하나님의 사랑을 나누는 특별한 예배 시간",
  },
};

export const KoreanEvent: Story = {
  args: {
    postId: 1,
    eventId: "korean-001",
    index: 7,
    eventName: "찬양",
    name: "한국인",
    description: "주님을 찬양합니다",
  },
};
