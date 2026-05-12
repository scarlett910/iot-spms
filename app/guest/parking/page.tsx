"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchSubZones } from "@/lib/api"

type SubZone = { id: string; zone: string; capacity: number; occupied: number }

export default function GuestParkingPage() {
  const router = useRouter()
  const [slots, setSlots] = useState<SubZone[]>([])
  const [now,   setNow]   = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    async function load() {
      const data = await fetchSubZones()
      setSlots(data.subZones ?? [])
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  function zoneColor(z: SubZone) {
    const pct = z.capacity > 0 ? z.occupied / z.capacity : 0
    if (pct >= 1)   return { bg: "rgba(255,14,14,0.18)",  border: "#FF9292" }
    if (pct >= 0.8) return { bg: "rgba(246,255,67,0.38)", border: "#E2E000" }
    return               { bg: "rgba(49,233,42,0.22)",  border: "#A2F59F" }
  }

  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr = now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  return (
    <div suppressHydrationWarning style={{
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column",
    }}>
      {/* Navbar */}
      <nav style={{
        background: "#003289", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 16 }}>IOT-SPMS</span>
        <button onClick={() => router.push("/login")} style={{
          background: "none", border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 8, color: "#F8FAFC", fontSize: 12, fontWeight: 600,
          padding: "5px 12px", cursor: "pointer", fontFamily: "'Inter',sans-serif",
        }}>Đăng nhập</button>
      </nav>

      <div style={{ flex: 1, padding: "20px 16px 32px", maxWidth: 600, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {/* Header */}
        <button onClick={() => router.push("/guest")} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none",
          border: "none", cursor: "pointer", color: "#003289", fontSize: 12,
          fontWeight: 600, fontFamily: "'Inter',sans-serif", marginBottom: 12, padding: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M15 9H3M9 3L3 9l6 6" stroke="#003289" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Quay lại
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <p style={{ fontWeight: 800, fontSize: 20, color: "#003289" }}>Bản đồ bãi giữ xe</p>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#003289" }}>{timeStr}</p>
            <p style={{ fontSize: 10, color: "#868686", marginTop: 1 }}>{dateStr}</p>
          </div>
        </div>

        {/* Map card */}
        <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 4px 4px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
            {[{ color: "#A2F59F", label: "Còn trống" }, { color: "#FF9292", label: "Hết chỗ" }, { color: "#FAFFA5", label: "Có lỗi" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 12, height: 12, background: l.color, borderRadius: 2 }}/>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#000" }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Khu A */}
          <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Khu A (GV / CB)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 4 }}>
            {["1","2","3"].map(sub => {
              const z = slots.find(s => s.id === `A${sub}`)
              const col = z ? zoneColor(z) : { bg: "#f5f5f5", border: "#e2e8f0" }
              return (
                <div key={`A${sub}`} style={{ background: col.bg, border: `1.5px solid ${col.border}`, borderRadius: 8, padding: "8px 6px", textAlign: "center", minHeight: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: "#000", marginBottom: 4 }}>A{sub}</p>
                  <p style={{ fontSize: 12, color: "#000" }}>{z ? `${z.occupied}/${z.capacity}` : "—"}</p>
                </div>
              )
            })}
          </div>

          {/* Cổng vào */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", background: "#DCEBFD", borderRadius: 20, border: "1px solid #B5D4F4" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 5h8M5 1l4 4-4 4" stroke="#003289" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#003289" }}>Cổng vào</span>
            </div>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
          </div>

          {/* Khu B/C/D */}
          <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Khu B / C / D (SV / Khách)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 4 }}>
            {["B","C","D"].flatMap(zone => ["1","2","3"].map(sub => {
              const id = `${zone}${sub}`
              const z  = slots.find(s => s.id === id)
              const col = z ? zoneColor(z) : { bg: "#f5f5f5", border: "#e2e8f0" }
              return (
                <div key={id} style={{ background: col.bg, border: `1.5px solid ${col.border}`, borderRadius: 8, padding: "8px 6px", textAlign: "center", minHeight: 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: "#000", marginBottom: 4 }}>{id}</p>
                  <p style={{ fontSize: 12, color: "#000" }}>{z ? `${z.occupied}/${z.capacity}` : "—"}</p>
                </div>
              )
            }))}
          </div>

          {/* Tổng quan */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
            {[
              { label: "Tổng chỗ",   val: slots.reduce((s,z) => s + z.capacity, 0) },
              { label: "Đang có xe", val: slots.reduce((s,z) => s + z.occupied, 0) },
              { label: "Còn trống",  val: slots.reduce((s,z) => s + (z.capacity - z.occupied), 0) },
            ].map(s => (
              <div key={s.label} style={{ background: "#DCEBFD", borderRadius: 10, padding: "8px", textAlign: "center" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#003289", marginBottom: 3 }}>{s.label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#003289" }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 32, background: "#003289" }}/>
    </div>
  )
}