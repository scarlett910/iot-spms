"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchTickets, checkoutTicket } from "@/lib/api"
import Navbar from "@/components/Navbar"

export default function TicketListPage() {
  const router  = useRouter()
  const [tickets,     setTickets]     = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [confirming,  setConfirming]  = useState<string | null>(null) // ticketId đang xác nhận
  const [processing,  setProcessing]  = useState<string | null>(null) // ticketId đang xử lý
  const [doneId,      setDoneId]      = useState<string | null>(null) // ticketId vừa xong
  const [doneFee,     setDoneFee]     = useState(0)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || !["operator","admin"].includes(u.role)) {
      router.push("/login"); return
    }
    loadTickets()
  }, [])

  async function loadTickets() {
    const data = await fetchTickets()
    setTickets(data.tickets)
    setLoading(false)
  }

  async function handleCheckout(ticketId: string) {
    setProcessing(ticketId)
    setConfirming(null)

    const result = await checkoutTicket(ticketId)

    if (result.error) {
      alert(result.error)
      setProcessing(null)
      return
    }

    setDoneFee(result.fee!)
    setDoneId(ticketId)
    setProcessing(null)

    // Reload danh sách
    loadTickets()
  }

  function duration(entryTime: string) {
    const h = Math.max(1, Math.ceil(
      (Date.now() - new Date(entryTime).getTime()) / 3600000
    ))
    return `${h} giờ`
  }

  if (loading) return null

  const active = tickets.filter(t => t.status === "active")
  const closed = tickets.filter(t => t.status === "closed")

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200
                        shadow-sm">
          <Navbar title="IoT-SPMS · Vận hành" />
          <div className="bg-white p-5">

            <div className="flex justify-between items-center mb-5">
              <button onClick={() => router.push("/dashboard/operator")}
                className="text-xs text-gray-400 hover:text-gray-600">
                ← Dashboard
              </button>
              <button onClick={() => router.push("/ticket/new")}
                className="text-xs bg-[#185FA5] text-[#E6F1FB] px-3 py-1.5
                           rounded-lg hover:bg-[#0C447C] transition-colors">
                + Phát vé mới
              </button>
            </div>

            <p className="font-medium text-gray-900 mb-4">Danh sách vé</p>

            {/* Thông báo vừa thu phí xong */}
            {doneId && (
              <div className="bg-green-50 border border-green-100 rounded-xl
                              px-4 py-3 mb-4 flex justify-between items-center">
                <p className="text-sm text-green-700 font-medium">
                  Thu phí thành công — {doneFee.toLocaleString("vi-VN")}đ
                </p>
                <button onClick={() => setDoneId(null)}
                  className="text-xs text-green-500 hover:text-green-700">
                  ✕
                </button>
              </div>
            )}

            {/* Đang gửi xe */}
            <p className="text-xs font-medium text-gray-500 uppercase
                          tracking-wide mb-2">
              Đang gửi xe ({active.length})
            </p>

            {active.length === 0 ? (
              <p className="text-xs text-gray-300 mb-4 px-1">Không có xe nào</p>
            ) : (
              <div className="flex flex-col gap-2 mb-5">
                {active.map(t => (
                  <div key={t.id}
                    className="border border-amber-100 bg-amber-50/40
                               rounded-xl overflow-hidden">

                    {/* Thông tin xe */}
                    <div className="flex justify-between items-start px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {t.licensePlate}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.id} · Khu {t.subZoneId}
                        </p>
                        <p className="text-xs text-gray-400">
                          Vào: {new Date(t.entryTime).toLocaleTimeString("vi-VN")}
                          {" · "}
                          {duration(t.entryTime)}
                        </p>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700
                                       px-2 py-0.5 rounded-full font-medium
                                       shrink-0">
                        Đang gửi
                      </span>
                    </div>

                    {/* Nút thu phí — hoặc xác nhận */}
                    {confirming === t.id ? (
                      <div className="border-t border-amber-100 px-4 py-3
                                      bg-white flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-500">
                          Xác nhận đã thu tiền mặt?
                        </p>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setConfirming(null)}
                            className="text-xs px-3 py-1.5 border border-gray-200
                                       rounded-lg text-gray-500 hover:bg-gray-50">
                            Huỷ
                          </button>
                          <button
                            onClick={() => handleCheckout(t.id)}
                            disabled={processing === t.id}
                            className="text-xs px-3 py-1.5 bg-[#185FA5]
                                       text-[#E6F1FB] rounded-lg
                                       hover:bg-[#0C447C] disabled:bg-gray-300
                                       transition-colors">
                            {processing === t.id ? "Đang xử lý..." : "Xác nhận"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirming(t.id)}
                        className="w-full border-t border-amber-100 px-4 py-2.5
                                   text-xs font-medium text-[#185FA5] bg-white
                                   hover:bg-blue-50 transition-colors text-left">
                        Thu phí & Mở cổng ra →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Đã hoàn tất */}
            <p className="text-xs font-medium text-gray-500 uppercase
                          tracking-wide mb-2">
              Đã hoàn tất ({closed.length})
            </p>

            {closed.length === 0 ? (
              <p className="text-xs text-gray-300 px-1">Không có</p>
            ) : (
              <div className="flex flex-col gap-2">
                {closed.map(t => (
                  <div key={t.id}
                    className="flex justify-between items-center px-4 py-3
                               border border-gray-100 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {t.licensePlate}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(t.entryTime).toLocaleTimeString("vi-VN")}
                        {" → "}
                        {t.exitTime
                          ? new Date(t.exitTime).toLocaleTimeString("vi-VN")
                          : "—"}
                        {" · Khu "}{t.subZoneId}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-gray-900">
                        {t.fee ? t.fee.toLocaleString("vi-VN") + "đ" : "—"}
                      </p>
                      <span className="text-xs bg-green-50 text-green-700
                                       px-2 py-0.5 rounded-full font-medium">
                        Hoàn tất
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}