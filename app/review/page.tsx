"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"
import { User } from "@/data/mock"

export default function ReviewPage() {
  const router   = useRouter()
  const [user,     setUser]     = useState<User | null>(null)
  const [stars,    setStars]    = useState(0)
  const [hovered,  setHovered]  = useState(0)
  const [comment,  setComment]  = useState("")
  const [sent,     setSent]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [now,      setNow]      = useState(new Date())

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
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
    if (!u) { router.push("/login"); return }
    setUser(u)
  }, [])

  if (!user) return null

  const initials = user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
  const roleLabel: Record<string, string> = {
    student: "Sinh viên", lecturer: "Giảng viên", staff: "Cán bộ",
  }
  const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr = now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  function doLogout() { logout(); router.push("/login") }

  async function handleSubmit() {
    if (stars === 0) return
    setLoading(true)
    try {
      await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: user!.id, stars, comment: comment.trim() }),
      })
      setSent(true)
    } catch {}
    finally { setLoading(false) }
  }

  function handleReset() { setSent(false); setStars(0); setComment("") }

  const sidebarItems = [
    { label: "Tổng quan",  href: "/dashboard/student", active: false },
    { label: "Bản đồ",     href: "/parking",           active: false },
    { label: "Thanh toán", href: "/invoice",           active: false },
    { label: "Đánh giá",   href: "/review",            active: true  },
  ]

  // ── Card content JSX (không phải component) ────────────
  const cardContent = sent ? (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "16px 0" }}>
      <div style={{
        width: 72, height: 72, background: "#00D720", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
          <path d="M8 20l9 9 15-16" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, color: "#003289", textAlign: "center" }}>
        Cảm ơn bạn đã đánh giá!
      </p>
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill={i <= stars ? "#FFB800" : "#D9D9D9"}>
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.3L12 17l-6.2 4.2 2.4-7.3L2 9.4h7.6z"/>
          </svg>
        ))}
      </div>
      {comment.trim() && (
        <p style={{ fontSize: 13, color: "#555", textAlign: "center", fontStyle: "italic" }}>
          "{comment.trim()}"
        </p>
      )}
      <button onClick={handleReset} style={{
        marginTop: 4, padding: "8px 24px", background: "#003289",
        border: "none", borderRadius: 20, color: "white",
        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif",
      }}>
        Đánh giá lại
      </button>
    </div>
  ) : (
    <>
      {/* Stars */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
        {[1,2,3,4,5].map(i => (
          <button key={i}
            onClick={() => setStars(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <svg width="28" height="28" viewBox="0 0 24 24"
              fill={i <= (hovered || stars) ? "#FFB800" : "#D9D9D9"}
              style={{ transition: "fill 0.1s", display: "block" }}>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.3L12 17l-6.2 4.2 2.4-7.3L2 9.4h7.6z"/>
            </svg>
          </button>
        ))}
      </div>

      {/* Label */}
      <p style={{ fontSize: 10, fontWeight: 500, color: "#033C89", marginBottom: 6 }}>
        Nhận xét (không quá 200 chữ)
      </p>

      {/* Textarea — KHÔNG bọc trong component con */}
      <textarea
        value={comment}
        onChange={e => { if (e.target.value.length <= 200) setComment(e.target.value) }}
        placeholder="Chia sẻ trải nghiệm của bạn..."
        style={{
          width: "100%", height: 90, boxSizing: "border-box",
          border: "3px solid #D9D9D9", borderRadius: 4,
          background: "white", padding: "8px 10px",
          fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#333",
          resize: "none", outline: "none", display: "block", marginBottom: 4,
        }}
        onFocus={e  => (e.target.style.borderColor = "#003289")}
        onBlur={e   => (e.target.style.borderColor = "#D9D9D9")}
      />
      <p style={{ fontSize: 10, color: "#868686", textAlign: "right", marginBottom: 16 }}>
        {comment.length}/200
      </p>

      {/* Submit */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={handleSubmit}
          disabled={stars === 0 || loading}
          style={{
            width: 90, height: 30,
            background: stars === 0 ? "#8BA5CC" : "#003289",
            border: "none", borderRadius: 20, color: "white",
            fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13,
            cursor: stars === 0 ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}>
          {loading ? "..." : "Gửi"}
        </button>
      </div>
    </>
  )

  const card = (
    <div style={{
      background: "#F8FAFC", borderRadius: 12,
      border: "1px solid #D9D9D9",
      boxShadow: "0 4px 4px rgba(0,0,0,0.1)",
      padding: "20px",
    }}>
      {cardContent}
    </div>
  )

  const navbarJsx = (
    <nav style={{
      background: "#003289", height: 52, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px",
    }}>
      <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 16 }}>IOT-SPMS</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#F8FAFC", fontWeight: 700, fontSize: 12 }}>{user.name.split(" ").pop()}</span>
        <div style={{
          width: 28, height: 28, background: "#B5D4F4", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#003289", fontSize: 10, fontWeight: 700,
        }}>{initials}</div>
        <button onClick={doLogout} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M3 9h12M9 3l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </nav>
  )

  const backBtn = (
    <button onClick={() => router.push("/dashboard/student")} style={{
      display: "flex", alignItems: "center", gap: 6, background: "none",
      border: "none", cursor: "pointer", color: "#003289", fontSize: 12,
      fontWeight: 600, fontFamily: "'Inter',sans-serif", marginBottom: 14, padding: 0,
    }}>
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M15 9H3M9 3L3 9l6 6" stroke="#003289" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Quay lại
    </button>
  )

  const sidebarJsx = (
    <div style={{ width: 220, background: "#003289", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 16, padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        IOT-SPMS
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ width: 36, height: 36, background: "#B5D4F4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#003289", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
        <div>
          <p style={{ color: "#F8FAFC", fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{user.name}</p>
          <p style={{ color: "rgba(181,212,244,0.7)", fontSize: 10 }}>{roleLabel[user.role] ?? ""}</p>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {sidebarItems.map(item => (
          <div key={item.label} onClick={() => router.push(item.href)} style={{
            padding: item.active ? "10px 20px 10px 17px" : "10px 20px",
            borderLeft: item.active ? "3px solid #319BE7" : "3px solid transparent",
            background: item.active ? "rgba(255,255,255,0.1)" : "transparent",
            color: item.active ? "white" : "rgba(255,255,255,0.55)",
            fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
          }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)" }}}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)" }}}>
            {item.label}
          </div>
        ))}
      </nav>
      <button onClick={doLogout} style={{
        margin: "0 12px 16px", display: "flex", alignItems: "center", gap: 8,
        padding: "10px 12px", background: "none", border: "none", borderRadius: 8,
        color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.75)" }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.4)" }}>
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
          <path d="M3 9h12M9 3l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Đăng xuất
      </button>
    </div>
  )

  // ── MOBILE ──────────────────────────────────────────────
  if (isMobile) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{ background: "#F8FAFC", minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>
        {navbarJsx}
        <div style={{ padding: "16px 16px 32px" }}>
          {backBtn}
          <p style={{ fontWeight: 800, fontSize: 22, color: "#003289", marginBottom: 16 }}>Đánh giá</p>
          {card}
        </div>
      </div>
    </>
  )

  // ── DESKTOP ──────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{
        display: "flex", height: "100vh", background: "#F8FAFC",
        fontFamily: "'Inter',sans-serif", overflow: "hidden",
      }}>
        {sidebarJsx}

        {/* Main */}
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              {backBtn}
              <p style={{ fontWeight: 800, fontSize: 22, color: "#003289" }}>Đánh giá</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#003289" }}>{timeStr}</p>
              <p style={{ fontSize: 10, color: "#868686", marginTop: 1 }}>{dateStr}</p>
            </div>
          </div>
          <div style={{ maxWidth: 460 }}>{card}</div>
        </div>

        {/* Right panel */}
        <div style={{ width: 220, background: "white", borderLeft: "1px solid #e2e8f0", padding: 20, overflowY: "auto", flexShrink: 0 }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: "#000", marginBottom: 14 }}>Hướng dẫn</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "⭐", text: "Chọn số sao từ 1–5 để đánh giá chất lượng dịch vụ" },
              { icon: "✏️", text: "Nhập nhận xét (tối đa 200 chữ)" },
              { icon: "📤", text: "Bấm Gửi để hoàn tất" },
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{tip.icon}</span>
                <p style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}