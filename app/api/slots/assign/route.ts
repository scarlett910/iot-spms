import { checkin } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: Request) {
  const { userId, role } = await req.json()
  if (!userId || !role) return Response.json(
    { error: "Thiếu userId hoặc role" }, { status: 400 }
  )

  const subZoneId = checkin(userId, role)
  if (!subZoneId) return Response.json(
    { error: "Bãi xe đã đầy" }, { status: 409 }
  )

  return Response.json({ subZoneId })
}