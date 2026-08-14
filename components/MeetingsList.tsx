"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { MeetingCard } from "@/components/MeetingCard";
import { MeetingModal } from "@/components/MeetingModal";
import { fetchMeetings, MEETINGS_QUERY_KEY } from "@/lib/meetings";
import type { Meeting } from "@/lib/types";

const MOBILE_VISIBLE_COUNT = 2;
// Искусственная задержка для демо: /api/meetings — локальный мок и отвечает
// мгновенно, поэтому без неё спиннер "Обновление..." не успевает отрисоваться
// и непонятно, что refetch вообще произошёл.
const REFRESH_MIN_DELAY_MS = 800;

function formatHiddenMeetings(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} встречу`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} встречи`;
  }
  return `${count} встреч`;
}

export function MeetingsList() {
  const [expanded, setExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const { data, refetch, isError, error } = useQuery({
    queryKey: MEETINGS_QUERY_KEY,
    queryFn: fetchMeetings,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        new Promise<void>((resolve) => {
          setTimeout(resolve, REFRESH_MIN_DELAY_MS);
        }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const meetings = data ?? [];
  const visibleMeetings = expanded
    ? meetings
    : meetings.slice(0, MOBILE_VISIBLE_COUNT);
  const hiddenCount = Math.max(meetings.length - MOBILE_VISIBLE_COUNT, 0);

  const listAnimationClass = isRefreshing
    ? "opacity-50 pointer-events-none animate-pulse"
    : "opacity-100";

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:px-5">
        <h2 className="text-lg font-semibold text-slate-900">Ваши встречи</h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshIcon spinning={isRefreshing} />
          {isRefreshing ? "Обновление..." : "Обновить"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        {isError ? (
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Ошибка загрузки"}
          </p>
        ) : (
          <>
            <div
              className={`space-y-3 transition-opacity duration-300 md:hidden ${listAnimationClass}`}
            >
              {visibleMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onClick={() => setSelectedMeeting(meeting)}
                />
              ))}
              {hiddenCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  disabled={isRefreshing}
                  className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60"
                >
                  {expanded
                    ? "Свернуть"
                    : `Показать (ещё ${formatHiddenMeetings(hiddenCount)})`}
                </button>
              ) : null}
            </div>

            <div
              className={`hidden space-y-3 transition-opacity duration-300 md:block ${listAnimationClass}`}
            >
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onClick={() => setSelectedMeeting(meeting)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <MeetingModal
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
      />
    </section>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      aria-hidden
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 4v6h6M20 20v-6h-6M5.6 18.4A8 8 0 1 0 6 10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
