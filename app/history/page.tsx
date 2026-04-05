"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { invoices, User } from "@/data/mock"
import Navbar from "@/components/Navbar"

export default function HistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [from, setFrom] = useState("")
  const [to,   setTo]   = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.push("/login"); return }
    setUser(u)
  }, [])

  if (!user) return null

  const all = invoices.filter(i => i.userId === user.id)

  const filtered = all.filter(i => {
    if (from && i.createdAt < from) return false
    if (to   && i.createdAt > to)   return false
    return true
  })

  function handleFilter() {
    if (from && to && from > to) {
      setError("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc")
      return
    }
    setError("")
  }

  const statusStyle = {
    pending: { label: "Chờ TT",    cls: "bg-amber-50 text-amber-700" },
    paid:    { label: "Đã thanh toán", cls: "bg-green-50 text-green-700"  },
  }

  const totalPaid = filtered
    .filter(i => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200
                        shadow-sm">
          <Navbar />
          <div className="bg-white p-5">

            <button
              onClick={() => router.push("/invoice")}
              className="flex items-center gap-1 text-xs text-gray-400
                         mb-4 hover:text-gray-600 transition-colors"
            >
              ← Hóa đơn
            </button>

            <p className="font-medium text-gray-900 mb-4">
              Lịch sử thanh toán
            </p>

            {/* Date filter */}
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Từ ngày</p>
                <input
                  type="date"
                  value={from}
                  onChange={e => { setFrom(e.target.value); setError("") }}
                  className="w-full border border-gray-200 rounded-lg px-3
                             py-2 text-sm text-gray-700 bg-gray-50
                             focus:outline-none focus:border-[#185FA5]"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Đến ngày</p>
                <input
                  type="date"
                  value={to}
                  onChange={e => { setTo(e.target.value); setError("") }}
                  className="w-full border border-gray-200 rounded-lg px-3
                             py-2 text-sm text-gray-700 bg-gray-50
                             focus:outline-none focus:border-[#185FA5]"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs mb-2 bg-red-50 px-3 py-2
                            rounded-lg">
                {error}
              </p>
            )}

            <button
              onClick={handleFilter}
              className="w-full border border-[#185FA5]/40 text-[#185FA5]
                         text-sm py-2 rounded-lg hover:bg-blue-50 mb-5
                         transition-colors"
            >
              Xem lịch sử
            </button>

            {/* Summary */}
            {filtered.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Số giao dịch</p>
                  <p className="text-lg font-medium text-gray-900">
                    {filtered.length}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Đã thanh toán</p>
                  <p className="text-lg font-medium text-green-700">
                    {totalPaid.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>
            )}

            {/* List */}
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300 text-3xl mb-2">🔍</p>
                <p className="text-sm text-gray-400">
                  Chưa có giao dịch nào
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map(inv => {
                  const s = statusStyle[inv.status]
                  return (
                    <div key={inv.id}
                         className="flex justify-between items-center
                                    px-4 py-3 border border-gray-100
                                    rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          Tháng {inv.period.split("-")[1]}/
                          {inv.period.split("-")[0]}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {inv.createdAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {inv.amount.toLocaleString("vi-VN")}đ
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full
                                          font-medium ${s.cls}`}>
                          {s.label}
                        </span>
                      </div>
                    </div>
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