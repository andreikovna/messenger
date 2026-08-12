import { meetingsData } from "@/lib/meetings";

export async function GET() {
  return Response.json(meetingsData);
}
