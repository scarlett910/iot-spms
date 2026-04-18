"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchInvoices } from "@/lib/api"
import { User } from "@/data/mock"
import Navbar from "@/components/Navbar"

export default function InvoicePage() {
  const router = useRouter()
  const [user,     setUser]     = useState<User | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.push("/login"); return }
    if (["operator","admin"].includes(u.role)) {
      router.push("/dashboard/operator"); return
    }
    setUser(u)
    fetchInvoices(u.id).then(data => {
      setInvoices(data.invoices)
      setLoading(false)
    })
  }, [])

  if (!user || loading) return null

  const statusStyle: Record<string,{label:string;cls:string}> = {
    pending: { label: "Chờ thanh toán", cls: "bg-amber-50 text-amber-700" },
    paid:    { label: "Đã thanh toán",  cls: "bg-green-50 text-green-700" },
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <Navbar />
          <div className="bg-white p-5">

            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-medium text-gray-900">Hóa đơn gửi xe</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {invoices.length} hóa đơn
                </p>
              </div>
              <button onClick={() => router.push("/history")}
                className="text-xs text-[#185FA5] border border-[#185FA5]/30
                           rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
                Lịch sử
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-300 text-4xl mb-3">📋</p>
                <p className="text-sm text-gray-400">Bạn chưa có hóa đơn nào</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {invoices.map((inv: any) => {
                  const s = statusStyle[inv.status] ?? statusStyle.pending
                  return (
                    <button key={inv.id}
                      onClick={() => router.push(`/invoice/${inv.id}`)}
                      className="w-full text-left border border-gray-100 rounded-xl
                                 p-4 hover:border-[#185FA5]/30 hover:shadow-sm
                                 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Tháng {inv.period?.split("-")[1]}/
                            {inv.period?.split("-")[0]}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{inv.id}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full
                                          font-medium ${s.cls}`}>
                          {s.label}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400">
                          Ngày tạo: {inv.createdAt}
                        </p>
                        <p className="text-base font-medium text-gray-900">
                          {inv.amount?.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}