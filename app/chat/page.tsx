import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { ChatShell } from "@/components/ChatShell";
import {
  getMeetingsForServer,
  MEETINGS_QUERY_KEY,
} from "@/lib/meetings";

export default async function ChatPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: MEETINGS_QUERY_KEY,
    queryFn: getMeetingsForServer,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChatShell />
    </HydrationBoundary>
  );
}
