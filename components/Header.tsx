import { ConnectionStatus } from "@/components/ConnectionStatus";
import type { ConnectionState } from "@/lib/types";

type HeaderProps = {
  connectionStatus?: ConnectionState;
};

export function Header({ connectionStatus = "connected" }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 xl:hidden"
            aria-label="Меню"
          >
            <MenuIcon />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ChatIcon />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
              Чат с консультантом
            </h1>
          </div>
        </div>
        <ConnectionStatus status={connectionStatus} variant="header" />
      </div>
    </header>
  );
}

function ChatIcon() {
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
        d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8-1.01 0-1.98-.14-2.9-.4L3 21l1.4-4.2C3.5 15.4 3 13.8 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
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
        d="M4 7h16M4 12h16M4 17h16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
