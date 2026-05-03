"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchSettings, saveSettings } from "@/lib/api"
import Navbar from "@/components/Navbar"

type Tab = "pricing" | "parking" | "bkpay"

export default function SettingsPage() {
  const router = useRouter()
  const [tab,     setTab]     = useState<Tab>("pricing")
  const [pricing, setPricing] = useState<any>(null)
  const [parking, setParking] = useState<any>(null)
  const [bkpay,   setBkpay]   = useState<any>(null)
  const [saved,   setSaved]   = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || u.role !== "admin") { router.push("/login"); return }

    fetchSettings().then(data => {
      const s = data.settings
      setPricing({ ...s.pricing })
      setParking({ ...s.parking })
      setBkpay({ ...s.bkpay })
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    await saveSettings({ pricing, parking, bkpay })
    setSaved("Đã lưu!")
    setTimeout(() => setSaved(""), 2000)
  }

  if (loading || !pricing) return null

  const tabs: { id: Tab; label: string }[] = [
    { id: "pricing", label: "Biểu giá"        },
    { id: "parking", label: "Bãi xe"           },
    { id: "bkpay",   label: "Môi trường demo"  },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200
                        shadow-sm">
          <Navbar title="IoT-SPMS · Cấu hình hệ thống" />
          <div className="bg-white p-5">

            <button
              onClick={() => router.push("/dashboard/operator")}
              className="flex items-center gap-1 text-xs text-gray-400
                         mb-4 hover:text-gray-600">
              ← Dashboard
            </button>

            {/* Tabs */}
            <div className="flex gap-1.5 mb-6">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 text-xs py-2 rounded-lg font-medium
                              transition-colors
                    ${tab === t.id
                      ? "bg-[#185FA5] text-[#E6F1FB]"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Biểu giá */}
            {tab === "pricing" && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-gray-400">
                  Thay đổi sẽ áp dụng ngay cho các lần tính phí tiếp theo.
                </p>
                {[
                  { key: "student",  label: "Sinh viên / HV / NCS", unit: "VNĐ/tháng" },
                  { key: "lecturer", label: "Giảng viên",            unit: "VNĐ/tháng" },
                  { key: "staff",    label: "Cán bộ - Nhân viên",    unit: "VNĐ/tháng" },
                  { key: "visitor",  label: "Khách vãng lai",         unit: "VNĐ/giờ"   },
                ].map(({ key, label, unit }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 block mb-1">
                      {label}
                      <span className="text-gray-300 ml-1">({unit})</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={pricing[key]}
                      onChange={e => setPricing((p: any) => ({
                        ...p, [key]: Number(e.target.value)
                      }))}
                      className="w-full border border-gray-200 rounded-lg
                                 px-3 py-2.5 text-sm bg-gray-50
                                 focus:outline-none focus:border-[#185FA5]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Bãi xe */}
            {tab === "parking" && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-gray-400">
                  Ngưỡng gần đầy ảnh hưởng đến màu hiển thị trên bản đồ bãi xe.
                </p>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Ngưỡng "Gần đầy" (%)
                  </label>
                  <input
                    type="number" min="50" max="99"
                    value={parking.nearFullThreshold}
                    onChange={e => setParking((p: any) => ({
                      ...p, nearFullThreshold: Number(e.target.value)
                    }))}
                    className="w-full border border-gray-200 rounded-lg
                               px-3 py-2.5 text-sm bg-gray-50
                               focus:outline-none focus:border-[#185FA5]"
                  />
                  <p className="text-xs text-gray-300 mt-1">
                    Khi tỉ lệ lấp đầy ≥ ngưỡng này → hiển thị "Gần đầy"
                  </p>
                </div>
                {(["A","B","C"] as const).map(zone => (
                  <div key={zone}>
                    <label className="text-xs text-gray-500 block mb-1">
                      Số chỗ khu {zone}
                    </label>
                    <input
                      type="number" min="1"
                      value={parking.totalSlots?.[zone] ?? 5}
                      onChange={e => setParking((p: any) => ({
                        ...p,
                        totalSlots: {
                          ...p.totalSlots,
                          [zone]: Number(e.target.value)
                        }
                      }))}
                      className="w-full border border-gray-200 rounded-lg
                                 px-3 py-2.5 text-sm bg-gray-50
                                 focus:outline-none focus:border-[#185FA5]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Môi trường demo */}
            {tab === "bkpay" && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-gray-400">
                  Dùng khi demo để kiểm tra luồng thành công và thất bại
                  mà không cần BKPay thật.
                </p>

                <div>
                  <label className="text-xs text-gray-500 block mb-2">
                    Chế độ giả lập BKPay
                  </label>
                  {([
                    { id: "success", label: "Luôn thành công",
                      sub: "Mọi giao dịch đều SUCCESS" },
                    { id: "failure", label: "Luôn thất bại",
                      sub: "Dùng để demo luồng ngoại lệ" },
                    { id: "random",  label: "Ngẫu nhiên",
                      sub: "70% thành công, 30% thất bại" },
                  ] as const).map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setBkpay((b: any) => ({
                        ...b, simulateMode: mode.id
                      }))}
                      className={`w-full flex justify-between items-center
                        px-4 py-3 mb-2 rounded-xl border text-left
                        transition-all
                        ${bkpay.simulateMode === mode.id
                          ? "border-[#185FA5] bg-blue-50"
                          : "border-gray-100 hover:border-gray-200"}`}>
                      <div>
                        <p className={`text-sm font-medium
                          ${bkpay.simulateMode === mode.id
                            ? "text-[#185FA5]" : "text-gray-800"}`}>
                          {mode.label}
                        </p>
                        <p className="text-xs text-gray-400">{mode.sub}</p>
                      </div>
                      {bkpay.simulateMode === mode.id && (
                        <span className="text-xs bg-[#185FA5] text-white
                                         px-2 py-0.5 rounded-full shrink-0">
                          Đang dùng
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Delay phản hồi (ms)
                  </label>
                  <input
                    type="number" min="0" max="5000" step="500"
                    value={bkpay.delayMs}
                    onChange={e => setBkpay((b: any) => ({
                      ...b, delayMs: Number(e.target.value)
                    }))}
                    className="w-full border border-gray-200 rounded-lg
                               px-3 py-2.5 text-sm bg-gray-50
                               focus:outline-none focus:border-[#185FA5]"
                  />
                  <p className="text-xs text-gray-300 mt-1">
                    0 = không delay · 1500 = mặc định · 3000 = demo timeout
                  </p>
                </div>
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              className="w-full mt-6 bg-[#185FA5] hover:bg-[#0C447C]
                         text-[#E6F1FB] font-medium py-3 rounded-xl
                         text-sm transition-colors">
              {saved || "Lưu cấu hình"}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}