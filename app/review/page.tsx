"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { User } from "@/data/mock"
import StudentLayout from "@/components/StudentLayout"
import OperatorLayout from "@/components/OperatorLayout"

export default function ReviewPage() {
  const router  = useRouter()
  const [user,    setUser]    = useState<User | null>(null)
  const [stars,   setStars]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [now,     setNow]     = useState(new Date())
  const [filterDate,  setFilterDate]  = useState("")
  const [sortStars,   setSortStars]   = useState<"desc"|"asc">("desc")

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.push("/login"); return }
    setUser(u)
  }, [])

  useEffect(() => {
    if (!user) return
    if (["operator","admin"].includes(user.role)) {
      fetch("/api/reviews").then(r => r.json()).then(data => setReviews(data.reviews ?? []))
    }
  }, [user])
  
  if (!user) return null
  
  const isOperator = ["operator","admin"].includes(user.role)
  const timeStr = now.toLocaleTimeString("vi-VN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })
  const dateStr = now.toLocaleDateString("vi-VN", { weekday:"long", day:"2-digit", month:"2-digit", year:"numeric" })

  async function handleSubmit() {
    if (stars === 0) return
    setLoading(true)
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id, stars, comment: comment.trim() }),
      })
      setSent(true)
    } catch {}
    finally { setLoading(false) }
  }

  function handleReset() { setSent(false); setStars(0); setComment("") }

  const card = sent ? (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, padding:"16px 0" }}>
      <div style={{ width:72, height:72, background:"#00D720", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
          <path d="M8 20l9 9 15-16" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p style={{ fontWeight:700, fontSize:16, color:"#003289", textAlign:"center" }}>Cảm ơn bạn đã đánh giá!</p>
      <div style={{ display:"flex", gap:4 }}>
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill={i <= stars ? "#FFB800" : "#D9D9D9"}>
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.3L12 17l-6.2 4.2 2.4-7.3L2 9.4h7.6z"/>
          </svg>
        ))}
      </div>
      {comment.trim() && (
        <p style={{ fontSize:13, color:"#555", textAlign:"center", fontStyle:"italic" }}>"{comment.trim()}"</p>
      )}
      <button onClick={handleReset} style={{ padding:"8px 24px", background:"#003289", border:"none", borderRadius:20, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
        Đánh giá lại
      </button>
    </div>
  ) : (
    <div style={{ background:"#F8FAFC", borderRadius:12, border:"1px solid #D9D9D9", boxShadow:"0 4px 4px rgba(0,0,0,0.1)", padding:20 }}>
      <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:20 }}>
        {[1,2,3,4,5].map(i => (
          <button key={i} onClick={() => setStars(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
            style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill={i <= (hovered || stars) ? "#FFB800" : "#D9D9D9"} style={{ transition:"fill 0.1s", display:"block" }}>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.3L12 17l-6.2 4.2 2.4-7.3L2 9.4h7.6z"/>
            </svg>
          </button>
        ))}
      </div>
      <p style={{ fontSize:10, fontWeight:500, color:"#033C89", marginBottom:6 }}>Nhận xét (không quá 200 chữ)</p>
      <textarea
        value={comment}
        onChange={e => { if (e.target.value.length <= 200) setComment(e.target.value) }}
        placeholder="Chia sẻ trải nghiệm của bạn..."
        style={{ width:"100%", height:90, boxSizing:"border-box", border:"3px solid #D9D9D9", borderRadius:4, background:"white", padding:"8px 10px", fontFamily:"'Inter',sans-serif", fontSize:13, color:"#333", resize:"none", outline:"none", display:"block", marginBottom:4 }}
        onFocus={e => (e.target.style.borderColor = "#003289")}
        onBlur={e  => (e.target.style.borderColor = "#D9D9D9")}
      />
      <p style={{ fontSize:10, color:"#868686", textAlign:"right", marginBottom:16 }}>{comment.length}/200</p>
      <div style={{ display:"flex", justifyContent:"center" }}>
        <button onClick={handleSubmit} disabled={stars === 0 || loading} style={{
          width:90, height:30, background: stars === 0 ? "#8BA5CC" : "#003289",
          border:"none", borderRadius:20, color:"white", fontFamily:"'Inter',sans-serif",
          fontWeight:600, fontSize:13, cursor: stars === 0 ? "not-allowed" : "pointer",
        }}>
          {loading ? "..." : "Gửi"}
        </button>
      </div>
    </div>
  )

  const mainForm = (
    <div style={{ width: "100%", maxWidth: 500, margin: "0 auto" }}>
      {card}
    </div>
  );
  
  const guideContent = (
    <div style={{ padding: "20px", boxSizing: "border-box" }}>
      <p style={{ 
        fontWeight: 800, 
        fontSize: 13, 
        color: "#000", 
        marginBottom: 16,
        textTransform: "uppercase",
        letterSpacing: "0.02em"
      }}>
        Hướng dẫn
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[
          { icon: "⭐", text: "Chọn số sao từ 1–5 để đánh giá chất lượng dịch vụ" },
          { icon: "✏️", text: "Nhập nhận xét (tối đa 200 chữ)" },
          { icon: "📤", text: "Bấm Gửi để hoàn tất" },
        ].map((tip, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: -2 }}>{tip.icon}</span>
            <p style={{ 
              fontSize: 12, 
              color: "#4A5568", 
              lineHeight: "1.6",
              margin: 0 
            }}>
              {tip.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  if (isOperator) {
    const avgStars = reviews.length
      ? (reviews.reduce((s:number, r:any) => s + r.stars, 0) / reviews.length).toFixed(1)
      : "—"

    const reviewTable = (() => {
      let filtered = reviews.slice()
      if (filterDate) {
        filtered = filtered.filter(r =>
          new Date(r.createdAt).toLocaleDateString("vi-VN") ===
          new Date(filterDate).toLocaleDateString("vi-VN")
        )
      }
      filtered.sort((a:any, b:any) =>
        sortStars === "desc" ? b.stars - a.stars : a.stars - b.stars
      )
      const avgStars = reviews.length
        ? (reviews.reduce((s:number, r:any) => s + r.stars, 0) / reviews.length).toFixed(1)
        : "—"

      return (
        <>
          {/* Stats */}
          <div style={{ display:"flex", gap:12, marginBottom:16 }}>
            {[
              { label:"Tổng đánh giá",  val: String(reviews.length) },
              { label:"Sao trung bình", val: reviews.length ? avgStars+" ⭐" : "—" },
            ].map(s => (
              <div key={s.label} style={{ flex:1, background:"#DCEBFD", borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
                <p style={{ fontSize:10, fontWeight:700, color:"#003289", marginBottom:4 }}>{s.label}</p>
                <p style={{ fontSize:20, fontWeight:700, color:"#003289" }}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"flex-end" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#555" }}>Lọc theo ngày</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                style={{ height:36, border:"1px solid #e2e8f0", borderRadius:8, padding:"0 10px", fontSize:13, fontFamily:"'Inter',sans-serif", background:"white", outline:"none" }}
                onFocus={e => (e.target.style.borderColor="#003289")}
                onBlur={e  => (e.target.style.borderColor="#e2e8f0")}
              />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#555" }}>Sắp xếp sao</label>
              <select value={sortStars} onChange={e => setSortStars(e.target.value as "desc"|"asc")}
                style={{ height:36, border:"1px solid #e2e8f0", borderRadius:8, padding:"0 10px", fontSize:13, fontFamily:"'Inter',sans-serif", background:"white", outline:"none", minWidth:160 }}
                onFocus={e => (e.target.style.borderColor="#003289")}
                onBlur={e  => (e.target.style.borderColor="#e2e8f0")}
              >
                <option value="desc">⭐ Cao → Thấp</option>
                <option value="asc">⭐ Thấp → Cao</option>
              </select>
            </div>
            {filterDate && (
              <button onClick={() => setFilterDate("")}
                style={{ height:36, padding:"0 14px", background:"#F1F5F9", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, fontWeight:600, color:"#555", cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                Xoá lọc
              </button>
            )}
            <p style={{ fontSize:11, color:"#868686", alignSelf:"center", marginLeft:"auto" }}>
              {filtered.length}/{reviews.length} đánh giá
            </p>
          </div>

          {/* Bảng */}
          <div style={{ background:"white", borderRadius:12, overflow:"hidden", border:"1px solid #e2e8f0", boxShadow:"0 2px 4px rgba(0,0,0,0.08)" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>{["STT","Người dùng","Sao","Nhận xét","Thời gian"].map(h => (
                    <th key={h} style={{ background:"#003289", color:"white", fontSize:12, fontWeight:600, padding:"10px 12px", textAlign:"center", whiteSpace:"nowrap" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={5} style={{ padding:"20px", textAlign:"center", color:"#868686", fontSize:13 }}>
                        {filterDate ? "Không có đánh giá trong ngày này" : "Chưa có đánh giá nào"}
                      </td></tr>
                    : filtered.map((r:any, i:number) => (
                      <tr key={r.id} style={{ background:i%2===0?"white":"#F8FAFC" }}>
                        <td style={{ fontSize:12, padding:"10px 12px", textAlign:"center", borderBottom:"1px solid #f0f0f0", color:"#000" }}>{i+1}</td>
                        <td style={{ fontSize:12, padding:"10px 12px", textAlign:"center", borderBottom:"1px solid #f0f0f0", color:"#000" }}>{r.userId ?? "Khách"}</td>
                        <td style={{ fontSize:13, padding:"10px 12px", textAlign:"center", borderBottom:"1px solid #f0f0f0" }}>{"⭐".repeat(r.stars)}</td>
                        <td style={{ fontSize:12, padding:"10px 12px", borderBottom:"1px solid #f0f0f0", color:"#000", maxWidth:300 }}>
                          {r.comment || <span style={{ color:"#868686", fontStyle:"italic" }}>Không có nhận xét</span>}
                        </td>
                        <td style={{ fontSize:11, padding:"10px 12px", textAlign:"center", borderBottom:"1px solid #f0f0f0", color:"#868686", whiteSpace:"nowrap" }}>
                          {new Date(r.createdAt).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </>
      )
    })()

    return (
      <OperatorLayout
        user={user}
        activePage="Đánh giá"
        backHref="/dashboard/operator"
        title="Đánh giá"
        subtitle={`${dateStr} · ${timeStr}`}
        rightPanel={guideContent}
      >
        {reviewTable}
      </OperatorLayout>
    )
  }

  return (
    <StudentLayout 
      user={user} 
      activePage="Đánh giá" 
      backHref="/dashboard/student" 
      title="Đánh giá" 
      subtitle={`${dateStr} · ${timeStr}`}
      rightPanel={guideContent} // Truyền vào prop chuyên biệt
    >
      {mainForm}
    </StudentLayout>
  )
}