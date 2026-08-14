"use client";

import { ChatWidget } from "@/components/ChatWidget";
import { Header } from "@/components/Header";
import { MeetingsList } from "@/components/MeetingsList";
import { useChat } from "@/hooks/useChat";

export function ChatShell() {
  const { status, messages, sendMessage, retryMessage } = useChat();

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
            onRetry={retryMessage}
            onSend={sendMessage}
          />
        </div>
      </main>
    </div>
  );
}
