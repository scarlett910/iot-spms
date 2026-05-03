import { checkoutGuestTicket } from "@/lib/store"

export async function POST(req: Request) {
  const { ticketId } = await req.json()
  const fee = checkoutGuestTicket(ticketId)

  if (fee === null) return Response.json(
    { error: "Không tìm thấy vé hoặc vé đã đóng" }, { status: 404 }
  )

  return Response.json({ fee })
}