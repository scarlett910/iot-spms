"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchTickets, checkoutTicket } from "@/lib/api"
import Navbar from "@/components/Navbar"

export default function CheckoutPage() {
  const router  = useRouter()
  const [code,    setCode]    = useState("")
  const [found,   setFound]   = useState<any>(null)
  const [error,   setError]   = useState("")
  const [done,    setDone]    = useState(false)
  const [fee,     setFee]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || !["operator","admin"].includes(u.role))
      router.push("/login")

    fetchTickets().then(data => setTickets(data.tickets))
  }, [])

  function handleLookup() {
    const t = tickets.find(t =>
      (t.id === code.trim() ||
       t.licensePlate === code.trim().toUpperCase()) &&
      t.status === "active"
    )
    if (!t) { setError("Không tìm thấy vé đang hoạt động"); return }

    // Tính phí tạm để preview (đọc giá từ settings qua API sẽ tính chính xác)
    const hours = Math.max(1, Math.ceil(
      (Date.now() - new Date(t.entryTime).getTime()) / 3600000
    ))
    setFee(hours * 5000)   // preview — giá thật sẽ tính ở server khi checkout
    setFound(t)
    setError("")
  }

  async function handleCheckout() {
    if (!found) return
    setLoading(true)
    const result = await checkoutTicket(found.id)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setFee(result.fee!)   // phí chính xác từ server (đọc settings.pricing.visitor)
    setDone(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <Navbar title="IoT-SPMS · Vận hành" />
          <div className="bg-white p-5">

            <button onClick={() => router.push("/dashboard/operator")}
              className="flex items-center gap-1 text-xs text-gray-400
                         mb-4 hover:text-gray-600">
              ← Dashboard
            </button>

            {!done ? (
              <>
                <p className="font-medium text-gray-900 mb-1">Thu phí & Mở cổng ra</p>
                <p className="text-xs text-gray-400 mb-5">
                  Nhập mã vé hoặc biển số xe
                </p>

                <div className="flex gap-2 mb-4">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3
                               py-2.5 text-sm bg-gray-50 focus:outline-none
                               focus:border-[#185FA5]"
                    placeholder="Mã vé hoặc biển số"
                    value={code}
                    onChange={e => { setCode(e.target.value); setError("") }}
                    onKeyDown={e => e.key === "Enter" && handleLookup()}
                  />
                  <button onClick={handleLookup}
                    className="bg-[#185FA5] text-[#E6F1FB] px-4 rounded-lg
                               text-sm hover:bg-[#0C447C] transition-colors">
                    Tra cứu
                  </button>
                </div>

                {error && (
                  <p className="text-red-500 text-xs mb-4 bg-red-50
                                px-3 py-2 rounded-lg">{error}</p>
                )}

                {found && (
                  <>
                    <div className="border border-gray-100 rounded-xl
                                    overflow-hidden mb-4">
                      {[
                        ["Mã vé",   found.id],
                        ["Biển số", found.licensePlate],
                        ["Khu vực", found.subZoneId],
                        ["Giờ vào", new Date(found.entryTime)
                          .toLocaleTimeString("vi-VN")],
                      ].map(([l, v], i, arr) => (
                        <div key={l}
                          className={`flex justify-between px-4 py-3 text-sm
                            ${i < arr.length-1 ? "border-b border-gray-100" : ""}`}>
                          <span className="text-gray-400">{l}</span>
                          <span className="font-medium text-gray-800">{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-amber-50 rounded-xl px-4 py-4 mb-5
                                    flex justify-between items-center">
                      <span className="text-sm text-amber-700">Phí tạm tính</span>
                      <span className="text-xl font-medium text-amber-700">
                        {fee.toLocaleString("vi-VN")}đ
                      </span>
                    </div>

                    <button onClick={handleCheckout} disabled={loading}
                      className="w-full bg-[#185FA5] hover:bg-[#0C447C]
                                 disabled:bg-gray-300 text-[#E6F1FB] font-medium
                                 py-3 rounded-xl text-sm transition-colors">
                      {loading ? "Đang xử lý..." : "Xác nhận thu phí & Mở cổng"}
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex
                                items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="font-medium text-gray-900 mb-1">Hoàn tất — Cổng đang mở</p>
                <p className="text-sm text-gray-400 mb-6">
                  Đã thu {fee.toLocaleString("vi-VN")}đ
                </p>
                <button onClick={() => { setDone(false); setCode(""); setFound(null) }}
                  className="w-full bg-[#185FA5] text-[#E6F1FB] font-medium
                             py-2.5 rounded-xl text-sm hover:bg-[#0C447C]">
                  Xử lý xe tiếp theo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}