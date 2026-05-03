import { getSessions, getSettings, getInvoices } from "@/lib/store"
import { users } from "@/data/mock"

export async function POST(req: Request) {
  const { userId, role } = await req.json()
  const settings  = getSettings()

  // Tính kỳ: từ đầu tháng đến cuối tháng hiện tại
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const end   = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString()

  // Đếm số lượt trong kỳ
  const trips = getSessions().filter(s =>
    s.userId    === userId &&
    s.status    === "closed" &&
    s.entryTime >= start &&
    s.entryTime <= end
  )

  const pricePerTrip =
    role === "student"  ? settings.pricing.student  :
    role === "lecturer" ? settings.pricing.lecturer :
    role === "staff"    ? settings.pricing.staff    : 0

  const amount = trips.length * pricePerTrip
  const period = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`

  // Kiểm tra đã có hóa đơn kỳ này chưa
  const existing = getInvoices().find(
    i => i.userId === userId && i.period === period
  )
  if (existing) return Response.json({ invoice: existing })

  const invoice = {
    id:        "INV" + Date.now().toString().slice(-6),
    userId,
    amount,
    trips:     trips.length,
    pricePerTrip,
    status:    "pending" as const,
    period,
    createdAt: new Date().toISOString().slice(0, 10),
  }

  // Push vào store
  getInvoices().push(invoice as any)

  return Response.json({ invoice })
}