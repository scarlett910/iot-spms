"use client"

// ── SubZones (bản đồ bãi xe) ──────────────────────────
export async function fetchSubZones(userId?: string) {
  const url = userId ? `/api/slots?userId=${userId}` : "/api/slots"
  const res = await fetch(url)
  return res.json() as Promise<{
    subZones:       any[]
    currentSubZone: string | null
  }>
}

export async function checkin(userId: string, role: string) {
  const res = await fetch("/api/slots/assign", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId, role }),
  })
  return res.json() as Promise<{ subZoneId?: string; error?: string }>
}

// ── Invoices ──────────────────────────────────────────
export async function fetchInvoices(userId: string) {
  const res = await fetch(`/api/invoices?userId=${userId}`)
  return res.json() as Promise<{ invoices: any[] }>
}

export async function generateInvoice(userId: string, role: string) {
  const res = await fetch("/api/invoices/generate", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId, role }),
  })
  return res.json() as Promise<{ invoice?: any; error?: string }>
}

export async function payInvoice(
  invoiceId: string,
  amount:    number,
  method:    string
) {
  const res = await fetch("/api/bkpay", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ invoiceId, amount, method }),
  })
  return res.json() as Promise<{
    status:         "SUCCESS" | "FAILED"
    transactionId?: string
    message?:       string
  }>
}

// ── Tickets (khách vãng lai) ──────────────────────────
export async function fetchTickets() {
  const res = await fetch("/api/tickets")
  return res.json() as Promise<{ tickets: any[] }>
}

export async function createTicket(
  licensePlate: string,
  guestName?:   string
) {
  const res = await fetch("/api/tickets", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ licensePlate, guestName }),
  })
  return res.json() as Promise<{ ticket?: any; error?: string }>
}

export async function checkoutTicket(ticketId: string) {
  const res = await fetch("/api/tickets/checkout", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ ticketId }),
  })
  return res.json() as Promise<{ fee?: number; error?: string }>
}

// ── Reviews ───────────────────────────────────────────
export async function submitReview(
  userId:  string | null,
  stars:   number,
  comment: string
) {
  const res = await fetch("/api/reviews", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ userId, stars, comment }),
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
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(patch),
  })
  return res.json()
}