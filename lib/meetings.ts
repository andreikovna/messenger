import type { Meeting } from "@/lib/types";

export const MEETINGS_QUERY_KEY = ["meetings"] as const;

export const meetingsData: Meeting[] = [
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

export async function fetchMeetings(): Promise<Meeting[]> {
  const response = await fetch("/api/meetings", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить встречи");
  }

  return response.json();
}

export function getMeetingsForServer(): Meeting[] {
  return meetingsData;
}
