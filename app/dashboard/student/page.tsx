"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchInvoices, fetchSlots } from "@/lib/api"
import { User } from "@/data/mock"
import Navbar from "@/components/Navbar"

export default function StudentDashboard() {
  const router = useRouter()
  const [user,         setUser]         = useState<User | null>(null)
  const [invoices,     setInvoices]     = useState<any[]>([])
  const [currentSlot,  setCurrentSlot]  = useState<string | null>(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || ["operator","admin"].includes(u.role)) {
      router.push("/login"); return
    }
    setUser(u)

    const userId = u.id   // lưu vào biến trước

    async function load() {
      const [invData, slotData] = await Promise.all([
        fetchInvoices(userId),   // dùng biến thay vì u.id
        fetchSlots(userId),
      ])
      setInvoices(invData.invoices)
      setCurrentSlot(slotData.currentSlot)
      setLoading(false)
    }
    load()
  }, [])

  if (!user || loading) return null

  const pending  = invoices.filter(i => i.status === "pending")
  const paid     = invoices.filter(i => i.status === "paid")
  const totalAmt = pending.reduce((s: number, i: any) => s + i.amount, 0)

  const menuItems = [
    { icon: "💳", title: "Hóa đơn gửi xe", sub: "Xem & thanh toán",
      href: "/invoice",  color: "bg-blue-50"   },
    { icon: "🕐", title: "Lịch sử",         sub: "Xem lại giao dịch",
      href: "/history",  color: "bg-green-50"  },
    { icon: "🗺️", title: "Bản đồ bãi xe",  sub: "Xem chỗ trống",
      href: "/parking",  color: "bg-amber-50"  },
    { icon: "⭐", title: "Đánh giá",        sub: "Gửi phản hồi",
      href: "/review",   color: "bg-purple-50" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <Navbar />
          <div className="bg-white p-5">

            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              {user.role === "student"  ? "Sinh viên"  :
               user.role === "lecturer" ? "Giảng viên" : "Cán bộ"}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Vị trí gửi xe</p>
                <p className={`text-lg font-medium
                  ${currentSlot ? "text-green-700" : "text-gray-300"}`}>
                  {currentSlot ?? "—"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Chờ thanh toán</p>
                <p className="text-lg font-medium text-amber-600">
                  {pending.length > 0
                    ? `${(totalAmt / 1000).toFixed(0)}k`
                    : "0"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Đã thanh toán</p>
                <p className="text-lg font-medium text-green-700">
                  {paid.length}
                </p>
              </div>
            </div>

            {/* Menu */}
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase
                          tracking-wide">
              Chức năng
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