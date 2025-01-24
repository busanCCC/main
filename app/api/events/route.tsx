import { NextResponse } from "next/server";

export async function GET() {
  const events = [
    {
      id: 1,
      title: "1월 23일 목요채플",
      createdAt: new Date().toISOString(),
      schedule: "2025-01-23T00:00Z",
    },
    {
      id: 2,
      title: "2025 TST 수련회 개회예배",
      createdAt: new Date().toISOString(),
      schedule: "2025-02-03T00:00Z",
    },
  ];

  return NextResponse.json(events);
}
