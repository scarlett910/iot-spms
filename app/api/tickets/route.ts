import { getTickets, createTicket } from "@/lib/store"

export async function GET() {
  return Response.json({ tickets: getTickets() })
}

export async function POST(req: Request) {
  const { licensePlate, guestName } = await req.json()
  if (!licensePlate) return Response.json(
    { error: "Thiếu biển số xe" }, { status: 400 }
  )

  const ticket = createTicket(licensePlate, guestName)
  if (!ticket) return Response.json(
    { error: "Bãi xe đã đầy" }, { status: 409 }
  )

  return Response.json({ ticket })
}