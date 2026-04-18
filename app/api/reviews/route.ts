import { getReviews, addReview } from "@/lib/store"

export async function GET() {
  return Response.json({ reviews: getReviews() })
}

export async function POST(req: Request) {
  const { userId, stars, comment } = await req.json()
  if (!stars || stars < 1 || stars > 5) return Response.json(
    { error: "Số sao không hợp lệ" }, { status: 400 }
  )

  addReview(userId ?? null, stars, comment ?? "")
  return Response.json({ success: true })
}