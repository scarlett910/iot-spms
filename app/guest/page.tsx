"use client"
import { useRouter } from "next/navigation"

export default function GuestPage() {
  const router = useRouter()

  return (
    <div suppressHydrationWarning style={{
      minHeight: "100vh", background: "#F8FAFC",
      fontFamily: "'Inter', sans-serif",
      display: "flex", flexDirection: "column",
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
        }}>
          Đăng nhập
        </button>
      </nav>

      {/* Content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "32px 16px",
      }}>
        <p style={{ fontWeight: 900, fontSize: 24, color: "#003289", marginBottom: 6 }}>
          Người dùng khách
        </p>
        <p style={{ fontSize: 13, color: "#868686", marginBottom: 32, textAlign: "center" }}>
          Chọn chức năng bạn muốn sử dụng
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            {
              icon: "🗺️",
              title: "Bản đồ bãi xe",
              sub: "Xem vị trí và tình trạng các khu",
              href: "/guest/parking",
              color: "#DCEBFD",
            },
            {
              icon: "⭐",
              title: "Đánh giá dịch vụ",
              sub: "Góp ý để cải thiện chất lượng",
              href: "/guest/review",
              color: "#FFF7ED",
            },
          ].map(m => (
            <div key={m.title} onClick={() => router.push(m.href)} style={{
              width: 180, background: "white", borderRadius: 16,
              padding: "24px 20px", cursor: "pointer",
              border: "1px solid #e2e8f0", textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              transition: "box-shadow 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)")}>
              <div style={{
                width: 56, height: 56, background: m.color, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, margin: "0 auto 14px",
              }}>{m.icon}</div>
              <p style={{ fontWeight: 700, fontSize: 15, color: "#000", marginBottom: 6 }}>{m.title}</p>
              <p style={{ fontSize: 11, color: "#868686", lineHeight: 1.5 }}>{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: 32, background: "#003289" }}/>
    </div>
  )
}