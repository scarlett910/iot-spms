"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchSubZones } from "@/lib/api"
import { User } from "@/data/mock"
import OperatorLayout from "@/components/OperatorLayout"

type SubZone = { id:string; zone:string; capacity:number; occupied:number }

export default function OperatorDashboard() {
  const router = useRouter()
  const [user,     setUser]     = useState<User | null>(null)
  const [slots,    setSlots]    = useState<SubZone[]>([])
  const [tickets,  setTickets]  = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [now,      setNow]      = useState(new Date())

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

  const totalFree  = slots.reduce((s,z) => s + (z.capacity - z.occupied), 0)
  const guestCount = tickets.filter(t => t.status === "active").length
  const entryCount = sessions.filter(s => s.entryTime).length
  const exitCount  = sessions.filter(s => s.exitTime).length
  const timeStr    = now.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })
  const dateStr    = now.toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" })

  function zoneColor(z: SubZone) {
    const pct = z.capacity > 0 ? z.occupied / z.capacity : 0
    if (pct >= 1)   return { bg:"rgba(255,14,14,0.18)",  border:"#FF9292" }
    if (pct >= 0.8) return { bg:"rgba(246,255,67,0.38)", border:"#E2E000" }
    return               { bg:"rgba(49,233,42,0.22)",  border:"#A2F59F" }
  }

  const statsBlock = (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
      {[
        { label:"Còn trống", val:totalFree  },
        { label:"Khách",     val:guestCount },
        { label:"Lượt vào",  val:entryCount },
        { label:"Lượt ra",   val:exitCount  },
      ].map(s => (
        <div key={s.label} style={{ background:"#D1ECFF", borderRadius:20, padding:"16px 12px", textAlign:"center", boxShadow:"0 2px 6px rgba(0,0,0,0.1)" }}>
          <p style={{ fontWeight:700, fontSize:14, color:"#003289", marginBottom:8 }}>{s.label}</p>
          <p style={{ fontWeight:600, fontSize:28, color:"#003289" }}>{s.val}</p>
        </div>
      ))}
    </div>
  )

  const mapBlock = (
    <div style={{ background:"white", borderRadius:12, padding:18, boxShadow:"0 4px 4px rgba(0,0,0,0.1)", border:"1px solid #e2e8f0" }}>
      <div style={{ display:"flex", gap:16, marginBottom:14, flexWrap:"wrap" }}>
        {[{color:"#A2F59F",label:"Còn trống"},{color:"#FF9292",label:"Hết chỗ"},{color:"#FAFFA5",label:"Có lỗi"}].map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:12, height:12, background:l.color, borderRadius:2 }}/>
            <span style={{ fontSize:12, fontWeight:500 }}>{l.label}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize:11, fontWeight:700, color:"#003289", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Khu A (GV / CB)</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:4 }}>
        {slots.filter(z => z.zone === "A").map(z => {
          const col = zoneColor(z)
          return (
            <div key={z.id} style={{ background:col.bg, border:`1.5px solid ${col.border}`, borderRadius:8, padding:"10px 6px", textAlign:"center" }}>
              <p style={{ fontWeight:800, fontSize:14, color:"#000", marginBottom:3 }}>{z.id}</p>
              <p style={{ fontSize:12, color:"#000" }}>{z.occupied}/{z.capacity}</p>
            </div>
          )
        })}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, margin:"12px 0" }}>
        <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", background:"#DCEBFD", borderRadius:20, border:"1px solid #B5D4F4" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h8M5 1l4 4-4 4" stroke="#003289" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize:11, fontWeight:700, color:"#003289" }}>Cổng vào</span>
        </div>
        <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
      </div>
      <p style={{ fontSize:11, fontWeight:700, color:"#003289", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Khu B / C / D (SV / Khách)</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        {slots.filter(z => ["B","C","D"].includes(z.zone)).map(z => {
          const col = zoneColor(z)
          return (
            <div key={z.id} style={{ background:col.bg, border:`1.5px solid ${col.border}`, borderRadius:8, padding:"10px 6px", textAlign:"center" }}>
              <p style={{ fontWeight:800, fontSize:14, color:"#000", marginBottom:3 }}>{z.id}</p>
              <p style={{ fontSize:12, color:"#000" }}>{z.occupied}/{z.capacity}</p>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <OperatorLayout
      user={user}
      activePage="Tổng quan"
      title="Nhân viên vận hành"
      subtitle={`Tổng quan bãi xe · ${dateStr} · ${timeStr}`}
      headerRight={
        <button onClick={() => router.push("/ticket/new")} style={{
          background:"#003289", color:"white", border:"none", borderRadius:12,
          padding:"10px 20px", fontSize:14, fontWeight:600, cursor:"pointer",
          fontFamily:"'Inter',sans-serif", boxShadow:"0 2px 4px rgba(0,0,0,0.15)",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity="0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity="1")}>
          + Phát vé tạm
        </button>
      }
    >
      {statsBlock}
      {mapBlock}
    </OperatorLayout>
  )
}