import type { ConnectionState } from "@/lib/types";

type ConnectionStatusProps = {
  status: ConnectionState;
  variant?: "header" | "chat";
};

const labels: Record<ConnectionState, string> = {
  connecting: "Подключение...",
  connected: "Подключено",
  disconnected: "Нет связи",
};

const dotColors: Record<ConnectionState, string> = {
  connecting: "bg-amber-400",
  connected: "bg-emerald-500",
  disconnected: "bg-red-500",
};

export function ConnectionStatus({
  status,
  variant = "chat",
}: ConnectionStatusProps) {
  const label =
    variant === "header" && status === "connected" ? "Онлайн" : labels[status];

  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span
        className={`h-2 w-2 rounded-full ${dotColors[status]}`}
        aria-hidden
      />
      {label}
    </span>
  );
}
