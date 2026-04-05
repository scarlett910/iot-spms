"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { invoices, tickets, parkingSlots } from "@/data/mock"
import Navbar from "@/components/Navbar"

export default function ReportPage() {
  const router = useRouter()
  const [type, setType]     = useState("summary")
  const [generated, setGen] = useState(false)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || u.role !== "admin") { router.push("/login"); return }
  }, [])

  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((s,i) => s + i.amount, 0)
  const totalTickets  = tickets.length
  const activeTickets = tickets.filter(t => t.status === "active").length
  const errorSlots    = parkingSlots.filter(s => s.status === "error").length

  const reportTypes = [
    { id: "summary",  label: "Báo cáo tổng hợp"  },
    { id: "revenue",  label: "Báo cáo doanh thu"  },
    { id: "traffic",  label: "Báo cáo lưu lượng"  },
    { id: "device",   label: "Báo cáo thiết bị"   },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200
                        shadow-sm">
          <Navbar title="IoT-SPMS · Quản trị" />
          <div className="bg-white p-5">

            <button
              onClick={() => router.push("/dashboard/operator")}
              className="flex items-center gap-1 text-xs text-gray-400
                         mb-4 hover:text-gray-600"
            >
              ← Dashboard
            </button>

            <p className="font-medium text-gray-900 mb-5">Tạo báo cáo</p>

            {/* Type */}
            <p className="text-xs text-gray-500 mb-2">Loại báo cáo</p>
            <div className="flex flex-col gap-1.5 mb-4">
              {reportTypes.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setType(r.id); setGen(false) }}
                  className={`flex items-center justify-between px-4 py-3
                    rounded-xl border text-sm transition-all ${
                    type === r.id
                      ? "border-[#185FA5] bg-blue-50 text-[#185FA5]"
                      : "border-gray-100 text-gray-700 hover:border-gray-200"
                  }`}
                >
                  {r.label}
                  {type === r.id && (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l4 4 6-7" stroke="currentColor"
                            strokeWidth="1.5" strokeLinecap="round"
                            strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setGen(true)}
              className="w-full bg-[#185FA5] hover:bg-[#0C447C]
                         text-[#E6F1FB] font-medium py-3 rounded-xl
                         text-sm transition-colors mb-5"
            >
              Tạo báo cáo
            </button>

            {/* Preview */}
            {generated && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">
                    {reportTypes.find(r => r.id === type)?.label}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date().toLocaleDateString("vi-VN")}
                  </p>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  {(type === "summary" || type === "revenue") && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Tổng doanh thu</span>
                      <span className="font-medium text-gray-900">
                        {totalRevenue.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  )}
                  {(type === "summary" || type === "traffic") && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Tổng lượt gửi xe</span>
                        <span className="font-medium text-gray-900">
                          {totalTickets}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Đang gửi xe</span>
                        <span className="font-medium text-amber-600">
                          {activeTickets}
                        </span>
                      </div>
                    </>
                  )}
                  {(type === "summary" || type === "device") && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Cảm biến lỗi</span>
                      <span className={`font-medium ${
                        errorSlots > 0 ? "text-red-600" : "text-green-700"
                      }`}>
                        {errorSlots}
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-4 pb-4">
                  <button
                    onClick={() => alert(
                      "Mock: Xuất PDF thành công!\n" +
                      "File: bao-cao-" + type + "-" +
                      new Date().toISOString().slice(0,10) + ".pdf"
                    )}
                    className="w-full border border-[#185FA5]/40
                               text-[#185FA5] text-sm py-2.5 rounded-xl
                               hover:bg-blue-50 transition-colors"
                  >
                    Tải về PDF (Mock)
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