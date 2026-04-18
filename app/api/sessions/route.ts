import { getSessions } from "@/lib/store"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const status = searchParams.get("status")   // "active" | "closed"

  let result = getSessions()
  if (userId) result = result.filter(s => s.userId === userId)
  if (status) result = result.filter(s => s.status === status)

  return Response.json({ sessions: result })
}