// lib/store.ts
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
export const getSubZones  = () => zones
export const getSessions  = () => sessions
export const getInvoices  = () => invs
export const getTickets   = () => tcks
export const getReviews   = () => revs
export const getSettings  = () => settings

// ── Helpers ──────────────────────────────────────────────
function pickSubZone(role: string): SubZone | null {
  const forRole = (role === "lecturer" || role === "staff")
    ? "staff_lecturer" : "student_visitor"
  return zones
    .filter(z => z.forRole === forRole && z.occupied < z.capacity)
    .sort((a, b) => a.occupied - b.occupied)[0] ?? null
}

export function calcFeePerTrip(role: string): number {
  const p = settings.pricing
  if (role === "lecturer") return p.lecturer
  if (role === "staff")    return p.staff
  return p.student
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

  const fee = calcFeePerTrip(role)
  session.exitTime = new Date().toISOString()
  session.status   = "closed"
  session.fee      = fee
  return fee
}

// Dùng bởi /api/sessions/close (đóng session theo sessionId)
export function closeSession(sessionId: string): number | null {
  const session = sessions.find(
    s => s.id === sessionId && s.status === "active"
  )
  if (!session) return null

  const subZone = zones.find(z => z.id === session.subZoneId)
  if (subZone) subZone.occupied = Math.max(0, subZone.occupied - 1)

  session.exitTime = new Date().toISOString()
  session.status   = "closed"
  session.fee      = 0   // ra bãi tự do — phí tính riêng qua invoice
  return session.fee
}

export function getCurrentSubZone(userId: string): string | null {
  return sessions.find(
    s => s.userId === userId && s.status === "active"
  )?.subZoneId ?? null
}

// ── Invoice ──────────────────────────────────────────────
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

  const fee = settings.pricing.visitor
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