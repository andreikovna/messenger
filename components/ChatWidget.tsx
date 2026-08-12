"use client";

import { useEffect, useRef, useState } from "react";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MessageBubble } from "@/components/MessageBubble";
import type { ChatMessage, ConnectionState } from "@/lib/types";

type ChatWidgetProps = {
  connectionStatus: ConnectionState;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onRetry: (id: string) => void;
};

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
        <div className="text-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
            12 мая 2025
          </span>
        </div>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onRetry={onRetry} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 px-4 py-4 md:px-5"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Прикрепить файл"
          >
            <PaperclipIcon />
          </button>
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

function PaperclipIcon() {
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
        d="m16.5 7.5-7.8 7.8a3 3 0 1 1-4.2-4.2l8.5-8.5a4.5 4.5 0 0 1 6.4 6.4l-9 9a6 6 0 0 1-8.5-8.5l8.7-8.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
