"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createTicket } from "@/lib/api"
import Navbar from "@/components/Navbar"

export default function NewTicketPage() {
  const router  = useRouter()
  const [plate,   setPlate]   = useState("")
  const [name,    setName]    = useState("")
  const [error,   setError]   = useState("")
  const [done,    setDone]    = useState(false)
  const [ticket,  setTicket]  = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || !["operator","admin"].includes(u.role))
      router.push("/login")
  }, [])

  async function handleIssue() {
    if (!plate.trim()) { setError("Vui lòng nhập biển số xe"); return }
    setLoading(true)
    setError("")

    const result = await createTicket(plate, name || undefined)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setTicket(result.ticket)
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
                <p className="font-medium text-gray-900 mb-5">Phát vé tạm thời</p>

                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Biển số xe *
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3
                               py-2.5 text-sm bg-gray-50 focus:outline-none
                               focus:border-[#185FA5] uppercase"
                    placeholder="VD: 51A-12345"
                    value={plate}
                    onChange={e => setPlate(e.target.value)}
                  />
                </div>
                <div className="mb-5">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Họ tên khách (tùy chọn)
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3
                               py-2.5 text-sm bg-gray-50 focus:outline-none
                               focus:border-[#185FA5]"
                    placeholder="Không bắt buộc"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-xs mb-4 bg-red-50
                                px-3 py-2 rounded-lg">{error}</p>
                )}

                <button onClick={handleIssue} disabled={loading}
                  className="w-full bg-[#185FA5] hover:bg-[#0C447C]
                             disabled:bg-gray-300 text-[#E6F1FB] font-medium
                             py-3 rounded-xl text-sm transition-colors">
                  {loading ? "Đang xử lý..." : "Phát vé & Mở cổng"}
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex
                                items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎫</span>
                </div>
                <p className="font-medium text-gray-900 mb-1">Vé đã phát</p>
                <p className="text-xs text-gray-400 mb-1">
                  Khu vực:{" "}
                  <span className="font-medium text-[#185FA5]">
                    {ticket?.slotId}
                  </span>
                </p>
                <p className="text-xs text-gray-300 mb-5">Cổng đang mở</p>

                <div className="border-2 border-dashed border-gray-200
                                rounded-xl p-4 mb-5 mx-auto max-w-[180px]">
                  <p className="font-mono text-sm font-medium text-gray-700
                                text-center mb-1">
                    {ticket?.id}
                  </p>
                  <p className="text-xs text-gray-400 text-center">
                    {ticket?.licensePlate}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => router.push("/ticket/list")}
                    className="flex-1 border border-gray-200 text-gray-600
                               py-2.5 rounded-xl text-sm hover:bg-gray-50">
                    Danh sách vé
                  </button>
                  <button onClick={() => { setDone(false); setPlate(""); setName("") }}
                    className="flex-1 bg-[#185FA5] text-[#E6F1FB] py-2.5
                               rounded-xl text-sm hover:bg-[#0C447C]">
                    Phát vé mới
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}