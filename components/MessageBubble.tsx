import type { ChatMessage } from "@/lib/types";

type MessageBubbleProps = {
  message: ChatMessage;
  onRetry?: (id: string) => void;
};

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isUser ? "text-right" : "text-left"}`}>
        {!isUser ? (
          <p className="mb-1 text-xs font-medium text-slate-500">Консультант</p>
        ) : null}
        <div
          className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-6 ${
            isUser
              ? "rounded-br-md bg-blue-600 text-white"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
          } ${message.status === "failed" ? "opacity-80 ring-2 ring-red-200" : ""}`}
        >
          {message.text}
        </div>
        <div
          className={`mt-1 flex items-center gap-2 text-xs text-slate-400 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span>{formatTime(message.timestamp)}</span>
          {isUser ? <DeliveryIcon status={message.status} /> : null}
          {message.status === "failed" && onRetry ? (
            <button
              type="button"
              onClick={() => onRetry(message.id)}
              className="font-medium text-red-600 hover:text-red-700"
            >
              Повторить
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DeliveryIcon({ status }: { status: ChatMessage["status"] }) {
  if (status === "failed") {
    return <span className="text-red-500">!</span>;
  }

  return (
    <svg
      aria-hidden
      className={`h-3.5 w-3.5 ${status === "delivered" ? "text-blue-500" : "text-slate-300"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 12.5 9.5 18 20 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {status === "delivered" ? (
        <path
          d="M8 12.5 13.5 18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}
