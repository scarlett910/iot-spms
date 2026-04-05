"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { tickets, parkingSlots } from "@/data/mock"
import Navbar from "@/components/Navbar"

export default function NewTicketPage() {
  const router  = useRouter()
  const [plate, setPlate]   = useState("")
  const [name,  setName]    = useState("")
  const [error, setError]   = useState("")
  const [done,  setDone]    = useState(false)
  const [ticketId, setTicketId] = useState("")

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || !["operator","admin"].includes(u.role))
      router.push("/login")
  }, [])

  const freeSlots = parkingSlots.filter(s => s.status === "available")

  function handleIssue() {
    if (!plate.trim()) { setError("Vui lòng nhập biển số xe"); return }
    if (freeSlots.length === 0) { setError("Bãi xe hiện đã đầy"); return }

    const id = "TK" + Date.now().toString().slice(-6)
    tickets.push({
      id,
      licensePlate: plate.toUpperCase(),
      entryTime: new Date().toISOString(),
      exitTime: null,
      status: "active",
      fee: null,
    })
    // Đánh dấu 1 chỗ đã chiếm
    const slot = freeSlots[0]
    slot.status = "occupied"

    setTicketId(id)
    setDone(true)
    setError("")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200
                        shadow-sm">
          <Navbar title="IoT-SPMS · Vận hành" />
          <div className="bg-white p-5">

            <button
              onClick={() => router.push("/dashboard/operator")}
              className="flex items-center gap-1 text-xs text-gray-400
                         mb-4 hover:text-gray-600 transition-colors"
            >
              ← Dashboard
            </button>

            {!done ? (
              <>
                <p className="font-medium text-gray-900 mb-1">
                  Phát vé tạm thời
                </p>
                <p className="text-xs text-gray-400 mb-5">
                  Còn {freeSlots.length} chỗ trống
                </p>

                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Biển số xe *
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-lg
                               px-3 py-2.5 text-sm bg-gray-50
                               focus:outline-none focus:border-[#185FA5]
                               uppercase"
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
                    className="w-full border border-gray-200 rounded-lg
                               px-3 py-2.5 text-sm bg-gray-50
                               focus:outline-none focus:border-[#185FA5]"
                    placeholder="Không bắt buộc"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-xs mb-4 bg-red-50
                                px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  onClick={handleIssue}
                  className="w-full bg-[#185FA5] hover:bg-[#0C447C]
                             text-[#E6F1FB] font-medium py-3 rounded-xl
                             text-sm transition-colors"
                >
                  Phát vé & Mở cổng
                </button>
              </>
            ) : (
              /* Vé đã phát */
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex
                                items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎫</span>
                </div>
                <p className="font-medium text-gray-900 mb-1">
                  Vé đã phát thành công
                </p>
                <p className="text-xs text-gray-400 mb-5">Cổng đang mở</p>

                {/* QR mock */}
                <div className="border-2 border-dashed border-gray-200
                                rounded-xl p-5 mb-5 mx-auto max-w-[200px]">
                  <div className="grid grid-cols-5 gap-1 mb-3">
                    {Array.from({length:25}).map((_,i) => (
                      <div key={i}
                           className={`h-4 rounded-sm ${
                             [0,1,5,6,10,12,18,19,23,24,3,8,16,21]
                               .includes(i)
                               ? "bg-gray-800" : "bg-gray-100"
                           }`}/>
                    ))}
                  </div>
                  <p className="font-mono text-xs text-gray-600 text-center">
                    {ticketId}
                  </p>
                  <p className="text-xs text-gray-400 text-center mt-1">
                    {plate.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-300 text-center mt-0.5">
                    {new Date().toLocaleTimeString("vi-VN")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/ticket/list")}
                    className="flex-1 border border-gray-200 text-gray-600
                               py-2.5 rounded-xl text-sm hover:bg-gray-50
                               transition-colors"
                  >
                    Danh sách vé
                  </button>
                  <button
                    onClick={() => {
                      setDone(false); setPlate(""); setName("")
                    }}
                    className="flex-1 bg-[#185FA5] text-[#E6F1FB] py-2.5
                               rounded-xl text-sm hover:bg-[#0C447C]
                               transition-colors"
                  >
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