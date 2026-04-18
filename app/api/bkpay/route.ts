import { getSettings, updateInvoiceStatus } from "@/lib/store"

export async function POST(req: Request) {
  const { invoiceId, amount } = await req.json()
  const { bkpay } = getSettings()

  await new Promise(r => setTimeout(r, bkpay.delayMs))

  const success =
    bkpay.simulateMode === "success" ? true  :
    bkpay.simulateMode === "failure" ? false :
    Math.random() > 0.3

  if (success) {
    const txId = "BKP-" + Date.now().toString().slice(-8)
    updateInvoiceStatus(invoiceId, "paid", txId)
    return Response.json({
      status:        "SUCCESS",
      transactionId: txId,
      paidAt:        new Date().toISOString(),
    })
  }

  return Response.json({
    status:    "FAILED",
    errorCode: "INSUFFICIENT_BALANCE",
    message:   "Số dư không đủ hoặc giao dịch bị từ chối",
  }, { status: 400 })
}