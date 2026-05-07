"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchSubZones } from "@/lib/api"
import { User } from "@/data/mock"
import StudentLayout from "@/components/StudentLayout"
import OperatorLayout from "@/components/OperatorLayout"

type SubZone = { id: string; zone: string; capacity: number; occupied: number }

export default function ParkingPage() {
  const router = useRouter()
  const [user,        setUser]        = useState<User | null>(null)
  const [slots,       setSlots]       = useState<SubZone[]>([])
  const [currentZone, setCurrentZone] = useState<string | null>(null)
  const [now,         setNow]         = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.push("/login"); return }
    setUser(u)
    async function load() {
      const data = await fetchSubZones(u!.id)
      setSlots(data.subZones ?? [])
      setCurrentZone(data.currentSubZone ?? null)
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!user) return null

  const isOperator = ["operator", "admin"].includes(user.role)

  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr = now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  function zoneColor(z: SubZone) {
    const pct = z.capacity > 0 ? z.occupied / z.capacity : 0
    if (pct >= 1)   return { bg: "rgba(255,14,14,0.18)",  border: "#FF9292" }
    if (pct >= 0.8) return { bg: "rgba(246,255,67,0.38)", border: "#E2E000" }
    return               { bg: "rgba(49,233,42,0.22)",  border: "#A2F59F" }
  }

  // ── Shared content blocks (biến JSX, không phải component) ──
  const legend = (
    <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
      {[
        { color: "#A2F59F", label: "Còn trống" },
        { color: "#FF9292", label: "Hết chỗ"   },
        { color: "#FAFFA5", label: "Có lỗi"    },
      ].map(l => (
        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 12, height: 12, background: l.color, borderRadius: 2 }}/>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#000" }}>{l.label}</span>
        </div>
      ))}
    </div>
  )

  const parkingGrid = (
    <div style={{
      background: "white", borderRadius: 12, padding: 16,
      boxShadow: "0 4px 4px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0",
    }}>
      {legend}

      {/* Khu A */}
      <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        Khu A (GV / CB)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 4 }}>
        {["1","2","3"].map(sub => {
          const zoneId = `A${sub}`
          const z      = slots.find(s => s.id === zoneId)
          const isHere = currentZone === zoneId
          const col    = z ? zoneColor(z) : { bg: "#f5f5f5", border: "#e2e8f0" }
          return (
            <div key={zoneId} style={{
              background: col.bg, borderRadius: 8, padding: "8px 6px",
              textAlign: "center", minHeight: 60,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: isHere ? "2.5px solid #003289" : `1.5px solid ${col.border}`,
              boxShadow: isHere ? "0 0 0 3px rgba(0,50,137,0.15)" : "none",
            }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: "#000", marginBottom: 4 }}>{zoneId}</p>
              <p style={{ fontSize: 12, color: "#000" }}>{z ? `${z.occupied}/${z.capacity}` : "—"}</p>
            </div>
          )
        })}
      </div>

      {/* Cổng vào */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 4 }}>
        {["B","C","D"].flatMap(zone => ["1","2","3"].map(sub => {
          const zoneId = `${zone}${sub}`
          const z      = slots.find(s => s.id === zoneId)
          const isHere = currentZone === zoneId
          const col    = z ? zoneColor(z) : { bg: "#f5f5f5", border: "#e2e8f0" }
          return (
            <div key={zoneId} style={{
              background: col.bg, borderRadius: 8, padding: "8px 6px",
              textAlign: "center", minHeight: 60,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: isHere ? "2.5px solid #003289" : `1.5px solid ${col.border}`,
              boxShadow: isHere ? "0 0 0 3px rgba(0,50,137,0.15)" : "none",
            }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: "#000", marginBottom: 4 }}>{zoneId}</p>
              <p style={{ fontSize: 12, color: "#000" }}>{z ? `${z.occupied}/${z.capacity}` : "—"}</p>
            </div>
          )
        }))}
      </div>

      {/* Tổng quan */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 16 }}>
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
  )

  // Right panel — chi tiết khu vực (chỉ desktop)
  const rightPanelContent = (
    <div style={{ padding: "20px", boxSizing: "border-box" }}>
      <p style={{ fontWeight: 800, fontSize: 13, color: "#000", marginBottom: 16 }}>Chi tiết khu vực</p>
      {["A","B","C","D"].map(zone => {
        const zSlots   = slots.filter(s => s.zone === zone)
        const total    = zSlots.reduce((s,z) => s + z.capacity, 0)
        const occupied = zSlots.reduce((s,z) => s + z.occupied, 0)
        const pct      = total > 0 ? Math.round(occupied / total * 100) : 0
        return (
          <div key={zone} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#000" }}>Khu {zone}</span>
              <span style={{ fontSize: 11, color: "#868686" }}>{occupied}/{total}</span>
            </div>
            <div style={{ height: 6, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4, width: `${pct}%`,
                background: pct >= 100 ? "#FF9292" : pct >= 80 ? "#E2E000" : "#A2F59F",
                transition: "width 0.3s",
              }}/>
            </div>
            <p style={{ fontSize: 9, color: "#868686", marginTop: 3 }}>{pct}% lấp đầy</p>
          </div>
        )
      })}
    </div>
  )

  const layoutProps = {
    user: user!,
    activePage: "Bản đồ",
    backHref: isOperator ? "/dashboard/operator" : "/dashboard/student",
    title: "Bản đồ bãi giữ xe",
    subtitle: `${dateStr} · ${timeStr}`,
    rightPanel: rightPanelContent, // Truyền vào prop chuyên biệt
  };

  if (isOperator) {
    return (
      <OperatorLayout {...layoutProps}>
        <div style={{ maxWidth: 800 }}>{parkingGrid}</div>
      </OperatorLayout>
    )
  }

  return (
    <StudentLayout {...layoutProps}>
      <div style={{ maxWidth: 800 }}>{parkingGrid}</div>
    </StudentLayout>
  )
}