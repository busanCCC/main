"use client";

import {
  Match,
  SVGViewer,
  SingleEliminationBracket,
  createTheme,
} from "@g-loot/react-tournament-brackets";
import type { ReactNode } from "react";

export interface BracketParticipant {
  id: string;
  name: string;
  resultText: string | null;
  isWinner: boolean;
  status: "PLAYED" | "NO_SHOW" | "WALK_OVER" | "NO_PARTY" | null;
}

export interface BracketMatch {
  id: number;
  name?: string;
  nextMatchId: number | null;
  tournamentRoundText?: string;
  startTime: string;
  state: "NO_PARTY" | "SCORE_DONE" | "PLAYED" | string;
  participants: BracketParticipant[];
}

interface SportsBracketPreviewProps {
  matches: BracketMatch[];
  accentColor?: string;
}

interface SvgWrapperProps {
  bracketWidth: number;
  bracketHeight: number;
  startAt: [number, number];
  children: ReactNode;
}

function buildTheme(accentColor: string) {
  return createTheme({
    fontFamily: "System",
    transitionTimingFunction: "ease",
    disabledColor: "#475569",
    roundHeaders: { background: "#1e293b" },
    matchBackground: { wonColor: "#1a2744", lostColor: "#1e293b" },
    border: { color: "#334155", highlightedColor: accentColor },
    textColor: {
      main: "#e2e8f0",
      highlighted: "#ffffff",
      dark: "#94a3b8",
      disabled: "#475569",
    },
    score: {
      background: { wonColor: `${accentColor}33`, lostColor: "#1e293b" },
      text: {
        highlightedWonColor: accentColor,
        highlightedLostColor: "#f87171",
      },
    },
    canvasBackground: "#0f172a",
  });
}

function toLibraryMatch(match: BracketMatch) {
  return {
    id: match.id,
    name: match.name,
    nextMatchId: match.nextMatchId,
    tournamentRoundText: match.tournamentRoundText,
    startTime: match.startTime,
    state: match.state,
    participants: match.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      resultText: participant.resultText ?? undefined,
      isWinner: participant.isWinner,
      status: participant.status ?? undefined,
    })),
  };
}

export function SportsBracketPreview({
  matches,
  accentColor = "#22c55e",
}: SportsBracketPreviewProps) {
  const theme = buildTheme(accentColor);
  const libraryMatches = matches.map(toLibraryMatch);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
      <div className="overflow-hidden rounded-xl bg-slate-950">
        <SingleEliminationBracket
          matches={libraryMatches}
          matchComponent={Match}
          theme={theme}
          options={{
            style: {
              roundHeader: {
                isShown: true,
                backgroundColor: "#1e293b",
                fontColor: "#94a3b8",
                fontSize: 12,
              },
              connectorColor: "#334155",
              connectorColorHighlight: accentColor,
            },
          }}
          svgWrapper={({ bracketWidth, bracketHeight, startAt, children }: SvgWrapperProps) => (
            <SVGViewer
              width={640}
              height={320}
              bracketWidth={bracketWidth}
              bracketHeight={bracketHeight}
              startAt={startAt}
              scaleFactor={1}
            >
              {children}
            </SVGViewer>
          )}
        />
      </div>
      <p className="mt-2 text-center text-[11px] font-medium text-slate-500">
        앱 웹 화면과 동일한 브라켓 미리보기입니다. 드래그하여 탐색할 수 있습니다.
      </p>
    </div>
  );
}
