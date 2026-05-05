import { users } from "@/data/mock"
import { generateMonthlyInvoice } from "@/lib/store"

export async function POST(req: Request) {
  const { userId } = await req.json()

  const user = users.find(u => u.id === userId)
  if (!user) return Response.json({ error: "User not found" }, { status: 404 })

  // GV/CB miễn phí — không tạo invoice
  if (user.role === "lecturer" || user.role === "staff") {
    return Response.json({
      message: "Giảng viên/Cán bộ miễn phí, không cần hóa đơn"
    })
  }

  const invoice = generateMonthlyInvoice(userId)
  if (!invoice) return Response.json({ error: "Không thể tạo hóa đơn" }, { status: 500 })

  return Response.json({ invoice })
}