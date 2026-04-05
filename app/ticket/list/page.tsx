"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { tickets } from "@/data/mock"
import Navbar from "@/components/Navbar"

export default function TicketListPage() {
  const router = useRouter()

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || !["operator","admin"].includes(u.role))
      router.push("/login")
  }, [])

  const active = tickets.filter(t => t.status === "active")
  const closed = tickets.filter(t => t.status === "closed")

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
                         mb-4 hover:text-gray-600"
            >
              ← Dashboard
            </button>

            <div className="flex justify-between items-center mb-5">
              <p className="font-medium text-gray-900">Danh sách vé</p>
              <button
                onClick={() => router.push("/ticket/new")}
                className="text-xs bg-[#185FA5] text-[#E6F1FB] px-3 py-1.5
                           rounded-lg hover:bg-[#0C447C] transition-colors"
              >
                + Phát vé mới
              </button>
            </div>

            {/* Active */}
            <p className="text-xs font-medium text-gray-500 uppercase
                          tracking-wide mb-2">
              Đang gửi xe ({active.length})
            </p>
            {active.length === 0 ? (
              <p className="text-xs text-gray-300 mb-4 px-1">Không có</p>
            ) : (
              <div className="flex flex-col gap-2 mb-5">
                {active.map(t => (
                  <div key={t.id}
                       className="flex justify-between items-center px-4
                                  py-3 border border-amber-100 bg-amber-50/50
                                  rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {t.licensePlate}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Vào: {new Date(t.entryTime)
                          .toLocaleTimeString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-amber-100 text-amber-700
                                       px-2 py-0.5 rounded-full font-medium">
                        Đang gửi
                      </span>
                      <button
                        onClick={() => router.push("/ticket/checkout")}
                        className="text-xs text-[#185FA5] hover:underline"
                      >
                        Thu phí
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Closed */}
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
                       className="flex justify-between items-center px-4
                                  py-3 border border-gray-100 rounded-xl">
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
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {t.fee
                          ? t.fee.toLocaleString("vi-VN") + "đ"
                          : "—"}
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