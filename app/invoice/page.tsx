"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchInvoices } from "@/lib/api"
import { User } from "@/data/mock"
import StudentLayout from "@/components/StudentLayout"

export default function InvoicePage() {
  const router = useRouter()
  const [user,     setUser]     = useState<User | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [now,      setNow]      = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || ["operator","admin"].includes(u.role)) {
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
  const timeStr  = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr  = now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  const summaryCard = (
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

  const invoiceList = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {invoices.length === 0 ? (
        <p style={{ textAlign: "center", color: "#868686", fontSize: 13, padding: "20px 0" }}>
          Chưa có hóa đơn nào
        </p>
      ) : invoices.map(inv => (
        <div key={inv.id}
          onClick={() => router.push(`/invoice/${inv.id}`)}
          style={{
            background: "white", borderRadius: 12, border: "1px solid #D9D9D9",
            boxShadow: "0 4px 4px rgba(0,0,0,0.1)", padding: "14px 16px",
            cursor: "pointer", transition: "box-shadow 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 4px rgba(0,0,0,0.1)")}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#000" }}>
              Hóa đơn tháng {inv.period.replace("-", "/").split("/").reverse().join("/")}
            </p>
            <p style={{ fontSize: 13, fontWeight: 500, color: inv.status === "pending" ? "#FF0E0E" : "#868686" }}>
              {inv.status === "pending" ? "Chờ thanh toán" : "Đã thanh toán"}
            </p>
          </div>
          <p style={{ fontSize: 13, color: "#868686", marginBottom: 12 }}>Mã HD: {inv.id}</p>
          <div style={{ height: 1, background: "#f0f0f0", marginBottom: 10 }}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "#868686" }}>
              {inv.status === "pending"
                ? `Ngày tạo: ${new Date(inv.createdAt).toLocaleDateString("vi-VN")}`
                : `Cập nhật: ${new Date(inv.createdAt).toLocaleDateString("vi-VN")}`}
            </p>
            <p style={{ fontWeight: 600, fontSize: 15, color: "#000" }}>
              {inv.amount.toLocaleString("vi-VN")}đ
            </p>
          </div>
        </div>
      ))}
    </div>
  )

  const rightPanelContent = (
    <div style={{ padding: 20 }}>
      <p style={{ fontWeight: 800, fontSize: 13, color: "#000", marginBottom: 14 }}>Tóm tắt</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { label: "Tổng hóa đơn",   val: invoices.length },
          { label: "Chờ thanh toán", val: pending.length },
          { label: "Đã thanh toán",  val: invoices.length - pending.length },
        ].map(s => (
          <div key={s.label} style={{ background: "#DCEBFD", borderRadius: 10, padding: "10px 12px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#003289", marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#003289" }}>{s.val}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <StudentLayout
      user={user}
      activePage="Thanh toán"
      backHref="/dashboard/student"
      title="Thanh toán"
      subtitle={`${dateStr} · ${timeStr}`}
      rightPanel={rightPanelContent}   // ← truyền qua prop
    >
      
      <p style={{ fontWeight: 800, fontSize: 16, color: "#003289", marginBottom: 12 }}>Danh sách hóa đơn</p>
      {summaryCard}
      {invoiceList}
    </StudentLayout>
  )
  
}