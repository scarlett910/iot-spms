"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"
import { fetchInvoices, fetchSubZones } from "@/lib/api"
import { User } from "@/data/mock"
import UserQRCode from "@/components/UserQRCode"

type Session = {
  id: string
  subZoneId: string
  entryTime: string
  exitTime: string | null
  status: "active" | "closed"
}

export default function StudentDashboard() {
  const router = useRouter()
  const [user,        setUser]        = useState<User | null>(null)
  const [invoices,    setInvoices]    = useState<any[]>([])
  const [currentSlot, setCurrentSlot] = useState<string | null>(null)
  const [sessions,    setSessions]    = useState<Session[]>([])
  const [loading,     setLoading]     = useState(true)
  const [isMobile,    setIsMobile]    = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || ["operator", "admin"].includes(u.role)) {
      router.push("/login"); return
    }
    setUser(u)
    const userId = u.id

    async function load() {
      const [invData, zoneData, sessRes] = await Promise.all([
        fetchInvoices(userId),
        fetchSubZones(userId),
        fetch(`/api/sessions?userId=${userId}`).then(r => r.json()),
      ])
      setInvoices(invData.invoices ?? [])
      setCurrentSlot(zoneData.currentSubZone)
      setSessions(sessRes.sessions ?? [])
      setLoading(false)
    }

    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!user || loading) return null

  // ── Tính stats theo role ────────────────────────────────
  const isStudent = user.role === "student"
  const now       = new Date()
  const period    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  // Số lượt tháng này = closed sessions có exitTime trong tháng
  const thisMonthTrips = sessions.filter(s =>
    s.status   === "closed" &&
    s.exitTime?.startsWith(period)
  ).length

  // Tổng tiền chờ thanh toán (chỉ SV)
  const pendingAmt = isStudent
    ? invoices
        .filter(i => i.status === "pending")
        .reduce((s: number, i: any) => s + i.amount, 0)
    : 0

  const initials = user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()

  const roleLabel: Record<string, string> = {
    student:  "Sinh viên",
    lecturer: "Giảng viên",
    staff:    "Cán bộ",
  }

  // ── Activities ─────────────────────────────────────────
  const activities = sessions
    .slice()
    .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
    .slice(0, 6)
    .flatMap(s => {
      const rows: { type: string; zone: string; time: Date }[] = []
      rows.push({ type: "in", zone: s.subZoneId, time: new Date(s.entryTime) })
      if (s.exitTime)
        rows.push({ type: "out", zone: s.subZoneId, time: new Date(s.exitTime) })
      return rows
    })
    .slice(0, 8)

  function formatTime(date: Date) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diff  = Math.floor((today.getTime() - d.getTime()) / 86400000)
    const hm    = date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    if (diff === 0) return `Hôm nay - ${hm}`
    if (diff === 1) return `Hôm qua - ${hm}`
    return `${diff} ngày trước - ${hm}`
  }

  function doLogout() { logout(); router.push("/login") }

  // ── Nav items — ẩn Thanh toán nếu không phải SV ────────
  const navItems = [
    { label: "Tổng quan",  href: "/dashboard/student", active: true  },
    { label: "Bản đồ",     href: "/parking",           active: false },
    ...(isStudent ? [{ label: "Thanh toán", href: "/invoice", active: false }] : []),
    { label: "Đánh giá",   href: "/review",            active: false },
  ]

  // ── Stats data ─────────────────────────────────────────
  const statsData = isStudent
    ? [
        { label: "Vị trí",        val: currentSlot ?? "—" },
        { label: "Lượt tháng này", val: String(thisMonthTrips) },
        { label: "Chờ thanh toán", val: pendingAmt >= 1000
            ? `${Math.round(pendingAmt / 1000)}k`
            : pendingAmt > 0 ? String(pendingAmt) : "0" },
      ]
    : [
        { label: "Vị trí",        val: currentSlot ?? "—" },
        { label: "Lượt tháng này", val: String(thisMonthTrips) },
        { label: "Phí",           val: "Miễn phí" },
      ]

  // ── Cat items — ẩn Thanh toán nếu GV/CB ───────────────
  const catItems = [
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path d="M9 2C6.2 2 4 4.2 4 7c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#003289"/>
        </svg>
      ),
      name: "Bản đồ", sub: "Tìm vị trí đỗ xe nhanh chóng", href: "/parking",
    },
    ...(isStudent ? [{
      icon: (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="4" width="14" height="10" rx="2" stroke="#003289" strokeWidth="1.8"/>
          <path d="M6 8h6M6 11h4" stroke="#003289" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      name: "Thanh toán", sub: "Hóa đơn & lịch sử giao dịch", href: "/invoice",
    }] : []),
  ]

  // ── Sidebar icon SVGs ───────────────────────────────────
  const iconGrid = (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" fill="rgba(255,255,255,0.7)"/>
      <rect x="8" y="1" width="5" height="5" rx="1" fill="rgba(255,255,255,0.7)"/>
      <rect x="1" y="8" width="5" height="5" rx="1" fill="rgba(255,255,255,0.7)"/>
      <rect x="8" y="8" width="5" height="5" rx="1" fill="rgba(255,255,255,0.7)"/>
    </svg>
  )
  const iconMap = (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
      <path d="M9 2C6.2 2 4 4.2 4 7c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="rgba(255,255,255,0.7)"/>
    </svg>
  )
  const iconPay = (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8"/>
      <path d="M6 8h6M6 11h4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
  const iconStar = (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
      <path d="M9 2l1.8 5.4H17l-4.9 3.6 1.9 5.6L9 13.1 4 16.6l1.9-5.6L1 7.4h6.2z" fill="rgba(255,255,255,0.7)"/>
    </svg>
  )
  const iconArrow = (color = "white", size = 16) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M3 9h12M9 3l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const navIcons: Record<string, React.ReactNode> = {
    "Tổng quan":  iconGrid,
    "Bản đồ":     iconMap,
    "Thanh toán": iconPay,
    "Đánh giá":   iconStar,
  }

  // ── JSX blocks (biến, không phải component) ────────────
  const statsBlock = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
      {statsData.map(s => (
        <div key={s.label} style={{
          background: "#DCEBFD", borderRadius: 14, padding: "12px 8px",
          textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", marginBottom: 4 }}>{s.label}</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#003289" }}>{s.val}</p>
        </div>
      ))}
    </div>
  )

  const qrBlock = (
    <div style={{
      background: "white", borderRadius: 14, padding: 16,
      display: "flex", flexDirection: "column", alignItems: "center",
      marginBottom: 16, border: "1px solid #e2e8f0",
    }}>
      <UserQRCode userId={user.id} />
      <p style={{ fontSize: 12, fontWeight: 500, color: "#555", marginTop: 8 }}>
        Mã QR vào/ra bãi xe
      </p>
    </div>
  )

  const catBlock = (
    <>
      <p style={{ fontWeight: 800, fontSize: 14, color: "#000", marginBottom: 10 }}>Danh mục</p>

      {/* Grid items (Bản đồ + Thanh toán nếu SV) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: catItems.length > 1 ? "1fr 1fr" : "1fr",
        gap: 8, marginBottom: 8,
      }}>
        {catItems.map(m => (
          <div key={m.name} onClick={() => router.push(m.href)} style={{
            background: "white", borderRadius: 12, padding: 12,
            cursor: "pointer", border: "1px solid #e2e8f0",
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#DCEBFD")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
            <div style={{
              width: 32, height: 32, background: "#DCEBFD", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6,
            }}>{m.icon}</div>
            <p style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 12, color: "#000" }}>{m.name}</p>
            <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 600, color: "#868686", marginTop: 2, lineHeight: 1.4 }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Đánh giá — luôn hiện */}
      <div onClick={() => router.push("/review")} style={{
        background: "white", borderRadius: 12, padding: "10px 12px",
        display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer", border: "1px solid #e2e8f0",
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "#DCEBFD")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
        <div style={{
          width: 32, height: 32, background: "#DCEBFD", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M9 2l1.8 5.4H17l-4.9 3.6 1.9 5.6L9 13.1 4 16.6l1.9-5.6L1 7.4h6.2z" fill="#003289"/>
          </svg>
        </div>
        <div>
          <p style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 12, color: "#000" }}>Đánh giá dịch vụ</p>
          <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 8, fontWeight: 600, color: "#868686", marginTop: 2 }}>Góp ý cải thiện chất lượng</p>
        </div>
      </div>
    </>
  )

  const activityBlock = (
    <>
      <p style={{ fontWeight: 800, fontSize: 14, color: "#000", marginBottom: 10 }}>Hoạt động gần đây</p>
      <div style={{ background: "white", borderRadius: 14, padding: "4px 12px", border: "1px solid #e2e8f0" }}>
        {activities.length === 0 ? (
          <p style={{ padding: "14px 0", fontSize: 12, color: "#868686", textAlign: "center", fontFamily: "'Montserrat',sans-serif" }}>
            Chưa có hoạt động nào
          </p>
        ) : activities.map((a, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
            borderBottom: i < activities.length - 1 ? "2px solid #F3F4F6" : "none",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: a.type === "in" ? "#DCEBFD" : "#E6E6E6",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {a.type === "in"
                ? <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M9 3l6 6-6 6" stroke="#003289" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M15 9H3M9 3L3 9l6 6" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
            </div>
            <div>
              <p style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 11, color: "#000" }}>
                {a.type === "in" ? "Vào bãi" : "Ra bãi"} - Khu {a.zone}
              </p>
              <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 9, color: "#868686", marginTop: 2 }}>
                {formatTime(a.time)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  )

  const sidebarJsx = (
    <div style={{ width: 220, background: "#003289", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 16, padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        IOT-SPMS
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ width: 36, height: 36, background: "#B5D4F4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#003289", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
        <div>
          <p style={{ color: "#F8FAFC", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{user.name}</p>
          <p style={{ color: "rgba(181,212,244,0.7)", fontSize: 10 }}>{roleLabel[user.role]}</p>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {navItems.map(item => (
          <div key={item.label} onClick={() => router.push(item.href)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: item.active ? "10px 20px 10px 17px" : "10px 20px",
            borderLeft: item.active ? "3px solid #319BE7" : "3px solid transparent",
            background: item.active ? "rgba(255,255,255,0.1)" : "transparent",
            color: item.active ? "white" : "rgba(255,255,255,0.55)",
            fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
          }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)" }}}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)" }}}>
            <div style={{
              width: 28, height: 28,
              background: item.active ? "#319BE7" : "rgba(255,255,255,0.08)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            }}>{navIcons[item.label]}</div>
            {item.label}
          </div>
        ))}
      </nav>
      <button onClick={doLogout} style={{
        margin: "0 12px 16px", display: "flex", alignItems: "center", gap: 8,
        padding: "10px 12px", background: "none", border: "none", borderRadius: 8,
        color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)" }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.4)" }}>
        {iconArrow("currentColor", 14)}
        Đăng xuất
      </button>
    </div>
  )

  const mobileNavbar = (
    <nav style={{
      background: "#003289", height: 52,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px",
    }}>
      <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 16 }}>IOT-SPMS</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#F8FAFC", fontWeight: 700, fontSize: 12 }}>{user.name.split(" ").pop()}</span>
        <div style={{ width: 28, height: 28, background: "#B5D4F4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#003289", fontSize: 10, fontWeight: 700 }}>{initials}</div>
        <button onClick={doLogout} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          {iconArrow()}
        </button>
      </div>
    </nav>
  )

  // ── MOBILE ──────────────────────────────────────────────
  if (isMobile) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>
        {mobileNavbar}
        <div style={{ padding: "16px 16px 32px" }}>
          <p style={{ fontWeight: 800, fontSize: 18, color: "#000", marginBottom: 14 }}>
            {roleLabel[user.role] ?? "Người dùng"}
          </p>
          {qrBlock}
          {statsBlock}
          <div style={{ marginBottom: 16 }}>{catBlock}</div>
          {activityBlock}
        </div>
      </div>
    </>
  )

  // ── DESKTOP ──────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{
        display: "flex", height: "100vh", background: "#F8FAFC",
        fontFamily: "'Inter',sans-serif", overflow: "hidden",
      }}>
        {sidebarJsx}

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 800, fontSize: 20, color: "#000" }}>
              Xin chào, {user.name.split(" ").pop()} 👋
            </p>
            <p style={{ fontSize: 12, color: "#868686", marginTop: 2 }}>
              {now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>

          {currentSlot && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#DCEBFD", borderRadius: 20, padding: "5px 12px",
              fontSize: 11, fontWeight: 700, color: "#003289", marginBottom: 18,
            }}>
              <div style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%" }}/>
              Đang gửi xe · Khu {currentSlot}
            </div>
          )}

          {statsBlock}
          {qrBlock}
          {catBlock}
        </div>

        <div style={{ width: 240, background: "white", borderLeft: "1px solid #e2e8f0", padding: 20, overflowY: "auto", flexShrink: 0 }}>
          {activityBlock}
        </div>
      </div>
    </>
  )
}