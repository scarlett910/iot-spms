"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { users } from "@/data/mock"

export default function LoginPage() {
  const router = useRouter()
  const [id, setId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function handleLogin() {
    const user = users.find(u => u.id === id && u.password === password)
    if (!user) { setError("Sai tài khoản hoặc mật khẩu"); return }
    sessionStorage.setItem("currentUser", JSON.stringify(user))
    if (user.role === "admin" || user.role === "operator")
      router.push("/dashboard/operator")
    else
      router.push("/dashboard/student")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#185FA5] flex items-center
                          justify-center mb-3">
            <span className="text-[#E6F1FB] font-medium text-sm">SPMS</span>
          </div>
          <h1 className="text-xl font-medium text-gray-900">IoT-SPMS</h1>
          <p className="text-sm text-gray-400 mt-1">
            Hệ thống quản lý bãi đỗ xe HCMUT
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">Mã số</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                         text-sm focus:outline-none focus:border-[#185FA5]
                         bg-gray-50"
              placeholder="VD: SV001"
              value={id}
              onChange={e => setId(e.target.value)}
            />
          </div>
          <div className="mb-5">
            <label className="text-xs text-gray-500 mb-1 block">Mật khẩu</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5
                         text-sm focus:outline-none focus:border-[#185FA5]
                         bg-gray-50"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-lg
                          px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-[#185FA5] hover:bg-[#0C447C] text-[#E6F1FB]
                       font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Đăng nhập
          </button>
        </div>

        {/* Demo hint */}
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Tài khoản demo
          </p>
          {[
            ["SV001 / 123", "Sinh viên"],
            ["GV001 / 123", "Giảng viên"],
            ["NV001 / 123", "Nhân viên vận hành"],
            ["QTV01 / admin", "Quản trị viên"],
          ].map(([acc, role]) => (
            <div key={acc} className="flex justify-between py-1">
              <span className="text-xs font-mono text-gray-500">{acc}</span>
              <span className="text-xs text-gray-400">{role}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}