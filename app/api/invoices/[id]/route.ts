import { updateInvoiceStatus } from "@/lib/store"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { status, transactionId } = await req.json()
  const ok = updateInvoiceStatus(params.id, status, transactionId)

  if (!ok) return Response.json(
    { error: "Không tìm thấy hóa đơn" }, { status: 404 }
  )

  return Response.json({ success: true })
}