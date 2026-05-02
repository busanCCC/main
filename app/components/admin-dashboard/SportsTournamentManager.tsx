"use client";

import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { DeleteConfirmDialog } from "@/app/components/admin-dashboard/DeleteConfirmDialog";
import {
  createRecord,
  deleteRecord,
  fetchTableData,
  updateRecord,
  upsertRecord,
} from "@/app/(pages)/admin-dashboard/actions";
import type {
  BracketMatch,
  BracketParticipant,
} from "@/app/components/admin-dashboard/SportsBracketPreview";

const SportsBracketPreview = dynamic(
  () =>
    import("@/app/components/admin-dashboard/SportsBracketPreview").then(
      (mod) => mod.SportsBracketPreview
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-2xl border bg-muted/30 text-sm text-muted-foreground">
        대진표 미리보기를 불러오는 중...
      </div>
    ),
  }
);

const TOURNAMENT_TABLE = "sports_tournaments";
const MATCH_TABLE = "sports_matches";
const PARTICIPANT_TABLE = "sports_participants";

type MatchState = "NO_PARTY" | "SCORE_DONE" | "PLAYED";
type DbId = number | string;
type BracketTeamCount = 4 | 8 | 16;

const BRACKET_TEAM_COUNTS: BracketTeamCount[] = [4, 8, 16];

interface RawTournament {
  id: DbId;
  name: string;
  badge: string;
  accent_color: string;
  sort_order: number;
  year: number;
}

interface RawMatch {
  id: DbId;
  tournament_id: DbId;
  match_number: number;
  next_match_id: number | null;
  name: string | null;
  tournament_round_text: string | null;
  start_time: string;
  state: MatchState | string;
}

interface RawParticipant {
  id: DbId;
  match_id: DbId;
  slot: number;
  name: string;
  result_text: string | null;
  is_winner: boolean;
  status: BracketParticipant["status"];
}

interface EditableParticipant extends BracketParticipant {
  dbId?: DbId;
  slot: number;
}

interface EditableMatch extends BracketMatch {
  dbId?: DbId;
  participants: EditableParticipant[];
}

interface TournamentFormState {
  id?: DbId;
  title: string;
  badge: string;
  accentColor: string;
  sortOrder: number;
  year: number;
  teamCount: BracketTeamCount;
  matches: EditableMatch[];
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const textareaClassName =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none";

function createParticipant(prefix: string, slot: number): EditableParticipant {
  return {
    id: `${prefix}-p${slot}`,
    slot,
    name: "TBD",
    resultText: null,
    isWinner: false,
    status: null,
  };
}

function getRoundLabel(roundTeamCount: number) {
  return roundTeamCount === 2 ? "결승" : `${roundTeamCount}강`;
}

function getMatchName(roundTeamCount: number, roundMatchIndex: number) {
  if (roundTeamCount === 2) return "🏆 결승";
  if (roundTeamCount === 4) return `준결승 ${roundMatchIndex + 1}`;
  return `${getRoundLabel(roundTeamCount)} ${roundMatchIndex + 1}`;
}

function getTeamCountFromMatches(matchCount: number): BracketTeamCount {
  const inferred = matchCount + 1;
  if (inferred >= 16) return 16;
  if (inferred >= 8) return 8;
  return 4;
}

function getFirstRoundMatchCount(teamCount: BracketTeamCount) {
  return teamCount / 2;
}

function collectFirstRoundTeams(matches: EditableMatch[], teamCount: BracketTeamCount) {
  return matches
    .slice(0, getFirstRoundMatchCount(teamCount))
    .flatMap((match) => match.participants.map((participant) => participant.name))
    .filter((name) => name && name !== "TBD");
}

function createDefaultMatches(
  teamCount: BracketTeamCount = 4,
  prefix = "new",
  teams: string[] = []
): EditableMatch[] {
  const matches: EditableMatch[] = [];
  let currentRoundTeamCount: number = teamCount;
  let roundStartId = 1;
  let nextRoundStartId = roundStartId + currentRoundTeamCount / 2;

  while (currentRoundTeamCount >= 2) {
    const roundMatchCount = currentRoundTeamCount / 2;
    const roundLabel = getRoundLabel(currentRoundTeamCount);

    for (let index = 0; index < roundMatchCount; index += 1) {
      const matchNumber = roundStartId + index;
      const nextMatchId =
        currentRoundTeamCount === 2
          ? null
          : nextRoundStartId + Math.floor(index / 2);
      const firstRoundTeamIndex = index * 2;

      matches.push({
        id: matchNumber,
        name: getMatchName(currentRoundTeamCount, index),
        nextMatchId,
        tournamentRoundText: roundLabel,
        startTime: "2026-07-28",
        state: "NO_PARTY",
        participants: [1, 2].map((slot) => ({
          ...createParticipant(`${prefix}-m${matchNumber}`, slot),
          name:
            currentRoundTeamCount === teamCount
              ? teams[firstRoundTeamIndex + slot - 1] || "TBD"
              : "TBD",
        })),
      });
    }

    roundStartId = nextRoundStartId;
    currentRoundTeamCount /= 2;
    nextRoundStartId = roundStartId + currentRoundTeamCount / 2;
  }

  return matches;
}

function createEmptyForm(): TournamentFormState {
  return {
    title: "형제 풋살",
    badge: "BROTHERS",
    accentColor: "#22c55e",
    sortOrder: 1,
    year: 2026,
    teamCount: 4,
    matches: createDefaultMatches(),
  };
}

function normalizeParticipants(
  match: RawMatch,
  participants: RawParticipant[]
): EditableParticipant[] {
  const sorted = participants
    .filter((participant) => String(participant.match_id) === String(match.id))
    .sort((a, b) => a.slot - b.slot);

  return [1, 2].map((slot) => {
    const participant = sorted.find((item) => item.slot === slot);
    if (!participant) return createParticipant(`${match.id}`, slot);

    return {
      dbId: participant.id,
      id: `${match.id}-s${slot}`,
      slot,
      name: participant.name,
      resultText: participant.result_text,
      isWinner: participant.is_winner,
      status: participant.status,
    };
  });
}

function toFormState(
  tournament: RawTournament,
  matches: RawMatch[],
  participants: RawParticipant[]
): TournamentFormState {
  const tournamentMatches = matches
    .filter((match) => String(match.tournament_id) === String(tournament.id))
    .sort((a, b) => a.match_number - b.match_number)
    .map<EditableMatch>((match) => ({
      dbId: match.id,
      id: match.match_number,
      name: match.name ?? undefined,
      nextMatchId: match.next_match_id,
      tournamentRoundText: match.tournament_round_text ?? undefined,
      startTime: match.start_time,
      state: match.state,
      participants: normalizeParticipants(match, participants),
    }));

  return {
    id: tournament.id,
    title: tournament.name,
    badge: tournament.badge,
    accentColor: tournament.accent_color,
    sortOrder: tournament.sort_order,
    year: tournament.year,
    teamCount: getTeamCountFromMatches(tournamentMatches.length),
    matches: tournamentMatches.length > 0 ? tournamentMatches : createDefaultMatches(4, String(tournament.id)),
  };
}

function toPreviewMatches(matches: EditableMatch[]): BracketMatch[] {
  return matches.map((match) => ({
    id: match.id,
    name: match.name,
    nextMatchId: match.nextMatchId,
    tournamentRoundText: match.tournamentRoundText,
    startTime: match.startTime,
    state: match.state,
    participants: match.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      resultText: participant.resultText,
      isWinner: participant.isWinner,
      status: participant.status,
    })),
  }));
}

function parseRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows as unknown as T[];
}

interface SportsTournamentFormProps {
  editTarget: TournamentFormState | null;
  onSuccess: () => void;
  onCancelEdit: () => void;
}

function SportsTournamentForm({
  editTarget,
  onSuccess,
  onCancelEdit,
}: SportsTournamentFormProps) {
  const [form, setForm] = useState<TournamentFormState>(() => createEmptyForm());
  const [quickTeams, setQuickTeams] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isEdit = editTarget !== null;

  useEffect(() => {
    setForm(editTarget ?? createEmptyForm());
    setQuickTeams("");
  }, [editTarget]);

  const previewMatches = useMemo(() => toPreviewMatches(form.matches), [form.matches]);

  const reset = () => {
    setForm(createEmptyForm());
    setQuickTeams("");
    onCancelEdit();
  };

  const handleTeamCountChange = (teamCount: BracketTeamCount) => {
    setForm((current) => {
      const existingTeams = collectFirstRoundTeams(current.matches, current.teamCount);
      return {
        ...current,
        teamCount,
        matches: createDefaultMatches(teamCount, String(current.id ?? "new"), existingTeams),
      };
    });
  };

  const updateMatch = <K extends keyof EditableMatch>(
    matchIndex: number,
    key: K,
    value: EditableMatch[K]
  ) => {
    setForm((current) => ({
      ...current,
      matches: current.matches.map((match, index) =>
        index === matchIndex ? { ...match, [key]: value } : match
      ),
    }));
  };

  const updateParticipant = <K extends keyof EditableParticipant>(
    matchIndex: number,
    participantIndex: number,
    key: K,
    value: EditableParticipant[K]
  ) => {
    setForm((current) => ({
      ...current,
      matches: current.matches.map((match, index) =>
        index === matchIndex
          ? {
              ...match,
              participants: match.participants.map((participant, pIndex) =>
                pIndex === participantIndex
                  ? { ...participant, [key]: value }
                  : participant
              ),
            }
          : match
      ),
    }));
  };

  const setWinner = (matchIndex: number, winnerIndex: number | null) => {
    setForm((current) => ({
      ...current,
      matches: current.matches.map((match, index) => {
        if (index !== matchIndex) return match;
        const hasWinner = winnerIndex !== null;
        return {
          ...match,
          state: hasWinner ? "SCORE_DONE" : "NO_PARTY",
          participants: match.participants.map((participant, pIndex) => ({
            ...participant,
            isWinner: pIndex === winnerIndex,
            status: hasWinner ? "PLAYED" : null,
          })),
        };
      }),
    }));
  };

  const applyQuickTeams = () => {
    const teams = quickTeams
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, form.teamCount);

    if (teams.length < form.teamCount) {
      toast.error(`${form.teamCount}개 팀을 줄바꿈으로 입력해 주세요.`);
      return;
    }

    const firstRoundMatchCount = getFirstRoundMatchCount(form.teamCount);

    setForm((current) => ({
      ...current,
      matches: current.matches.map((match, matchIndex) => {
        if (matchIndex >= firstRoundMatchCount) {
          return {
            ...match,
            state: "NO_PARTY",
            participants: match.participants.map((participant) => ({
              ...participant,
              name: "TBD",
              resultText: null,
              isWinner: false,
              status: null,
            })),
          };
        }

        return {
          ...match,
          state: "NO_PARTY",
          participants: match.participants.map((participant, participantIndex) => ({
            ...participant,
            name: teams[matchIndex * 2 + participantIndex],
            resultText: null,
            isWinner: false,
            status: null,
          })),
        };
      }),
    }));
  };

  const syncWinnersToNextRound = () => {
    const winners = form.matches.filter((match) =>
      match.participants.some((participant) => participant.isWinner)
    );

    if (winners.length === 0) {
      toast.error("다음 라운드에 반영할 승자를 먼저 선택해 주세요.");
      return;
    }

    setForm((current) => ({
      ...current,
      matches: current.matches.map((match) => {
        const feederMatches = current.matches
          .filter((candidate) => candidate.nextMatchId === match.id)
          .sort((a, b) => a.id - b.id);

        if (feederMatches.length === 0) return match;

        return {
          ...match,
          state: "NO_PARTY",
          participants: match.participants.map((participant, index) => {
            const winner = feederMatches[index]?.participants.find((item) => item.isWinner);
            if (!winner) return participant;

            return {
                ...participant,
                name: winner.name,
                resultText: null,
                isWinner: false,
                status: null,
            };
          }),
        };
      }),
    }));
    toast.success("선택된 승자를 다음 라운드에 반영했습니다.");
  };

  const saveMatch = async (tournamentId: DbId, match: EditableMatch) => {
    const payload = {
      tournament_id: tournamentId,
      match_number: match.id,
      next_match_id: match.nextMatchId,
      name: match.name ?? null,
      tournament_round_text: match.tournamentRoundText ?? null,
      start_time: match.startTime,
      state: match.state,
    };

    if (match.dbId) {
      const result = await updateRecord(MATCH_TABLE, match.dbId, payload);
      if (!result.ok) throw new Error(result.reason);
      return match.dbId;
    }

    const result = await upsertRecord(MATCH_TABLE, payload, "tournament_id,match_number");
    if (!result.ok) throw new Error(result.reason);
    return (result.data as { id: DbId }).id;
  };

  const saveParticipant = async (
    matchDbId: DbId,
    participant: EditableParticipant,
    slot: number
  ) => {
    const payload = {
      match_id: matchDbId,
      slot,
      name: participant.name.trim() || "TBD",
      result_text: participant.resultText?.trim() || null,
      is_winner: participant.isWinner,
      status: participant.status,
    };

    if (participant.dbId) {
      const result = await updateRecord(PARTICIPANT_TABLE, participant.dbId, payload);
      if (!result.ok) throw new Error(result.reason);
      return;
    }

    const result = await upsertRecord(PARTICIPANT_TABLE, payload, "match_id,slot");
    if (!result.ok) throw new Error(result.reason);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim() || !form.badge.trim()) {
      toast.error("대회명과 배지를 입력해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const tournamentPayload = {
        name: form.title.trim(),
        badge: form.badge.trim(),
        accent_color: form.accentColor,
        sort_order: Number(form.sortOrder),
        year: Number(form.year),
      };

      let tournamentId = form.id;
      if (tournamentId) {
        const result = await updateRecord(TOURNAMENT_TABLE, tournamentId, tournamentPayload);
        if (!result.ok) throw new Error(result.reason);
      } else {
        const result = await createRecord(TOURNAMENT_TABLE, tournamentPayload);
        if (!result.ok) throw new Error(result.reason);
        tournamentId = (result.data as { id: DbId }).id;
      }

      for (const match of form.matches) {
        const matchDbId = await saveMatch(tournamentId, match);
        for (let index = 0; index < match.participants.length; index += 1) {
          await saveParticipant(matchDbId, match.participants[index], index + 1);
        }
      }

      if (editTarget) {
        const keptMatchNumbers = new Set(form.matches.map((match) => match.id));
        const obsoleteMatches = editTarget.matches.filter(
          (match) => match.dbId && !keptMatchNumbers.has(match.id)
        );

        for (const match of obsoleteMatches) {
          await deleteRecord(MATCH_TABLE, match.dbId!);
        }
      }

      toast.success(isEdit ? "대진표가 수정되었습니다." : "대진표가 등록되었습니다.");
      reset();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_680px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card className={isEdit ? "border-primary/50 ring-1 ring-primary/20" : ""}>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold">
              {isEdit ? `수정 중: ${editTarget?.title}` : "새 축구 대진표 작성"}
            </CardTitle>
            <CardDescription className="text-xs">
              앱 스포츠 페이지에서 사용하는 4강/결승 브라켓 데이터를 입력합니다.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_130px_110px_120px_120px]">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sports-title" className="text-xs">
                  대회명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sports-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="예: 형제 풋살"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sports-badge" className="text-xs">
                  배지 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sports-badge"
                  value={form.badge}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, badge: event.target.value }))
                  }
                  placeholder="BROTHERS"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sports-team-count" className="text-xs">팀 수</Label>
                <select
                  id="sports-team-count"
                  className={selectClassName}
                  value={form.teamCount}
                  onChange={(event) =>
                    handleTeamCountChange(Number(event.target.value) as BracketTeamCount)
                  }
                >
                  {BRACKET_TEAM_COUNTS.map((teamCount) => (
                    <option key={teamCount} value={teamCount}>
                      {teamCount}팀
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sports-year" className="text-xs">연도</Label>
                <Input
                  id="sports-year"
                  type="number"
                  value={form.year}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, year: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sports-sort" className="text-xs">정렬</Label>
                <Input
                  id="sports-sort"
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr]">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sports-color" className="text-xs">강조 색상</Label>
                <div className="flex gap-2">
                  <Input
                    id="sports-color"
                    type="color"
                    value={form.accentColor}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, accentColor: event.target.value }))
                    }
                    className="h-10 w-14 p-1"
                  />
                  <Input
                    value={form.accentColor}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, accentColor: event.target.value }))
                    }
                    placeholder="#22c55e"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quick-teams" className="text-xs">
                  {form.teamCount}팀 일괄 입력
                </Label>
                <div className="flex gap-2">
                  <textarea
                    id="quick-teams"
                    rows={3}
                    value={quickTeams}
                    onChange={(event) => setQuickTeams(event.target.value)}
                    className={textareaClassName}
                    placeholder={`부산대\n동아대\n부경대\n동서대${
                      form.teamCount >= 8 ? "\n동의대\n신라대\n고신대\n동명대" : ""
                    }${form.teamCount >= 16 ? "\n인제대\n경남정보대\n부산외대\n영산대\n부산교대\n창원대\n울산대\n해양대" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto shrink-0"
                    onClick={applyQuickTeams}
                  >
                    적용
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={syncWinnersToNextRound}>
            <Sparkles className="h-3.5 w-3.5" />
            승자 다음 라운드 반영
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {form.matches.map((match, matchIndex) => (
            <Card key={match.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {match.tournamentRoundText} · {match.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      팀명, 점수, 승자를 입력하면 미리보기에 바로 반영됩니다.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_140px]">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">경기명</Label>
                    <Input
                      value={match.name ?? ""}
                      onChange={(event) => updateMatch(matchIndex, "name", event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">라운드</Label>
                    <Input
                      value={match.tournamentRoundText ?? ""}
                      onChange={(event) =>
                        updateMatch(matchIndex, "tournamentRoundText", event.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">경기 상태</Label>
                    <select
                      className={selectClassName}
                      value={match.state}
                      onChange={(event) =>
                        updateMatch(matchIndex, "state", event.target.value as MatchState)
                      }
                    >
                      <option value="NO_PARTY">예정</option>
                      <option value="SCORE_DONE">점수 입력 완료</option>
                      <option value="PLAYED">경기 완료</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {match.participants.map((participant, participantIndex) => (
                    <div
                      key={participant.slot}
                      className="grid grid-cols-[1fr_82px_88px_36px] items-end gap-2 rounded-lg border bg-muted/20 p-3"
                    >
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">팀 {participantIndex + 1}</Label>
                        <Input
                          value={participant.name}
                          onChange={(event) =>
                            updateParticipant(
                              matchIndex,
                              participantIndex,
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="TBD"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">점수</Label>
                        <Input
                          value={participant.resultText ?? ""}
                          onChange={(event) =>
                            updateParticipant(
                              matchIndex,
                              participantIndex,
                              "resultText",
                              event.target.value
                            )
                          }
                          placeholder="-"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">상태</Label>
                        <select
                          className={selectClassName}
                          value={participant.status ?? ""}
                          onChange={(event) =>
                            updateParticipant(
                              matchIndex,
                              participantIndex,
                              "status",
                              (event.target.value || null) as BracketParticipant["status"]
                            )
                          }
                        >
                          <option value="">미정</option>
                          <option value="PLAYED">참가</option>
                          <option value="NO_SHOW">불참</option>
                          <option value="WALK_OVER">몰수승</option>
                          <option value="NO_PARTY">미정</option>
                        </select>
                      </div>
                      <label className="flex h-10 items-center justify-center rounded-md border bg-background text-xs font-medium">
                        <input
                          type="radio"
                          name={`winner-${match.id}`}
                          checked={participant.isWinner}
                          onChange={() => setWinner(matchIndex, participantIndex)}
                          className="sr-only"
                        />
                        <Trophy
                          className={`h-4 w-4 ${
                            participant.isWinner ? "text-amber-500" : "text-muted-foreground"
                          }`}
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit text-muted-foreground"
                  onClick={() => setWinner(matchIndex, null)}
                >
                  <X className="h-3.5 w-3.5" />
                  승자 선택 해제
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={reset} disabled={submitting}>
            {isEdit ? "취소" : "초기화"}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "수정 완료" : "저장"}
          </Button>
        </div>
      </form>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4" />
              미리보기
            </CardTitle>
            <CardDescription>
              현재 입력값 기준으로 앱의 웹 대진표와 같은 형태를 표시합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SportsBracketPreview matches={previewMatches} accentColor={form.accentColor} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SportsTournamentManager() {
  const [tournaments, setTournaments] = useState<TournamentFormState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<TournamentFormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TournamentFormState | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [tournamentResult, matchResult, participantResult] = await Promise.all([
      fetchTableData(TOURNAMENT_TABLE, {
        orderBy: "sort_order",
        ascending: true,
        pageSize: 200,
      }),
      fetchTableData(MATCH_TABLE, {
        orderBy: "match_number",
        ascending: true,
        pageSize: 600,
      }),
      fetchTableData(PARTICIPANT_TABLE, {
        orderBy: "slot",
        ascending: true,
        pageSize: 1200,
      }),
    ]);

    if (!tournamentResult.ok) {
      toast.error("스포츠 대회 목록을 불러오지 못했습니다: " + tournamentResult.reason);
      setIsLoading(false);
      return;
    }
    if (!matchResult.ok || !participantResult.ok) {
      toast.error("경기/참가자 데이터를 불러오지 못했습니다.");
      setIsLoading(false);
      return;
    }

    const rawTournaments = parseRows<RawTournament>(tournamentResult.data.rows);
    const rawMatches = parseRows<RawMatch>(matchResult.data.rows);
    const rawParticipants = parseRows<RawParticipant>(participantResult.data.rows);

    setTournaments(
      rawTournaments.map((tournament) =>
        toFormState(tournament, rawMatches, rawParticipants)
      )
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;

    for (const match of deleteTarget.matches) {
      for (const participant of match.participants) {
        if (participant.dbId) await deleteRecord(PARTICIPANT_TABLE, participant.dbId);
      }
    }
    for (const match of deleteTarget.matches) {
      if (match.dbId) await deleteRecord(MATCH_TABLE, match.dbId);
    }

    const result = await deleteRecord(TOURNAMENT_TABLE, deleteTarget.id);
    if (result.ok) {
      toast.success("대진표가 삭제되었습니다.");
      setDeleteTarget(null);
      if (editTarget?.id === deleteTarget.id) setEditTarget(null);
      load();
    } else {
      toast.error("삭제 실패: " + result.reason);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SportsTournamentForm
        editTarget={editTarget}
        onSuccess={load}
        onCancelEdit={() => setEditTarget(null)}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            등록된 대진표 ({isLoading ? "…" : tournaments.length})
          </h2>
          <button
            onClick={load}
            className="text-muted-foreground transition-colors hover:text-foreground"
            title="새로고침"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditTarget(null)}>
          <Plus className="h-3.5 w-3.5" />새 대진표
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <RotateCcw className="h-8 w-8 opacity-30" />
          <p className="text-sm">등록된 대진표가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: `${tournament.accentColor}22`,
                        color: tournament.accentColor,
                      }}
                    >
                      {tournament.badge}
                    </span>
                    <CardTitle className="mt-2 truncate text-base">
                      {tournament.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {tournament.year} · 정렬 {tournament.sortOrder}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditTarget(tournament);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(tournament)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  {tournament.matches.map((match) => (
                    <div key={match.id} className="rounded-md border bg-muted/20 p-2">
                      <p className="font-medium text-foreground">{match.tournamentRoundText}</p>
                      <p className="mt-1 truncate">{match.participants[0]?.name}</p>
                      <p className="truncate">{match.participants[1]?.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="대진표를 삭제하시겠습니까?"
        description={`"${deleteTarget?.title}" 대진표와 경기/참가자 데이터가 함께 삭제됩니다.`}
      />
    </div>
  );
}
