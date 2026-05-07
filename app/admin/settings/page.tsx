"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { fetchSettings, saveSettings } from "@/lib/api"
import { User } from "@/data/mock"
import OperatorLayout from "@/components/OperatorLayout"

type Tab = "pricing" | "parking" | "bkpay"

export default function SettingsPage() {
  const router = useRouter()
  const [user,    setUser]    = useState<User | null>(null)
  const [tab,     setTab]     = useState<Tab>("pricing")
  const [pricing, setPricing] = useState<any>(null)
  const [parking, setParking] = useState<any>(null)
  const [bkpay,   setBkpay]   = useState<any>(null)
  const [saved,   setSaved]   = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u || u.role !== "admin") { router.push("/login"); return }
    setUser(u)
    fetchSettings().then(data => {
      const s = data.settings
      setPricing({ ...s.pricing })
      setParking({ ...s.parking })
      setBkpay({ ...s.bkpay })
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    await saveSettings({ pricing, parking, bkpay })
    setSaved("Đã lưu!")
    setTimeout(() => setSaved(""), 2000)
  }

  if (!user || loading || !pricing) return null

  const tabs: { id:Tab; label:string }[] = [
    { id:"pricing", label:"Biểu giá"       },
    { id:"parking", label:"Bãi xe"          },
    { id:"bkpay",   label:"Môi trường demo" },
  ]

  const inputStyle: React.CSSProperties = {
    width:"100%", border:"1px solid #e2e8f0", borderRadius:10,
    padding:"10px 14px", fontSize:14, fontFamily:"'Inter',sans-serif",
    background:"#F8FAFC", outline:"none", boxSizing:"border-box",
  }

  return (
    <OperatorLayout user={user} activePage="Cấu hình" backHref="/dashboard/operator" title="Cấu hình hệ thống">
      <div style={{ maxWidth:560 }}>

        {/* Tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:24, background:"#e2e8f0", borderRadius:12, padding:4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, padding:"9px 0", border:"none", borderRadius:10,
              background:tab===t.id?"#003289":"transparent",
              color:tab===t.id?"white":"#555",
              fontSize:13, fontWeight:600, cursor:"pointer",
              fontFamily:"'Inter',sans-serif", transition:"all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Biểu giá */}
        {tab === "pricing" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <p style={{ fontSize:12, color:"#868686" }}>Thay đổi sẽ áp dụng ngay cho các lần tính phí tiếp theo.</p>
            {[
              { key:"student",  label:"Sinh viên / HV / NCS", unit:"VNĐ/lượt" },
              { key:"lecturer", label:"Giảng viên",            unit:"VNĐ/lượt" },
              { key:"staff",    label:"Cán bộ - Nhân viên",    unit:"VNĐ/lượt" },
              { key:"visitor",  label:"Khách vãng lai",         unit:"VNĐ/lượt" },
            ].map(({ key, label, unit }) => (
              <div key={key}>
                <p style={{ fontSize:12, color:"#555", marginBottom:6 }}>
                  {label} <span style={{ color:"#aaa" }}>({unit})</span>
                </p>
                <input type="number" min="0" step="1000" value={pricing[key]}
                  onChange={e => setPricing((p:any) => ({ ...p, [key]: Number(e.target.value) }))}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor="#003289")}
                  onBlur={e  => (e.target.style.borderColor="#e2e8f0")}
                />
              </div>
            ))}
          </div>
        )}

        {/* Bãi xe */}
        {tab === "parking" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <p style={{ fontSize:12, color:"#868686" }}>Ngưỡng gần đầy ảnh hưởng đến màu hiển thị trên bản đồ bãi xe.</p>
            <div>
              <p style={{ fontSize:12, color:"#555", marginBottom:6 }}>Ngưỡng "Gần đầy" (%)</p>
              <input type="number" min="50" max="99" value={parking.nearFullThreshold}
                onChange={e => setParking((p:any) => ({ ...p, nearFullThreshold: Number(e.target.value) }))}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor="#003289")}
                onBlur={e  => (e.target.style.borderColor="#e2e8f0")}
              />
              <p style={{ fontSize:11, color:"#aaa", marginTop:4 }}>Khi tỉ lệ lấp đầy ≥ ngưỡng này → hiển thị "Gần đầy"</p>
            </div>
          </div>
        )}

        {/* BKPay */}
        {tab === "bkpay" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <p style={{ fontSize:12, color:"#868686" }}>Dùng khi demo để kiểm tra luồng thành công và thất bại.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {([
                { id:"success", label:"Luôn thành công", sub:"Mọi giao dịch đều SUCCESS" },
                { id:"failure", label:"Luôn thất bại",   sub:"Dùng để demo luồng ngoại lệ" },
                { id:"random",  label:"Ngẫu nhiên",      sub:"70% thành công, 30% thất bại" },
              ] as const).map(mode => (
                <button key={mode.id} onClick={() => setBkpay((b:any) => ({ ...b, simulateMode:mode.id }))} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"12px 16px", borderRadius:12,
                  border:`1px solid ${bkpay.simulateMode===mode.id?"#185FA5":"#e2e8f0"}`,
                  background:bkpay.simulateMode===mode.id?"#EFF6FF":"white",
                  cursor:"pointer", fontFamily:"'Inter',sans-serif", textAlign:"left",
                  transition:"all 0.15s",
                }}>
                  <div>
                    <p style={{ fontSize:14, fontWeight:600, color:bkpay.simulateMode===mode.id?"#185FA5":"#374151" }}>{mode.label}</p>
                    <p style={{ fontSize:12, color:"#868686", marginTop:2 }}>{mode.sub}</p>
                  </div>
                  {bkpay.simulateMode===mode.id && (
                    <span style={{ fontSize:11, background:"#185FA5", color:"white", padding:"3px 10px", borderRadius:20 }}>Đang dùng</span>
                  )}
                </button>
              ))}
            </div>
            <div>
              <p style={{ fontSize:12, color:"#555", marginBottom:6 }}>Delay phản hồi (ms)</p>
              <input type="number" min="0" max="5000" step="500" value={bkpay.delayMs}
                onChange={e => setBkpay((b:any) => ({ ...b, delayMs: Number(e.target.value) }))}
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor="#003289")}
                onBlur={e  => (e.target.style.borderColor="#e2e8f0")}
              />
              <p style={{ fontSize:11, color:"#aaa", marginTop:4 }}>0 = không delay · 1500 = mặc định · 3000 = demo timeout</p>
            </div>
          </div>
        )}

        <button onClick={handleSave} style={{
          width:"100%", height:46, marginTop:24,
          background:"#003289", color:"white", border:"none",
          borderRadius:12, fontSize:15, fontWeight:600,
          cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"opacity 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity="0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity="1")}>
          {saved || "Lưu cấu hình"}
        </button>
      </div>
    </OperatorLayout>
  )
}