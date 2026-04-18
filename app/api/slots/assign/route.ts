import { assignSlot } from "@/lib/store"

export async function POST(req: Request) {
  const { userId } = await req.json()
  if (!userId) return Response.json(
    { error: "Thiếu userId" }, { status: 400 }
  )

  const slotId = assignSlot(userId)
  if (!slotId) return Response.json(
    { error: "Bãi xe đã đầy" }, { status: 409 }
  )

  return Response.json({ slotId })
}