"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchSubZones } from "@/lib/api"
import { User } from "@/data/mock"
import Navbar from "@/components/Navbar"

export default function ParkingPage() {
  const router = useRouter()
  const [user,        setUser]        = useState<User | null>(null)
  const [slots,       setSlots]       = useState<any[]>([])
  const [currentSlot, setCurrentSlot] = useState<string | null>(null)
  const [filter,      setFilter]      = useState<"all"|"available"|"occupied"|"error">("all")
  const [loading,     setLoading]     = useState(true)
  const [lastUpdate,  setLastUpdate]  = useState(new Date())

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.push("/login"); return }
    setUser(u)

    const userId = u.id

    async function load() {
      const data = await fetchSubZones(userId)
      setSlots(data.subZones)
      setCurrentSlot(data.currentSubZone)
      setLastUpdate(new Date())
      setLoading(false)
    }

    load()

    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!user || loading) return null

  const zones = ["A","B","C"]
  const filtered = slots.filter(s =>
    filter === "all" ? true : s.status === filter
  )

  const total     = slots.length
  const available = slots.filter(s => s.status === "available").length
  const occupied  = slots.filter(s => s.status === "occupied").length
  const errors    = slots.filter(s => s.status === "error").length
  const pct       = total ? Math.round(occupied / total * 100) : 0

  function getZoneStyle(sz: any) {
  const pct = Math.round(sz.occupied / sz.capacity * 100)
  if (pct >= 100) return {
    label: "Hết chỗ", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500"
  }
  if (pct >= 80) return {
    label: "Gần đầy", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500"
  }
  return {
    label: "Còn chỗ", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500"
  }
}

  async function refresh() {
    const data = await fetchSubZones(user!.id)
    setSlots(data.subZones)
    setCurrentSlot(data.currentSubZone)
    setLastUpdate(new Date())
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <Navbar />
          <div className="bg-white p-5">

            <button onClick={() => router.back()}
              className="flex items-center gap-1 text-xs text-gray-400
                         mb-4 hover:text-gray-600">
              ← Quay lại
            </button>

            <p className="font-medium text-gray-900 mb-1">Bản đồ bãi xe</p>

            {/* Thời gian + nút làm mới */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-gray-400">
                Cập nhật lúc {lastUpdate.toLocaleTimeString("vi-VN")}
              </p>
              <button onClick={refresh}
                className="text-xs text-[#185FA5] hover:underline">
                Làm mới
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-1.5 mb-5">
              {[
                { label: "Tổng",  value: total,     cls: "text-gray-900"  },
                { label: "Trống", value: available,  cls: "text-green-700" },
                { label: "Có xe", value: occupied,   cls: "text-gray-500"  },
                { label: "Lỗi",   value: errors,     cls: "text-red-600"   },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className={`text-base font-medium ${s.cls}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Fill bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Tỉ lệ lấp đầy</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all
                    ${pct >= 90 ? "bg-red-400"
                    : pct >= 70 ? "bg-amber-400"
                    : "bg-[#185FA5]"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-1.5 mb-4">
              {(["all","available","occupied","error"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium
                              transition-colors
                    ${filter === f
                      ? "bg-[#185FA5] text-[#E6F1FB]"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {f === "all"       ? "Tất cả"
                   : f === "available" ? "Trống"
                   : f === "occupied"  ? "Có xe" : "Lỗi"}
                </button>
              ))}
            </div>

            {/* Grid by zone */}
            {zones.map(zone => {
              const zSlots = filtered.filter(s => s.zone === zone)
              if (zSlots.length === 0) return null
              return (
                <div key={zone} className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Khu {zone}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {zSlots.map(sz => {
                      const st       = getZoneStyle(sz)
                      const isMyZone = sz.id === currentSlot
                      const pct      = Math.round(sz.occupied / sz.capacity * 100)

                      return (
                        <div key={sz.id}
                          className={`rounded-xl p-3 text-center relative
                            ${isMyZone
                              ? "ring-2 ring-[#185FA5] bg-blue-50"
                              : st.bg}`}>
                          {isMyZone && (
                            <div className="absolute -top-1 -right-1 w-3 h-3
                                            bg-[#185FA5] rounded-full border-2 border-white"/>
                          )}
                          <p className={`text-sm font-medium mb-0.5
                            ${isMyZone ? "text-[#185FA5]" : st.text}`}>
                            {sz.id}
                          </p>
                          <p className={`text-xs font-medium
                            ${isMyZone ? "text-[#185FA5]" : st.text}`}>
                            {sz.occupied}/{sz.capacity}
                          </p>
                          <p className={`text-xs opacity-70 mt-0.5
                            ${isMyZone ? "text-[#185FA5]" : st.text}`}>
                            {isMyZone ? "Của bạn" : st.label}
                          </p>
                          {/* Progress bar nhỏ */}
                          <div className="w-full h-1 bg-white/50 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full
                                ${pct >= 100 ? "bg-red-500"
                                : pct >= 80  ? "bg-amber-500"
                                : "bg-green-500"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

          </div>
        </div>
      </div>
    </div>
  )
}