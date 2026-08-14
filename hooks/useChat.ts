"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTimers } from "@/hooks/useTimers";
import { useWebSocket } from "@/hooks/useWebSocket";
import { parseWireMessage, serializeWireMessage } from "@/lib/chatWire";
import type { ChatMessage, MessageStatus } from "@/lib/types";

// Оба таймаута — искусственные, только для наглядности демо.
// Echo-сервер отвечает за 300 мс, поэтому без них статус "Отправляется"
// мелькает и оптимистичную отправку на UI не видно.
// Сеть при этом не тормозим: задерживается только смена статуса на экране.
const MIN_SENDING_VISIBLE_MS = 800;
// Пауза между "Доставлено" и ответом консультанта, чтобы ACK успели заметить
// до того, как в ленту добавится echo.
const REPLY_AFTER_DELIVERED_MS = 350;

const DELIVER_TIMER = "deliver";
const REPLY_TIMER = "reply";

const GREETING = "Здравствуйте! Я ваш консультант. Чем могу помочь?";

function createConsultantMessage(text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    text,
    sender: "consultant",
    status: "delivered",
    timestamp: new Date(),
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createConsultantMessage(GREETING),
  ]);
  // Сообщения, ожидающие ACK: id → время отправки (нужно для MIN_SENDING_VISIBLE_MS).
  const pendingRef = useRef(new Map<string, number>());
  const { set: setTimer, clear: clearTimers, clearByName } = useTimers();

  const setMessageStatus = useCallback((id: string, status: MessageStatus) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, status } : message,
      ),
    );
  }, []);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((current) => [...current, message]);
  }, []);

  const handleIncomingMessage = useCallback(
    (raw: string) => {
      const wire = parseWireMessage(raw);
      const sentAt = wire ? pendingRef.current.get(wire.id) : undefined;

      if (!wire || sentAt === undefined) {
        appendMessage(createConsultantMessage(wire?.text ?? raw));
        return;
      }

      pendingRef.current.delete(wire.id);

      // Придерживаем ACK, чтобы порядок на экране был
      // "Отправляется" → "Доставлено" → ответ консультанта.
      const remaining = Math.max(
        0,
        MIN_SENDING_VISIBLE_MS - (Date.now() - sentAt),
      );

      setTimer(
        wire.id,
        DELIVER_TIMER,
        () => {
          setMessageStatus(wire.id, "delivered");
          setTimer(
            wire.id,
            REPLY_TIMER,
            () => appendMessage(createConsultantMessage(wire.text)),
            REPLY_AFTER_DELIVERED_MS,
          );
        },
        remaining,
      );
    },
    [appendMessage, setMessageStatus, setTimer],
  );

  // onOpen объявляется раньше, чем в этом рендере появится sendMessage,
  // поэтому обращаемся к актуальной версии через ref.
  const flushOutboxRef = useRef<() => void>(() => {});

  const { status, send } = useWebSocket({
    onMessage: handleIncomingMessage,
    onOpen: () => flushOutboxRef.current(),
    onClose: () => {
      pendingRef.current.clear();

      // Отменяем только отложенные "Доставлено" — их ACK больше не актуален.
      // Таймеры ответа консультанта не трогаем: те сообщения сервер уже принял.
      clearByName(DELIVER_TIMER);

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

      const id = existingId ?? crypto.randomUUID();

      // Автоповтор после reconnect и клик по «Повторить» могут совпасть —
      // второй отправки не делаем, иначе сервер пришлёт echo дважды.
      if (pendingRef.current.has(id)) {
        return;
      }

      clearTimers(id);

      if (existingId) {
        setMessageStatus(id, "sending");
      } else {
        appendMessage({
          id,
          text: trimmed,
          sender: "user",
          status: "sending",
          timestamp: new Date(),
        });
      }

      if (send(serializeWireMessage({ id, text: trimmed }))) {
        pendingRef.current.set(id, Date.now());
      } else {
        setMessageStatus(id, "failed");
      }
    },
    [appendMessage, clearTimers, send, setMessageStatus],
  );

  const retryMessage = useCallback(
    (id: string) => {
      const message = messages.find((item) => item.id === id);

      if (message) {
        sendMessage(message.text, id);
      }
    },
    [messages, sendMessage],
  );

  // Исходящая очередь: всё, что не уехало, отправляется заново на onOpen.
  useEffect(() => {
    flushOutboxRef.current = () => {
      for (const message of messages) {
        if (message.sender === "user" && message.status === "failed") {
          sendMessage(message.text, message.id);
        }
      }
    };
  }, [messages, sendMessage]);

  return {
    status,
    messages,
    sendMessage,
    retryMessage,
  };
}
