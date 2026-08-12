"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MeetingCard } from "@/components/MeetingCard";
import { fetchMeetings, MEETINGS_QUERY_KEY } from "@/lib/meetings";

const MOBILE_VISIBLE_COUNT = 2;

export function MeetingsList() {
  const [expanded, setExpanded] = useState(false);
  const { data, isFetching, refetch, isError, error } = useQuery({
    queryKey: MEETINGS_QUERY_KEY,
    queryFn: fetchMeetings,
  });

  const meetings = data ?? [];
  const visibleMeetings = expanded
    ? meetings
    : meetings.slice(0, MOBILE_VISIBLE_COUNT);
  const hiddenCount = Math.max(meetings.length - MOBILE_VISIBLE_COUNT, 0);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:px-5">
        <h2 className="text-lg font-semibold text-slate-900">Ваши встречи</h2>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshIcon spinning={isFetching} />
          Обновить
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        {isError ? (
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "Ошибка загрузки"}
          </p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {visibleMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
              {!expanded && hiddenCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Показать все ({hiddenCount})
                </button>
              ) : null}
            </div>

            <div className="hidden space-y-3 md:block">
              {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </>
        )}
      </div>
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
