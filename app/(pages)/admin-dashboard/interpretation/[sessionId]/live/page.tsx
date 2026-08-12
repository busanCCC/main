"use client";

import { LiveConsole } from "@/app/components/admin-dashboard/interpretation/LiveConsole";

interface LivePageProps {
  params: { sessionId: string };
}

export default function InterpretationLivePage({ params }: LivePageProps) {
  return <LiveConsole sessionId={params.sessionId} />;
}
