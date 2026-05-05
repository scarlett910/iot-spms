"use client"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import { User } from "@/data/mock"

type Props = {
  user: User
  activePage: string
  children: React.ReactNode
  title?: string
  subtitle?: string
  headerRight?: React.ReactNode
}

export default function StudentLayout({
  user, activePage, children, title, subtitle, headerRight
}: Props) {
  const router    = useRouter()
  const isStudent = user.role === "student"
  const initials  = user.name.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase()

  function doLogout() { logout(); router.push("/login") }

  const roleLabel: Record<string,string> = {
    student:"Sinh viên", lecturer:"Giảng viên", staff:"Cán bộ",
  }

  const navItems = [
    { label:"Tổng quan", href:"/dashboard/student" },
    { label:"Bản đồ",    href:"/parking"           },
    ...(isStudent ? [{ label:"Thanh toán", href:"/invoice" }] : []),
    { label:"Đánh giá",  href:"/review"            },
  ]

  const sidebarJsx = (
    <div style={{
      width:220, background:"#003289",
      display:"flex", flexDirection:"column", flexShrink:0,
    }}>
      {/* Logo */}
      <div style={{
        color:"#F8FAFC", fontWeight:800, fontSize:16,
        padding:"18px 20px 14px",
        borderBottom:"1px solid rgba(255,255,255,0.1)",
      }}>
        IOT-SPMS
      </div>

      {/* User */}
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"12px 20px",
        borderBottom:"1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{
          width:34, height:34, background:"#B5D4F4", borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#003289", fontSize:11, fontWeight:700, flexShrink:0,
        }}>{initials}</div>
        <div>
          <p style={{color:"#F8FAFC", fontSize:12, fontWeight:600, lineHeight:1.3}}>{user.name}</p>
          <p style={{color:"rgba(181,212,244,0.7)", fontSize:10}}>
            {roleLabel[user.role] ?? user.role}
          </p>
        </div>
      </div>

      {/* Nav label */}
      <div style={{
        padding:"10px 20px 4px",
        color:"rgba(255,255,255,0.4)", fontSize:10,
        fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase",
      }}>
        Danh mục
      </div>

      {/* Nav items */}
      <nav style={{flex:1}}>
        {navItems.map(item => {
          const active = activePage === item.label
          return (
            <div key={item.label} onClick={() => router.push(item.href)} style={{
              padding:    active ? "10px 20px 10px 17px" : "10px 20px",
              borderLeft: active ? "3px solid #319BE7" : "3px solid transparent",
              background: active ? "rgba(255,255,255,0.1)" : "transparent",
              color:      active ? "#F8FAFC" : "rgba(255,255,255,0.55)",
              fontSize:13, fontWeight: active ? 700 : 600,
              cursor:"pointer", transition:"all 0.15s",
            }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)"
                  e.currentTarget.style.color = "rgba(255,255,255,0.85)"
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)"
                }
              }}>
              {item.label}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <button onClick={doLogout} style={{
        margin:"0 12px 14px",
        display:"flex", alignItems:"center", gap:8,
        padding:"9px 12px", background:"none", border:"none",
        borderRadius:8, color:"rgba(255,255,255,0.4)",
        fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif",
      }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)"
          e.currentTarget.style.color = "rgba(255,255,255,0.75)"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "none"
          e.currentTarget.style.color = "rgba(255,255,255,0.4)"
        }}>
        <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
          <path d="M3 9h12M9 3l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Đăng xuất
      </button>
    </div>
  )

  const topbarJsx = (
    <nav style={{
      background:"#003289", height:50, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 20px",
    }}>
      <span style={{color:"#F8FAFC", fontWeight:800, fontSize:16}}>IOT-SPMS</span>
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        <span style={{color:"#F8FAFC", fontWeight:700, fontSize:13}}>
          {user.name.split(" ").pop()}
        </span>
        <div style={{
          width:30, height:30, background:"#B5D4F4", borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#003289", fontSize:11, fontWeight:700,
        }}>{initials}</div>
        <button onClick={doLogout} style={{background:"none", border:"none", cursor:"pointer", padding:0}}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
            <path d="M3 9h12M9 3l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </nav>
  )

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div suppressHydrationWarning style={{
        display:"flex", height:"100vh", background:"#F8FAFC",
        fontFamily:"'Inter',sans-serif", overflow:"hidden",
      }}>
        {sidebarJsx}
        <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden"}}>
          {topbarJsx}
          {(title || headerRight) && (
            <div style={{
              padding:"16px 24px 0",
              display:"flex", justifyContent:"space-between", alignItems:"flex-start",
            }}>
              <div>
                {title && <p style={{fontWeight:800, fontSize:22, color:"#003289", marginBottom:2}}>{title}</p>}
                {subtitle && <p style={{fontSize:12, color:"#555"}}>{subtitle}</p>}
              </div>
              {headerRight}
            </div>
          )}
          <div style={{flex:1, overflowY:"auto", padding:"16px 24px 24px"}}>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}