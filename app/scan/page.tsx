"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import Navbar from "@/components/Navbar"

type ScanResult = {
  action:    "checkin" | "checkout"
  userName:  string
  role:      string
  subZoneId: string
  fee?:      number | null
  time:      string
}

export default function ScanPage() {
  const router  = useRouter()
  const scanRef = useRef<any>(null)
  const [scanning, setScanning] = useState(false)
  const [result,   setResult]   = useState<ScanResult | null>(null)
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)
  // desktop dùng "environment" có thể fail → fallback "user"
  const [facingMode, setFacingMode] = useState<"environment"|"user">("environment")

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || !["operator","admin"].includes(u.role)) {
      router.push("/login")
    }
  }, [])

  async function startScan() {
    setError("")
    setResult(null)

    const { Html5Qrcode } = await import("html5-qrcode")
    const qr = new Html5Qrcode("qr-reader")
    scanRef.current = qr

    const tryStart = async (mode: "environment"|"user") => {
      await qr.start(
        { facingMode: mode },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText: string) => {
          await stopScan()
          await processUserId(decodedText.trim())
        },
        () => {}
      )
      setFacingMode(mode)
      setScanning(true)
    }

    try {
      await tryStart("environment")
    } catch {
      try {
        // Desktop thường không có "environment" → thử "user" (webcam trước)
        await tryStart("user")
      } catch (e) {
        setError("Không thể khởi động camera. Hãy cho phép truy cập camera trong trình duyệt.")
        scanRef.current = null
      }
    }
  }

  async function stopScan() {
    if (scanRef.current) {
      try { await scanRef.current.stop() } catch {}
      scanRef.current = null
    }
    setScanning(false)
  }

  async function processUserId(userId: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/scan", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Lỗi xử lý"); return }
      setResult(data)
    } catch {
      setError("Mất kết nối. Thử lại.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => { stopScan() }
  }, [])

  const roleLabel: Record<string,string> = {
    student:  "Sinh viên",
    lecturer: "Giảng viên",
    staff:    "Cán bộ",
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <Navbar title="IoT-SPMS · Quét QR" />
          <div className="bg-white p-5">

            <button onClick={() => { stopScan(); router.push("/dashboard/operator") }}
              className="flex items-center gap-1 text-xs text-gray-400 mb-4 hover:text-gray-600">
              ← Dashboard
            </button>

            <p className="font-medium text-gray-900 mb-1">Quét mã QR</p>
            <p className="text-xs text-gray-400 mb-4">
              Quét thẻ QR của sinh viên / giảng viên để check-in hoặc check-out
            </p>

            {/* Khung camera */}
            <div className="relative rounded-xl overflow-hidden bg-black mb-4 aspect-square">
              <div id="qr-reader" className="w-full h-full"/>
              {!scanning && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📷</span>
                  </div>
                  <p className="text-white/60 text-xs">Camera chưa bật</p>
                </div>
              )}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <p className="text-white text-sm">Đang xử lý...</p>
                </div>
              )}
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white/60 rounded-xl"/>
                </div>
              )}
            </div>

            {!scanning ? (
              <button onClick={startScan}
                className="w-full bg-[#185FA5] hover:bg-[#0C447C] text-[#E6F1FB]
                           font-medium py-3 rounded-xl text-sm transition-colors mb-3">
                Bật camera & Quét
              </button>
            ) : (
              <button onClick={stopScan}
                className="w-full border border-gray-200 text-gray-600 py-3
                           rounded-xl text-sm hover:bg-gray-50 transition-colors mb-3">
                Dừng quét
              </button>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className={`rounded-xl overflow-hidden border mb-3
                ${result.action === "checkin"
                  ? "border-green-100 bg-green-50"
                  : "border-amber-100 bg-amber-50"}`}>
                <div className={`px-4 py-2 flex items-center gap-2
                  ${result.action === "checkin" ? "bg-green-100" : "bg-amber-100"}`}>
                  <span>{result.action === "checkin" ? "✅" : "🚗"}</span>
                  <p className={`text-sm font-medium
                    ${result.action === "checkin" ? "text-green-800" : "text-amber-800"}`}>
                    {result.action === "checkin" ? "Check-in thành công" : "Check-out thành công"}
                  </p>
                </div>
                <div className="px-4 py-3 flex flex-col gap-1.5">
                  {[
                    ["Họ tên",    result.userName],
                    ["Vai trò",   roleLabel[result.role] ?? result.role],
                    ["Khu vực",   result.subZoneId],
                    ...(result.action === "checkout"
                      ? [["Phí thu", result.fee
                          ? result.fee.toLocaleString("vi-VN") + "đ"
                          : "Miễn phí"]]
                      : []),
                    ["Thời gian", new Date(result.time).toLocaleTimeString("vi-VN")],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-400">{label}</span>
                      <span className="font-medium text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-3">
                  <button onClick={() => { setResult(null); startScan() }}
                    className="w-full border border-gray-200 text-gray-600 py-2
                               rounded-lg text-xs hover:bg-white transition-colors">
                    Quét xe tiếp theo
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