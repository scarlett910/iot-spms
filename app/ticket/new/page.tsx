"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { User } from "@/data/mock"
import OperatorLayout from "@/components/OperatorLayout"
import QRCode from "qrcode"

type Ticket = {
  id: string
  licensePlate: string
  guestName: string | null
  subZoneId: string
  entryTime: string
  exitTime: string | null
  status: "active" | "closed"
  fee: number | null
}

export default function TicketPage() {
  const router = useRouter()
  const [user,        setUser]        = useState<User | null>(null)
  const [plate,       setPlate]       = useState("")
  const [guestName,   setGuestName]   = useState("")
  const [reason,      setReason]      = useState("")
  const [tickets,     setTickets]     = useState<Ticket[]>([])
  const [loading,     setLoading]     = useState(false)
  const [msg,         setMsg]         = useState("")
  const [now,         setNow]         = useState(new Date())
  // Bill modal
  const [billTicket,  setBillTicket]  = useState<Ticket | null>(null)
  // Checkout modal
  const [checkoutQuery, setCheckoutQuery] = useState("")
  const [checkoutResult, setCheckoutResult] = useState<{fee:number; ticket:Ticket} | null>(null)
  const [checkoutError, setCheckoutError] = useState("")
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [filterDate,   setFilterDate]   = useState("")
  const [filterField,  setFilterField]  = useState<"all"|"id"|"licensePlate"|"status"|"subZoneId">("all")
  const [filterValue,  setFilterValue]  = useState("")
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
  const u = getCurrentUser()
  if (!u || !["operator","admin"].includes(u.role)) {
    router.push("/login"); return
  }
  setUser(u)
  loadTickets()

  // ← Auto-refresh mỗi 3 giây để cập nhật khi scan QR từ trang khác
  const interval = setInterval(loadTickets, 3000)
  return () => clearInterval(interval)
}, [])

  // Vẽ QR khi bill modal mở
  useEffect(() => {
    if (billTicket && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, billTicket.id, {
        width: 140, margin: 1,
        color: { dark: "#003289", light: "#FFFFFF" },
      })
    }
  }, [billTicket])

  async function loadTickets() {
    const res  = await fetch("/api/tickets")
    const data = await res.json()
    setTickets(data.tickets ?? [])
  }

  async function handleIssue() {
    if (!plate.trim()) { setMsg("Vui lòng nhập biển số xe"); return }
    setLoading(true); setMsg("")
    try {
      const res  = await fetch("/api/tickets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licensePlate: plate.trim(), guestName: guestName.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error ?? "Lỗi phát vé"); return }
      setPlate(""); setGuestName(""); setReason("")
      await loadTickets()
      setBillTicket(data.ticket) // ← mở bill modal
    } catch { setMsg("Mất kết nối") }
    finally { setLoading(false) }
  }

  async function handleCheckout() {
    if (!checkoutQuery.trim()) return
    setCheckoutLoading(true); setCheckoutError(""); setCheckoutResult(null)
    try {
      const res  = await fetch("/api/tickets/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: checkoutQuery.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setCheckoutError(data.error ?? "Không tìm thấy vé"); return }
      setCheckoutResult({ fee: data.fee, ticket: data.ticket })
      await loadTickets()   // ← reload ngay sau checkout
    } catch { setCheckoutError("Mất kết nối") }
    finally { setCheckoutLoading(false) }
  }

  function exportCSV() {
    const headers = ["STT","Mã vé","Ngày vào","Ngày ra","Trạng thái","Biển số xe","Khu vực","Phí","Vé"]
    const lines = tickets.map((t,i) => [
      i+1, t.id,
      new Date(t.entryTime).toLocaleString("vi-VN"),
      t.exitTime ? new Date(t.exitTime).toLocaleString("vi-VN") : "—",
      t.status === "active" ? "Đang gửi" : "Đã ra",
      t.licensePlate, t.subZoneId,
      t.fee != null ? t.fee+"đ" : "—",
    ].join(","))
    const csv  = [headers.join(","), ...lines].join("\n")
    const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a"); a.href=url; a.download="ve-tam.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  if (!user) return null

  const timeStr = now.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })
  const dateStr = now.toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" })

  const thStyle: React.CSSProperties = { background:"#003289", color:"white", fontSize:12, fontWeight:600, padding:"10px 12px", textAlign:"center", whiteSpace:"nowrap" }
  const tdStyle: React.CSSProperties = { fontSize:12, fontWeight:500, padding:"10px 12px", textAlign:"center", borderBottom:"1px solid #f0f0f0", color:"#000" }

  // ── Bill Modal ──────────────────────────────────────────
  const billModal = billTicket && (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:16,
    }}>
      <div style={{
        background:"white", borderRadius:16, padding:24,
        maxWidth:320, width:"100%",
        boxShadow:"0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <p style={{ fontWeight:800, fontSize:16, color:"#003289", marginBottom:2 }}>
            🎫 Vé gửi xe
          </p>
          <p style={{ fontSize:11, color:"#868686" }}>IOT-SPMS · HCMUT</p>
        </div>

        <div style={{ height:1, background:"#e2e8f0", marginBottom:16 }}/>

        {/* QR */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
          <canvas ref={qrCanvasRef} style={{ borderRadius:8 }}/>
        </div>

        {/* Info */}
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
          {[
            { label:"Mã vé",     val: billTicket.id },
            { label:"Biển số",   val: billTicket.licensePlate },
            { label:"Khu vực",   val: billTicket.subZoneId },
            { label:"Giờ vào",   val: new Date(billTicket.entryTime).toLocaleString("vi-VN") },
            ...(billTicket.guestName ? [{ label:"Tên khách", val: billTicket.guestName }] : []),
          ].map(row => (
            <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, color:"#868686" }}>{row.label}</span>
              <span style={{ fontSize:12, fontWeight:600, color:"#000" }}>{row.val}</span>
            </div>
          ))}
        </div>

        <div style={{ height:1, background:"#e2e8f0", marginBottom:12 }}/>

        <p style={{ fontSize:10, color:"#868686", textAlign:"center", marginBottom:14 }}>
          Xuất trình mã QR này khi ra khỏi bãi xe
        </p>

        {/* Buttons */}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => window.print()} style={{
            flex:1, height:38, background:"#F8FAFC", border:"1px solid #e2e8f0",
            borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"'Inter',sans-serif", color:"#003289",
          }}>
            🖨 In vé
          </button>
          <button onClick={() => setBillTicket(null)} style={{
            flex:1, height:38, background:"#003289", border:"none",
            borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"'Inter',sans-serif", color:"white",
          }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )

  // ── Checkout Modal ──────────────────────────────────────
  const checkoutModal = showCheckout && (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:16,
    }}>
      <div style={{
        background:"white", borderRadius:16, padding:24,
        maxWidth:360, width:"100%",
        boxShadow:"0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <p style={{ fontWeight:800, fontSize:16, color:"#003289", marginBottom:4 }}>
          Checkout khách vãng lai
        </p>
        <p style={{ fontSize:12, color:"#868686", marginBottom:16 }}>
          Nhập mã vé hoặc biển số xe để checkout
        </p>

        {!checkoutResult ? (
          <>
            <input
              value={checkoutQuery}
              onChange={e => { setCheckoutQuery(e.target.value); setCheckoutError("") }}
              onKeyDown={e => e.key === "Enter" && handleCheckout()}
              placeholder="VD: TK123456 hoặc 59D1-123.45"
              style={{
                width:"100%", height:42, border:"2px solid #D9D9D9",
                borderRadius:10, padding:"0 12px", fontSize:13,
                fontFamily:"'Inter',sans-serif", outline:"none",
                boxSizing:"border-box", marginBottom:8,
              }}
              onFocus={e => (e.target.style.borderColor="#003289")}
              onBlur={e  => (e.target.style.borderColor="#D9D9D9")}
              autoFocus
            />
            {checkoutError && (
              <p style={{ fontSize:12, color:"#EF4444", marginBottom:8 }}>{checkoutError}</p>
            )}
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <button onClick={() => { setShowCheckout(false); setCheckoutQuery(""); setCheckoutError("") }}
                style={{ flex:1, height:40, background:"#F8FAFC", border:"1px solid #e2e8f0", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif", color:"#555" }}>
                Huỷ
              </button>
              <button onClick={handleCheckout} disabled={checkoutLoading || !checkoutQuery.trim()}
                style={{ flex:1, height:40, background:checkoutLoading?"#8BA5CC":"#003289", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif", color:"white" }}>
                {checkoutLoading ? "Đang xử lý..." : "Checkout"}
              </button>
            </div>
          </>
        ) : (
          /* Checkout thành công */
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
            <div style={{ width:64, height:64, background:"#00D720", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <path d="M8 20l9 9 15-16" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontWeight:700, fontSize:16, color:"#003289" }}>Checkout thành công!</p>
            <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Mã vé",     val: checkoutResult.ticket.id },
                { label:"Biển số",   val: checkoutResult.ticket.licensePlate },
                { label:"Khu vực",   val: checkoutResult.ticket.subZoneId },
                { label:"Phí thu",   val: checkoutResult.fee > 0 ? checkoutResult.fee.toLocaleString("vi-VN")+"đ" : "Miễn phí" },
              ].map(row => (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:13, color:"#868686" }}>{row.label}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#000" }}>{row.val}</span>
                </div>
              ))}
            </div>
            <button onClick={() => {
              setShowCheckout(false)
              setCheckoutQuery("")
              setCheckoutResult(null)
              setCheckoutError("")
            }} style={{ width:"100%", height:40, background:"#003289", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif", color:"white" }}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {billModal}
      {checkoutModal}
      <OperatorLayout
        user={user}
        activePage="Danh sách vé tạm"
        title="Phát vé tạm"
        subtitle={`${dateStr} · ${timeStr}`}
        backHref="/dashboard/operator"
        headerRight={
          <button onClick={() => { setShowCheckout(true); setCheckoutResult(null); setCheckoutError("") }}
            style={{
              background:"#22c55e", color:"white", border:"none",
              borderRadius:10, padding:"10px 18px", fontSize:14,
              fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif",
            }}>
            Checkout khách
          </button>
        }
      >
        {/* Form phát vé */}
        <div style={{ background:"white", borderRadius:12, padding:20, boxShadow:"0 4px 4px rgba(0,0,0,0.1)", border:"1px solid #e2e8f0", marginBottom:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:14 }}>
            {[
              { label:"Biển số xe* (bắt buộc)", val:plate,     set:setPlate,     ph:"VD: 59D1-123.45" },
              { label:"Tên khách (tùy chọn)",   val:guestName, set:setGuestName, ph:"Nguyễn Văn A"    },
              { label:"Lý do vào (tùy chọn)",   val:reason,    set:setReason,    ph:"Công tác..."     },
            ].map(f => (
              <div key={f.label}>
                <p style={{ fontSize:12, fontWeight:500, color:"#033C89", marginBottom:5 }}>{f.label}</p>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  style={{ width:"100%", height:38, border:"2px solid #D9D9D9", borderRadius:4, padding:"0 10px", fontSize:13, fontFamily:"'Inter',sans-serif", outline:"none", boxSizing:"border-box" }}
                  onFocus={e => (e.target.style.borderColor="#003289")}
                  onBlur={e  => (e.target.style.borderColor="#D9D9D9")}
                />
              </div>
            ))}
          </div>
          {msg && <p style={{ fontSize:12, color:msg.startsWith("✅")?"#22c55e":"#EF4444", marginBottom:10 }}>{msg}</p>}
          <button onClick={handleIssue} disabled={loading} style={{
            width:"100%", height:46, background:loading?"#8BA5CC":"#003289",
            color:"white", border:"none", borderRadius:10, fontSize:16,
            fontWeight:600, cursor:loading?"not-allowed":"pointer",
            fontFamily:"'Inter',sans-serif",
          }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.opacity="0.88" }}
            onMouseLeave={e => (e.currentTarget.style.opacity="1")}>
            {loading ? "Đang xử lý..." : "Phát vé và mở cổng"}
          </button>
        </div>

        {/* Bảng vé */}

          {/* Filter bar */}
        <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap", alignItems:"flex-end" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <label style={{ fontSize:11, fontWeight:600, color:"#555" }}>Lọc theo ngày</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              style={{ height:36, border:"1px solid #e2e8f0", borderRadius:8, padding:"0 10px", fontSize:13, fontFamily:"'Inter',sans-serif", background:"white", outline:"none" }}
              onFocus={e => (e.target.style.borderColor="#003289")}
              onBlur={e  => (e.target.style.borderColor="#e2e8f0")}
            />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <label style={{ fontSize:11, fontWeight:600, color:"#555" }}>Tìm theo</label>
            <select value={filterField} onChange={e => { setFilterField(e.target.value as any); setFilterValue("") }}
              style={{ height:36, border:"1px solid #e2e8f0", borderRadius:8, padding:"0 10px", fontSize:13, fontFamily:"'Inter',sans-serif", background:"white", outline:"none", minWidth:160 }}>
              <option value="all">-- Tất cả --</option>
              <option value="id">Mã vé</option>
              <option value="licensePlate">Biển số xe</option>
              <option value="status">Trạng thái</option>
              <option value="subZoneId">Khu vực</option>
            </select>
          </div>
          {filterField !== "all" && (
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#555" }}>Giá trị</label>
              {filterField === "status" ? (
                <select value={filterValue} onChange={e => setFilterValue(e.target.value)}
                  style={{ height:36, border:"1px solid #e2e8f0", borderRadius:8, padding:"0 10px", fontSize:13, fontFamily:"'Inter',sans-serif", background:"white", outline:"none", minWidth:140 }}>
                  <option value="">-- Tất cả --</option>
                  <option value="active">Đang gửi</option>
                  <option value="closed">Đã ra</option>
                </select>
              ) : (
                <input value={filterValue} onChange={e => setFilterValue(e.target.value)}
                  placeholder={filterField === "id" ? "VD: TK123" : filterField === "licensePlate" ? "VD: 59D1-123" : "VD: B1"}
                  style={{ height:36, border:"1px solid #e2e8f0", borderRadius:8, padding:"0 10px", fontSize:13, fontFamily:"'Inter',sans-serif", background:"white", outline:"none", minWidth:160, boxSizing:"border-box" }}
                  onFocus={e => (e.target.style.borderColor="#003289")}
                  onBlur={e  => (e.target.style.borderColor="#e2e8f0")}
                />
              )}
            </div>
          )}
          {(filterDate || filterValue) && (
            <button onClick={() => { setFilterDate(""); setFilterValue(""); setFilterField("all") }}
              style={{ height:36, padding:"0 14px", background:"#F1F5F9", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, fontWeight:600, color:"#555", cursor:"pointer", fontFamily:"'Inter',sans-serif", alignSelf:"flex-end" }}>
              Xoá lọc
            </button>
          )}
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <p style={{ fontWeight:600, fontSize:16, color:"#000" }}>Tình trạng gửi xe khách vãng lai</p>
          <button onClick={exportCSV} style={{ background:"#22c55e", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
            ⬇ Xuất CSV
          </button>
        </div>
        <div style={{ background:"white", borderRadius:12, overflow:"hidden", border:"1px solid #e2e8f0", boxShadow:"0 2px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>{["STT","Mã vé","Ngày vào","Ngày ra","Trạng thái","Biển số xe","Khu vực","Phí","Vé",""].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = tickets.filter(t => {
                    const matchDate = !filterDate ||
                      new Date(t.entryTime).toLocaleDateString("vi-VN") === new Date(filterDate).toLocaleDateString("vi-VN")
                    const matchField = filterField === "all" || !filterValue ||
                      String((t as any)[filterField]).toLowerCase().includes(filterValue.toLowerCase())
                    return matchDate && matchField
                  })
                  if (filtered.length === 0) return (
                    <tr><td colSpan={10} style={{ ...tdStyle, color:"#868686", padding:"20px" }}>
                      {filterDate || filterValue ? "Không tìm thấy vé nào" : "Chưa có vé nào"}
                    </td></tr>
                  )
                  return filtered.map((t, i) => (
                    <tr key={t.id} style={{ background: i%2===0 ? "white" : "#F8FAFC" }}>
                      <td style={tdStyle}>{i+1}</td>
                      <td style={tdStyle}>{t.id}</td>
                      <td style={tdStyle}>{new Date(t.entryTime).toLocaleString("vi-VN")}</td>
                      <td style={tdStyle}>{t.exitTime ? new Date(t.exitTime).toLocaleString("vi-VN") : "—"}</td>
                      <td style={tdStyle}>
                        <span style={{ background:t.status==="active"?"#DCEBFD":"#F0FDF4", color:t.status==="active"?"#003289":"#16a34a", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>
                          {t.status==="active" ? "Đang gửi" : "Đã ra"}
                        </span>
                      </td>
                      <td style={tdStyle}>{t.licensePlate}</td>
                      <td style={tdStyle}>{t.subZoneId}</td>
                      <td style={tdStyle}>{t.fee!=null ? t.fee.toLocaleString("vi-VN")+"đ" : "—"}</td>
                      <td style={tdStyle}>
                        <button onClick={() => {
                          const found = tickets.find(tk => tk.id === t.id)
                          if (found) setBillTicket(found)
                        }} style={{ background:"#DCEBFD", color:"#003289", border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                          🎫 Vé
                        </button>
                      </td>
                      <td style={tdStyle}>
                        {t.status === "active" && (
                          <button onClick={() => { setCheckoutQuery(t.id); setShowCheckout(true); setCheckoutResult(null); setCheckoutError("") }}
                            style={{ background:"#EF4444", color:"white", border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                            Checkout
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </OperatorLayout>
    </>
  )
}