import { getMeetings } from "@/lib/meetings";

export async function GET() {
  return Response.json(getMeetings());
}
