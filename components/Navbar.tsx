"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, logout } from "@/lib/auth"

export default function Navbar({ title = "IoT-SPMS" }: { title?: string }) {
  const router = useRouter()
  const [initials, setInitials] = useState("")

  useEffect(() => {
    const u = getCurrentUser()
    if (u) {
      setInitials(u.name.split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase())
    }
  }, [])

  function handleLogout() {
    logout()
    router.push("/login")
  }

  return (
    <nav className="bg-[#185FA5] px-4 py-3 flex items-center justify-between">
      <span className="text-[#E6F1FB] font-medium text-sm">{title}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={handleLogout}
          className="text-[#B5D4F4] hover:text-white text-xs transition-colors">
          Đăng xuất
        </button>
        <div className="w-7 h-7 rounded-full bg-[#B5D4F4] flex items-center
                        justify-center text-[#0C447C] text-xs font-medium">
          {initials}
        </div>
      </div>
    </nav>
  )
}