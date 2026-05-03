"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"
import { fetchInvoices } from "@/lib/api"
import { User } from "@/data/mock"

export default function InvoicePage() {
  const router = useRouter()
  const [user,     setUser]     = useState<User | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [now,      setNow]      = useState(new Date())

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || ["operator", "admin"].includes(u.role)) {
      router.push("/login"); return
    }
    setUser(u)
    fetchInvoices(u.id).then(data => {
      setInvoices(data.invoices ?? [])
      setLoading(false)
    })
  }, [])

  if (!user || loading) return null

  const pending  = invoices.filter(i => i.status === "pending")
  const totalAmt = pending.reduce((s: number, i: any) => s + i.amount, 0)
  const initials = user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()

  function doLogout() { logout(); router.push("/login") }

  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr = now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  const roleLabel: Record<string, string> = {
    student: "Sinh viên", lecturer: "Giảng viên", staff: "Cán bộ",
  }

  // ── Shared components ──────────────────────────────────
  const Navbar = () => (
    <nav style={{
      background: "#003289", height: 52,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px", flexShrink: 0,
    }}>
      <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 16 }}>IOT-SPMS</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#F8FAFC", fontWeight: 700, fontSize: 12 }}>
          {user!.name.split(" ").pop()}
        </span>
        <div style={{
          width: 28, height: 28, background: "#B5D4F4", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#003289", fontSize: 10, fontWeight: 700,
        }}>{initials}</div>
        <button onClick={doLogout} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M3 9h12M9 3l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </nav>
  )

  const BackBtn = () => (
    <button onClick={() => router.push("/dashboard/student")} style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "none", border: "none", cursor: "pointer",
      color: "#003289", fontSize: 12, fontWeight: 600,
      fontFamily: "'Inter',sans-serif", marginBottom: 14, padding: 0,
    }}>
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M15 9H3M9 3L3 9l6 6" stroke="#003289" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Quay lại
    </button>
  )

  const SummaryCard = () => (
    <div style={{
      background: "white", borderRadius: 12, border: "1px solid #D9D9D9",
      boxShadow: "0 4px 4px rgba(0,0,0,0.1)", marginBottom: 24,
      display: "flex", overflow: "hidden",
    }}>
      <div style={{ flex: 1, padding: "16px 20px", borderRight: "1px solid #D9D9D9" }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: "#000", marginBottom: 8 }}>Cần thanh toán</p>
        <p style={{ fontWeight: 600, fontSize: 22, color: "#000" }}>
          {totalAmt > 0 ? `${totalAmt.toLocaleString("vi-VN")}đ` : "0đ"}
        </p>
      </div>
      <div style={{ flex: 1, padding: "16px 20px" }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: "#000", marginBottom: 8 }}>Số lượt</p>
        <p style={{ fontWeight: 600, fontSize: 22, color: "#000" }}>{invoices.length}</p>
      </div>
    </div>
  )

  const InvoiceList = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {invoices.length === 0 ? (
        <p style={{ textAlign: "center", color: "#868686", fontSize: 13, padding: "20px 0" }}>
          Chưa có hóa đơn nào
        </p>
      ) : invoices.map(inv => (
        <div key={inv.id}
          onClick={() => router.push(`/invoice/${inv.id}`)}
          style={{
            background: "white", borderRadius: 12,
            border: "1px solid #D9D9D9",
            boxShadow: "0 4px 4px rgba(0,0,0,0.1)",
            padding: "14px 16px", cursor: "pointer",
            transition: "box-shadow 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 4px rgba(0,0,0,0.1)")}>

          {/* Row 1: Tên + trạng thái */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#000" }}>
              Hóa đơn tháng {inv.period.replace("-", "/").split("/").reverse().join("/")}
            </p>
            <p style={{
              fontSize: 13, fontWeight: 500,
              color: inv.status === "pending" ? "#FF0E0E" : "#868686",
            }}>
              {inv.status === "pending" ? "Chờ thanh toán" : "Đã thanh toán"}
            </p>
          </div>

          {/* Row 2: Mã HD */}
          <p style={{ fontSize: 13, color: "#868686", marginBottom: 12 }}>Mã HD: {inv.id}</p>

          {/* Divider */}
          <div style={{ height: 1, background: "#f0f0f0", marginBottom: 10 }}/>

          {/* Row 3: Ngày + Số tiền */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "#868686" }}>
              {inv.status === "pending"
                ? `Ngày tạo: ${new Date(inv.createdAt).toLocaleDateString("vi-VN")}`
                : `Cập nhật lần cuối: ${new Date(inv.createdAt).toLocaleDateString("vi-VN")}`}
            </p>
            <p style={{ fontWeight: 600, fontSize: 15, color: "#000" }}>
              {inv.amount.toLocaleString("vi-VN")}đ
            </p>
          </div>
        </div>
      ))}
    </div>
  )

  // ── MOBILE ──────────────────────────────────────────────
  if (isMobile) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{
        background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Inter',sans-serif",
      }}>
        <Navbar/>
        <div style={{ padding: "16px 16px 32px" }}>
          <BackBtn/>
          <p style={{ fontWeight: 800, fontSize: 22, color: "#003289", marginBottom: 16 }}>Thanh toán</p>
          <SummaryCard/>
          <p style={{ fontWeight: 800, fontSize: 20, color: "#003289", marginBottom: 12 }}>Danh sách hóa đơn</p>
          <InvoiceList/>
        </div>
      </div>
    </>
  )

  // ── DESKTOP ──────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{
        display: "flex", height: "100vh", background: "#F8FAFC",
        fontFamily: "'Inter',sans-serif", overflow: "hidden",
      }}>

        {/* Sidebar */}
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
            {[
              { label: "Tổng quan",  href: "/dashboard/student", active: false },
              { label: "Bản đồ",     href: "/parking",           active: false },
              { label: "Thanh toán", href: "/invoice",           active: true  },
              { label: "Đánh giá",   href: "/review",            active: false },
            ].map(item => (
              <div key={item.label} onClick={() => router.push(item.href)} style={{
                padding: item.active ? "10px 20px 10px 17px" : "10px 20px",
                borderLeft: item.active ? "3px solid #319BE7" : "3px solid transparent",
                background: item.active ? "rgba(255,255,255,0.1)" : "transparent",
                color: item.active ? "white" : "rgba(255,255,255,0.55)",
                fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              }}
                onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)" }}}
                onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)" }}}>
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
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <path d="M3 9h12M9 3l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Đăng xuất
          </button>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <p style={{ fontWeight: 800, fontSize: 22, color: "#003289" }}>Thanh toán</p>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#003289" }}>{timeStr}</p>
              <p style={{ fontSize: 10, color: "#868686", marginTop: 1 }}>{dateStr}</p>
            </div>
          </div>
          <div style={{ maxWidth: 600 }}>
            <SummaryCard/>
            <p style={{ fontWeight: 800, fontSize: 18, color: "#003289", marginBottom: 12 }}>Danh sách hóa đơn</p>
            <InvoiceList/>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 220, background: "white", borderLeft: "1px solid #e2e8f0", padding: 20, overflowY: "auto", flexShrink: 0 }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: "#000", marginBottom: 14 }}>Tóm tắt</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Tổng hóa đơn", val: invoices.length },
              { label: "Chờ thanh toán", val: pending.length },
              { label: "Đã thanh toán", val: invoices.length - pending.length },
            ].map(s => (
              <div key={s.label} style={{ background: "#DCEBFD", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#003289" }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}