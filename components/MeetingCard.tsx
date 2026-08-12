import type { Meeting, MeetingStatus } from "@/lib/types";

const statusLabels: Record<MeetingStatus, string> = {
  scheduled: "Запланирована",
  completed: "Завершена",
  cancelled: "Отменена",
};

const statusStyles: Record<MeetingStatus, string> = {
  scheduled: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  completed: "bg-slate-100 text-slate-600 ring-slate-200",
  cancelled: "bg-red-50 text-red-600 ring-red-100",
};

function formatMeetingDate(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

type MeetingCardProps = {
  meeting: Meeting;
  onClick?: () => void;
};

export function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  return (
    <article
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <CalendarIcon />
            <time className="text-sm" dateTime={meeting.date}>
              {formatMeetingDate(meeting.date)}
            </time>
          </div>
          <h3 className="truncate text-base font-medium text-slate-900">
            {meeting.title}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[meeting.status]}`}
        >
          {statusLabels[meeting.status]}
        </span>
      </div>
    </article>
  );
}

function CalendarIcon() {
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
        d="M8 2v4m8-4v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
