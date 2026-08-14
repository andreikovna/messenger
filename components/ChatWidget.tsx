"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MessageBubble } from "@/components/MessageBubble";
import type { ChatMessage, ConnectionState } from "@/lib/types";

const MS_IN_DAY = 24 * 60 * 60 * 1000;

type ChatWidgetProps = {
  connectionStatus: ConnectionState;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onRetry: (id: string) => void;
};

type DayGroup = {
  key: string;
  label: string;
  messages: ChatMessage[];
};

function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

// Относительные подписи («Сегодня») заодно спасают от hydration mismatch:
// сервер и клиент могут быть в разных таймзонах, но оба видят сообщение
// как отправленное сегодня и рендерят одинаковый текст.
function formatDayLabel(date: Date, now: Date): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / MS_IN_DAY);

  if (diffDays <= 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function groupByDay(messages: ChatMessage[]): DayGroup[] {
  const now = new Date();

  return messages.reduce<DayGroup[]>((groups, message) => {
    const key = toDayKey(message.timestamp);
    const lastGroup = groups.at(-1);

    if (lastGroup?.key === key) {
      lastGroup.messages.push(message);
    } else {
      groups.push({
        key,
        label: formatDayLabel(message.timestamp, now),
        messages: [message],
      });
    }

    return groups;
  }, []);
}

export function ChatWidget({
  connectionStatus,
  messages,
  onSend,
  onRetry,
}: ChatWidgetProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, connectionStatus]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend(input);
    setInput("");
  };

  return (
    <section className="flex h-full min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:px-5">
        <h2 className="text-lg font-semibold text-slate-900">Чат</h2>
        <ConnectionStatus status={connectionStatus} />
      </div>

      {connectionStatus === "disconnected" ? (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700 md:px-5">
          Соединение потеряно. Переподключаемся автоматически...
        </div>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-5">
        {groupByDay(messages).map((group) => (
          <Fragment key={group.key}>
            <div className="text-center">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                {group.label}
              </span>
            </div>
            {group.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onRetry={onRetry}
              />
            ))}
          </Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 px-4 py-4 md:px-5"
      >
        <div className="flex items-center gap-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Введите сообщение..."
            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Отправить сообщение"
          >
            <SendIcon />
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">
          Соединение защищено. Сообщения доставляются в реальном времени.
        </p>
      </form>
    </section>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
