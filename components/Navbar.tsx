"use client"
import { logout, getCurrentUser } from "@/lib/auth"

export default function Navbar({ title = "IoT-SPMS" }: { title?: string }) {
  const user = getCurrentUser()
  const initials = user?.name.split(" ").slice(-2)
    .map(w => w[0]).join("").toUpperCase() ?? "?"

  return (
    <nav className="bg-[#185FA5] px-5 py-3 flex justify-between items-center
                    rounded-t-2xl">
      <span className="text-[#E6F1FB] font-medium text-sm">{title}</span>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#B5D4F4] flex items-center
                        justify-center text-[#0C447C] text-xs font-medium">
          {initials}
        </div>
        <span className="text-[#B5D4F4] text-xs hidden sm:block">
          {user?.name}
        </span>
        <button
          onClick={logout}
          className="text-[#B5D4F4] text-xs border border-[#378ADD]/40
                     rounded-md px-2 py-0.5 hover:bg-[#0C447C] transition-colors"
        >
          Thoát
        </button>
      </div>
    </nav>
  )
}