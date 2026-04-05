"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { reviews } from "@/data/mock"
import Navbar from "@/components/Navbar"

export default function ReviewPage() {
  const router   = useRouter()
  const [stars,  setStars]   = useState(0)
  const [comment,setComment] = useState("")
  const [done,   setDone]    = useState(false)
  const [error,  setError]   = useState("")

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) router.push("/login")
  }, [])

  function handleSubmit() {
    if (stars === 0) { setError("Vui lòng chọn số sao"); return }
    const u = getCurrentUser()
    reviews.push({
      id:        "RV" + Date.now().toString().slice(-6),
      userId:    u?.id ?? null,
      stars,
      comment,
      createdAt: new Date().toISOString(),
    })
    setDone(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200
                        shadow-sm">
          <Navbar />
          <div className="bg-white p-5">

            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-xs text-gray-400
                         mb-4 hover:text-gray-600"
            >
              ← Quay lại
            </button>

            {!done ? (
              <>
                <p className="font-medium text-gray-900 mb-1">Đánh giá hệ thống</p>
                <p className="text-xs text-gray-400 mb-5">
                  Phản hồi của bạn giúp cải thiện dịch vụ
                </p>

                {/* Stars */}
                <p className="text-xs text-gray-500 mb-2">Đánh giá của bạn</p>
                <div className="flex gap-2 mb-5">
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      onClick={() => setStars(s)}
                      className={`text-3xl transition-transform hover:scale-110
                        ${s <= stars ? "opacity-100" : "opacity-20"}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>

                {/* Comment */}
                <p className="text-xs text-gray-500 mb-2">
                  Nhận xét (tùy chọn)
                </p>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3
                             py-2.5 text-sm bg-gray-50 resize-none h-24
                             focus:outline-none focus:border-[#185FA5] mb-5"
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />

                {error && (
                  <p className="text-red-500 text-xs mb-4 bg-red-50
                                px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  className="w-full bg-[#185FA5] hover:bg-[#0C447C]
                             text-[#E6F1FB] font-medium py-3 rounded-xl
                             text-sm transition-colors"
                >
                  Gửi đánh giá
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🙏</div>
                <p className="font-medium text-gray-900 mb-1">
                  Cảm ơn bạn đã đóng góp ý kiến!
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Đánh giá của bạn đã được ghi nhận
                </p>
                <button
                  onClick={() => router.back()}
                  className="w-full bg-[#185FA5] text-[#E6F1FB] font-medium
                             py-2.5 rounded-xl text-sm hover:bg-[#0C447C]
                             transition-colors"
                >
                  Quay lại
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}