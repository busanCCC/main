import type { Meta, StoryObj } from "@storybook/react";
import CustomEventExample from "./CustomEventExample";

const meta: Meta<typeof CustomEventExample> = {
  title: "Worship Order/CustomEventExample",
  component: CustomEventExample,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    postId: {
      control: "number",
      description: "페이지 ID",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    postId: 1,
  },
};

export const DifferentPost: Story = {
  args: {
    postId: 2,
  },
};
