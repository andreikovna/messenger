import type { Meeting, MeetingStatus } from "@/lib/types";

export const MEETINGS_QUERY_KEY = ["meetings"] as const;

export type UpdateMeetingPayload = {
  title?: string;
  date?: string;
  status?: MeetingStatus;
};

const INITIAL_MEETINGS_DATA: Meeting[] = [
  {
    id: "1",
    title: "Обсуждение проекта",
    date: "2025-05-12T14:00:00Z",
    status: "scheduled",
  },
  {
    id: "2",
    title: "Консультация по интеграции",
    date: "2025-05-09T11:30:00Z",
    status: "completed",
  },
  {
    id: "3",
    title: "Демо платформы",
    date: "2025-05-07T16:00:00Z",
    status: "completed",
  },
  {
    id: "4",
    title: "Ревью документации",
    date: "2025-05-05T10:00:00Z",
    status: "cancelled",
  },
  {
    id: "5",
    title: "Планирование спринта",
    date: "2025-05-01T13:00:00Z",
    status: "scheduled",
  },
];

const MEETINGS_STORE_KEY = "__messengerMeetingsStore__";

function cloneMeetings(meetings: Meeting[]): Meeting[] {
  return meetings.map((meeting) => ({ ...meeting }));
}

export function getMeetingsStore(): Meeting[] {
  const globalStore = globalThis as typeof globalThis & {
    [MEETINGS_STORE_KEY]?: Meeting[];
  };

  if (!globalStore[MEETINGS_STORE_KEY]) {
    globalStore[MEETINGS_STORE_KEY] = cloneMeetings(INITIAL_MEETINGS_DATA);
  }

  return globalStore[MEETINGS_STORE_KEY]!;
}

export function getMeetings(): Meeting[] {
  return cloneMeetings(getMeetingsStore());
}

export function findMeetingIndex(id: string): number {
  return getMeetingsStore().findIndex((meeting) => meeting.id === id);
}

export async function fetchMeetings(): Promise<Meeting[]> {
  const response = await fetch("/api/meetings", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить встречи");
  }

  return response.json();
}

export async function updateMeeting(
  id: string,
  payload: UpdateMeetingPayload,
): Promise<Meeting> {
  const response = await fetch(`/api/meetings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Не удалось сохранить встречу");
  }

  return response.json();
}

export function getMeetingsForServer(): Meeting[] {
  return getMeetings();
}
