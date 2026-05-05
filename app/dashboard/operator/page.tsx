"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"
import { fetchSubZones } from "@/lib/api"
import { User } from "@/data/mock"

type SubZone = { id: string; zone: string; capacity: number; occupied: number }

export default function OperatorDashboard() {
  const router = useRouter()
  const [user,    setUser]    = useState<User | null>(null)
  const [slots,   setSlots]   = useState<SubZone[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [sessions,setSessions]= useState<any[]>([])
  const [now,     setNow]     = useState(new Date())
  const [isMobile,setIsMobile]= useState(false)

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
    async function load() {
      const [zoneData, ticketRes, sessRes] = await Promise.all([
        fetchSubZones(),
        fetch("/api/tickets").then(r => r.json()),
        fetch("/api/sessions").then(r => r.json()),
      ])
      setSlots(zoneData.subZones ?? [])
      setTickets(ticketRes.tickets ?? [])
      setSessions(sessRes.sessions ?? [])
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!user) return null

  const initials = user.name.split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase()
  const isAdmin  = user.role === "admin"

  const totalCap  = slots.reduce((s,z) => s + z.capacity, 0)
  const totalOcc  = slots.reduce((s,z) => s + z.occupied, 0)
  const totalFree = totalCap - totalOcc
  const guestCount = tickets.filter(t => t.status === "active").length
  const entryCount = sessions.filter(s => s.entryTime).length
  const exitCount  = sessions.filter(s => s.exitTime).length

  const timeStr = now.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})
  const dateStr = now.toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"})

  function doLogout() { logout(); router.push("/login") }

  function zoneColor(z: SubZone) {
    const pct = z.capacity > 0 ? z.occupied / z.capacity : 0
    if (pct >= 1)   return { bg:"rgba(255,14,14,0.18)",   border:"#FF9292" }
    if (pct >= 0.8) return { bg:"rgba(246,255,67,0.38)",  border:"#E2E000" }
    return               { bg:"rgba(49,233,42,0.22)",  border:"#A2F59F" }
  }

  const navItems = [
    { label:"Tổng quan",       href:"/dashboard/operator", active:true  },
    { label:"Đánh giá",        href:"/review",             active:false },
    { label:"Danh sách vé tạm",href:"/ticket/new",         active:false },
    { label:"Lượt vào/ra",     href:"/sessions",           active:false },
    ...(isAdmin ? [
      { label:"Báo cáo",       href:"/report",             active:false },
      { label:"Cấu hình",      href:"/admin/settings",     active:false },
    ] : []),
  ]

  const sidebarJsx = (
    <div style={{width:220,background:"#0B4265",display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{color:"#F8FAFC",fontWeight:800,fontSize:16,padding:"18px 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        IOT-SPMS
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <div style={{width:34,height:34,background:"#B5D4F4",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#003289",fontSize:11,fontWeight:700,flexShrink:0}}>{initials}</div>
        <div>
          <p style={{color:"#F8FAFC",fontSize:12,fontWeight:600,lineHeight:1.3}}>{user.name}</p>
          <p style={{color:"rgba(181,212,244,0.7)",fontSize:10}}>{isAdmin?"Quản trị viên":"Nhân viên"}</p>
        </div>
      </div>
      <div style={{padding:"10px 20px 4px",color:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Danh mục</div>
      <nav style={{flex:1}}>
        {navItems.map(item => (
          <div key={item.label} onClick={() => router.push(item.href)} style={{
            padding: item.active ? "10px 20px 10px 17px" : "10px 20px",
            borderLeft: item.active ? "3px solid #319BE7" : "3px solid transparent",
            background: item.active ? "rgba(217,217,217,0.16)" : "transparent",
            color: item.active ? "#F8FAFC" : "rgba(255,255,255,0.55)",
            fontSize:13, fontWeight:item.active?700:600, cursor:"pointer", transition:"all 0.15s",
          }}
            onMouseEnter={e => { if(!item.active){e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.color="rgba(255,255,255,0.9)"}}}
            onMouseLeave={e => { if(!item.active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.55)"}}}>
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

  const mapJsx = (
    <div style={{background:"white",borderRadius:12,padding:18,boxShadow:"0 4px 4px rgba(0,0,0,0.1)",border:"1px solid #e2e8f0"}}>
      {/* Legend */}
      <div style={{display:"flex",gap:16,marginBottom:14,flexWrap:"wrap"}}>
        {[{color:"#A2F59F",label:"Còn trống"},{color:"#FF9292",label:"Hết chỗ"},{color:"#FAFFA5",label:"Có lỗi"}].map(l=>(
          <div key={l.label} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:12,height:12,background:l.color,borderRadius:2}}/>
            <span style={{fontSize:12,fontWeight:500}}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Khu A */}
      <p style={{fontSize:11,fontWeight:700,color:"#003289",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Khu A (GV / CB)</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:4}}>
        {slots.filter(z=>z.zone==="A").map(z=>{
          const col = zoneColor(z)
          return (
            <div key={z.id} style={{background:col.bg,border:`1.5px solid ${col.border}`,borderRadius:8,padding:"10px 6px",textAlign:"center"}}>
              <p style={{fontWeight:800,fontSize:14,color:"#000",marginBottom:3}}>{z.id}</p>
              <p style={{fontSize:12,color:"#000"}}>{z.occupied}/{z.capacity}</p>
            </div>
          )
        })}
      </div>

      {/* Cổng vào */}
      <div style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0"}}>
        <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 12px",background:"#DCEBFD",borderRadius:20,border:"1px solid #B5D4F4"}}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h8M5 1l4 4-4 4" stroke="#003289" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{fontSize:11,fontWeight:700,color:"#003289"}}>Cổng vào</span>
        </div>
        <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
      </div>

      {/* Khu B/C/D */}
      <p style={{fontSize:11,fontWeight:700,color:"#003289",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Khu B / C / D (SV / Khách)</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {slots.filter(z=>["B","C","D"].includes(z.zone)).map(z=>{
          const col = zoneColor(z)
          return (
            <div key={z.id} style={{background:col.bg,border:`1.5px solid ${col.border}`,borderRadius:8,padding:"10px 6px",textAlign:"center"}}>
              <p style={{fontWeight:800,fontSize:14,color:"#000",marginBottom:3}}>{z.id}</p>
              <p style={{fontSize:12,color:"#000"}}>{z.occupied}/{z.capacity}</p>
            </div>
          )
        })}
      </div>
    </div>
  )

  const mainContent = (
    <div style={{flex:1,overflowY:"auto",padding:24}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <p style={{fontWeight:900,fontSize:22,color:"#003289",marginBottom:2}}>Nhân viên vận hành</p>
          <p style={{fontWeight:600,fontSize:14,color:"#000",marginBottom:2}}>Tổng quan bãi xe</p>
          <p style={{fontSize:12,color:"#555"}}>{dateStr} · {timeStr}</p>
        </div>
        <button onClick={()=>router.push("/ticket/new")} style={{
          background:"#003289",color:"white",border:"none",borderRadius:12,
          padding:"10px 20px",fontSize:14,fontWeight:600,cursor:"pointer",
          fontFamily:"'Inter',sans-serif",boxShadow:"0 2px 4px rgba(0,0,0,0.15)",
        }}
          onMouseEnter={e=>(e.currentTarget.style.opacity="0.88")}
          onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
          + Phát vé tạm
        </button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Còn trống", val:totalFree},
          {label:"Khách",     val:guestCount},
          {label:"Lượt vào",  val:entryCount},
          {label:"Lượt ra",   val:exitCount},
        ].map(s=>(
          <div key={s.label} style={{background:"#D1ECFF",borderRadius:20,padding:"16px 12px",textAlign:"center",boxShadow:"0 2px 6px rgba(0,0,0,0.1)"}}>
            <p style={{fontWeight:700,fontSize:14,color:"#003289",marginBottom:8}}>{s.label}</p>
            <p style={{fontWeight:600,fontSize:28,color:"#003289"}}>{s.val}</p>
          </div>
        ))}
      </div>

      {mapJsx}
    </div>
  )

  /* ── MOBILE ── */
  if (isMobile) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{background:"#F8FAFC",minHeight:"100vh",fontFamily:"'Inter',sans-serif"}}>
        {topbarJsx}
        <div style={{padding:"16px 16px 32px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <p style={{fontWeight:900,fontSize:18,color:"#003289"}}>Nhân viên vận hành</p>
              <p style={{fontSize:11,color:"#555"}}>{dateStr} · {timeStr}</p>
            </div>
            <button onClick={()=>router.push("/ticket/new")} style={{background:"#003289",color:"white",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
              + Phát vé tạm
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:16}}>
            {[{label:"Còn trống",val:totalFree},{label:"Khách",val:guestCount},{label:"Lượt vào",val:entryCount},{label:"Lượt ra",val:exitCount}].map(s=>(
              <div key={s.label} style={{background:"#D1ECFF",borderRadius:16,padding:"12px 8px",textAlign:"center",boxShadow:"0 2px 4px rgba(0,0,0,0.08)"}}>
                <p style={{fontWeight:700,fontSize:11,color:"#003289",marginBottom:4}}>{s.label}</p>
                <p style={{fontWeight:600,fontSize:22,color:"#003289"}}>{s.val}</p>
              </div>
            ))}
          </div>
          {mapJsx}
          <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:10}}>
            {[{label:"Đánh giá",href:"/review"},{label:"Danh sách vé tạm",href:"/ticket/new"},{label:"Lượt vào/ra",href:"/sessions"}].map(m=>(
              <div key={m.label} onClick={()=>router.push(m.href)} style={{background:"white",borderRadius:12,padding:"14px 16px",cursor:"pointer",border:"1px solid #e2e8f0",fontWeight:600,fontSize:14,color:"#003289"}}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="#D1ECFF")}
                onMouseLeave={e=>(e.currentTarget.style.borderColor="#e2e8f0")}>
                {m.label} →
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  /* ── DESKTOP ── */
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
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