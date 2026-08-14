"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  MEETINGS_QUERY_KEY,
  updateMeeting,
  type UpdateMeetingPayload,
} from "@/lib/meetings";
import type { Meeting, MeetingStatus } from "@/lib/types";

const statusLabels: Record<MeetingStatus, string> = {
  scheduled: "Запланирована",
  completed: "Завершена",
  cancelled: "Отменена",
};

type MeetingModalProps = {
  meeting: Meeting | null;
  onClose: () => void;
};

type MeetingModalContentProps = {
  meeting: Meeting;
  onClose: () => void;
};

function toDateTimeLocalValue(isoDate: string) {
  const date = new Date(isoDate);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

function MeetingModalContent({ meeting, onClose }: MeetingModalContentProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(meeting.title);
  const [date, setDate] = useState(toDateTimeLocalValue(meeting.date));
  const [status, setStatus] = useState(meeting.status);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleClose]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateMeetingPayload) =>
      updateMeeting(meeting.id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
      handleClose();
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    mutation.mutate({
      title: title.trim(),
      date: fromDateTimeLocalValue(date),
      status,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 transition-opacity"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-modal-title"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              id="meeting-modal-title"
              className="text-xl font-semibold text-slate-900"
            >
              Встреча
            </h2>
            <p className="mt-1 text-sm text-slate-500">ID: {meeting.id}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Название
            </span>
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Дата и время
            </span>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Статус
            </span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as MeetingStatus)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {(Object.keys(statusLabels) as MeetingStatus[]).map(
                (statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusLabels[statusOption]}
                  </option>
                ),
              )}
            </select>
          </label>

          {mutation.isError ? (
            <p className="text-sm text-red-600">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Не удалось сохранить изменения"}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {mutation.isPending ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MeetingModal({ meeting, onClose }: MeetingModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Portal нужен document.body — рендерим только после монтирования.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only portal
    setMounted(true);
  }, []);

  if (!mounted || !meeting) {
    return null;
  }

  return createPortal(
    <MeetingModalContent key={meeting.id} meeting={meeting} onClose={onClose} />,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        d="M6 18 18 6M6 6l12 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
