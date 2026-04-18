// lib/api.ts
// Tất cả hàm này dùng ở client component ("use client")

const base = ""   // cùng origin, không cần prefix

// ── Slots ────────────────────────────────────────────
export async function fetchSlots(userId?: string) {
  const url = userId ? `/api/slots?userId=${userId}` : "/api/slots"
  const res = await fetch(url)
  return res.json() as Promise<{ slots: any[], currentSlot: string | null }>
}

export async function assignSlot(userId: string) {
  const res = await fetch("/api/slots/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  })
  return res.json() as Promise<{ slotId?: string; error?: string }>
}

// ── Invoices ──────────────────────────────────────────
export async function fetchInvoices(userId: string) {
  const res = await fetch(`/api/invoices?userId=${userId}`)
  return res.json() as Promise<{ invoices: any[] }>
}

export async function payInvoice(invoiceId: string, amount: number, method: string) {
  const res = await fetch("/api/bkpay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId, amount, method }),
  })
  return res.json() as Promise<{
    status: "SUCCESS" | "FAILED"
    transactionId?: string
    message?: string
  }>
}

// ── Tickets ───────────────────────────────────────────
export async function fetchTickets() {
  const res = await fetch("/api/tickets")
  return res.json() as Promise<{ tickets: any[] }>
}

export async function createTicket(licensePlate: string, guestName?: string) {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ licensePlate, guestName }),
  })
  return res.json() as Promise<{ ticket?: any; error?: string }>
}

export async function checkoutTicket(ticketId: string) {
  const res = await fetch("/api/tickets/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticketId }),
  })
  return res.json() as Promise<{ fee?: number; error?: string }>
}

// ── Reviews ───────────────────────────────────────────
export async function submitReview(
  userId: string | null,
  stars: number,
  comment: string
) {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, stars, comment }),
  })
  return res.json()
}

// ── Settings ──────────────────────────────────────────
export async function fetchSettings() {
  const res = await fetch("/api/settings")
  return res.json() as Promise<{ settings: any }>
}

export async function saveSettings(patch: object) {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  return res.json()
}