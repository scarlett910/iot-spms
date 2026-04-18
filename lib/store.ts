// lib/store.ts
import {
  parkingSlots   as initialSlots,
  parkingSessions as initialSessions,
  invoices       as initialInvoices,
  tickets        as initialTickets,
  reviews        as initialReviews,
  systemSettings as initialSettings,
  type ParkingSlot,
  type ParkingSession,
  type Invoice,
  type Ticket,
  type Review,
} from "@/data/mock"

// Deep clone để tránh mutate file gốc
function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

// State sống trong module-level variable trên server
// Next.js giữ module này trong RAM suốt vòng đời server process
let slots:    ParkingSlot[]   = clone(initialSlots)
let sessions: ParkingSession[] = clone(initialSessions)
let invs:     Invoice[]       = clone(initialInvoices)
let tcks:     Ticket[]        = clone(initialTickets)
let revs:     Review[]        = clone(initialReviews)
let settings                  = clone(initialSettings)

// ── Getters ──────────────────────────────────────────
export function getSlots()    { return slots    }
export function getSessions() { return sessions }
export function getInvoices() { return invs     }
export function getTickets()  { return tcks     }
export function getReviews()  { return revs     }
export function getSettings() { return settings }

// ── Parking logic ─────────────────────────────────────
export function assignSlot(userId: string): string | null {
  const existing = sessions.find(
    s => s.userId === userId && s.status === "active"
  )
  if (existing) return existing.slotId

  const slot = slots
    .filter(s => s.status === "available")
    .sort((a, b) => a.id.localeCompare(b.id))[0]

  if (!slot) return null

  slot.status = "occupied"
  slot.userId = userId

  sessions.push({
    id:        "PS" + Date.now().toString().slice(-6),
    userId,
    slotId:    slot.id,
    entryTime: new Date().toISOString(),
    exitTime:  null,
    status:    "active",
  })

  return slot.id
}

export function getCurrentSlot(userId: string): string | null {
  return sessions.find(
    s => s.userId === userId && s.status === "active"
  )?.slotId ?? null
}

export function closeSession(sessionId: string): number | null {
  const session = sessions.find(
    s => s.id === sessionId && s.status === "active"
  )
  if (!session) return null

  const slot = slots.find(s => s.id === session.slotId)
  if (slot) {
    slot.status = "available"
    slot.userId = null
  }

  session.exitTime = new Date().toISOString()
  session.status   = "closed"

  const hours = Math.max(1, Math.ceil(
    (new Date(session.exitTime).getTime() -
     new Date(session.entryTime).getTime()) / 3600000
  ))
  return hours
}

// ── Invoice logic ─────────────────────────────────────
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

// ── Ticket logic ──────────────────────────────────────
export function createTicket(licensePlate: string, guestName?: string) {
  const slotId = assignSlot("GUEST-" + Date.now().toString().slice(-6))
  if (!slotId) return null

  const ticket = {
    id:           "TK" + Date.now().toString().slice(-6),
    licensePlate: licensePlate.toUpperCase(),
    guestName:    guestName ?? null,
    slotId,
    entryTime:    new Date().toISOString(),
    exitTime:     null,
    status:       "active" as const,
    fee:          null as number | null,
  }
  tcks.push(ticket as any)
  return ticket
}

export function checkoutTicket(ticketId: string): number | null {
  const ticket = tcks.find(t => t.id === ticketId) as any
  if (!ticket || ticket.status === "closed") return null

  // Đóng session của ticket này
  const session = sessions.find(
    s => s.slotId === ticket.slotId && s.status === "active"
  )
  const hours = session ? closeSession(session.id) : 1
  const fee   = (hours ?? 1) * settings.pricing.visitor

  ticket.exitTime = new Date().toISOString()
  ticket.status   = "closed"
  ticket.fee      = fee

  return fee
}

// ── Review logic ──────────────────────────────────────
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

// ── Settings logic ────────────────────────────────────
export function updateSettings(patch: Partial<typeof settings>) {
  Object.assign(settings, patch)
  if (patch.pricing) Object.assign(settings.pricing, patch.pricing)
  if (patch.parking) Object.assign(settings.parking, patch.parking)
  if (patch.bkpay)   Object.assign(settings.bkpay,   patch.bkpay)
}