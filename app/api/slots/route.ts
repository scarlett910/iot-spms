import { getSubZones, getCurrentSubZone } from "@/lib/store"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  return Response.json({
    subZones:       getSubZones(),
    currentSubZone: userId ? getCurrentSubZone(userId) : null,
  })
}