"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"
import { User } from "@/data/mock"

export default function TicketPage() {
  const router = useRouter()
  const [user,      setUser]      = useState<User | null>(null)
  const [plate,     setPlate]     = useState("")
  const [guestName, setGuestName] = useState("")
  const [reason,    setReason]    = useState("")
  const [tickets,   setTickets]   = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)
  const [msg,       setMsg]       = useState("")
  const [now,       setNow]       = useState(new Date())
  const [isMobile,  setIsMobile]  = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
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
    if (!u || !["operator","admin"].includes(u.role)) {
      router.push("/login"); return
    }
    setUser(u)
    loadTickets()
  }, [])

  async function loadTickets() {
    const res = await fetch("/api/tickets")
    const data = await res.json()
    setTickets(data.tickets ?? [])
  }

  async function handleIssue() {
    if (!plate.trim()) { setMsg("Vui lòng nhập biển số xe"); return }
    setLoading(true); setMsg("")
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licensePlate: plate.trim(), guestName: guestName.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg(data.error ?? "Lỗi phát vé"); return }
      setMsg("✅ Phát vé thành công · Khu " + data.ticket.subZoneId)
      setPlate(""); setGuestName(""); setReason("")
      loadTickets()
    } catch { setMsg("Mất kết nối") }
    finally { setLoading(false) }
  }

  function exportCSV(rows: any[], filename: string) {
    const headers = ["STT","Mã vé","Ngày vào","Ngày ra","Hành động","Biển số xe","Khu vực","Phí"]
    const lines = rows.map((t,i) => [
      i+1, t.id,
      new Date(t.entryTime).toLocaleString("vi-VN"),
      t.exitTime ? new Date(t.exitTime).toLocaleString("vi-VN") : "—",
      t.status === "active" ? "Vào bãi xe" : "Ra bãi xe",
      t.licensePlate,
      t.subZoneId,
      t.fee != null ? t.fee + "đ" : "—",
    ].join(","))
    const csv = [headers.join(","), ...lines].join("\n")
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  if (!user) return null

  const initials = user.name.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase()
  const isAdmin  = user.role === "admin"
  const timeStr  = now.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})
  const dateStr  = now.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"})

  function doLogout() { logout(); router.push("/login") }

  const navItems = [
    { label:"Tổng quan",        href:"/dashboard/operator", active:false },
    { label:"Đánh giá",         href:"/review",             active:false },
    { label:"Danh sách vé tạm", href:"/ticket/new",         active:true  },
    { label:"Lượt vào/ra",      href:"/sessions",           active:false },
    ...(isAdmin ? [
      { label:"Báo cáo",    href:"/report",         active:false },
      { label:"Cấu hình",   href:"/admin/settings", active:false },
    ] : []),
  ]

  const sidebarJsx = (
    <div style={{width:220,background:"#0B4265",display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{color:"#F8FAFC",fontWeight:800,fontSize:16,padding:"18px 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>IOT-SPMS</div>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <div style={{width:34,height:34,background:"#B5D4F4",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#003289",fontSize:11,fontWeight:700,flexShrink:0}}>{initials}</div>
        <div>
          <p style={{color:"#F8FAFC",fontSize:12,fontWeight:600,lineHeight:1.3}}>{user.name}</p>
          <p style={{color:"rgba(181,212,244,0.7)",fontSize:10}}>{isAdmin?"Quản trị viên":"Nhân viên"}</p>
        </div>
      </div>
      <div style={{padding:"10px 20px 4px",color:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Danh mục</div>
      <nav style={{flex:1}}>
        {navItems.map(item=>(
          <div key={item.label} onClick={()=>router.push(item.href)} style={{
            padding:item.active?"10px 20px 10px 17px":"10px 20px",
            borderLeft:item.active?"3px solid #319BE7":"3px solid transparent",
            background:item.active?"rgba(217,217,217,0.16)":"transparent",
            color:item.active?"#F8FAFC":"rgba(255,255,255,0.55)",
            fontSize:13,fontWeight:item.active?700:600,cursor:"pointer",transition:"all 0.15s",
          }}
            onMouseEnter={e=>{if(!item.active){e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.color="rgba(255,255,255,0.9)"}}}
            onMouseLeave={e=>{if(!item.active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.55)"}}}>
            {item.label}
          </div>
        ))}
      </nav>
      <button onClick={doLogout} style={{margin:"0 12px 14px",display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"none",border:"none",borderRadius:8,color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="rgba(255,255,255,0.75)"}}
        onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color="rgba(255,255,255,0.4)"}}>
        <svg width="13" height="13" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M9 3l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        Đăng xuất
      </button>
    </div>
  )

  const topbarJsx = (
    <nav style={{background:"#003289",height:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0}}>
      <span style={{color:"#F8FAFC",fontWeight:800,fontSize:16}}>IOT-SPMS</span>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{color:"#F8FAFC",fontWeight:700,fontSize:13}}>{user.name}</span>
        <div style={{width:30,height:30,background:"#B5D4F4",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#003289",fontSize:11,fontWeight:700}}>{initials}</div>
        <button onClick={doLogout} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M9 3l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>
    </nav>
  )

  const thStyle: React.CSSProperties = {
    background:"#003289",color:"white",fontSize:12,fontWeight:600,
    padding:"10px 12px",textAlign:"center",whiteSpace:"nowrap",
  }
  const tdStyle: React.CSSProperties = {
    fontSize:12,fontWeight:500,padding:"10px 12px",
    textAlign:"center",borderBottom:"1px solid #f0f0f0",color:"#000",
  }

  const mainContent = (
    <div style={{flex:1,overflowY:"auto",padding:24}}>
      <button onClick={()=>router.push("/dashboard/operator")} style={{
        display:"flex",alignItems:"center",gap:5,background:"none",border:"none",
        cursor:"pointer",color:"#316C91",fontSize:13,fontWeight:500,
        fontFamily:"'Inter',sans-serif",marginBottom:8,padding:0,
        textDecoration:"underline",
      }}>← Quay về</button>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <p style={{fontWeight:800,fontSize:24,color:"#003289"}}>Phát vé tạm</p>
        <p style={{fontSize:12,color:"#555"}}>{dateStr} · {timeStr}</p>
      </div>

      {/* Form */}
      <div style={{background:"white",borderRadius:12,padding:20,boxShadow:"0 4px 4px rgba(0,0,0,0.1)",border:"1px solid #e2e8f0",marginBottom:20}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:14}}>
          {[
            {label:"Biển số xe* (bắt buộc)", val:plate,     set:setPlate,     ph:"VD: 59D1-123.45"},
            {label:"Tên khách (tùy chọn)",   val:guestName, set:setGuestName, ph:"Nguyễn Văn A"},
            {label:"Lý do vào (tùy chọn)",   val:reason,    set:setReason,    ph:"Công tác..."},
          ].map(f=>(
            <div key={f.label}>
              <p style={{fontSize:12,fontWeight:500,color:"#033C89",marginBottom:5}}>{f.label}</p>
              <input value={f.val} onChange={e=>f.set(e.target.value)}
                placeholder={f.ph}
                style={{width:"100%",height:38,border:"2px solid #D9D9D9",borderRadius:4,padding:"0 10px",fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}}
                onFocus={e=>(e.target.style.borderColor="#003289")}
                onBlur={e=>(e.target.style.borderColor="#D9D9D9")}
              />
            </div>
          ))}
        </div>
        {msg && <p style={{fontSize:12,color:msg.startsWith("✅")?"#22c55e":"#EF4444",marginBottom:10}}>{msg}</p>}
        <button onClick={handleIssue} disabled={loading} style={{
          width:"100%",height:46,background:loading?"#8BA5CC":"#003289",
          color:"white",border:"none",borderRadius:10,fontSize:16,
          fontWeight:600,cursor:loading?"not-allowed":"pointer",
          fontFamily:"'Inter',sans-serif",transition:"opacity 0.15s",
        }}
          onMouseEnter={e=>{if(!loading)e.currentTarget.style.opacity="0.88"}}
          onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
          {loading ? "Đang xử lý..." : "Phát vé và mở cổng"}
        </button>
      </div>

      {/* Bảng vé khách */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <p style={{fontWeight:600,fontSize:16,color:"#000"}}>Tình trạng gửi xe khách vãng lai</p>
        <button onClick={()=>exportCSV(tickets,"ve-tam.csv")} style={{
          background:"#22c55e",color:"white",border:"none",borderRadius:8,
          padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",
          fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:5,
        }}>
          ⬇ Xuất CSV
        </button>
      </div>

      <div style={{background:"white",borderRadius:12,overflow:"hidden",border:"1px solid #e2e8f0",boxShadow:"0 2px 4px rgba(0,0,0,0.08)"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>
                {["STT","Mã vé","Ngày vào","Ngày ra","Trạng thái","Biển số xe","Khu vực","Phí"].map(h=>(
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan={8} style={{...tdStyle,color:"#868686",padding:"20px"}}>Chưa có vé nào</td></tr>
              ) : tickets.map((t,i)=>(
                <tr key={t.id} style={{background:i%2===0?"white":"#F8FAFC"}}>
                  <td style={tdStyle}>{i+1}</td>
                  <td style={tdStyle}>{t.id}</td>
                  <td style={tdStyle}>{new Date(t.entryTime).toLocaleString("vi-VN")}</td>
                  <td style={tdStyle}>{t.exitTime ? new Date(t.exitTime).toLocaleString("vi-VN") : "—"}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background:t.status==="active"?"#DCEBFD":"#F0FDF4",
                      color:t.status==="active"?"#003289":"#16a34a",
                      borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,
                    }}>
                      {t.status==="active" ? "Đang gửi" : "Đã ra"}
                    </span>
                  </td>
                  <td style={tdStyle}>{t.licensePlate}</td>
                  <td style={tdStyle}>{t.subZoneId}</td>
                  <td style={tdStyle}>{t.fee != null ? t.fee.toLocaleString("vi-VN")+"đ" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  if (isMobile) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{background:"#F8FAFC",minHeight:"100vh",fontFamily:"'Inter',sans-serif"}}>
        {topbarJsx}
        <div style={{padding:"16px 16px 32px"}}>
          <button onClick={()=>router.push("/dashboard/operator")} style={{color:"#316C91",fontSize:12,fontWeight:500,background:"none",border:"none",cursor:"pointer",padding:0,textDecoration:"underline",marginBottom:8,fontFamily:"'Inter',sans-serif"}}>← Quay về</button>
          <p style={{fontWeight:800,fontSize:20,color:"#003289",marginBottom:14}}>Phát vé tạm</p>
          <div style={{background:"white",borderRadius:12,padding:16,boxShadow:"0 2px 4px rgba(0,0,0,0.1)",border:"1px solid #e2e8f0",marginBottom:16}}>
            {[{label:"Biển số xe* (bắt buộc)",val:plate,set:setPlate,ph:"59D1-123.45"},{label:"Tên khách (tùy chọn)",val:guestName,set:setGuestName,ph:"Nguyễn Văn A"}].map(f=>(
              <div key={f.label} style={{marginBottom:12}}>
                <p style={{fontSize:11,fontWeight:500,color:"#033C89",marginBottom:4}}>{f.label}</p>
                <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                  style={{width:"100%",height:36,border:"2px solid #D9D9D9",borderRadius:4,padding:"0 10px",fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
            {msg && <p style={{fontSize:12,color:msg.startsWith("✅")?"#22c55e":"#EF4444",marginBottom:8}}>{msg}</p>}
            <button onClick={handleIssue} disabled={loading} style={{width:"100%",height:40,background:loading?"#8BA5CC":"#003289",color:"white",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
              {loading?"Đang xử lý...":"Phát vé và mở cổng"}
            </button>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <p style={{fontWeight:600,fontSize:13}}>Vé khách vãng lai</p>
            <button onClick={()=>exportCSV(tickets,"ve-tam.csv")} style={{background:"#22c55e",color:"white",border:"none",borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>⬇ CSV</button>
          </div>
          <div style={{background:"white",borderRadius:10,overflow:"hidden",border:"1px solid #e2e8f0"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
                <thead><tr>{["STT","Mã vé","Biển số","Khu","Trạng thái"].map(h=><th key={h} style={{...thStyle,fontSize:11,padding:"8px"}}>{h}</th>)}</tr></thead>
                <tbody>
                  {tickets.map((t,i)=>(
                    <tr key={t.id} style={{background:i%2===0?"white":"#F8FAFC"}}>
                      <td style={{...tdStyle,fontSize:11,padding:"8px"}}>{i+1}</td>
                      <td style={{...tdStyle,fontSize:11,padding:"8px"}}>{t.id}</td>
                      <td style={{...tdStyle,fontSize:11,padding:"8px"}}>{t.licensePlate}</td>
                      <td style={{...tdStyle,fontSize:11,padding:"8px"}}>{t.subZoneId}</td>
                      <td style={{...tdStyle,fontSize:11,padding:"8px"}}>{t.status==="active"?"Đang gửi":"Đã ra"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{display:"flex",height:"100vh",background:"#F8FAFC",fontFamily:"'Inter',sans-serif",overflow:"hidden"}}>
        {sidebarJsx}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {topbarJsx}
          {mainContent}
        </div>
      </div>
    </>
  )
}