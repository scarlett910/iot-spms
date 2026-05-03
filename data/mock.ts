// data/mock.ts

// ── Types ──────────────────────────────────────────────
export type Role = "student" | "lecturer" | "staff" | "operator" | "admin"

export type User = {
  id:       string
  name:     string
  role:     Role
  password: string
}

export type SubZone = {
  id:       string
  zone:     "A" | "B" | "C" | "D"
  forRole:  "staff_lecturer" | "student_visitor"
  capacity: number
  occupied: number
}

export type ParkingSession = {
  id:        string
  userId:    string
  subZoneId: string
  entryTime: string
  exitTime:  string | null
  status:    "active" | "closed"
  fee:       number | null
}

export type Invoice = {
  id:        string
  userId:    string
  amount:    number
  status:    "pending" | "paid"
  period:    string    // "2025-04"
  createdAt: string
}

export type Ticket = {
  id:           string
  licensePlate: string
  guestName:    string | null
  subZoneId:    string
  entryTime:    string
  exitTime:     string | null
  status:       "active" | "closed"
  fee:          number | null
}

export type Review = {
  id:        string
  userId:    string | null
  stars:     number
  comment:   string
  createdAt: string
}

export type BKPayMode = "success" | "failure" | "random"

// ── Users ───────────────────────────────────────────────
export const users: User[] = [
  { id: "SV001", name: "Nguyễn Văn An",    role: "student",  password: "123"   },
  { id: "SV002", name: "Trần Thị Bình",    role: "student",  password: "123"   },
  { id: "GV001", name: "TS. Lê Văn Cường", role: "lecturer", password: "123"   },
  { id: "CB001", name: "Phạm Thị Dung",    role: "staff",    password: "123"   },
  { id: "NV001", name: "Hoàng Văn Em",     role: "operator", password: "123"   },
  { id: "QTV01", name: "Admin",            role: "admin",    password: "admin" },
]

// ── SubZones ────────────────────────────────────────────
// Khu A: GV/CB — Khu B,C,D: SV/Khách
export const subZones: SubZone[] = [
  { id: "A1", zone: "A", forRole: "staff_lecturer",  capacity: 100, occupied: 12 },
  { id: "A2", zone: "A", forRole: "staff_lecturer",  capacity: 100, occupied: 8  },
  { id: "A3", zone: "A", forRole: "staff_lecturer",  capacity: 100, occupied: 5  },
  { id: "B1", zone: "B", forRole: "student_visitor", capacity: 100, occupied: 45 },
  { id: "B2", zone: "B", forRole: "student_visitor", capacity: 100, occupied: 78 },
  { id: "B3", zone: "B", forRole: "student_visitor", capacity: 100, occupied: 90 },
  { id: "C1", zone: "C", forRole: "student_visitor", capacity: 100, occupied: 30 },
  { id: "C2", zone: "C", forRole: "student_visitor", capacity: 100, occupied: 55 },
  { id: "C3", zone: "C", forRole: "student_visitor", capacity: 100, occupied: 20 },
  { id: "D1", zone: "D", forRole: "student_visitor", capacity: 100, occupied: 60 },
  { id: "D2", zone: "D", forRole: "student_visitor", capacity: 100, occupied: 40 },
  { id: "D3", zone: "D", forRole: "student_visitor", capacity: 100, occupied: 15 },
]

// ── Invoices ────────────────────────────────────────────
export const invoices: Invoice[] = [
  { id: "INV001", userId: "SV001", amount: 50000,
    status: "pending", period: "2025-04", createdAt: "2025-04-30" },
  { id: "INV002", userId: "SV001", amount: 40000,
    status: "paid",    period: "2025-03", createdAt: "2025-03-31" },
  { id: "INV003", userId: "SV002", amount: 60000,
    status: "pending", period: "2025-04", createdAt: "2025-04-30" },
  { id: "INV004", userId: "GV001", amount: 0,
    status: "paid",    period: "2025-04", createdAt: "2025-04-30" },
]

// ── Tickets ─────────────────────────────────────────────
export const tickets: Ticket[] = [
  { id: "TK001", licensePlate: "51A-12345", guestName: null,
    subZoneId: "B1",
    entryTime: "2025-04-30T08:00:00", exitTime: null,
    status: "active", fee: null },
  { id: "TK002", licensePlate: "59B-67890", guestName: "Nguyễn Văn X",
    subZoneId: "B2",
    entryTime: "2025-04-29T14:00:00", exitTime: "2025-04-29T16:30:00",
    status: "closed", fee: 5000 },
]

// ── Reviews ─────────────────────────────────────────────
export const reviews: Review[] = [
  { id: "RV001", userId: "SV001", stars: 5,
    comment: "Hệ thống tiện lợi, dễ dùng.",
    createdAt: "2025-04-28T10:00:00" },
  { id: "RV002", userId: null, stars: 3,
    comment: "Máy in vé hơi chậm.",
    createdAt: "2025-04-29T15:30:00" },
]

// ── ParkingSessions ─────────────────────────────────────
// Pre-populate để khớp với subZones occupied trên
export const parkingSessions: ParkingSession[] = [
  { id: "PS001", userId: "SV001", subZoneId: "B1",
    entryTime: "2025-04-30T07:45:00", exitTime: null,
    status: "active", fee: null },
  { id: "PS002", userId: "GV001", subZoneId: "A1",
    entryTime: "2025-04-30T08:10:00", exitTime: null,
    status: "active", fee: null },
]

// ── System Settings ─────────────────────────────────────
export const systemSettings = {
  pricing: {
    student:  2000,   // VNĐ/lượt
    lecturer: 0,
    staff:    0,
    visitor:  5000,   // VNĐ/lượt — thu ngay khi ra
  },
  billing: {
    cycleDays: 30,
    dueDays:   7,
  },
  parking: {
    nearFullThreshold: 80,
  },
  bkpay: {
    simulateMode: "success" as BKPayMode,
    delayMs: 1500,
  },
}