import { getInvoices } from "@/lib/store"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  const result = userId
    ? getInvoices().filter(i => i.userId === userId)
    : getInvoices()

  return Response.json({ invoices: result })
}