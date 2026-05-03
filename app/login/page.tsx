"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [id,    setId]    = useState("")
  const [pw,    setPw]    = useState("")
  const [error, setError] = useState("")

  function handleLogin() {
    const u = login(id.trim(), pw)
    if (!u) { setError("Sai tên tài khoản hoặc mật khẩu"); return }
    setError("")
    if (["operator","admin"].includes(u.role)) router.push("/dashboard/operator")
    else router.push("/dashboard/student")
  }

  const inputStyle: React.CSSProperties = {
    boxSizing:    "border-box",
    width:        "100%",
    height:       50,
    background:   "rgba(65,133,251,0.18)",
    border:       "1px solid #E2E8F0",
    borderRadius: 20,
    fontFamily:   "'Inter', sans-serif",
    fontSize:     15,
    padding:      "0 20px",
    outline:      "none",
    color:        "#1a1a1a",
    display:      "block",
  }

  return (
    <div suppressHydrationWarning style={{
      minHeight:      "100vh",
      background:     "white",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "space-between",
      fontFamily:     "'Inter', sans-serif",
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet"/>

      {/* Main content */}
      <div style={{
        flex:           1,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        width:          "100%",
        maxWidth:       420,
        padding:        "32px 40px 16px",
        boxSizing:      "border-box",
      }}>

        {/* Logo thật */}
        <img
          src="/logo-bk.png"
          alt="Logo BK TP.HCM"
          style={{ width: 240, height: 240, objectFit: "contain", marginBottom: 5 }}
        />

        {/* SPMS */}
        <h1 style={{
          fontFamily:    "'Inter', sans-serif",
          fontWeight:    800,
          fontSize:      42,
          color:         "#003289",
          margin:        "0 0 28px",
          letterSpacing: "0.01em",
        }}>
          SPMS
        </h1>

        {/* Tên tài khoản */}
        <div style={{ width: "100%", marginBottom: 16 }}>
          <label style={{
            display:    "block",
            fontWeight: 600,
            fontSize:   17,
            color:      "#000",
            marginBottom: 8,
          }}>
            Tên tài khoản
          </label>
          <input
            type="text"
            value={id}
            onChange={e => { setId(e.target.value); setError("") }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = "#4185FB"}
            onBlur={e  => e.target.style.borderColor = "#E2E8F0"}
          />
        </div>

        {/* Mật khẩu */}
        <div style={{ width: "100%", marginBottom: 0 }}>
          <label style={{
            display:    "block",
            fontWeight: 600,
            fontSize:   17,
            color:      "#000",
            marginBottom: 8,
          }}>
            Mật khẩu
          </label>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError("") }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = "#4185FB"}
            onBlur={e  => e.target.style.borderColor = "#E2E8F0"}
          />
        </div>

        {error && (
          <p style={{ color: "#EF4444", fontSize: 13, marginTop: 8, alignSelf: "flex-start" }}>
            {error}
          </p>
        )}

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: "#000", margin: "20px 0" }}/>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 16, width: "100%" }}>
          <button
            onClick={handleLogin}
            style={{
              flex:         1,
              height:       80,
              background:   "#003289",
              border:       "none",
              borderRadius: 20,
              color:        "white",
              fontFamily:   "'Inter', sans-serif",
              fontWeight:   600,
              fontSize:     22,
              cursor:       "pointer",
            }}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => router.push("/ticket/new")}
            style={{
              flex:         1,
              height:       80,
              background:   "#319BE7",
              border:       "1px solid #003289",
              borderRadius: 20,
              color:        "white",
              fontFamily:   "'Inter', sans-serif",
              fontWeight:   600,
              fontSize:     20,
              lineHeight:   "1.3",
              cursor:       "pointer",
            }}
          >
            Người dùng<br/>khách
          </button>
        </div>

      </div>

      {/* Footer bar */}
      <div style={{ width: "100%", height: 32, background: "#003289" }}/>
    </div>
  )
}