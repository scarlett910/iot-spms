"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { User, invoices } from "@/data/mock"
import Navbar from "@/components/Navbar"

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

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || ["operator","admin"].includes(u.role)) {
      router.push("/login"); return
    }
    setUser(u)
  }, [])

  if (!user) return null

  const myInvoices = invoices.filter(i => i.userId === user.id)
  const pending    = myInvoices.filter(i => i.status === "pending")
  const paid       = myInvoices.filter(i => i.status === "paid")
  const total      = myInvoices.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center
                    py-6 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl overflow-hidden border border-gray-200
                        shadow-sm">
          <Navbar />
          <div className="bg-white p-5">

            {/* Greeting */}
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-4">
              Sinh viên · Tháng 4/2025
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { label: "Lượt gửi xe",      value: myInvoices.length,
                  cls: "text-gray-900" },
                { label: "Cần thanh toán",
                  value: pending.length > 0
                    ? `${(pending[0].amount/1000).toFixed(0)}k` : "0",
                  cls: "text-amber-600" },
                { label: "Đã thanh toán",    value: paid.length,
                  cls: "text-green-700" },
              ].map(s => (
                <div key={s.label}
                     className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className={`text-lg font-medium ${s.cls}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Menu */}
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase
                          tracking-wide">
              Chức năng
            </p>
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map(m => (
                <button
                  key={m.title}
                  onClick={() => router.push(m.href)}
                  className="bg-white border border-gray-100 rounded-xl p-4
                             text-left hover:border-[#185FA5]/30 hover:shadow-sm
                             transition-all"
                >
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