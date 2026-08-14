"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConnectionState } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8081";
const MAX_RECONNECT_DELAY = 10_000;

type UseWebSocketOptions = {
  onMessage?: (message: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

export function useWebSocket({
  onMessage,
  onOpen,
  onClose,
}: UseWebSocketOptions = {}) {
  const [status, setStatus] = useState<ConnectionState>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const shouldReconnectRef = useRef(true);
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
  }, [onMessage, onOpen, onClose]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    clearReconnectTimeout();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("connecting");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      setStatus("connected");
      onOpenRef.current?.();
    };

    ws.onmessage = (event) => {
      onMessageRef.current?.(event.data.toString());
    };

    ws.onclose = () => {
      wsRef.current = null;
      setStatus("disconnected");
      onCloseRef.current?.();

      if (!shouldReconnectRef.current) {
        return;
      }

      const delay = Math.min(
        1000 * 2 ** reconnectAttemptRef.current,
        MAX_RECONNECT_DELAY,
      );
      reconnectAttemptRef.current += 1;

      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [clearReconnectTimeout]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimeout();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [clearReconnectTimeout, connect]);

  const send = useCallback((data: string) => {
    const ws = wsRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    ws.send(data);
    return true;
  }, []);

  return {
    status,
    send,
  };
}
