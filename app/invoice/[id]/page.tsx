"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"
import { User } from "@/data/mock"

type Invoice = {
  id: string
  userId: string
  amount: number
  status: "pending" | "paid"
  period: string
  createdAt: string
}

type PayStep = "detail" | "processing" | "success" | "failed"

export default function InvoiceDetailPage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = params?.id as string

  const [user,     setUser]     = useState<User | null>(null)
  const [invoice,  setInvoice]  = useState<Invoice | null>(null)
  const [step,     setStep]     = useState<PayStep>("detail")
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
    if (!u) { router.push("/login"); return }
    setUser(u)

    fetch(`/api/invoices?userId=${u.id}`)
      .then(r => r.json())
      .then(data => {
        const found = (data.invoices ?? []).find((i: Invoice) => i.id === id)
        if (found) setInvoice(found)
      })
  }, [id])

  if (!user || !invoice) return null

  const initials = user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
  const roleLabel: Record<string, string> = { student: "Sinh viên", lecturer: "Giảng viên", staff: "Cán bộ" }
  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr = now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  function doLogout() { logout(); router.push("/login") }

  async function handlePay() {
    setStep("processing")
    try {
      const res = await fetch("/api/bkpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice!.id, userId: user!.id }),
      })
      const data = await res.json()
      if (data.success) {
        // Update invoice status
        await fetch(`/api/invoices/${invoice!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "paid", transactionId: data.transactionId }),
        })
        setInvoice(prev => prev ? { ...prev, status: "paid" } : prev)
        setStep("success")
      } else {
        setStep("failed")
      }
    } catch {
      setStep("failed")
    }
  }

  const periodParts = invoice.period.split("-")
  const periodStr   = `Tháng ${periodParts[1]}/${periodParts[0]}`

  const Navbar = () => (
    <nav style={{
      background: "#003289", height: 52, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px",
    }}>
      <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 16 }}>IOT-SPMS</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#F8FAFC", fontWeight: 700, fontSize: 12 }}>{user!.name.split(" ").pop()}</span>
        <div style={{ width: 28, height: 28, background: "#B5D4F4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#003289", fontSize: 10, fontWeight: 700 }}>{initials}</div>
        <button onClick={doLogout} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M3 9h12M9 3l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </nav>
  )

  const BackBtn = () => (
    <button onClick={() => router.push("/invoice")} style={{
      display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
      cursor: "pointer", color: "#003289", fontSize: 12, fontWeight: 600,
      fontFamily: "'Inter',sans-serif", marginBottom: 14, padding: 0,
    }}>
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M15 9H3M9 3L3 9l6 6" stroke="#003289" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Quay lại
    </button>
  )

  // ── Invoice card (dùng chung cho detail + success) ──
  const InvoiceCard = () => (
    <div style={{
      background: "white", borderRadius: 12, border: "1px solid #D9D9D9",
      boxShadow: "0 4px 4px rgba(0,0,0,0.1)", padding: "20px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
        <p style={{ fontWeight: 800, fontSize: 18, color: "#000", marginBottom: 4 }}>
          Hóa đơn tháng {periodParts[1]}/{periodParts[0]}
        </p>
        <p style={{ fontSize: 13, color: "#868686" }}>Mã HD: {invoice.id}</p>
        <p style={{ fontSize: 13, color: "#868686", marginTop: 2 }}>
          Ngày tạo: {new Date(invoice.createdAt).toLocaleDateString("vi-VN")}
        </p>
      </div>

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Khách hàng:", val: user!.name },
          { label: "Vai trò:",    val: roleLabel[user!.role] ?? user!.role },
          { label: "Kỳ thanh toán:", val: periodStr },
          {
            label: "Trạng thái:",
            val: step === "success" || invoice.status === "paid" ? "Đã thanh toán" : "Chờ thanh toán",
            color: step === "success" || invoice.status === "paid" ? "#000" : "#000",
          },
          { label: "Tổng phí:",  val: `${invoice.amount.toLocaleString("vi-VN")}đ` },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#000" }}>{row.label}</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: row.color ?? "#000" }}>{row.val}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#000", margin: "16px 0" }}/>

      {/* Action */}
      {step === "detail" && invoice.status === "pending" && (
        <button onClick={handlePay} style={{
          width: "100%", height: 44, background: "#003289",
          border: "none", borderRadius: 12, color: "white",
          fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 18,
          cursor: "pointer", transition: "opacity 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          Thanh toán
        </button>
      )}

      {step === "processing" && (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <p style={{ color: "#003289", fontWeight: 600, fontSize: 14 }}>Đang xử lý...</p>
        </div>
      )}

      {(step === "success" || invoice.status === "paid") && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {/* Green checkmark */}
          <div style={{
            width: 80, height: 80, background: "#00D720", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 20l9 9 15-16" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: 18, color: "#003289" }}>Thanh toán thành công</p>
        </div>
      )}

      {step === "failed" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 80, height: 80, background: "#FF0E0E", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M12 12l16 16M28 12L12 28" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: 18, color: "#FF0E0E" }}>Thanh toán thất bại</p>
          <button onClick={() => setStep("detail")} style={{
            width: "100%", height: 44, background: "#003289",
            border: "none", borderRadius: 12, color: "white",
            fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 16, cursor: "pointer",
          }}>
            Thử lại
          </button>
        </div>
      )}
    </div>
  )

  // ── MOBILE ──────────────────────────────────────────────
  if (isMobile) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>
        <Navbar/>
        <div style={{ padding: "16px 16px 32px" }}>
          <BackBtn/>
          <p style={{ fontWeight: 800, fontSize: 22, color: "#003289", marginBottom: 16 }}>Thanh toán</p>
          <InvoiceCard/>
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
          <div style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 16, padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>IOT-SPMS</div>
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
            <div>
              <BackBtn/>
              <p style={{ fontWeight: 800, fontSize: 22, color: "#003289" }}>Chi tiết hóa đơn</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#003289" }}>{timeStr}</p>
              <p style={{ fontSize: 10, color: "#868686", marginTop: 1 }}>{dateStr}</p>
            </div>
          </div>
          <div style={{ maxWidth: 500 }}>
            <InvoiceCard/>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 220, background: "white", borderLeft: "1px solid #e2e8f0", padding: 20, overflowY: "auto", flexShrink: 0 }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: "#000", marginBottom: 14 }}>Thông tin</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "#DCEBFD", borderRadius: 10, padding: "10px 12px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", marginBottom: 4 }}>Mã hóa đơn</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#003289" }}>{invoice.id}</p>
            </div>
            <div style={{ background: "#DCEBFD", borderRadius: 10, padding: "10px 12px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", marginBottom: 4 }}>Số tiền</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#003289" }}>
                {invoice.amount.toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div style={{
              background: step === "success" || invoice.status === "paid" ? "#e8f5e9" : "#fff3f3",
              borderRadius: 10, padding: "10px 12px",
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", marginBottom: 4 }}>Trạng thái</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: step === "success" || invoice.status === "paid" ? "#00D720" : "#FF0E0E" }}>
                {step === "success" || invoice.status === "paid" ? "✓ Đã thanh toán" : "⏳ Chờ thanh toán"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}