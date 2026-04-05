# IoT-SPMS — Smart Parking Management System

Hệ thống Quản lý Bãi đỗ xe Thông minh cho khuôn viên HCMUT. 
---

## Công nghệ sử dụng

- **Next.js 15** (App Router) — Framework frontend + backend
- **TypeScript** — Ngôn ngữ lập trình
- **Tailwind CSS** — Styling
- **Node.js 20** — Môi trường chạy

Toàn bộ dữ liệu được hard-code trong `data/mock.ts`.  
Các hệ thống ngoài (SSO, BKPay, IoT) được mock/stub — không tích hợp thật.

---

## Yêu cầu trước khi bắt đầu

| Công cụ | Phiên bản | Kiểm tra |
|---------|-----------|----------|
| Node.js | >= 20     | `node -v` |
| npm     | >= 10     | `npm -v`  |
| Git     | bất kỳ   | `git --version` |

Khuyến nghị dùng **WSL (Ubuntu)** trên Windows hoặc macOS/Linux.

---

## Cài đặt môi trường (làm 1 lần)

### Bước 1 — Cài nvm + Node.js (nếu chưa có)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Đóng terminal, mở lại, rồi:

```bash
nvm install 20
nvm use 20
node -v   # phải thấy v20.x.x
```

### Bước 2 — Clone repository

```bash
git clone https://github.com/scarlett910/iot-spms.git
cd iot-spms
```

### Bước 3 — Dùng đúng version Node

```bash
nvm use   # tự đọc file .nvmrc, dùng Node 20
```

### Bước 4 — Cài dependencies

```bash
npm install
```

### Bước 5 — Chạy project

```bash
npm run dev
```

Mở trình duyệt vào `http://localhost:3000`.

---

## Tài khoản demo

| Mã số   | Mật khẩu | Vai trò          | Trang sau đăng nhập       |
|---------|----------|------------------|---------------------------|
| SV001   | 123      | Sinh viên        | /dashboard/student        |
| SV002   | 123      | Sinh viên        | /dashboard/student        |
| GV001   | 123      | Giảng viên       | /dashboard/student        |
| CB001   | 123      | Cán bộ           | /dashboard/student        |
| NV001   | 123      | Nhân viên vận hành | /dashboard/operator     |
| QTV01   | admin    | Quản trị viên    | /dashboard/operator       |

---

## Cấu trúc thư mục

```
iot-spms/
│
├── app/                        # Tất cả các trang (Next.js App Router)
│   ├── login/
│   │   └── page.tsx            # Trang đăng nhập
│   ├── dashboard/
│   │   ├── student/page.tsx    # Dashboard sinh viên/GV/CB
│   │   └── operator/page.tsx   # Dashboard nhân viên vận hành/QTV
│   ├── invoice/
│   │   ├── page.tsx            # Danh sách hóa đơn (UC03)
│   │   └── [id]/page.tsx       # Chi tiết + thanh toán 3 bước (UC03)
│   ├── history/
│   │   └── page.tsx            # Lịch sử thanh toán (UC05)
│   ├── ticket/
│   │   ├── new/page.tsx        # Phát vé tạm thời (UC04)
│   │   ├── checkout/page.tsx   # Thu phí khi ra (UC04)
│   │   └── list/page.tsx       # Danh sách vé (UC04)
│   ├── parking/
│   │   └── page.tsx            # Bản đồ bãi xe realtime (UC07+08)
│   ├── report/
│   │   └── page.tsx            # Báo cáo tổng hợp (UC10)
│   ├── review/
│   │   └── page.tsx            # Đánh giá hệ thống (UC09)
│   ├── layout.tsx              # Layout chung toàn app
│   ├── page.tsx                # Redirect về /login
│   └── globals.css             # CSS toàn cục (Tailwind)
│
├── components/
│   └── Navbar.tsx              # Thanh điều hướng dùng chung
│
├── data/
│   └── mock.ts                 # Toàn bộ dữ liệu hard-code
│
├── lib/
│   └── auth.ts                 # Helper: getCurrentUser(), logout()
│
├── .nvmrc                      # Phiên bản Node (20)
├── tailwind.config.ts          # Cấu hình màu Tailwind
├── next.config.ts              # Cấu hình Next.js
└── tsconfig.json               # Cấu hình TypeScript
```

---

## Danh sách trang & Use-case

| Trang | Use-case | Ai dùng | Mô tả |
|-------|----------|---------|-------|
| `/login` | — | Tất cả | Đăng nhập, routing theo role |
| `/dashboard/student` | UC06 | SV, GV, CB | Dashboard, menu chức năng |
| `/dashboard/operator` | UC06 | NV, QTV | Dashboard vận hành |
| `/invoice` | UC03 | SV, GV, CB | Danh sách hóa đơn |
| `/invoice/[id]` | UC03 | SV, GV, CB | Chi tiết + mock thanh toán BKPay |
| `/history` | UC05 | SV, GV, CB | Lịch sử, lọc theo ngày |
| `/ticket/new` | UC04 | NV, QTV | Phát vé khách vãng lai |
| `/ticket/checkout` | UC04 | NV, QTV | Thu phí khi ra |
| `/ticket/list` | UC04 | NV, QTV | Danh sách vé active/closed |
| `/parking` | UC07, UC08 | Tất cả | Bản đồ chỗ trống, filter |
| `/report` | UC10 | QTV | Báo cáo 4 loại, mock xuất PDF |
| `/review` | UC09 | Tất cả | Đánh giá 5 sao + nhận xét |

---

## Dữ liệu mock (`data/mock.ts`)

Đây là file quan trọng nhất — **không tự ý đổi cấu trúc** nếu chưa thông báo cả nhóm.

### Các kiểu dữ liệu

```typescript
type Role = "student" | "lecturer" | "staff" | "operator" | "admin"

type User = {
  id: string        // VD: "SV001"
  name: string
  role: Role
  password: string
}

type ParkingSlot = {
  id: string        // VD: "A01"
  zone: string      // "A" | "B" | "C"
  status: "available" | "occupied" | "error"
}

type Invoice = {
  id: string        // VD: "INV001"
  userId: string
  amount: number    // VNĐ
  status: "pending" | "paid"
  period: string    // VD: "2025-04"
  createdAt: string // VD: "2025-04-30"
}

type Ticket = {
  id: string
  licensePlate: string
  entryTime: string   // ISO string
  exitTime: string | null
  status: "active" | "closed"
  fee: number | null
}

type Review = {
  id: string
  userId: string | null  // null nếu là khách vãng lai
  stars: number          // 1-5
  comment: string
  createdAt: string
}
```

### Biểu giá

```typescript
const pricingPolicy = {
  student:  50000,  // VNĐ/tháng
  lecturer: 0,      // miễn phí
  staff:    30000,  // VNĐ/tháng
  visitor:  5000,   // VNĐ/giờ
}
```

---

## Auth (`lib/auth.ts`)

```typescript
// Lấy user đang đăng nhập
getCurrentUser(): User | null

// Đăng xuất, redirect về /login
logout(): void
```

User được lưu trong `sessionStorage` với key `"currentUser"`.  
Mỗi trang cần bảo vệ phải gọi `getCurrentUser()` trong `useEffect` và redirect nếu không có user.

**Ví dụ dùng trong trang:**

```tsx
useEffect(() => {
  const u = getCurrentUser()
  if (!u) { router.push("/login"); return }
  // Kiểm tra role nếu cần
  if (!["operator","admin"].includes(u.role)) {
    router.push("/login"); return
  }
  setUser(u)
}, [])
```

---

## Navbar (`components/Navbar.tsx`)

Dùng chung cho tất cả trang. Tự động lấy tên user và viết tắt avatar.

```tsx
// Mặc định
<Navbar />

// Tuỳ chỉnh tiêu đề
<Navbar title="IoT-SPMS · Vận hành" />
```

---

## Quy trình làm việc với Git

### Setup LẦN ĐẦU (đã có repository)

```bash
git clone https://github.com/ten-nhom/iot-spms.git
cd iot-spms
nvm use
npm install
npm run dev
```

### Làm việc hàng ngày

```bash
# 1. Luôn pull code mới nhất trước khi bắt đầu
git pull origin main

# 2. Tạo branch riêng cho tính năng đang làm
git checkout -b feature/ten-tinh-nang

# 3. Làm việc, sau đó commit
git add .
git commit -m "feat: mô tả ngắn thay đổi"

# 4. Push branch lên GitHub
git push origin feature/ten-tinh-nang

# 5. Tạo Pull Request trên GitHub để merge vào main
```

### Quy ước đặt tên commit

```
feat: thêm tính năng mới
fix: sửa lỗi
style: chỉnh UI, không đổi logic
refactor: tái cấu trúc code
docs: cập nhật tài liệu
```

### Xử lý conflict

```bash
# Khi pull bị conflict
git pull origin main

# Mở file bị conflict, sửa tay phần <<< HEAD ... >>> MERGE
# Sau khi sửa xong:
git add .
git commit -m "fix: resolve conflict"
```

---

## Phân công nhóm

| Thành viên | UC phụ trách | Trang |
|------------|-------------|-------|


---
