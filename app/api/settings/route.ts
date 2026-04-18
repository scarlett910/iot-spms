import { getSettings, updateSettings } from "@/lib/store"

export async function GET() {
  return Response.json({ settings: getSettings() })
}

export async function PATCH(req: Request) {
  const patch = await req.json()
  updateSettings(patch)
  return Response.json({ success: true, settings: getSettings() })
}