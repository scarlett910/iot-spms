import { checkin, checkout, getCurrentSubZone, getSettings } from "@/lib/store"
import { users } from "@/data/mock"

export async function POST(req: Request) {
  const { userId } = await req.json()
  if (!userId) return Response.json(
    { error: "Thiếu userId" }, { status: 400 }
  )

  const user = users.find(u => u.id === userId)
  if (!user) return Response.json(
    { error: "Không tìm thấy người dùng" }, { status: 404 }
  )

  const currentZone = getCurrentSubZone(userId)

  if (!currentZone) {
    // Chưa có session → checkin
    const subZoneId = checkin(userId, user.role)
    if (!subZoneId) return Response.json(
      { error: "Bãi xe đã đầy" }, { status: 409 }
    )
    return Response.json({
      action:     "checkin",
      userId,
      userName:   user.name,
      role:       user.role,
      subZoneId,
      time:       new Date().toISOString(),
    })
  } else {
    // Đang có session → checkout
    const fee = checkout(userId, user.role)
    return Response.json({
      action:   "checkout",
      userId,
      userName: user.name,
      role:     user.role,
      subZoneId: currentZone,
      fee,
      time:     new Date().toISOString(),
    })
  }
}