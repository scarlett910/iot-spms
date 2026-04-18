import { closeSession } from "@/lib/store"

export async function POST(req: Request) {
  const { sessionId } = await req.json()
  const hours = closeSession(sessionId)

  if (hours === null) return Response.json(
    { error: "Không tìm thấy session" }, { status: 404 }
  )

  return Response.json({ hours })
}