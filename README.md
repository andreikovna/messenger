# Чат с консультантом

Тестовое задание: мини-страница `/chat` со списком встреч и WebSocket-чатом.

## Стек

- Next.js (App Router)
- TypeScript
- TanStack Query
- Tailwind CSS

## Запуск

```bash
npm install
npm run ws    # терминал 1 — WebSocket echo-сервер на ws://localhost:8081
npm run dev   # терминал 2 — Next.js на http://localhost:3000
```

Страница чата: [http://localhost:3000/chat](http://localhost:3000/chat)

## Архитектурные решения

### Граница Server / Client Components

| Слой | Файл | Роль |
|------|------|------|
| Server | `app/chat/page.tsx` | `prefetchQuery` + `HydrationBoundary` — начальные данные встреч попадают в HTML |
| Client | `components/MeetingsList.tsx` | `useQuery` + кнопка «Обновить» (`refetch`) без перезагрузки страницы |
| Client | `components/ChatShell.tsx` | WebSocket, оптимистичная отправка, автопереподключение |

**Почему так:** список встреч рендерится на сервере (SSR client-компонента с prefetched cache) — HTML виден даже при отключённом JS. Интерактив (обновление списка, чат) живёт на клиенте.

`app/providers.tsx` — Client Component-обёртка с `QueryClientProvider`, подключена в `app/layout.tsx`, потому что TanStack Query требует React Context, а layout по умолчанию — Server Component.

### TanStack Query для SSR

1. Server Component (`app/chat/page.tsx`) вызывает `prefetchQuery` с ключом `["meetings"]`
2. Состояние передаётся клиенту через `dehydrate` / `HydrationBoundary`
3. `MeetingsList` использует `useQuery` с тем же ключом — данные уже в кеше, loading-состояния нет
4. Кнопка «Обновить» вызывает `refetch()` — данные обновляются без reload страницы

### WebSocket и reconnect

- Echo-сервер: `server.js` (порт 8081, задержка 300 мс, обрыв каждые ~25–35 с)
- Хук `useWebSocket`: exponential backoff (1s → 2s → 4s → max 10s)
- Оптимистичная отправка: сообщение сразу в ленте со статусом `sending`
- При обрыве: pending → `failed`, баннер «Соединение потеряно»
- После reconnect: failed-сообщения переотправляются автоматически или по кнопке «Повторить»

### Адаптив

- **Desktop (≥1280px):** две колонки — встречи слева (~320px), чат справа
- **Планшет (768–1279px):** две колонки, компактнее
- **Мобилка (<768px):** одна колонка, встречи сворачиваются с «Показать все»

## Структура проекта

```
app/
  chat/page.tsx       # Server Component — точка входа
  api/meetings/       # GET /api/meetings — мок-данные
  providers.tsx       # QueryClientProvider
components/
  MeetingsList.tsx    # Список встреч (Client)
  ChatShell.tsx       # WebSocket + layout страницы (Client)
  ChatWidget.tsx      # UI чата (Client)
hooks/
  useWebSocket.ts     # Подключение и reconnect
lib/
  meetings.ts         # Данные и fetch-функции
  types.ts            # TypeScript-типы
server.js             # Echo WebSocket сервер
```
