"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"
import { fetchSubZones } from "@/lib/api"
import { User } from "@/data/mock"
import Navbar from "@/components/Navbar"

export default function OperatorDashboard() {
  const router = useRouter()
  const [user,  setUser]  = useState<User | null>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || !["operator","admin"].includes(u.role)) {
      router.push("/login"); return
    }
    setUser(u)

    fetchSubZones().then(data => {
      setSlots(data.subZones)    // field đổi từ slots → subZones
      setLoading(false)
    })
  }, [])

  if (!user || loading) return null

  const zones = ["A","B","C"]
  const total    = slots.length
  const occupied = slots.filter(s => s.status === "occupied").length
  const free     = slots.filter(s => s.status === "available").length
  const errors   = slots.filter(s => s.status === "error").length

  const statusLabel: Record<string,{text:string;cls:string}> = {
    ok:   { text: "Còn chỗ",  cls: "bg-green-50 text-green-700" },
    warn: { text: "Cảnh báo", cls: "bg-amber-50 text-amber-700" },
    full: { text: "Gần đầy",  cls: "bg-red-50   text-red-700"   },
  }

  function zoneStatus(zone: string): "ok"|"warn"|"full" {
    const zSlots   = slots.filter(s => s.zone === zone)
    const zOccupied = zSlots.filter(s => s.status === "occupied").length
    const pct      = zSlots.length ? Math.round(zOccupied / zSlots.length * 100) : 0
    const hasError = zSlots.some(s => s.status === "error")
    return hasError ? "warn" : pct >= 90 ? "full" : "ok"
  }

  const menuItems = [
    { icon: "🎫", title: "Phát vé tạm thời", sub: "Khách vãng lai",
      href: "/ticket/new",  color: "bg-amber-50"  },
    { icon: "📋", title: "Danh sách vé",     sub: "Xem & thu phí",   // thêm dòng này
    href: "/ticket/list", color: "bg-blue-50"   },
    { icon: "🗺️", title: "Bản đồ bãi xe",   sub: "Xem chi tiết",
      href: "/parking",     color: "bg-blue-50"   },
    ...(user.role === "admin" ? [
      { icon: "📊", title: "Báo cáo",           sub: "Thống kê & xuất PDF",
        href: "/report",          color: "bg-green-50"  },
      { icon: "⭐", title: "Xem đánh giá",      sub: "Phản hồi người dùng",
        href: "/review/admin",    color: "bg-purple-50" },
      { icon: "⚙️", title: "Cấu hình hệ thống", sub: "Biểu giá & cài đặt",
        href: "/admin/settings",  color: "bg-gray-100"  },
    ] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <Navbar title="IoT-SPMS · Vận hành" />
          <div className="bg-white p-5">

            <p className="font-medium text-gray-900">Tổng quan bãi xe</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              {user.role === "admin" ? "Quản trị viên" : "Nhân viên vận hành"}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { label: "Tổng chỗ",     value: total,    cls: "text-gray-900" },
                { label: "Đang có xe",   value: occupied, cls: "text-amber-600" },
                { label: "Còn trống",    value: free,     cls: "text-green-700" },
                { label: "Cảm biến lỗi", value: errors,   cls: "text-red-600"   },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className={`text-xl font-medium ${s.cls}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Zone status */}
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase
                          tracking-wide">
              Theo khu vực
            </p>
            <div className="border border-gray-100 rounded-xl overflow-hidden mb-5">
              {zones.map((zone, i) => {
                const zSlots    = slots.filter(s => s.zone === zone)
                const zOccupied = zSlots.filter(s => s.status === "occupied").length
                const zErrors   = zSlots.filter(s => s.status === "error").length
                const pct       = zSlots.length
                  ? Math.round(zOccupied / zSlots.length * 100) : 0
                const st        = statusLabel[zoneStatus(zone)]

                return (
                  <div key={zone}
                    className={`flex items-center justify-between px-4 py-3
                      ${i < zones.length-1 ? "border-b border-gray-100" : ""}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Khu {zone}
                      </p>
                      <p className="text-xs text-gray-400">
                        {zOccupied}/{zSlots.length} chỗ
                        {zErrors > 0 ? ` · ${zErrors} lỗi` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#185FA5]"
                             style={{ width: `${pct}%` }}/>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full
                                        font-medium ${st.cls}`}>
                        {st.text}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Menu */}
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase
                          tracking-wide">
              Thao tác nhanh
            </p>
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map(m => (
                <button key={m.title}
                  onClick={() => router.push(m.href)}
                  className="bg-white border border-gray-100 rounded-xl p-4
                             text-left hover:border-[#185FA5]/30 hover:shadow-sm
                             transition-all">
                  <div className={`w-8 h-8 ${m.color} rounded-lg flex
                                   items-center justify-center text-base mb-2`}>
                    {m.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-800">{m.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}