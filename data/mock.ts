// ── Types ──
export type Role = "student" | "lecturer" | "staff" | "operator" | "admin"

export type User = {
  id: string
  name: string
  role: Role
  password: string
}

export type ParkingSlot = {
  id: string
  zone: string
  status: "available" | "occupied" | "error"
  userId: string | null
}

export type Invoice = {
  id: string
  userId: string
  amount: number
  status: "pending" | "paid"
  period: string
  createdAt: string
}

export type Ticket = {
  id: string
  licensePlate: string
  entryTime: string
  exitTime: string | null
  status: "active" | "closed"
  fee: number | null
}

export type Review = {
  id: string
  userId: string | null   // null nếu là khách vãng lai
  stars: number
  comment: string
  createdAt: string
}

export type ParkingSession = {
  id:        string
  userId:    string
  subZoneId: string        // "B1", "C2"...
  entryTime: string
  exitTime:  string | null
  status:    "active" | "closed"
  fee:       number | null  // null khi còn active, tính khi đóng session
}

export type BKPayMode = "success" | "failure" | "random"

// ── Users ──
export const users: User[] = [
  { id: "SV001", name: "Nguyễn Văn An",     role: "student",  password: "123" },
  { id: "SV002", name: "Trần Thị Bình",     role: "student",  password: "123" },
  { id: "GV001", name: "TS. Lê Văn Cường",  role: "lecturer", password: "123" },
  { id: "CB001", name: "Phạm Thị Dung",     role: "staff",    password: "123" },
  { id: "NV001", name: "Hoàng Văn Em",      role: "operator", password: "123" },
  { id: "QTV01", name: "Admin",             role: "admin",    password: "admin" },
]

// ── Parking Slots ──
export const parkingSlots: ParkingSlot[] = [
  { id: "A01", zone: "A", status: "available", userId: null },
  { id: "A02", zone: "A", status: "occupied",  userId: "SV001" },
  { id: "A03", zone: "A", status: "available", userId: null },
  { id: "A04", zone: "A", status: "available", userId: null },
  { id: "A05", zone: "A", status: "available", userId: null },
  { id: "B01", zone: "B", status: "available", userId: null },
  { id: "B02", zone: "B", status: "error",     userId: null },
  { id: "B03", zone: "B", status: "occupied",  userId: "GV001" },
  { id: "B04", zone: "B", status: "available", userId: null },
  { id: "B05", zone: "B", status: "available", userId: null },
  { id: "C01", zone: "C", status: "available", userId: null },
  { id: "C02", zone: "C", status: "available", userId: null },
  { id: "C03", zone: "C", status: "occupied",  userId: "NV001" },
]

// ── Invoices ──
export const invoices: Invoice[] = [
  { id: "INV001", userId: "SV001", amount: 50000,
    status: "pending", period: "2025-04", createdAt: "2025-04-30" },
  { id: "INV002", userId: "SV001", amount: 35000,
    status: "paid",    period: "2025-03", createdAt: "2025-03-31" },
  { id: "INV003", userId: "SV002", amount: 60000,
    status: "pending", period: "2025-04", createdAt: "2025-04-30" },
  { id: "INV004", userId: "GV001", amount: 0,
    status: "paid",    period: "2025-04", createdAt: "2025-04-30" },
]

// ── Tickets (khách vãng lai) ──
export const tickets: Ticket[] = [
  { id: "TK001", licensePlate: "51A-12345",
    entryTime:  "2025-04-30T08:00:00",
    exitTime:   null,
    status: "active", fee: null },
  { id: "TK002", licensePlate: "59B-67890",
    entryTime:  "2025-04-29T14:00:00",
    exitTime:   "2025-04-29T16:30:00",
    status: "closed", fee: 15000 },
]

// ── Reviews ──
export const reviews: Review[] = [
  { id: "RV001", userId: "SV001", stars: 5,
    comment: "Hệ thống tiện lợi, dễ dùng.",
    createdAt: "2025-04-28T10:00:00" },
  { id: "RV002", userId: null, stars: 3,
    comment: "Máy in vé hơi chậm.",
    createdAt: "2025-04-29T15:30:00" },
]

// ── Pricing Policy ──
export const pricingPolicy = {
  student:  50000,   // VNĐ/tháng
  lecturer: 0,       // miễn phí
  staff:    30000,   // VNĐ/tháng
  visitor:  5000,    // VNĐ/giờ
}

export const parkingSessions: ParkingSession[] = []

export const systemSettings = {
  pricing: {
    student:  2000,   // VNĐ/lượt
    lecturer: 0,      // miễn phí (cấu hình được)
    staff:    0,      // miễn phí (cấu hình được)
    visitor:  5000,   // VNĐ/lượt — thu ngay khi ra
  },
  billing: {
    cycleDays: 30,    // chu kỳ tính hóa đơn (ngày)
    dueDays:   7,
  },
  parking: {
    nearFullThreshold: 80,  // % → "Gần đầy"
  },
  bkpay: {
    simulateMode: "success" as BKPayMode,
    delayMs: 1500,
  },
}

export type SubZone = {
  id:       string    // "A1", "B2", "C3"...
  zone:     "A" | "B" | "C" | "D"
  forRole:  "staff_lecturer" | "student_visitor"
  capacity: number    // tổng số slot
  occupied: number    // số slot đang có xe
}

export const subZones: SubZone[] = [
  // Khu A — GV/CB
  { id: "A1", zone: "A", forRole: "staff_lecturer", capacity: 100, occupied: 12 },
  { id: "A2", zone: "A", forRole: "staff_lecturer", capacity: 100, occupied: 8  },
  { id: "A3", zone: "A", forRole: "staff_lecturer", capacity: 100, occupied: 5  },
  // Khu B — SV/Khách
  { id: "B1", zone: "B", forRole: "student_visitor", capacity: 100, occupied: 45 },
  { id: "B2", zone: "B", forRole: "student_visitor", capacity: 100, occupied: 78 },
  { id: "B3", zone: "B", forRole: "student_visitor", capacity: 100, occupied: 90 },
  // Khu C — SV/Khách
  { id: "C1", zone: "C", forRole: "student_visitor", capacity: 100, occupied: 30 },
  { id: "C2", zone: "C", forRole: "student_visitor", capacity: 100, occupied: 55 },
  { id: "C3", zone: "C", forRole: "student_visitor", capacity: 100, occupied: 20 },
  // Khu D — SV/Khách
  { id: "D1", zone: "D", forRole: "student_visitor", capacity: 100, occupied: 60 },
  { id: "D2", zone: "D", forRole: "student_visitor", capacity: 100, occupied: 40 },
  { id: "D3", zone: "D", forRole: "student_visitor", capacity: 100, occupied: 15 },
]
