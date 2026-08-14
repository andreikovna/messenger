export type WireMessage = {
  id: string;
  text: string;
};

// Сервер умеет только echo, поэтому отправляем JSON с собственным id:
// вернувшееся сообщение со «своим» id считается подтверждением доставки (ACK),
// а не репликой консультанта.
export function serializeWireMessage(message: WireMessage): string {
  return JSON.stringify(message);
}

export function parseWireMessage(raw: string): WireMessage | null {
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
    // Не-JSON payload вызывающая сторона обрабатывает как обычный текст.
  }

  return null;
}
