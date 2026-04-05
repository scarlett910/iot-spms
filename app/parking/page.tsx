"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { parkingSlots } from "@/data/mock"
import Navbar from "@/components/Navbar"

export default function ParkingPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<"all"|"available"|"occupied"|"error">("all")

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) router.push("/login")
  }, [])

  const zones = ["A","B","C"]

  const statusStyle = {
    available: { label: "Trống",    bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
    occupied:  { label: "Có xe",   bg: "bg-gray-100",   text: "text-gray-500",   dot: "bg-gray-400"   },
    error:     { label: "Lỗi",     bg: "bg-red-100",    text: "text-red-600",    dot: "bg-red-400"    },
  }

  const filtered = parkingSlots.filter(s =>
    filter === "all" ? true : s.status === filter
  )

  const total     = parkingSlots.length
  const available = parkingSlots.filter(s => s.status === "available").length
  const occupied  = parkingSlots.filter(s => s.status === "occupied").length
  const errors    = parkingSlots.filter(s => s.status === "error").length
  const pct       = Math.round((occupied / total) * 100)

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200
                        shadow-sm">
          <Navbar />
          <div className="bg-white p-5">

            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-xs text-gray-400
                         mb-4 hover:text-gray-600"
            >
              ← Quay lại
            </button>

            <p className="font-medium text-gray-900 mb-1">Bản đồ bãi xe</p>
            <p className="text-xs text-gray-400 mb-4">
              Cập nhật lúc {new Date().toLocaleTimeString("vi-VN")}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-1.5 mb-5">
              {[
                { label: "Tổng",   value: total,     cls: "text-gray-900" },
                { label: "Trống",  value: available, cls: "text-green-700" },
                { label: "Có xe",  value: occupied,  cls: "text-gray-500"  },
                { label: "Lỗi",   value: errors,    cls: "text-red-600"   },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-2
                                              text-center">
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className={`text-base font-medium ${s.cls}`}>
                    {s.value}
                  </p>
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
                  className={`h-full rounded-full transition-all ${
                    pct >= 90 ? "bg-red-400"
                    : pct >= 70 ? "bg-amber-400"
                    : "bg-[#185FA5]"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1.5 mb-4">
              {(["all","available","occupied","error"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium
                    transition-colors ${
                    filter === f
                      ? "bg-[#185FA5] text-[#E6F1FB]"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? "Tất cả"
                   : f === "available" ? "Trống"
                   : f === "occupied"  ? "Có xe" : "Lỗi"}
                </button>
              ))}
            </div>

            {/* Grid by zone */}
            {zones.map(zone => {
              const slots = filtered.filter(s => s.zone === zone)
              if (slots.length === 0) return null
              return (
                <div key={zone} className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Khu {zone}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => {
                      const st = statusStyle[slot.status]
                      return (
                        <div key={slot.id}
                             className={`${st.bg} rounded-lg p-2 text-center`}>
                          <div className={`w-2 h-2 rounded-full ${st.dot}
                                           mx-auto mb-1`}/>
                          <p className={`text-xs font-medium ${st.text}`}>
                            {slot.id}
                          </p>
                          <p className={`text-xs ${st.text} opacity-70`}>
                            {st.label}
                          </p>
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