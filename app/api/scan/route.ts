import { checkin, checkout, getCurrentSubZone, checkoutGuestTicket, lookupActiveTicket, getTickets } from "@/lib/store"
import { users } from "@/data/mock"

export async function POST(req: Request) {
  const { userId } = await req.json()
  if (!userId) return Response.json({ error: "Thiếu userId" }, { status: 400 })

  // ── Thử tra cứu vé khách trước (ticketId hoặc biển số) ──
  const guestTicket = lookupActiveTicket(userId)
  if (guestTicket) {
    const fee = checkoutGuestTicket(guestTicket.id)
    const updated = getTickets().find(t => t.id === guestTicket.id)
    return Response.json({
      action:       "checkout",
      type:         "guest",
      ticketId:     guestTicket.id,
      licensePlate: guestTicket.licensePlate,
      subZoneId:    guestTicket.subZoneId,
      fee,
      ticket:       updated,
      time:         new Date().toISOString(),
    })
  }

  // ── Thành viên trường ──
  const user = users.find(u => u.id === userId)
  if (!user) return Response.json({ error: "Không tìm thấy người dùng" }, { status: 404 })

  const currentZone = getCurrentSubZone(userId)

  if (!currentZone) {
    const subZoneId = checkin(userId, user.role)
    if (!subZoneId) return Response.json({ error: "Bãi xe đã đầy" }, { status: 409 })
    return Response.json({
      action:   "checkin",
      type:     "member",
      userId,
      userName: user.name,
      role:     user.role,
      subZoneId,
      time:     new Date().toISOString(),
    })
  } else {
    const fee = checkout(userId, user.role)
    return Response.json({
      action:    "checkout",
      type:      "member",
      userId,
      userName:  user.name,
      role:      user.role,
      subZoneId: currentZone,
      fee,
      time:      new Date().toISOString(),
    })
  }
}