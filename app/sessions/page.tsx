"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { User, users } from "@/data/mock"
import OperatorLayout from "@/components/OperatorLayout"

const FilterBar = ({
  filterDate, setFilterDate, filterField, setFilterField, filterValue, setFilterValue,
  fieldOptions,
}: {
  filterDate: string, setFilterDate: (v:string)=>void,
  filterField: string, setFilterField: (v:any)=>void,
  filterValue: string, setFilterValue: (v:string)=>void,
  fieldOptions: {value:string; label:string}[],
}) => (
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
      <select value={filterField} onChange={e => { setFilterField(e.target.value); setFilterValue("") }}
        style={{ height:36, border:"1px solid #e2e8f0", borderRadius:8, padding:"0 10px", fontSize:13, fontFamily:"'Inter',sans-serif", background:"white", outline:"none", minWidth:160 }}>
        <option value="all">-- Tất cả --</option>
        {fieldOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
        ) : filterField === "userRole" ? (
          <select value={filterValue} onChange={e => setFilterValue(e.target.value)}
            style={{ height:36, border:"1px solid #e2e8f0", borderRadius:8, padding:"0 10px", fontSize:13, fontFamily:"'Inter',sans-serif", background:"white", outline:"none", minWidth:140 }}>
            <option value="">-- Tất cả --</option>
            <option value="student">Sinh viên</option>
            <option value="lecturer">Giảng viên</option>
            <option value="staff">Cán bộ</option>
          </select>
        ) : (
          <input value={filterValue} onChange={e => setFilterValue(e.target.value)}
            placeholder="Nhập giá trị..."
            style={{ height:36, border:"1px solid #e2e8f0", borderRadius:8, padding:"0 10px", fontSize:13, fontFamily:"'Inter',sans-serif", background:"white", outline:"none", minWidth:160, boxSizing:"border-box" as any }}
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
)
export default function SessionsPage() {
  const router = useRouter()
  const [user,     setUser]     = useState<User | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [tickets,  setTickets]  = useState<any[]>([])
  const [tab,      setTab]      = useState<"member"|"guest">("member")
  // Filter member tab
  const [mFilterDate,  setMFilterDate]  = useState("")
  const [mFilterField, setMFilterField] = useState<"all"|"userId"|"userRole"|"subZoneId"|"status">("all")
  const [mFilterValue, setMFilterValue] = useState("")
  // Filter guest tab
  const [gFilterDate,  setGFilterDate]  = useState("")
  const [gFilterField, setGFilterField] = useState<"all"|"id"|"licensePlate"|"subZoneId"|"status">("all")
  const [gFilterValue, setGFilterValue] = useState("")
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
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  async function load() {
    const [sessRes, tickRes] = await Promise.all([
      fetch("/api/sessions").then(r => r.json()),
      fetch("/api/tickets").then(r => r.json()),
    ])
    setSessions(sessRes.sessions ?? [])
    setTickets(tickRes.tickets ?? [])
  }

  if (!user) return null

  const timeStr = now.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })
  const dateStr = now.toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" })

  const roleMap: Record<string,string> = { student:"Sinh viên", lecturer:"Giảng viên", staff:"Cán bộ" }

  const enriched = sessions
    .slice()
    .sort((a,b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
    .map((s,i) => {
      const u = users.find(u => u.id === s.userId)
      return { ...s, idx:i+1, userName:u?.name??"—", userRole:u?.role??"—" }
    })

  const enrichedTickets = tickets
    .slice()
    .sort((a,b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
    .map((t,i) => ({ ...t, idx:i+1 }))

  function exportSessionsCSV() {
    const headers = ["STT","Mã","Tên","Vai trò","Khu vực","Thời gian vào","Thời gian ra","Trạng thái","Phí"]
    const lines = enriched.map(s => [
      s.idx, s.userId, s.userName,
      roleMap[s.userRole] ?? s.userRole,
      s.subZoneId,
      new Date(s.entryTime).toLocaleString("vi-VN"),
      s.exitTime ? new Date(s.exitTime).toLocaleString("vi-VN") : "—",
      s.status==="active" ? "Đang gửi" : "Đã ra",
      s.fee!=null ? s.fee+"đ" : "—",
    ].join(","))
    const csv  = [headers.join(","), ...lines].join("\n")
    const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href=url; a.download="luot-vao-ra-thanh-vien.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  function exportTicketsCSV() {
    const headers = ["STT","Mã vé","Biển số","Tên khách","Khu vực","Thời gian vào","Thời gian ra","Trạng thái","Phí"]
    const lines = enrichedTickets.map(t => [
      t.idx, t.id, t.licensePlate, t.guestName??"Khách",
      t.subZoneId,
      new Date(t.entryTime).toLocaleString("vi-VN"),
      t.exitTime ? new Date(t.exitTime).toLocaleString("vi-VN") : "—",
      t.status==="active" ? "Đang gửi" : "Đã ra",
      t.fee!=null ? t.fee+"đ" : "—",
    ].join(","))
    const csv  = [headers.join(","), ...lines].join("\n")
    const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href=url; a.download="luot-vao-ra-khach.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const thStyle: React.CSSProperties = { background:"#003289", color:"white", fontSize:12, fontWeight:600, padding:"10px 12px", textAlign:"center", whiteSpace:"nowrap" }
  const tdStyle: React.CSSProperties = { fontSize:12, fontWeight:500, padding:"10px 12px", textAlign:"center", borderBottom:"1px solid #f0f0f0", color:"#000" }
  
  return (
    <OperatorLayout user={user} activePage="Lượt vào/ra" backHref="/dashboard/operator"title="Lượt vào/ra" subtitle={`${dateStr} · ${timeStr}`}>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, marginBottom:16, background:"#e2e8f0", borderRadius:10, padding:3, width:"fit-content" }}>
        {[
          { key:"member", label:`Thành viên (${enriched.length})`           },
          { key:"guest",  label:`Khách vãng lai (${enrichedTickets.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding:"8px 18px", border:"none", borderRadius:8,
            background:tab===t.key?"#003289":"transparent",
            color:tab===t.key?"white":"#555",
            fontSize:13, fontWeight:600, cursor:"pointer",
            fontFamily:"'Inter',sans-serif", transition:"all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "member" && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <p style={{ fontWeight:600, fontSize:15, color:"#000" }}>Lượt vào/ra — SV · GV · CB</p>
            <button onClick={exportSessionsCSV} style={{ background:"#22c55e", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>⬇ Xuất CSV</button>
          </div>

          <FilterBar
            filterDate={mFilterDate}  setFilterDate={setMFilterDate}
            filterField={mFilterField} setFilterField={setMFilterField}
            filterValue={mFilterValue} setFilterValue={setMFilterValue}
            fieldOptions={[
              { value:"userId",   label:"Mã SV/GV"  },
              { value:"userRole", label:"Vai trò"    },
              { value:"subZoneId",label:"Khu vực"    },
              { value:"status",   label:"Trạng thái" },
            ]}
          />

          <div style={{ background:"white", borderRadius:12, overflow:"hidden", border:"1px solid #e2e8f0", boxShadow:"0 2px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>{["STT","Mã SV/GV","Tên","Vai trò","Khu vực","Thời gian vào","Thời gian ra","Trạng thái","Phí"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {enriched
                    .filter(s => {
                      const matchDate = !mFilterDate ||
                        new Date(s.entryTime).toLocaleDateString("vi-VN") === new Date(mFilterDate).toLocaleDateString("vi-VN")
                      const matchField = mFilterField === "all" || !mFilterValue ||
                        String((s as any)[mFilterField]).toLowerCase().includes(mFilterValue.toLowerCase())
                      return matchDate && matchField
                    })
                    .map((s,i) => (
                      <tr key={s.id} style={{ background:i%2===0?"white":"#F8FAFC" }}>
                        <td style={tdStyle}>{i+1}</td>
                        <td style={tdStyle}>{s.userId}</td>
                        <td style={{ ...tdStyle, textAlign:"left" }}>{s.userName}</td>
                        <td style={tdStyle}>{roleMap[s.userRole]??s.userRole}</td>
                        <td style={tdStyle}>{s.subZoneId}</td>
                        <td style={tdStyle}>{new Date(s.entryTime).toLocaleString("vi-VN")}</td>
                        <td style={tdStyle}>{s.exitTime ? new Date(s.exitTime).toLocaleString("vi-VN") : "—"}</td>
                        <td style={tdStyle}>
                          <span style={{ background:s.status==="active"?"#DCEBFD":"#F0FDF4", color:s.status==="active"?"#003289":"#16a34a", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>
                            {s.status==="active"?"Đang gửi":"Đã ra"}
                          </span>
                        </td>
                        <td style={tdStyle}>{s.fee!=null ? s.fee.toLocaleString("vi-VN")+"đ" : "—"}</td>
                      </tr>
                    ))
                  }
                  {enriched.filter(s => {
                    const matchDate = !mFilterDate || new Date(s.entryTime).toLocaleDateString("vi-VN") === new Date(mFilterDate).toLocaleDateString("vi-VN")
                    const matchField = mFilterField === "all" || !mFilterValue || String((s as any)[mFilterField]).toLowerCase().includes(mFilterValue.toLowerCase())
                    return matchDate && matchField
                  }).length === 0 && (
                    <tr><td colSpan={9} style={{ ...tdStyle, color:"#868686", padding:"20px" }}>Không có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "guest" && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <p style={{ fontWeight:600, fontSize:15, color:"#000" }}>Lượt vào/ra — Khách vãng lai</p>
            <button onClick={exportTicketsCSV} style={{ background:"#22c55e", color:"white", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>⬇ Xuất CSV</button>
          </div>

          <FilterBar
            filterDate={gFilterDate}  setFilterDate={setGFilterDate}
            filterField={gFilterField} setFilterField={setGFilterField}
            filterValue={gFilterValue} setFilterValue={setGFilterValue}
            fieldOptions={[
              { value:"id",          label:"Mã vé"      },
              { value:"licensePlate",label:"Biển số xe"  },
              { value:"subZoneId",   label:"Khu vực"     },
              { value:"status",      label:"Trạng thái"  },
            ]}
          />

          <div style={{ background:"white", borderRadius:12, overflow:"hidden", border:"1px solid #e2e8f0", boxShadow:"0 2px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>{["STT","Mã vé","Biển số xe","Tên khách","Khu vực","Thời gian vào","Thời gian ra","Trạng thái","Phí"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {enrichedTickets
                    .filter(t => {
                      const matchDate = !gFilterDate ||
                        new Date(t.entryTime).toLocaleDateString("vi-VN") === new Date(gFilterDate).toLocaleDateString("vi-VN")
                      const matchField = gFilterField === "all" || !gFilterValue ||
                        String((t as any)[gFilterField]).toLowerCase().includes(gFilterValue.toLowerCase())
                      return matchDate && matchField
                    })
                    .map((t,i) => (
                      <tr key={t.id} style={{ background:i%2===0?"white":"#F8FAFC" }}>
                        <td style={tdStyle}>{i+1}</td>
                        <td style={tdStyle}>{t.id}</td>
                        <td style={tdStyle}>{t.licensePlate}</td>
                        <td style={tdStyle}>{t.guestName??"Khách"}</td>
                        <td style={tdStyle}>{t.subZoneId}</td>
                        <td style={tdStyle}>{new Date(t.entryTime).toLocaleString("vi-VN")}</td>
                        <td style={tdStyle}>{t.exitTime ? new Date(t.exitTime).toLocaleString("vi-VN") : "—"}</td>
                        <td style={tdStyle}>
                          <span style={{ background:t.status==="active"?"#DCEBFD":"#F0FDF4", color:t.status==="active"?"#003289":"#16a34a", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>
                            {t.status==="active"?"Đang gửi":"Đã ra"}
                          </span>
                        </td>
                        <td style={tdStyle}>{t.fee!=null ? t.fee.toLocaleString("vi-VN")+"đ" : "—"}</td>
                      </tr>
                    ))
                  }
                  {enrichedTickets.filter(t => {
                    const matchDate = !gFilterDate || new Date(t.entryTime).toLocaleDateString("vi-VN") === new Date(gFilterDate).toLocaleDateString("vi-VN")
                    const matchField = gFilterField === "all" || !gFilterValue || String((t as any)[gFilterField]).toLowerCase().includes(gFilterValue.toLowerCase())
                    return matchDate && matchField
                  }).length === 0 && (
                    <tr><td colSpan={9} style={{ ...tdStyle, color:"#868686", padding:"20px" }}>Không có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </OperatorLayout>
  )
}