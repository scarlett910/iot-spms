"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"
import { fetchSubZones } from "@/lib/api"
import { User } from "@/data/mock"

type SubZone = {
  id: string
  zone: string
  capacity: number
  occupied: number
}

export default function ParkingPage() {
  const router = useRouter()
  const [user,        setUser]        = useState<User | null>(null)
  const [slots,       setSlots]       = useState<SubZone[]>([])
  const [currentZone, setCurrentZone] = useState<string | null>(null)
  const [now,         setNow]         = useState(new Date())
  const [isMobile,    setIsMobile]    = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Clock
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

  function zoneColor(z: SubZone): { bg: string; border: string } {
    const pct = z.capacity > 0 ? z.occupied / z.capacity : 0
    if (pct >= 1)   return { bg: "rgba(255,14,14,0.18)",   border: "#FF9292" }
    if (pct >= 0.8) return { bg: "rgba(246,255,67,0.38)",  border: "#E2E000" }
    return              { bg: "rgba(49,233,42,0.22)",   border: "#A2F59F" }
  }

  function zoneStatus(z: SubZone) {
    const pct = z.capacity > 0 ? z.occupied / z.capacity : 0
    if (pct >= 1)   return "full"
    if (pct >= 0.8) return "warn"
    return "ok"
  }

  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
  })
  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  })

  const initials = user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()

  function doLogout() { logout(); router.push("/login") }

  // ── Legend ──
  const Legend = () => (
    <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
      {[
        { color: "#A2F59F", label: "Còn trống" },
        { color: "#FF9292", label: "Hết chỗ"   },
        { color: "#FAFFA5", label: "Có lỗi"    },
      ].map(l => (
        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 12, height: 12, background: l.color, borderRadius: 2 }}/>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#000", fontFamily: "'Inter',sans-serif" }}>
            {l.label}
          </span>
        </div>
      ))}
    </div>
  )

  // ── Grid ──
  const ParkingGrid = () => {
  const zones = ["A", "B", "C", "D"]
  const subIds = ["1", "2", "3"]

  return (
      <div style={{
        background: "white", borderRadius: 12, padding: 16,
        boxShadow: "0 4px 4px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0",
      }}>
        <Legend/>

        {/* Khu A — tách riêng */}
        <div style={{ marginBottom: 4 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: "#003289",
            fontFamily: "'Inter',sans-serif", marginBottom: 6,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>Khu A (GV / CB)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {subIds.map(sub => {
              const zoneId = `A${sub}`
              const z = slots.find(s => s.id === zoneId)
              const isHere = currentZone === zoneId
              const col = z ? zoneColor(z) : { bg: "#f5f5f5", border: "#e2e8f0" }
              return (
                <div key={zoneId} style={{
                  background:    col.bg,
                  border:        isHere ? "2.5px solid #003289" : `1.5px solid ${col.border}`,
                  borderRadius:  8,
                  padding:       "8px 6px",
                  textAlign:     "center",
                  minHeight:     60,
                  display:       "flex",
                  flexDirection: "column",
                  alignItems:    "center",
                  justifyContent: "center",
                  boxShadow:     isHere ? "0 0 0 3px rgba(0,50,137,0.15)" : "none",
                }}>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:14, color:"#000", marginBottom:4 }}>{zoneId}</p>
                  <p style={{ fontSize:12, color:"#000" }}>{z ? `${z.occupied}/${z.capacity}` : "—"}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Divider + Cổng vào */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          margin: "14px 0",
        }}>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 12px",
            background: "#DCEBFD", borderRadius: 20,
            border: "1px solid #B5D4F4",
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 5h8M5 1l4 4-4 4" stroke="#003289" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#003289",
              fontFamily: "'Inter',sans-serif",
            }}>Cổng vào</span>
          </div>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }}/>
        </div>

        {/* Khu B, C, D */}
        <div style={{ marginBottom: 4 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: "#003289",
            fontFamily: "'Inter',sans-serif", marginBottom: 6,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>Khu B / C / D (SV / Khách)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {["B","C","D"].flatMap(zone =>
              subIds.map(sub => {
                const zoneId = `${zone}${sub}`
                const z = slots.find(s => s.id === zoneId)
                const isHere = currentZone === zoneId
                const col = z ? zoneColor(z) : { bg: "#f5f5f5", border: "#e2e8f0" }
                return (
                  <div key={zoneId} style={{
                    background:    col.bg,
                    border:        isHere ? "2.5px solid #003289" : `1.5px solid ${col.border}`,
                    borderRadius:  8,
                    padding:       "8px 6px",
                    textAlign:     "center",
                    minHeight:     60,
                    display:       "flex",
                    flexDirection: "column",
                    alignItems:    "center",
                    justifyContent: "center",
                    boxShadow:     isHere ? "0 0 0 3px rgba(0,50,137,0.15)" : "none",
                  }}>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:14, color:"#000", marginBottom:4 }}>{zoneId}</p>
                    <p style={{ fontSize:12, color:"#000" }}>{z ? `${z.occupied}/${z.capacity}` : "—"}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Tổng quan */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginTop:16 }}>
          {[
            { label:"Tổng chỗ",   val: slots.reduce((s,z) => s + z.capacity, 0) },
            { label:"Đang có xe", val: slots.reduce((s,z) => s + z.occupied, 0) },
            { label:"Còn trống",  val: slots.reduce((s,z) => s + (z.capacity - z.occupied), 0) },
          ].map(s => (
            <div key={s.label} style={{
              background:"#DCEBFD", borderRadius:10, padding:"8px", textAlign:"center",
            }}>
              <p style={{ fontSize:9, fontWeight:700, color:"#003289", marginBottom:3 }}>{s.label}</p>
              <p style={{ fontSize:16, fontWeight:700, color:"#003289" }}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Datetime header ──
  const DateTimeBar = () => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 16,
    }}>
      <p style={{
        fontFamily: "'Inter',sans-serif",
        fontWeight: 800, fontSize: isMobile ? 18 : 22,
        color: "#003289",
      }}>Bản đồ bãi giữ xe</p>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#003289", fontFamily: "'Inter',sans-serif" }}>
          {timeStr}
        </p>
        <p style={{ fontSize: 10, color: "#868686", fontFamily: "'Inter',sans-serif", marginTop: 1 }}>
          {dateStr}
        </p>
      </div>
    </div>
  )

  const BackBtn = () => (
    <button
      onClick={() => router.push(isOperator ? "/dashboard/operator" : "/dashboard/student")}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", cursor: "pointer",
        color: "#003289", fontSize: 12, fontWeight: 600,
        fontFamily: "'Inter',sans-serif", marginBottom: 14,
        padding: 0,
      }}>
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M15 9H3M9 3L3 9l6 6" stroke="#003289" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Quay lại
    </button>
  )

  // ── MOBILE ──────────────────────────────────────────────
  if (isMobile) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{
        background: "#F8FAFC", minHeight: "100vh",
        fontFamily: "'Inter',sans-serif",
      }}>
        {/* Navbar */}
        <nav style={{
          background: "#003289", height: 52,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
        }}>
          <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 16 }}>IOT-SPMS</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#F8FAFC", fontWeight: 700, fontSize: 12 }}>
              {user.name.split(" ").pop()}
            </span>
            <div style={{
              width: 28, height: 28, background: "#B5D4F4", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#003289", fontSize: 10, fontWeight: 700,
            }}>{initials}</div>
            <button onClick={doLogout} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M9 3l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </nav>

        <div style={{ padding: "16px 16px 32px" }}>
          <BackBtn/>
          <DateTimeBar/>
          <ParkingGrid/>
        </div>
      </div>
    </>
  )

  // ── DESKTOP (3 cột) ──────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{
        display: "flex", height: "100vh", background: "#F8FAFC",
        fontFamily: "'Inter',sans-serif", overflow: "hidden",
      }}>

        {/* Sidebar */}
        <div style={{
          width: 220, background: "#003289",
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}>
          <div style={{
            color: "#F8FAFC", fontWeight: 800, fontSize: 16,
            padding: "20px 20px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}>IOT-SPMS</div>

          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{
              width: 36, height: 36, background: "#B5D4F4", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#003289", fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>{initials}</div>
            <div>
              <p style={{ color: "#F8FAFC", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{user.name}</p>
              <p style={{ color: "rgba(181,212,244,0.7)", fontSize: 10 }}>
                {user.role === "student" ? "Sinh viên" :
                 user.role === "lecturer" ? "Giảng viên" :
                 user.role === "staff" ? "Cán bộ" :
                 user.role === "operator" ? "Nhân viên" : "Quản trị viên"}
              </p>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "12px 0" }}>
            {(isOperator ? [
              { label: "Tổng quan",    href: "/dashboard/operator" },
              { label: "Bản đồ",       href: "/parking",            active: true },
              { label: "Phát vé",      href: "/ticket/new" },
              { label: "Danh sách vé", href: "/ticket/list" },
              { label: "Quét QR",      href: "/scan" },
            ] : [
              { label: "Tổng quan",  href: "/dashboard/student" },
              { label: "Bản đồ",     href: "/parking",           active: true },
              { label: "Thanh toán", href: "/invoice" },
              { label: "Đánh giá",   href: "/review" },
            ]).map((item: any) => (
              <div key={item.label}
                onClick={() => router.push(item.href)}
                style={{
                  padding: item.active ? "10px 20px 10px 17px" : "10px 20px",
                  borderLeft: item.active ? "3px solid #319BE7" : "3px solid transparent",
                  background: item.active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: item.active ? "white" : "rgba(255,255,255,0.55)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)" }}}
                onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)" }}}>
                {item.label}
              </div>
            ))}
          </nav>

          <button onClick={doLogout} style={{
            margin: "0 12px 16px",
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 12px", background: "none", border: "none",
            borderRadius: 8, color: "rgba(255,255,255,0.4)",
            fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.4)" }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M3 9h12M9 3l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Đăng xuất
          </button>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          <DateTimeBar/>
          <div style={{ maxWidth: 600 }}>
            <ParkingGrid/>
          </div>
        </div>

        {/* Right panel — legend chi tiết */}
        <div style={{
          width: 220, background: "white",
          borderLeft: "1px solid #e2e8f0",
          padding: 20, overflowY: "auto", flexShrink: 0,
        }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: "#000", marginBottom: 14 }}>
            Chi tiết khu vực
          </p>
          {["A", "B", "C", "D"].map(zone => {
            const zSlots = slots.filter(s => s.zone === zone)
            const total    = zSlots.reduce((s, z) => s + z.capacity, 0)
            const occupied = zSlots.reduce((s, z) => s + z.occupied, 0)
            const pct      = total > 0 ? Math.round(occupied / total * 100) : 0
            return (
              <div key={zone} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#000" }}>Khu {zone}</span>
                  <span style={{ fontSize: 11, color: "#868686" }}>{occupied}/{total}</span>
                </div>
                <div style={{ height: 6, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4,
                    width: `${pct}%`,
                    background: pct >= 100 ? "#FF9292" : pct >= 80 ? "#E2E000" : "#A2F59F",
                    transition: "width 0.3s",
                  }}/>
                </div>
                <p style={{ fontSize: 9, color: "#868686", marginTop: 3 }}>{pct}% lấp đầy</p>
              </div>
            )
          })}
        </div>

      </div>
    </>
  )
}