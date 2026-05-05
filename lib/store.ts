import {
  subZones        as initialSubZones,
  parkingSessions as initialSessions,
  invoices        as initialInvoices,
  tickets         as initialTickets,
  reviews         as initialReviews,
  systemSettings  as initialSettings,
  type SubZone,
  type ParkingSession,
  type Invoice,
  type Ticket,
  type Review,
} from "@/data/mock"

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

let zones:    SubZone[]        = clone(initialSubZones)
let sessions: ParkingSession[] = clone(initialSessions)
let invs:     Invoice[]        = clone(initialInvoices)
let tcks:     Ticket[]         = clone(initialTickets)
let revs:     Review[]         = clone(initialReviews)
let settings                   = clone(initialSettings)

// ── Getters ──────────────────────────────────────────────
export const getSubZones = () => zones
export const getSessions = () => sessions
export const getInvoices = () => invs
export const getTickets  = () => tcks
export const getReviews  = () => revs
export const getSettings = () => settings

// ── Helpers ──────────────────────────────────────────────
function pickSubZone(role: string): SubZone | null {
  const forRole = (role === "lecturer" || role === "staff")
    ? "staff_lecturer" : "student_visitor"
  return zones
    .filter(z => z.forRole === forRole && z.occupied < z.capacity)
    .sort((a, b) => a.occupied - b.occupied)[0] ?? null
}

// Chỉ khai báo 1 lần — GV/CB miễn phí, SV 2000đ/lượt
export function calcFeePerTrip(role: string): number {
  const p = settings.pricing
  if (role === "lecturer") return p.lecturer  // 0
  if (role === "staff")    return p.staff     // 0
  return p.student                            // 2000
}

// ── Parking — thành viên trường ──────────────────────────
export function checkin(userId: string, role: string): string | null {
  const existing = sessions.find(
    s => s.userId === userId && s.status === "active"
  )
  if (existing) return existing.subZoneId

  const subZone = pickSubZone(role)
  if (!subZone) return null

  subZone.occupied += 1
  sessions.push({
    id:        "PS" + Date.now().toString().slice(-6),
    userId,
    subZoneId: subZone.id,
    entryTime: new Date().toISOString(),
    exitTime:  null,
    status:    "active",
    fee:       null,
  })
  return subZone.id
}

export function checkout(userId: string, role: string): number | null {
  const session = sessions.find(
    s => s.userId === userId && s.status === "active"
  )
  if (!session) return null

  const subZone = zones.find(z => z.id === session.subZoneId)
  if (subZone) subZone.occupied = Math.max(0, subZone.occupied - 1)

  // GV/CB → 0, SV → 2000 (1 checkin+checkout = 1 lượt hoàn tất)
  const fee        = calcFeePerTrip(role)
  session.exitTime = new Date().toISOString()
  session.status   = "closed"
  session.fee      = fee
  return fee
}

// Đóng session theo sessionId — dùng bởi /api/sessions/close
// Cần truyền role để tính fee đúng
export function closeSession(sessionId: string, role = "student"): number | null {
  const session = sessions.find(
    s => s.id === sessionId && s.status === "active"
  )
  if (!session) return null

  const subZone = zones.find(z => z.id === session.subZoneId)
  if (subZone) subZone.occupied = Math.max(0, subZone.occupied - 1)

  const fee        = calcFeePerTrip(role)
  session.exitTime = new Date().toISOString()
  session.status   = "closed"
  session.fee      = fee
  return fee
}

export function getCurrentSubZone(userId: string): string | null {
  return sessions.find(
    s => s.userId === userId && s.status === "active"
  )?.subZoneId ?? null
}

// ── Invoice — chỉ dành cho SV ────────────────────────────
export function generateMonthlyInvoice(userId: string): Invoice | null {
  const now    = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  // Đếm lượt hoàn tất trong tháng (closed + có exitTime trong tháng)
  const completedTrips = sessions.filter(s =>
    s.userId  === userId   &&
    s.status  === "closed" &&
    s.exitTime?.startsWith(period)
  )

  const tripCount = completedTrips.length
  const amount    = tripCount * settings.pricing.student  // 2000 × số lượt

  // Cập nhật nếu đã có invoice tháng này
  const existing = invs.find(i => i.userId === userId && i.period === period)
  if (existing) {
    existing.amount = amount
    return existing
  }

  // Tạo mới
  const invoice: Invoice = {
    id:        "INV" + Date.now().toString().slice(-6),
    userId,
    amount,
    status:    "pending",
    period,
    createdAt: now.toISOString(),
  }
  invs.push(invoice)
  return invoice
}

export function updateInvoiceStatus(
  invoiceId: string,
  status: "paid" | "pending",
  transactionId?: string
) {
  const inv = invs.find(i => i.id === invoiceId)
  if (!inv) return false
  inv.status = status
  if (transactionId) (inv as any).transactionId = transactionId
  return true
}

// ── Khách vãng lai ───────────────────────────────────────
export function createGuestTicket(
  licensePlate: string,
  guestName?: string
) {
  const subZone = pickSubZone("student")
  if (!subZone) return null

  subZone.occupied += 1
  const ticket: Ticket = {
    id:           "TK" + Date.now().toString().slice(-6),
    licensePlate: licensePlate.toUpperCase(),
    guestName:    guestName ?? null,
    subZoneId:    subZone.id,
    entryTime:    new Date().toISOString(),
    exitTime:     null,
    status:       "active",
    fee:          null,
  }
  tcks.push(ticket)
  return ticket
}

export function checkoutGuestTicket(ticketId: string): number | null {
  const ticket = tcks.find(t => t.id === ticketId)
  if (!ticket || ticket.status === "closed") return null

  const subZone = zones.find(z => z.id === ticket.subZoneId)
  if (subZone) subZone.occupied = Math.max(0, subZone.occupied - 1)

  const fee       = settings.pricing.visitor  // 5000
  ticket.exitTime = new Date().toISOString()
  ticket.status   = "closed"
  ticket.fee      = fee
  return fee
}

export function lookupActiveTicket(query: string) {
  const q = query.trim().toUpperCase()
  return tcks.find(t =>
    t.status === "active" &&
    (t.id === query.trim() || t.licensePlate === q)
  ) ?? null
}

// ── Review ───────────────────────────────────────────────
export function addReview(
  userId: string | null,
  stars: number,
  comment: string
) {
  revs.push({
    id:        "RV" + Date.now().toString().slice(-6),
    userId,
    stars,
    comment,
    createdAt: new Date().toISOString(),
  })
}

// ── Settings ─────────────────────────────────────────────
export function updateSettings(patch: any) {
  if (patch.pricing) Object.assign(settings.pricing, patch.pricing)
  if (patch.parking) Object.assign(settings.parking, patch.parking)
  if (patch.bkpay)   Object.assign(settings.bkpay,   patch.bkpay)
  if (patch.billing) Object.assign(settings.billing,  patch.billing)
}