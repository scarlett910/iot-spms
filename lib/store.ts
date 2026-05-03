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
} from "@/data/mock"

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

let zones:    SubZone[]        = clone(initialSubZones)
let sessions: ParkingSession[] = clone(initialSessions)
let invs:     Invoice[]        = clone(initialInvoices)
let tcks:     any[]            = clone(initialTickets)
let revs:     any[]            = clone(initialReviews)
let settings                   = clone(initialSettings)

// ── Getters ───────────────────────────────────────────────────────────────────
export function getSubZones()  { return zones    }
export function getSessions()  { return sessions }
export function getInvoices()  { return invs     }
export function getTickets()   { return tcks     }
export function getReviews()   { return revs     }
export function getSettings()  { return settings }

// ── Helpers ───────────────────────────────────────────────────────────────────
function pickSubZone(role: string): SubZone | null {
  const forRole = (role === "lecturer" || role === "staff")
    ? "staff_lecturer"
    : "student_visitor"

  const available = zones
    .filter(z => z.forRole === forRole && z.occupied < z.capacity)
    .sort((a, b) => a.occupied - b.occupied)

  return available[0] ?? null
}

export function calcFeePerTrip(role: string): number {
  switch (role) {
    case "student":  return settings.pricing.student
    case "lecturer": return settings.pricing.lecturer
    case "staff":    return settings.pricing.staff
    default:         return settings.pricing.student
  }
}

// ── Parking — thành viên trường ───────────────────────────────────────────────
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

  const fee = calcFeePerTrip(role)

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

// ── Invoice — tính cuối kỳ ────────────────────────────────────────────────────
export function calcMonthlyInvoice(
  userId: string,
  role: string,
  periodStart: string,
  periodEnd: string
): number {
  const trips = sessions.filter(s =>
    s.userId    === userId &&
    s.status    === "closed" &&
    s.entryTime >= periodStart &&
    s.entryTime <= periodEnd
  )
  return trips.length * calcFeePerTrip(role)
}

export function countTripsInPeriod(
  userId: string,
  periodStart: string,
  periodEnd: string
): number {
  return sessions.filter(s =>
    s.userId    === userId &&
    s.status    === "closed" &&
    s.entryTime >= periodStart &&
    s.entryTime <= periodEnd
  ).length
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

// ── Khách vãng lai ────────────────────────────────────────────────────────────
export function createGuestTicket(
  licensePlate: string,
  guestName?: string
) {
  const subZone = pickSubZone("student")   // khách → khu SV/Khách
  if (!subZone) return null

  subZone.occupied += 1

  const ticket = {
    id:           "TK" + Date.now().toString().slice(-6),
    licensePlate: licensePlate.toUpperCase(),
    guestName:    guestName ?? null,
    subZoneId:    subZone.id,
    entryTime:    new Date().toISOString(),
    exitTime:     null as string | null,
    status:       "active" as const,
    fee:          null as number | null,
  }
  tcks.push(ticket)
  return ticket
}

// Dùng khi nhấn "Thu phí" trực tiếp từ list (biết ticketId)
export function checkoutGuestTicket(ticketId: string): number | null {
  const ticket = tcks.find(t => t.id === ticketId)
  if (!ticket || ticket.status === "closed") return null

  const subZone = zones.find(z => z.id === ticket.subZoneId)
  if (subZone) subZone.occupied = Math.max(0, subZone.occupied - 1)

  ticket.exitTime = new Date().toISOString()
  ticket.status   = "closed"
  ticket.fee      = settings.pricing.visitor   // 5000đ/lượt, thu ngay

  return ticket.fee
}

// Dùng khi tra cứu bằng mã vé hoặc biển số (trang checkout thủ công)
export function lookupActiveTicket(query: string) {
  return tcks.find(t =>
    t.status === "active" && (
      t.id           === query.trim() ||
      t.licensePlate === query.trim().toUpperCase()
    )
  ) ?? null
}

// ── Review ────────────────────────────────────────────────────────────────────
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

// ── Settings ──────────────────────────────────────────────────────────────────
export function updateSettings(patch: any) {
  if (patch.pricing) Object.assign(settings.pricing, patch.pricing)
  if (patch.parking) Object.assign(settings.parking, patch.parking)
  if (patch.bkpay)   Object.assign(settings.bkpay,   patch.bkpay)
  if (patch.billing) Object.assign(settings.billing,  patch.billing)
}