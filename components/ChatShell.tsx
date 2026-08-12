"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatWidget } from "@/components/ChatWidget";
import { Header } from "@/components/Header";
import { MeetingsList } from "@/components/MeetingsList";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { ChatMessage } from "@/lib/types";

function createMessage(
  text: string,
  sender: ChatMessage["sender"],
  status: ChatMessage["status"] = "delivered",
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    text,
    sender,
    status,
    timestamp: new Date(),
  };
}

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "Здравствуйте! Я ваш консультант. Чем могу помочь?",
      "consultant",
    ),
  ]);
  const pendingByTextRef = useRef<Map<string, string>>(new Map());

  const markMessageStatus = useCallback(
    (id: string, status: ChatMessage["status"]) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, status } : message,
        ),
      );
    },
    [],
  );

  const handleIncomingMessage = useCallback(
    (text: string) => {
      const pendingId = pendingByTextRef.current.get(text);

      if (pendingId) {
        pendingByTextRef.current.delete(text);
        markMessageStatus(pendingId, "delivered");
      }

      setMessages((current) => [
        ...current,
        createMessage(text, "consultant"),
      ]);
    },
    [markMessageStatus],
  );

  const messagesRef = useRef(messages);
  const sendUserMessageRef = useRef<
    (text: string, existingId?: string) => void
  >(() => {});

  const { status, sendMessage } = useWebSocket({
    onMessage: handleIncomingMessage,
    onOpen: () => {
      const failedMessages = messagesRef.current.filter(
        (message) => message.sender === "user" && message.status === "failed",
      );

      for (const message of failedMessages) {
        sendUserMessageRef.current(message.text, message.id);
      }
    },
    onClose: () => {
      setMessages((current) =>
        current.map((message) =>
          message.sender === "user" && message.status === "sending"
            ? { ...message, status: "failed" }
            : message,
        ),
      );
    },
  });

  const sendUserMessage = useCallback(
    (text: string, existingId?: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      const messageId = existingId ?? crypto.randomUUID();
      const isRetry = Boolean(existingId);

      if (!isRetry) {
        setMessages((current) => [
          ...current,
          {
            id: messageId,
            text: trimmed,
            sender: "user",
            status: "sending",
            timestamp: new Date(),
          },
        ]);
      } else {
        markMessageStatus(messageId, "sending");
      }

      const sent = sendMessage(trimmed);

      if (sent) {
        pendingByTextRef.current.set(trimmed, messageId);
      } else {
        markMessageStatus(messageId, "failed");
      }
    },
    [markMessageStatus, sendMessage],
  );

  sendUserMessageRef.current = sendUserMessage;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Header connectionStatus={status} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 md:p-6 xl:flex-row xl:gap-6">
        <aside className="w-full shrink-0 xl:w-[320px]">
          <MeetingsList />
        </aside>
        <div className="min-h-[520px] flex-1">
          <ChatWidget
            connectionStatus={status}
            messages={messages}
            onRetry={(id) => {
              const failedMessage = messages.find((item) => item.id === id);
              if (failedMessage) {
                sendUserMessage(failedMessage.text, id);
              }
            }}
            onSend={sendUserMessage}
          />
        </div>
      </main>
    </div>
  );
}
