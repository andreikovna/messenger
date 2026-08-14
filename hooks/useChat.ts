"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { ChatMessage } from "@/lib/types";

type WireMessage = {
  id: string;
  text: string;
};

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

function parseWireMessage(raw: string): WireMessage | null {
  try {
    const parsed = JSON.parse(raw) as Partial<WireMessage>;
    if (
      typeof parsed?.id === "string" &&
      typeof parsed?.text === "string" &&
      parsed.id &&
      parsed.text
    ) {
      return { id: parsed.id, text: parsed.text };
    }
  } catch {
    // Non-JSON payloads are treated as plain text below.
  }

  return null;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createMessage(
      "Здравствуйте! Я ваш консультант. Чем могу помочь?",
      "consultant",
    ),
  ]);
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef(messages);
  const sendUserMessageRef = useRef<(text: string, existingId?: string) => void>(
    () => {},
  );

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
    (raw: string) => {
      const wire = parseWireMessage(raw);

      if (wire && pendingIdsRef.current.has(wire.id)) {
        pendingIdsRef.current.delete(wire.id);
        markMessageStatus(wire.id, "delivered");
        setMessages((current) => [
          ...current,
          createMessage(wire.text, "consultant"),
        ]);
        return;
      }

      const text = wire?.text ?? raw;
      setMessages((current) => [...current, createMessage(text, "consultant")]);
    },
    [markMessageStatus],
  );

  const { status, send } = useWebSocket({
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
      pendingIdsRef.current.clear();
      setMessages((current) =>
        current.map((message) =>
          message.sender === "user" && message.status === "sending"
            ? { ...message, status: "failed" }
            : message,
        ),
      );
    },
  });

  const sendMessage = useCallback(
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

      const payload: WireMessage = { id: messageId, text: trimmed };
      const sent = send(JSON.stringify(payload));

      if (sent) {
        pendingIdsRef.current.add(messageId);
      } else {
        markMessageStatus(messageId, "failed");
      }
    },
    [markMessageStatus, send],
  );

  const retryMessage = useCallback(
    (id: string) => {
      const failedMessage = messagesRef.current.find((item) => item.id === id);
      if (failedMessage) {
        sendMessage(failedMessage.text, id);
      }
    },
    [sendMessage],
  );

  useEffect(() => {
    sendUserMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  return {
    status,
    messages,
    sendMessage,
    retryMessage,
  };
}
