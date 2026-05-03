"use client"
import { useEffect, useRef } from "react"
import QRCode from "qrcode"

export default function UserQRCode({ userId }: { userId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, userId, {
      width:  160,
      margin: 2,
      color: { dark: "#185FA5", light: "#FFFFFF" },
    })
  }, [userId])

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="rounded-xl"/>
      <p className="text-xs text-gray-400 mt-2">Mã QR vào/ra bãi xe</p>
    </div>
  )
}