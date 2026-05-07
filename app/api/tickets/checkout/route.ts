import { checkoutGuestTicket, getTickets } from "@/lib/store"

export async function POST(req: Request) {
  const { ticketId } = await req.json()
  const fee = checkoutGuestTicket(ticketId)

  if (fee === null) return Response.json(
    { error: "Không tìm thấy vé hoặc vé đã đóng" }, { status: 404 }
  )

  // Lấy ticket sau khi đã checkout để trả về đầy đủ
  const ticket = getTickets().find(t => t.id === ticketId)

  return Response.json({ fee, ticket })
}