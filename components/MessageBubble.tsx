import type { ChatMessage, MessageStatus } from "@/lib/types";

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
          className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-6 transition-colors duration-300 ${
            isUser
              ? `rounded-br-md text-white ${
                  message.status === "sending" ? "bg-blue-400" : "bg-blue-600"
                }`
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
          } ${message.status === "failed" ? "opacity-80 ring-2 ring-red-200" : ""}`}
        >
          {message.text}
        </div>
        <div
          className={`mt-1 flex items-center gap-2 text-xs ${
            isUser ? "justify-end" : "justify-start"
          } ${
            message.status === "failed"
              ? "text-red-500"
              : message.status === "sending"
                ? "text-blue-500"
                : "text-slate-400"
          }`}
        >
          {isUser ? (
            <DeliveryStatus
              status={message.status}
              timestamp={message.timestamp}
              onRetry={onRetry ? () => onRetry(message.id) : undefined}
            />
          ) : (
            <span>{formatTime(message.timestamp)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function DeliveryStatus({
  status,
  timestamp,
  onRetry,
}: {
  status: MessageStatus;
  timestamp: Date;
  onRetry?: () => void;
}) {
  if (status === "sending") {
    return (
      <>
        <SpinnerIcon />
        <span className="font-medium">Отправляется</span>
      </>
    );
  }

  if (status === "failed") {
    return (
      <>
        <span className="font-medium">Не отправлено</span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="font-medium text-red-600 hover:text-red-700"
          >
            Повторить
          </button>
        ) : null}
      </>
    );
  }

  return (
    <>
      <span>{formatTime(timestamp)}</span>
      <DeliveryIcon />
      <span className="font-medium text-blue-500">Доставлено</span>
    </>
  );
}

function SpinnerIcon() {
  return (
    <svg
      aria-hidden
      className="h-3.5 w-3.5 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4Z"
      />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg
      aria-hidden
      className="h-3.5 w-3.5 text-blue-500"
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
      <path
        d="M8 12.5 13.5 18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
