import { getSlots, getCurrentSlot } from "@/lib/store"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  return Response.json({
    slots:      getSlots(),
    currentSlot: userId ? getCurrentSlot(userId) : null,
  })
}