"use client";

import { useCallback, useEffect, useRef } from "react";

type Timeout = ReturnType<typeof setTimeout>;

/**
 * Реестр отложенных задач с двойным ключом: id сообщения + имя таймера.
 * Нужен, чтобы искусственные задержки чата можно было отменять точечно —
 * при обрыве связи, при повторной отправке и при размонтировании.
 */
export function useTimers() {
  const timersRef = useRef(new Map<string, Map<string, Timeout>>());

  const clear = useCallback((id: string, name?: string) => {
    const byName = timersRef.current.get(id);

    if (!byName) {
      return;
    }

    if (name === undefined) {
      for (const timeout of byName.values()) {
        clearTimeout(timeout);
      }
      timersRef.current.delete(id);
      return;
    }

    const timeout = byName.get(name);

    if (timeout !== undefined) {
      clearTimeout(timeout);
      byName.delete(name);
    }

    if (byName.size === 0) {
      timersRef.current.delete(id);
    }
  }, []);

  const set = useCallback(
    (id: string, name: string, callback: () => void, delay: number) => {
      clear(id, name);

      const timeout = setTimeout(() => {
        clear(id, name);
        callback();
      }, delay);

      const byName = timersRef.current.get(id) ?? new Map<string, Timeout>();
      byName.set(name, timeout);
      timersRef.current.set(id, byName);
    },
    [clear],
  );

  const clearByName = useCallback(
    (name: string) => {
      for (const id of [...timersRef.current.keys()]) {
        clear(id, name);
      }
    },
    [clear],
  );

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      for (const byName of timers.values()) {
        for (const timeout of byName.values()) {
          clearTimeout(timeout);
        }
      }
      timers.clear();
    };
  }, []);

  return { set, clear, clearByName };
}
