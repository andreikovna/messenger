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
Корень (`/`) редиректит на `/chat`.

## Архитектурные решения

### Граница Server / Client Components

| Слой | Файл | Роль |
|------|------|------|
| Server | `app/chat/page.tsx` | `prefetchQuery` + `HydrationBoundary` — начальные данные встреч попадают в HTML |
| Client | `components/MeetingsList.tsx` | `useQuery`, кнопка «Обновить», открытие модалки редактирования |
| Client | `components/MeetingModal.tsx` | `useMutation` — форма редактирования встречи |
| Client | `components/ChatShell.tsx` | WebSocket, оптимистичная отправка, автопереподключение |

**Почему так:** список встреч рендерится на сервере (SSR client-компонента с prefetched cache) — HTML виден даже при отключённом JS. Интерактив (обновление списка, редактирование, чат) живёт на клиенте.

`app/providers.tsx` — Client Component-обёртка с `QueryClientProvider`, подключена в `app/layout.tsx`, потому что TanStack Query требует React Context, а layout по умолчанию — Server Component.

### TanStack Query для SSR и мутаций

**Чтение (SSR + refetch):**

1. Server Component (`app/chat/page.tsx`) вызывает `prefetchQuery` с ключом `["meetings"]`
2. Состояние передаётся клиенту через `dehydrate` / `HydrationBoundary`
3. `MeetingsList` использует `useQuery` с тем же ключом — данные уже в кеше, loading-состояния нет
4. Кнопка «Обновить» вызывает `refetch()` — перезапрос `GET /api/meetings` без reload страницы

**Запись (редактирование встречи):**

1. Клик по `MeetingCard` открывает `MeetingModal` (portal в `document.body`)
2. `useMutation` вызывает `PATCH /api/meetings/[id]`
3. После успеха — `invalidateQueries({ queryKey: ["meetings"] })`, модалка закрывается
4. Мок-данные хранятся in-memory на сервере (`globalThis`); правки через PATCH сохраняются до перезапуска dev-сервера

### WebSocket и reconnect

- Echo-сервер: `server.js` (порт 8081, задержка 300 мс, обрыв каждые ~25–35 с)
- Хук `useWebSocket`: exponential backoff (1s → 2s → 4s → max 10s)
- Оптимистичная отправка: сообщение сразу в ленте со статусом `sending`
- При обрыве: pending → `failed`, баннер «Соединение потеряно»
- После reconnect: failed-сообщения переотправляются автоматически или по кнопке «Повторить»
- Статус соединения отображается в `Header` и `ChatWidget` через `ConnectionStatus`

### Декомпозиция UI

- `MeetingCard` — карточка встречи (статус, дата, клик → модалка)
- `MessageBubble` — пузырь сообщения со статусом доставки и кнопкой «Повторить»
- `Header` — шапка страницы с индикатором «Онлайн»
- `ConnectionStatus` — переиспользуемый индикатор состояния WebSocket

### Адаптив

- **Desktop (≥1280px):** две колонки — встречи слева (~320px), чат справа
- **Планшет (768–1279px):** две колонки, компактнее
- **Мобилка (<768px):** одна колонка, встречи сворачиваются с «Показать (ещё N …)» / «Свернуть»

## Структура проекта

```
app/
  page.tsx                    # редирект на /chat
  chat/page.tsx               # Server Component — точка входа
  api/meetings/
    route.ts                  # GET /api/meetings — мок-данные
    [id]/route.ts             # PATCH /api/meetings/:id — обновление встречи
  providers.tsx               # QueryClientProvider
components/
  MeetingsList.tsx            # Список встреч (Client)
  MeetingCard.tsx             # Карточка встречи
  MeetingModal.tsx            # Модалка редактирования (Client)
  ChatShell.tsx               # WebSocket + layout страницы (Client)
  ChatWidget.tsx              # UI чата (Client)
  MessageBubble.tsx           # Пузырь сообщения
  Header.tsx                  # Шапка страницы
  ConnectionStatus.tsx        # Индикатор WebSocket-соединения
hooks/
  useWebSocket.ts             # Подключение и reconnect
lib/
  meetings.ts                 # Данные, fetch и update-функции
  types.ts                    # TypeScript-типы
server.js                     # Echo WebSocket сервер
```
