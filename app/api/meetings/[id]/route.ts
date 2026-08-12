import { findMeetingIndex, getMeetingsStore } from "@/lib/meetings";
import type { MeetingStatus } from "@/lib/types";

const validStatuses: MeetingStatus[] = [
  "scheduled",
  "completed",
  "cancelled",
];

type UpdateMeetingBody = {
  title?: string;
  date?: string;
  status?: MeetingStatus;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const meetingIndex = findMeetingIndex(id);

  if (meetingIndex === -1) {
    return Response.json({ error: "Meeting not found" }, { status: 404 });
  }

  const body = (await request.json()) as UpdateMeetingBody;
  const currentMeeting = getMeetingsStore()[meetingIndex];

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }
    currentMeeting.title = title;
  }

  if (body.date !== undefined) {
    const parsedDate = new Date(body.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return Response.json({ error: "Invalid date" }, { status: 400 });
    }
    currentMeeting.date = parsedDate.toISOString();
  }

  if (body.status !== undefined) {
    if (!validStatuses.includes(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    currentMeeting.status = body.status;
  }

  return Response.json({ ...currentMeeting });
}
