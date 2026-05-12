"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function GuestReviewPage() {
  const router  = useRouter()
  const [stars,   setStars]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (stars === 0) return
    setLoading(true)
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: null, stars, comment: comment.trim() }),
      })
      setSent(true)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div suppressHydrationWarning style={{
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column",
    }}>
      {/* Navbar */}
      <nav style={{
        background: "#003289", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: 16 }}>IOT-SPMS</span>
        <button onClick={() => router.push("/login")} style={{
          background: "none", border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 8, color: "#F8FAFC", fontSize: 12, fontWeight: 600,
          padding: "5px 12px", cursor: "pointer", fontFamily: "'Inter',sans-serif",
        }}>Đăng nhập</button>
      </nav>

      <div style={{ flex: 1, padding: "20px 16px 32px", maxWidth: 480, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <button onClick={() => router.push("/guest")} style={{
          display: "flex", alignItems: "center", gap: 6, background: "none",
          border: "none", cursor: "pointer", color: "#003289", fontSize: 12,
          fontWeight: 600, fontFamily: "'Inter',sans-serif", marginBottom: 12, padding: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M15 9H3M9 3L3 9l6 6" stroke="#003289" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Quay lại
        </button>

        <p style={{ fontWeight: 800, fontSize: 20, color: "#003289", marginBottom: 16 }}>Đánh giá dịch vụ</p>

        {sent ? (
          <div style={{ background: "white", borderRadius: 16, padding: 32, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 72, height: 72, background: "#00D720", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
              <p style={{ fontSize: 13, color: "#555", textAlign: "center", fontStyle: "italic" }}>"{comment.trim()}"</p>
            )}
            <button onClick={() => router.push("/guest")} style={{
              padding: "10px 28px", background: "#003289", border: "none",
              borderRadius: 20, color: "white", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Inter',sans-serif",
            }}>
              Về trang khách
            </button>
          </div>
        ) : (
          <div style={{ background: "#F8FAFC", borderRadius: 12, border: "1px solid #D9D9D9", boxShadow: "0 4px 4px rgba(0,0,0,0.1)", padding: 20 }}>
            {/* Stars */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i}
                  onClick={() => setStars(i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24"
                    fill={i <= (hovered || stars) ? "#FFB800" : "#D9D9D9"}
                    style={{ transition: "fill 0.1s", display: "block" }}>
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.3L12 17l-6.2 4.2 2.4-7.3L2 9.4h7.6z"/>
                  </svg>
                </button>
              ))}
            </div>

            <p style={{ fontSize: 10, fontWeight: 500, color: "#033C89", marginBottom: 6 }}>
              Nhận xét (không quá 200 chữ)
            </p>
            <textarea
              value={comment}
              onChange={e => { if (e.target.value.length <= 200) setComment(e.target.value) }}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              style={{
                width: "100%", height: 100, boxSizing: "border-box",
                border: "3px solid #D9D9D9", borderRadius: 4,
                background: "white", padding: "8px 10px",
                fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#333",
                resize: "none", outline: "none", display: "block", marginBottom: 4,
              }}
              onFocus={e => (e.target.style.borderColor = "#003289")}
              onBlur={e  => (e.target.style.borderColor = "#D9D9D9")}
            />
            <p style={{ fontSize: 10, color: "#868686", textAlign: "right", marginBottom: 16 }}>
              {comment.length}/200
            </p>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button onClick={handleSubmit} disabled={stars === 0 || loading} style={{
                width: 100, height: 36, background: stars === 0 ? "#8BA5CC" : "#003289",
                border: "none", borderRadius: 20, color: "white",
                fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 14,
                cursor: stars === 0 ? "not-allowed" : "pointer",
              }}>
                {loading ? "..." : "Gửi"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 32, background: "#003289" }}/>
    </div>
  )
}