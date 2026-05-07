"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { User } from "@/data/mock"
import StudentLayout from "@/components/StudentLayout"

type Invoice = {
  id: string; userId: string; amount: number
  status: "pending" | "paid"; period: string; createdAt: string
}
type PayStep = "detail" | "processing" | "success" | "failed"

export default function InvoiceDetailPage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = params?.id as string

  const [user,    setUser]    = useState<User | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [step,    setStep]    = useState<PayStep>("detail")
  const [now,     setNow]     = useState(new Date())

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

  const roleLabel: Record<string,string> = {
    student: "Sinh viên", lecturer: "Giảng viên", staff: "Cán bộ",
  }
  const timeStr     = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr     = now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })
  const periodParts = invoice.period.split("-")
  const periodStr   = `Tháng ${periodParts[1]}/${periodParts[0]}`
  const isPaid      = step === "success" || invoice.status === "paid"

  async function handlePay() {
    setStep("processing")
    try {
      const res  = await fetch("/api/bkpay", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice!.id, userId: user!.id }),
      })
      const data = await res.json()
      if (data.success) {
        await fetch(`/api/invoices/${invoice!.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "paid", transactionId: data.transactionId }),
        })
        setInvoice(prev => prev ? { ...prev, status: "paid" } : prev)
        setStep("success")
      } else {
        setStep("failed")
      }
    } catch { setStep("failed") }
  }

  const invoiceCard = (
    <div style={{
      background: "white", borderRadius: 12, border: "1px solid #D9D9D9",
      boxShadow: "0 4px 4px rgba(0,0,0,0.1)", padding: 20,
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
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Khách hàng:",    val: user!.name },
          { label: "Vai trò:",       val: roleLabel[user!.role] ?? user!.role },
          { label: "Kỳ thanh toán:", val: periodStr },
          { label: "Trạng thái:",    val: isPaid ? "Đã thanh toán" : "Chờ thanh toán" },
          { label: "Tổng phí:",      val: `${invoice.amount.toLocaleString("vi-VN")}đ` },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#000" }}>{row.label}</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: "#000" }}>{row.val}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "#000", marginBottom: 16 }}/>

      {/* Actions */}
      {step === "detail" && !isPaid && (
        <button onClick={handlePay} style={{
          width: "100%", height: 44, background: "#003289", border: "none",
          borderRadius: 12, color: "white", fontFamily: "'Inter',sans-serif",
          fontWeight: 600, fontSize: 18, cursor: "pointer",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          Thanh toán
        </button>
      )}

      {step === "processing" && (
        <p style={{ textAlign: "center", color: "#003289", fontWeight: 600, fontSize: 14 }}>
          Đang xử lý...
        </p>
      )}

      {isPaid && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 80, height: 80, background: "#00D720", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 20l9 9 15-16" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: 18, color: "#003289" }}>Thanh toán thành công</p>
        </div>
      )}

      {step === "failed" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 80, height: 80, background: "#FF0E0E", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M12 12l16 16M28 12L12 28" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: 18, color: "#FF0E0E" }}>Thanh toán thất bại</p>
          <button onClick={() => setStep("detail")} style={{
            width: "100%", height: 44, background: "#003289", border: "none",
            borderRadius: 12, color: "white", fontFamily: "'Inter',sans-serif",
            fontWeight: 600, fontSize: 16, cursor: "pointer",
          }}>Thử lại</button>
        </div>
      )}
    </div>
  )

  const rightPanel = (
    <div style={{ width: 220, background: "white", borderLeft: "1px solid #e2e8f0", padding: 20, overflowY: "auto", flexShrink: 0 }}>
      <p style={{ fontWeight: 800, fontSize: 13, color: "#000", marginBottom: 14 }}>Thông tin</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: "#DCEBFD", borderRadius: 10, padding: "10px 12px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", marginBottom: 4 }}>Mã hóa đơn</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#003289" }}>{invoice.id}</p>
        </div>
        <div style={{ background: "#DCEBFD", borderRadius: 10, padding: "10px 12px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", marginBottom: 4 }}>Số tiền</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#003289" }}>{invoice.amount.toLocaleString("vi-VN")}đ</p>
        </div>
        <div style={{ background: isPaid ? "#e8f5e9" : "#fff3f3", borderRadius: 10, padding: "10px 12px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", marginBottom: 4 }}>Trạng thái</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: isPaid ? "#00D720" : "#FF0E0E" }}>
            {isPaid ? "✓ Đã thanh toán" : "⏳ Chờ thanh toán"}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <StudentLayout
      user={user}
      activePage="Thanh toán"
      backHref="/invoice"
      title="Chi tiết hóa đơn"
      subtitle={`${dateStr} · ${timeStr}`}
    >
      <div style={{ display: "flex", gap: 0, height: "100%" }}>
        <div style={{ flex: 1, overflowY: "auto", maxWidth: 520 }}>
            {invoiceCard}
        </div>
        {rightPanel}
      </div>
    </StudentLayout>
  )
}