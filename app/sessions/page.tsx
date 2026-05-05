"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"
import { User, users } from "@/data/mock"

export default function SessionsPage() {
  const router = useRouter()
  const [user,     setUser]     = useState<User | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [tickets,  setTickets]  = useState<any[]>([])
  const [tab,      setTab]      = useState<"member"|"guest">("member")
  const [now,      setNow]      = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)

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
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  async function load() {
    const [sessRes, tickRes] = await Promise.all([
      fetch("/api/sessions").then(r=>r.json()),
      fetch("/api/tickets").then(r=>r.json()),
    ])
    setSessions(sessRes.sessions ?? [])
    setTickets(tickRes.tickets ?? [])
  }

  if (!user) return null

  const initials = user.name.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase()
  const isAdmin  = user.role === "admin"
  const timeStr  = now.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})
  const dateStr  = now.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"})

  function doLogout() { logout(); router.push("/login") }

  // Enrich sessions với user info
  const enriched = sessions
    .slice()
    .sort((a,b)=>new Date(b.entryTime).getTime()-new Date(a.entryTime).getTime())
    .map((s,i) => {
      const u = users.find(u=>u.id===s.userId)
      return { ...s, idx:i+1, userName:u?.name??"—", userRole:u?.role??"—" }
    })

  // Enrich tickets
  const enrichedTickets = tickets
    .slice()
    .sort((a,b)=>new Date(b.entryTime).getTime()-new Date(a.entryTime).getTime())
    .map((t,i)=>({...t,idx:i+1}))

  function exportSessionsCSV() {
    const headers = ["STT","Mã","Tên","Vai trò","Khu vực","Thời gian vào","Thời gian ra","Trạng thái","Phí"]
    const lines = enriched.map(s=>[
      s.idx, s.userId, s.userName,
      s.userRole==="student"?"Sinh viên":s.userRole==="lecturer"?"Giảng viên":s.userRole==="staff"?"Cán bộ":s.userRole,
      s.subZoneId,
      new Date(s.entryTime).toLocaleString("vi-VN"),
      s.exitTime ? new Date(s.exitTime).toLocaleString("vi-VN") : "—",
      s.status==="active"?"Đang gửi":"Đã ra",
      s.fee!=null ? s.fee+"đ" : "—",
    ].join(","))
    const csv = [headers.join(","),...lines].join("\n")
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"})
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href=url; a.download="luot-vao-ra-thanh-vien.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  function exportTicketsCSV() {
    const headers = ["STT","Mã vé","Biển số","Tên khách","Khu vực","Thời gian vào","Thời gian ra","Trạng thái","Phí"]
    const lines = enrichedTickets.map(t=>[
      t.idx, t.id, t.licensePlate, t.guestName??"Khách",
      t.subZoneId,
      new Date(t.entryTime).toLocaleString("vi-VN"),
      t.exitTime ? new Date(t.exitTime).toLocaleString("vi-VN") : "—",
      t.status==="active"?"Đang gửi":"Đã ra",
      t.fee!=null ? t.fee+"đ" : "—",
    ].join(","))
    const csv = [headers.join(","),...lines].join("\n")
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"})
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href=url; a.download="luot-vao-ra-khach.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const navItems = [
    { label:"Tổng quan",        href:"/dashboard/operator", active:false },
    { label:"Đánh giá",         href:"/review",             active:false },
    { label:"Danh sách vé tạm", href:"/ticket/new",         active:false },
    { label:"Lượt vào/ra",      href:"/sessions",           active:true  },
    ...(isAdmin?[
      {label:"Báo cáo",   href:"/report",         active:false},
      {label:"Cấu hình",  href:"/admin/settings", active:false},
    ]:[]),
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

  const roleMap: Record<string,string> = {
    student:"Sinh viên", lecturer:"Giảng viên", staff:"Cán bộ",
  }

  const mainContent = (
    <div style={{flex:1,overflowY:"auto",padding:24}}>
      <button onClick={()=>router.push("/dashboard/operator")} style={{
        display:"flex",alignItems:"center",gap:5,background:"none",border:"none",
        cursor:"pointer",color:"#316C91",fontSize:13,fontWeight:500,
        fontFamily:"'Inter',sans-serif",marginBottom:8,padding:0,textDecoration:"underline",
      }}>← Quay về</button>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <p style={{fontWeight:800,fontSize:24,color:"#003289"}}>Lượt vào/ra</p>
        <p style={{fontSize:12,color:"#555"}}>{dateStr} · {timeStr}</p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:16,background:"#e2e8f0",borderRadius:10,padding:3,width:"fit-content"}}>
        {[
          {key:"member", label:`Thành viên (${enriched.length})`},
          {key:"guest",  label:`Khách vãng lai (${enrichedTickets.length})`},
        ].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key as any)} style={{
            padding:"8px 18px",border:"none",borderRadius:8,
            background:tab===t.key?"#003289":"transparent",
            color:tab===t.key?"white":"#555",
            fontSize:13,fontWeight:600,cursor:"pointer",
            fontFamily:"'Inter',sans-serif",transition:"all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "member" && (
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <p style={{fontWeight:600,fontSize:15,color:"#000"}}>
              Lượt vào/ra — SV · GV · CB
            </p>
            <button onClick={exportSessionsCSV} style={{
              background:"#22c55e",color:"white",border:"none",borderRadius:8,
              padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",
              fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:5,
            }}>⬇ Xuất CSV</button>
          </div>
          <div style={{background:"white",borderRadius:12,overflow:"hidden",border:"1px solid #e2e8f0",boxShadow:"0 2px 4px rgba(0,0,0,0.08)"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    {["STT","Mã SV/GV","Tên","Vai trò","Khu vực","Thời gian vào","Thời gian ra","Trạng thái","Phí"].map(h=>(
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enriched.length === 0 ? (
                    <tr><td colSpan={9} style={{...tdStyle,color:"#868686",padding:"20px"}}>Chưa có dữ liệu</td></tr>
                  ) : enriched.map((s,i)=>(
                    <tr key={s.id} style={{background:i%2===0?"white":"#F8FAFC"}}>
                      <td style={tdStyle}>{s.idx}</td>
                      <td style={tdStyle}>{s.userId}</td>
                      <td style={{...tdStyle,textAlign:"left"}}>{s.userName}</td>
                      <td style={tdStyle}>{roleMap[s.userRole]??s.userRole}</td>
                      <td style={tdStyle}>{s.subZoneId}</td>
                      <td style={tdStyle}>{new Date(s.entryTime).toLocaleString("vi-VN")}</td>
                      <td style={tdStyle}>{s.exitTime ? new Date(s.exitTime).toLocaleString("vi-VN") : "—"}</td>
                      <td style={tdStyle}>
                        <span style={{
                          background:s.status==="active"?"#DCEBFD":"#F0FDF4",
                          color:s.status==="active"?"#003289":"#16a34a",
                          borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,
                        }}>
                          {s.status==="active"?"Đang gửi":"Đã ra"}
                        </span>
                      </td>
                      <td style={tdStyle}>{s.fee!=null ? s.fee.toLocaleString("vi-VN")+"đ" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "guest" && (
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <p style={{fontWeight:600,fontSize:15,color:"#000"}}>Lượt vào/ra — Khách vãng lai</p>
            <button onClick={exportTicketsCSV} style={{
              background:"#22c55e",color:"white",border:"none",borderRadius:8,
              padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"pointer",
              fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",gap:5,
            }}>⬇ Xuất CSV</button>
          </div>
          <div style={{background:"white",borderRadius:12,overflow:"hidden",border:"1px solid #e2e8f0",boxShadow:"0 2px 4px rgba(0,0,0,0.08)"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    {["STT","Mã vé","Biển số xe","Tên khách","Khu vực","Thời gian vào","Thời gian ra","Trạng thái","Phí"].map(h=>(
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrichedTickets.length === 0 ? (
                    <tr><td colSpan={9} style={{...tdStyle,color:"#868686",padding:"20px"}}>Chưa có dữ liệu</td></tr>
                  ) : enrichedTickets.map((t,i)=>(
                    <tr key={t.id} style={{background:i%2===0?"white":"#F8FAFC"}}>
                      <td style={tdStyle}>{t.idx}</td>
                      <td style={tdStyle}>{t.id}</td>
                      <td style={tdStyle}>{t.licensePlate}</td>
                      <td style={tdStyle}>{t.guestName??"Khách"}</td>
                      <td style={tdStyle}>{t.subZoneId}</td>
                      <td style={tdStyle}>{new Date(t.entryTime).toLocaleString("vi-VN")}</td>
                      <td style={tdStyle}>{t.exitTime ? new Date(t.exitTime).toLocaleString("vi-VN") : "—"}</td>
                      <td style={tdStyle}>
                        <span style={{
                          background:t.status==="active"?"#DCEBFD":"#F0FDF4",
                          color:t.status==="active"?"#003289":"#16a34a",
                          borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,
                        }}>
                          {t.status==="active"?"Đang gửi":"Đã ra"}
                        </span>
                      </td>
                      <td style={tdStyle}>{t.fee!=null ? t.fee.toLocaleString("vi-VN")+"đ" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (isMobile) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{background:"#F8FAFC",minHeight:"100vh",fontFamily:"'Inter',sans-serif"}}>
        {topbarJsx}
        <div style={{padding:"16px 16px 32px"}}>
          <button onClick={()=>router.push("/dashboard/operator")} style={{color:"#316C91",fontSize:12,background:"none",border:"none",cursor:"pointer",padding:0,textDecoration:"underline",marginBottom:8,fontFamily:"'Inter',sans-serif"}}>← Quay về</button>
          <p style={{fontWeight:800,fontSize:20,color:"#003289",marginBottom:14}}>Lượt vào/ra</p>
          <div style={{display:"flex",gap:0,marginBottom:14,background:"#e2e8f0",borderRadius:10,padding:3}}>
            {[{key:"member",label:"Thành viên"},{key:"guest",label:"Khách"}].map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key as any)} style={{
                flex:1,padding:"7px 8px",border:"none",borderRadius:8,
                background:tab===t.key?"#003289":"transparent",
                color:tab===t.key?"white":"#555",
                fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",
              }}>{t.label}</button>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
            <button onClick={tab==="member"?exportSessionsCSV:exportTicketsCSV} style={{background:"#22c55e",color:"white",border:"none",borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>⬇ CSV</button>
          </div>
          <div style={{background:"white",borderRadius:10,overflow:"hidden",border:"1px solid #e2e8f0"}}>
            <div style={{overflowX:"auto"}}>
              {tab==="member" ? (
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
                  <thead><tr>{["STT","Mã","Tên","Khu","Vào","Trạng thái"].map(h=><th key={h} style={{...thStyle,fontSize:10,padding:"7px"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {enriched.map((s,i)=>(
                      <tr key={s.id} style={{background:i%2===0?"white":"#F8FAFC"}}>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{s.idx}</td>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{s.userId}</td>
                        <td style={{...tdStyle,fontSize:10,padding:"7px",textAlign:"left"}}>{s.userName}</td>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{s.subZoneId}</td>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{new Date(s.entryTime).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}</td>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{s.status==="active"?"Đang gửi":"Đã ra"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:440}}>
                  <thead><tr>{["STT","Mã vé","Biển số","Khu","Vào","Trạng thái"].map(h=><th key={h} style={{...thStyle,fontSize:10,padding:"7px"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {enrichedTickets.map((t,i)=>(
                      <tr key={t.id} style={{background:i%2===0?"white":"#F8FAFC"}}>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{t.idx}</td>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{t.id}</td>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{t.licensePlate}</td>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{t.subZoneId}</td>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{new Date(t.entryTime).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}</td>
                        <td style={{...tdStyle,fontSize:10,padding:"7px"}}>{t.status==="active"?"Đang gửi":"Đã ra"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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