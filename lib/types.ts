export type MeetingStatus = "scheduled" | "completed" | "cancelled";

export type Meeting = {
  id: string;
  title: string;
  date: string;
  status: MeetingStatus;
};

export type MessageSender = "user" | "consultant";

export type MessageStatus = "sending" | "delivered" | "failed";

export type ChatMessage = {
  id: string;
  text: string;
  sender: MessageSender;
  status: MessageStatus;
  timestamp: Date;
};

export type ConnectionState = "connecting" | "connected" | "disconnected";
