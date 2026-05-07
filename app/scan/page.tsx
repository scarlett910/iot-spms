"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import OperatorLayout from "@/components/OperatorLayout"

type ScanResult = {
  action:       "checkin" | "checkout"
  type:         "member" | "guest"
  // member fields
  userId?:      string
  userName?:    string
  role?:        string
  // guest fields
  ticketId?:    string
  licensePlate?: string
  // common
  subZoneId:    string
  fee?:         number | null
  time:         string
}

export default function ScanPage() {
  const router  = useRouter()
  const scanRef = useRef<any>(null)
  const [user,       setUser]       = useState<any>(null)
  const [scanning,   setScanning]   = useState(false)
  const [result,     setResult]     = useState<ScanResult | null>(null)
  const [error,      setError]      = useState("")
  const [loading,    setLoading]    = useState(false)
  const [facingMode, setFacingMode] = useState<"environment"|"user">("environment")

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || !["operator","admin"].includes(u.role)) {
      router.push("/login"); return
    }
    setUser(u)
  }, [])

  async function startScan() {
    setError(""); setResult(null)
    const { Html5Qrcode } = await import("html5-qrcode")
    const qr = new Html5Qrcode("qr-reader")
    scanRef.current = qr

    const tryStart = async (mode: "environment"|"user") => {
      await qr.start(
        { facingMode: mode },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText: string) => {
          await stopScan()
          await processQR(decodedText.trim())
        },
        () => {}
      )
      setFacingMode(mode)
      setScanning(true)
    }

    try { await tryStart("environment") }
    catch {
      try { await tryStart("user") }
      catch { setError("Không thể khởi động camera. Kiểm tra quyền truy cập."); scanRef.current = null }
    }
  }

  async function stopScan() {
    if (scanRef.current) {
      try { await scanRef.current.stop() } catch {}
      scanRef.current = null
    }
    setScanning(false)
  }

  async function processQR(value: string) {
    setLoading(true); setError("")
    try {
      const res  = await fetch("/api/scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: value }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Lỗi xử lý"); return }
      setResult(data)
    } catch { setError("Mất kết nối. Thử lại.") }
    finally { setLoading(false) }
  }

  useEffect(() => { return () => { stopScan() } }, [])

  if (!user) return null

  const roleLabel: Record<string,string> = {
    student:"Sinh viên", lecturer:"Giảng viên", staff:"Cán bộ",
  }

  // Màu theo action
  const isCheckout = result?.action === "checkout"
  const accentColor = isCheckout ? "#f59e0b" : "#22c55e"
  const accentBg    = isCheckout ? "#FFF7ED" : "#F0FDF4"
  const accentBorder= isCheckout ? "#FDE68A" : "#BBF7D0"

  return (
    <OperatorLayout user={user} activePage="Quét QR" title="Quét QR" backHref="/dashboard/operator">
      <div style={{ maxWidth:400 }}>

        {/* Camera box */}
        <div style={{
          position:"relative", borderRadius:16, overflow:"hidden",
          background:"#000", marginBottom:14, aspectRatio:"1",
        }}>
          <div id="qr-reader" style={{ width:"100%", height:"100%" }}/>
          {!scanning && !loading && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
              <div style={{ width:56, height:56, background:"rgba(255,255,255,0.1)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:26 }}>📷</span>
              </div>
              <p style={{ color:"rgba(255,255,255,0.6)", fontSize:12 }}>Camera chưa bật</p>
            </div>
          )}
          {loading && (
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <p style={{ color:"white", fontSize:14 }}>Đang xử lý...</p>
            </div>
          )}
          {scanning && (
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
              <div style={{ width:200, height:200, border:"2px solid rgba(255,255,255,0.7)", borderRadius:12 }}/>
            </div>
          )}
        </div>

        {/* Buttons */}
        {!scanning ? (
          <button onClick={startScan} style={{
            width:"100%", height:46, background:"#003289", color:"white",
            border:"none", borderRadius:12, fontSize:15, fontWeight:600,
            cursor:"pointer", fontFamily:"'Inter',sans-serif", marginBottom:12,
          }}>
            Bật camera & Quét
          </button>
        ) : (
          <button onClick={stopScan} style={{
            width:"100%", height:46, background:"white", color:"#555",
            border:"1px solid #e2e8f0", borderRadius:12, fontSize:14,
            fontWeight:500, cursor:"pointer", fontFamily:"'Inter',sans-serif", marginBottom:12,
          }}>
            Dừng quét
          </button>
        )}

        {error && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
            <p style={{ color:"#DC2626", fontSize:13 }}>{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ background:accentBg, border:`1px solid ${accentBorder}`, borderRadius:14, overflow:"hidden", marginBottom:12 }}>
            {/* Header */}
            <div style={{ background:accentBorder, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>{isCheckout ? "🚗" : "✅"}</span>
              <p style={{ fontWeight:700, fontSize:14, color: isCheckout?"#92400E":"#166534" }}>
                {isCheckout ? "Checkout thành công" : "Check-in thành công"}
              </p>
            </div>
            {/* Body */}
            <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
              {result.type === "guest" ? (
                // Khách vãng lai
                <>
                  <Row label="Loại"      val="Khách vãng lai" />
                  <Row label="Mã vé"     val={result.ticketId ?? "—"} />
                  <Row label="Biển số"   val={result.licensePlate ?? "—"} />
                  <Row label="Khu vực"   val={result.subZoneId} />
                  {result.action === "checkout" && (
                    <Row label="Phí thu" val={result.fee && result.fee > 0 ? result.fee.toLocaleString("vi-VN")+"đ" : "Miễn phí"} />
                  )}
                </>
              ) : (
                // Thành viên
                <>
                  <Row label="Họ tên"  val={result.userName ?? "—"} />
                  <Row label="Vai trò" val={roleLabel[result.role ?? ""] ?? result.role ?? "—"} />
                  <Row label="Khu vực" val={result.subZoneId} />
                  {result.action === "checkout" && (
                    <Row label="Phí thu" val={result.fee && result.fee > 0 ? result.fee.toLocaleString("vi-VN")+"đ" : "Miễn phí"} />
                  )}
                </>
              )}
              <Row label="Thời gian" val={new Date(result.time).toLocaleTimeString("vi-VN")} />
            </div>
            {/* Quét tiếp */}
            <div style={{ padding:"0 14px 12px" }}>
              <button onClick={() => { setResult(null); startScan() }} style={{
                width:"100%", height:36, background:"white",
                border:"1px solid #e2e8f0", borderRadius:8,
                fontSize:12, fontWeight:500, cursor:"pointer",
                fontFamily:"'Inter',sans-serif", color:"#555",
              }}>
                Quét xe tiếp theo
              </button>
            </div>
          </div>
        )}

        {/* Hướng dẫn */}
        <div style={{ background:"white", borderRadius:12, padding:14, border:"1px solid #e2e8f0" }}>
          <p style={{ fontWeight:600, fontSize:12, color:"#000", marginBottom:8 }}>Hướng dẫn</p>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {[
              "Quét QR trên thẻ SV/GV/CB → check-in hoặc check-out tự động",
              "Quét QR trên vé khách vãng lai → checkout và tính phí",
            ].map((t,i) => (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                <span style={{ fontSize:12, color:"#003289", flexShrink:0 }}>•</span>
                <p style={{ fontSize:11, color:"#555", lineHeight:1.5 }}>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OperatorLayout>
  )
}

function Row({ label, val }: { label:string; val:string }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:12, color:"#868686" }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, color:"#000" }}>{val}</span>
    </div>
  )
}