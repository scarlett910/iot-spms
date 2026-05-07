"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { User } from "@/data/mock"
import OperatorLayout from "@/components/OperatorLayout"

export default function ReportPage() {
  const router = useRouter()
  const [user,      setUser]      = useState<User | null>(null)
  const [type,      setType]      = useState("summary")
  const [generated, setGen]       = useState(false)
  const [reportData, setReportData] = useState({ totalRevenue:0, totalTickets:0, activeTickets:0 })

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || u.role !== "admin") { router.push("/login"); return }
    setUser(u)
    Promise.all([
      fetch("/api/invoices").then(r => r.json()),
      fetch("/api/tickets").then(r => r.json()),
    ]).then(([invData, tckData]) => {
      setReportData({
        totalRevenue:  invData.invoices.filter((i:any) => i.status==="paid").reduce((s:number,i:any) => s+i.amount, 0),
        totalTickets:  tckData.tickets.length,
        activeTickets: tckData.tickets.filter((t:any) => t.status==="active").length,
      })
    })
  }, [])

  if (!user) return null

  const { totalRevenue, totalTickets, activeTickets } = reportData

  const reportTypes = [
    { id:"summary", label:"Báo cáo tổng hợp" },
    { id:"revenue", label:"Báo cáo doanh thu" },
    { id:"traffic", label:"Báo cáo lưu lượng" },
    { id:"device",  label:"Báo cáo thiết bị"  },
  ]

  return (
    <OperatorLayout user={user} activePage="Báo cáo" backHref="/dashboard/operator" title="Tạo báo cáo">
      <div style={{ maxWidth:500 }}>

        <p style={{ fontSize:12, color:"#868686", marginBottom:12 }}>Loại báo cáo</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
          {reportTypes.map(r => (
            <button key={r.id} onClick={() => { setType(r.id); setGen(false) }} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"12px 16px", borderRadius:12, border:`1px solid ${type===r.id?"#185FA5":"#e2e8f0"}`,
              background:type===r.id?"#EFF6FF":"white",
              color:type===r.id?"#185FA5":"#374151",
              fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"'Inter',sans-serif",
              transition:"all 0.15s",
            }}>
              {r.label}
              {type===r.id && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        <button onClick={() => setGen(true)} style={{
          width:"100%", height:44, background:"#003289", color:"white", border:"none",
          borderRadius:12, fontSize:15, fontWeight:600, cursor:"pointer",
          fontFamily:"'Inter',sans-serif", marginBottom:20,
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity="0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity="1")}>
          Tạo báo cáo
        </button>

        {generated && (
          <div style={{ background:"white", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden", boxShadow:"0 2px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ background:"#F8FAFC", padding:"12px 16px", borderBottom:"1px solid #e2e8f0" }}>
              <p style={{ fontWeight:600, fontSize:14, color:"#000" }}>{reportTypes.find(r => r.id===type)?.label}</p>
              <p style={{ fontSize:12, color:"#868686", marginTop:2 }}>{new Date().toLocaleDateString("vi-VN")}</p>
            </div>
            <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
              {(type==="summary"||type==="revenue") && (
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:13, color:"#868686" }}>Tổng doanh thu</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#000" }}>{totalRevenue.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              {(type==="summary"||type==="traffic") && (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:13, color:"#868686" }}>Tổng lượt gửi xe</span>
                    <span style={{ fontSize:13, fontWeight:600, color:"#000" }}>{totalTickets}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:13, color:"#868686" }}>Đang gửi xe</span>
                    <span style={{ fontSize:13, fontWeight:600, color:"#d97706" }}>{activeTickets}</span>
                  </div>
                </>
              )}
            </div>
            <div style={{ padding:"0 16px 16px" }}>
              <button onClick={() => alert("Mock: Xuất PDF thành công!\nFile: bao-cao-"+type+"-"+new Date().toISOString().slice(0,10)+".pdf")}
                style={{ width:"100%", height:40, background:"transparent", border:"1px solid #185FA5", color:"#185FA5", borderRadius:10, fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                Tải về PDF (Mock)
              </button>
            </div>
          </div>
        )}
      </div>
    </OperatorLayout>
  )
}