"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchInvoices, payInvoice } from "@/lib/api"
import { User } from "@/data/mock"
import Navbar from "@/components/Navbar"

type PayStep = "detail" | "confirm" | "success"

export default function InvoiceDetailPage() {
  const router  = useRouter()
  const { id }  = useParams<{ id: string }>()
  const [user,    setUser]    = useState<User | null>(null)
  const [invoice, setInvoice] = useState<any | null>(null)
  const [step,    setStep]    = useState<PayStep>("detail")
  const [method,  setMethod]  = useState("bkpay")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const [txId,    setTxId]    = useState("")

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.push("/login"); return }
    setUser(u)

    fetchInvoices(u.id).then(data => {
      const inv = data.invoices.find((i: any) => i.id === id)
      if (!inv) { router.push("/invoice"); return }
      setInvoice(inv)
    })
  }, [])

  async function handlePay() {
    if (!invoice) return
    setLoading(true)
    setError("")
    try {
      const result = await payInvoice(invoice.id, invoice.amount, method)
      if (result.status === "SUCCESS") {
        setTxId(result.transactionId ?? "")
        // Cập nhật local state để UI phản ánh ngay
        setInvoice((prev: any) => ({ ...prev, status: "paid" }))
        setStep("success")
      } else {
        setError(result.message ?? "Giao dịch thất bại. Vui lòng thử lại.")
      }
    } catch {
      setError("Mất kết nối. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  if (!user || !invoice) return null

  const methods = [
    { id: "bkpay", label: "Ví BKPay",          sub: "Số dư: 500.000đ" },
    { id: "bank",  label: "Ngân hàng liên kết", sub: "VCB ****1234"    },
    { id: "qr",    label: "Quét mã QR",          sub: "VietQR"          },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <Navbar />
          <div className="bg-white p-5">

            <button
              onClick={() => step === "detail"
                ? router.push("/invoice") : setStep("detail")}
              className="flex items-center gap-1 text-xs text-gray-400
                         mb-4 hover:text-gray-600">
              ← {step === "detail" ? "Danh sách hóa đơn" : "Quay lại"}
            </button>

            {step === "detail" && (
              <>
                <p className="font-medium text-gray-900 mb-1">Chi tiết hóa đơn</p>
                <p className="text-xs text-gray-400 mb-5">{invoice.id}</p>

                <div className="border border-gray-100 rounded-xl overflow-hidden mb-5">
                  {[
                    ["Kỳ thanh toán",
                     `Tháng ${invoice.period?.split("-")[1]}/${invoice.period?.split("-")[0]}`],
                    ["Ngày tạo",  invoice.createdAt],
                    ["Người dùng", user.name],
                    ["Trạng thái",
                     invoice.status === "paid" ? "Đã thanh toán" : "Chờ thanh toán"],
                  ].map(([label, value], i, arr) => (
                    <div key={label}
                      className={`flex justify-between items-center px-4 py-3 text-sm
                        ${i < arr.length-1 ? "border-b border-gray-100" : ""}`}>
                      <span className="text-gray-400">{label}</span>
                      <span className={`font-medium
                        ${label === "Trạng thái"
                          ? invoice.status === "paid"
                            ? "text-green-600" : "text-amber-600"
                          : "text-gray-800"}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl px-4 py-4 mb-5
                                flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tổng phí</span>
                  <span className="text-xl font-medium text-gray-900">
                    {invoice.amount?.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                {invoice.status === "paid" ? (
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-green-700 font-medium text-sm">
                      Đã thanh toán thành công
                    </p>
                  </div>
                ) : (
                  <button onClick={() => setStep("confirm")}
                    className="w-full bg-[#185FA5] hover:bg-[#0C447C]
                               text-[#E6F1FB] font-medium py-3 rounded-xl
                               text-sm transition-colors">
                    Thanh toán ngay
                  </button>
                )}
              </>
            )}

            {step === "confirm" && (
              <>
                <p className="font-medium text-gray-900 mb-1">Chọn phương thức</p>
                <p className="text-xs text-gray-400 mb-5">Thanh toán qua BKPay</p>

                <div className="flex flex-col gap-2 mb-5">
                  {methods.map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`flex items-center justify-between px-4 py-3
                        rounded-xl border text-left transition-all
                        ${method === m.id
                          ? "border-[#185FA5] bg-blue-50"
                          : "border-gray-100 hover:border-gray-200"}`}>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.label}</p>
                        <p className="text-xs text-gray-400">{m.sub}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex
                                       items-center justify-center
                        ${method === m.id ? "border-[#185FA5]" : "border-gray-300"}`}>
                        {method === m.id && (
                          <div className="w-2 h-2 rounded-full bg-[#185FA5]"/>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="text-red-500 text-xs mb-4 bg-red-50
                                px-3 py-2 rounded-lg">{error}</p>
                )}

                <button onClick={handlePay} disabled={loading}
                  className="w-full bg-[#185FA5] hover:bg-[#0C447C]
                             disabled:bg-gray-300 text-[#E6F1FB] font-medium
                             py-3 rounded-xl text-sm transition-colors
                             flex items-center justify-center gap-2">
                  {loading ? "Đang xử lý..." : "Xác nhận thanh toán"}
                </button>
              </>
            )}

            {step === "success" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex
                                items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="font-medium text-gray-900 mb-1">Thanh toán thành công</p>
                <p className="text-sm text-gray-400 mb-1">
                  {invoice.amount?.toLocaleString("vi-VN")}đ
                </p>
                <p className="text-xs text-gray-300 mb-6">Mã GD: {txId}</p>
                <button onClick={() => router.push("/invoice")}
                  className="w-full bg-[#185FA5] text-[#E6F1FB] font-medium
                             py-2.5 rounded-xl text-sm hover:bg-[#0C447C]
                             transition-colors">
                  Về danh sách hóa đơn
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}