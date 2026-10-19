# HƯỚNG DẪN KIẾN TRÚC & UI/UX FRONTEND (`frontend.md`)
> **Dự án:** Cổng Thông Tin & Quản Lý Ban Học Thuật - CLB Tin Học VNUF2  
> **Kiến trúc:** Headless SPA (Single Page Application) sử dụng ES6 Modules thuần (Vanilla JS), không dùng thư viện nặng, chống Spaghetti Code, bảo mật XSS và tối ưu hiệu năng vượt trội.

---

## 1. Cấu Trúc Thư Mục Frontend

```text
frontend/
├── index.html                  # Shell chính của Web App (Head, CDN, Loading Overlay, Toast, Dev Banner)
├── app.js                      # Điểm khởi động (Entry Point), Router Hash, Central Event Delegation (data-action)
├── assets/                     # Tài nguyên tĩnh thương hiệu
│   └── images/                 # Logo CLB (logo-clb.png), Favicon (favicon.ico)
├── css/
│   └── styles.css              # Design Tokens (CSS Variables Light/Dark), bộ class chuẩn .bht-*
├── views/                      # Các phân hệ giao diện HTML (được nạp động qua viewLoader.js)
│   ├── auth.html               # Màn hình đăng nhập OTP (Giai đoạn 1: MSSV, Giai đoạn 2: Mã 6 số)
│   ├── member.html             # Cổng thành viên (Thẻ chuyên đề, Sub-view chi tiết, Điểm danh, Nộp bài)
│   └── admin.html              # Cổng quản trị (Duyệt bài, Quản lý buổi học Master-Detail, PIN, Nhân sự)
├── modules/                    # Logic điều phối giao diện (Controllers & Reactive State)
│   ├── store.js                # Quản lý State phản ứng tập trung (Pub/Sub + ES6 Proxy), thông báo UI tự động
│   ├── templates.js            # Tách biệt toàn bộ HTML Template Literals khỏi logic API, lọc chống XSS, taxonomy tags
│   ├── ui.js                   # Điều phối giao diện, Theme Sáng/Tối, Toast, Loading overlay
│   ├── auth.js                 # Xử lý xác thực OTP, đếm ngược 300s, Quản lý Token & Dọn sạch cache khi đăng xuất
│   ├── member.js               # Render Dashboard thành viên, Dòng thời gian buổi học, Sub-view chi tiết, Kho tài liệu
│   ├── admin.js                # Render Dashboard admin, Quản lý buổi học, Sub-view chi tiết, Chấm bài, Quản lý tài liệu
│   ├── skeleton.js             # Động cơ Skeleton Shimmer nạp mượt mà, chống giật layout (Anti-FOUC)
│   ├── pagination.js           # Bộ quản lý phân trang độc lập đa thực thể (Multi-instance pagination)
│   └── projector.js            # Chế độ máy chiếu PIN toàn màn hình (Chiếu hội trường)
├── utils/                      # Tiện ích bổ trợ dùng chung
│   └── dom.js                  # Hàm escapeHTML chống XSS, Event Delegation tập trung, Auto Button Lock, Drag Scroll
└── services/                   # Tầng giao tiếp dữ liệu & Dịch vụ ngầm
    ├── api.js                  # Lớp gọi API tập trung: Token-Based, Auto-Retry + Jitter, Deduplication, Cache SWR
    ├── mockData.js             # Dữ liệu giả lập chạy ngầm (Local Dev Mock Mode) hỗ trợ token giả lập
    └── viewLoader.js           # Bộ nạp view HTML bất đồng bộ từ thư mục views/
```

---

## 2. Triết Lý Thiết Kế UI/UX (Editorial Academic Studio)

- **Phong cách:** Học thuật, trang nhã (lấy cảm hứng từ Notion, Stripe Docs, Read.cv).
- **Màu sắc chủ đạo:**
  - Nền Sáng / Tối: Canvas dịu mắt (`--bg-canvas`), Surface sạch sẽ (`--bg-surface`).
  - Màu nhấn thương hiệu: **Xanh Cổ Vịt Học Thuật (`Academic Deep Teal`)** (`--accent-base: #0F6256`).
  - Đường nét: Phân tách bằng **viền siêu mảnh 1px (`Hairline Border`)**, bo góc gọn (`8px` – `12px`).
- **Hệ thống Font chữ 3 tầng:**
  - **Tiêu đề học thuật:** `Newsreader` (Editorial Serif) tạo vẻ chuyên nghiệp.
  - **Nội dung & Menu:** `Plus Jakarta Sans` / `Inter` dễ đọc, hiện đại.
  - **Mã số kỹ thuật:** `JetBrains Mono` đồng bộ cho `MSSV`, `SessionID`, `TaskID`, `MaPin`, `Deadline`.
- **Cơ chế chống chớp mắt (Anti-FOUC):** Script tự thực thi trong `<head>` của `index.html` đọc ngay theme từ `localStorage` để render đúng giao diện ngay từ mili-giây đầu tiên.

---

## 3. Kiến Trúc Màn Hình & Trải Nghiệm Master-Detail

Thay vì dùng popup modal chật chội khiến giao diện bị phình to (bloat), ứng dụng áp dụng mô hình **Master-Detail chuyên biệt**:

### 3.1. Phía Quản Trị Viên (Admin Portal)
1. **Màn hình Master (Danh sách buổi sinh hoạt):**
   - Hiển thị dạng lưới thẻ (Grid Cards) tóm tắt: Mã buổi học, Tên chuyên đề, Ngày giờ, Trạng thái PIN, Số SV có mặt, Trạng thái bài tập.
   - Nút **"Tạo buổi sinh hoạt"**: Mở form tinh gọn (nhập Tên, Ngày, Link Slide, Tóm tắt; mã PIN được sinh ngẫu nhiên tự động).
2. **Màn hình Sub-view Chi tiết Buổi học (`admin-tab-session-detail`):**
   - Chuyển thành trang toàn màn hình với thanh **Breadcrumb** ("Quay lại danh sách") và nút **"Xem PIN & Chiếu"**.
   - **4 Sub-tabs chuyên dụng:**
     - `Nội dung & Slide`: Nhập link Google Drive slide, ghi chú mục tiêu kiến thức.
     - `Danh sách Điểm danh`: Hiển thị PIN hiện tại, nút đổi PIN, bảng sinh viên đã điểm danh kèm tìm kiếm.
     - `Bài tập & Chấm bài`: Thiết lập bài tập thực hành (Tiêu đề, Hạn nộp, Mô tả) và bảng chấm bài trực tiếp tại chỗ.
     - `Trắc nghiệm & Ôn tập`: Mở rộng cho các bài test nhanh.
3. **Popup PIN Chuyên dụng (`modal-admin-pin-quickview`):**
   - Mở cửa sổ PIN kích thước siêu lớn (Font 5xl, tracking rộng) để trình chiếu hoặc đọc cho sinh viên trong phòng sinh hoạt.

### 3.2. Phía Thành Viên (Member Portal)
1. **Màn hình Master (Dòng thời gian Chuyên đề & Bài tập):**
   - Khối Điểm danh nhanh bằng mã PIN 6 số.
   - Bảng 3 ô thống kê (Số buổi đã học, Số bài đã nộp, Số bài cần làm).
   - Danh sách các thẻ Buổi sinh hoạt: Hiển thị 3 chip trạng thái tóm gọn (*Có mặt/Chưa điểm danh*, *Chưa nộp/Đã đạt*, *Có Slide*).
2. **Màn hình Sub-view Chi tiết Chuyên đề (`member-tab-session-detail`):**
   - Hiển thị đầy đủ bài giảng, nút mở Slide Drive.
   - Ô nhập PIN điểm danh trực tiếp của buổi học đó.
   - Khung bài tập thực hành chi tiết kèm nút **"Nộp bài ngay"** / **"Nộp lại bài"**.

---

## 4. Tầng Dịch Vụ API & Đồng Bộ (API Service Layer)

1. **Giao tiếp qua `callApi(action, payload, options)` trong `services/api.js`:**
   - **Tự động gắn Session Token:** Mọi yêu cầu đều tự động đọc `bht_token` từ `localStorage` và đóng gói thành `{ action, token, payload }`.
   - **Vượt rào cản CORS:** Gửi yêu cầu HTTP POST với `Content-Type: text/plain;charset=utf-8` để vượt qua rào cản CORS preflight `OPTIONS` của trình duyệt đối với Google Apps Script.
   - **Tự động chuyển đổi giữa Live API và Mock Dev:** Tự động fallback sang Local Mock Data khi chạy trên môi trường phát triển (localhost / file://) mà không cần cấu hình phức tạp.
2. **Cơ chế Auto-Retry với Exponential Backoff + Jitter:**
   - Khi gọi GAS nếu gặp lỗi mạng, lỗi HTTP 5xx, hoặc Backend phản hồi mã lỗi `LOCK_TIMEOUT` / `SERVER_BUSY` (do 30–50 người cùng bấm điểm danh), `api.js` **tự động thử lại tối đa 4 lần**.
   - Thời gian chờ giữa các lần thử tính theo công thức:
     $$\text{delay} = \text{baseDelay} \times 2^{\text{attempt}} + \text{randomJitter}(0 \text{--} 1000\text{ms})$$
     nhằm rải đều tải, chống sập dịch vụ Google Apps Script.
3. **Request Deduplication (Chống gọi trùng lặp & Double-click):**
   - Nếu cùng một `action` + `payload` đang trong trạng thái chờ phản hồi (in-flight), hệ thống không tạo thêm request mới mà tái sử dụng chính Promise đang chạy.
   - Kết hợp helper `withButtonLock` trong `utils/dom.js` tự động khóa nút bấm và hiển thị spinner cho người dùng.
4. **Cơ chế Cache Stale-While-Revalidate & Invalidation:**
   - Dữ liệu danh mục được lưu cache `bht_cache_*` trong `localStorage` giúp UI mở tức thì trong 0.1s.
   - **Tự động xóa cache (Invalidation):** Mỗi khi Admin hoặc Member thực hiện thao tác thay đổi dữ liệu (`createAttendanceSession`, `createTask`, `checkInAttendance`, `submitTaskAssignment`...), hệ thống tự động xóa cache liên quan theo `MUTATION_INVALIDATION_MAP`.
5. **Đồng bộ Đa Tab (Cross-tab Realtime Sync):**
   - Sự kiện `bht_sync_event` được phát qua `localStorage` và `window.dispatchEvent`.
   - Tab của Member tự động nạp ngầm dữ liệu mới nhất ngay khi Admin tạo buổi học hoặc mở khóa điểm danh.
6. **Thanh Hỗ Trợ Kiểm Thử (Dev Helper Banner):**
   - Tọa lạc ở góc dưới bên trái màn hình.
   - **Nút chuyển đổi chế độ:** `Mock Dev` <-> `GAS API`.
   - **Nút đổi quyền 1-click:** `[Xem quyền Member]` <-> `[Xem quyền Admin]` chuyển đổi tài khoản ngay trên cùng cửa sổ.
   - **Nút `Copy Mock` & `Dán Mock`:** Hỗ trợ đồng bộ dữ liệu mẫu sang Cửa sổ Ẩn danh (Incognito) hoặc trình duyệt khác.

---

## 5. Hệ Thống Phân Loại Học Thuật & Trải Nghiệm Tương Tác Dải Filter (Unified Taxonomy & Interactive Filter)

1. **Kiến trúc Phân loại Dùng chung (Unified Academic Taxonomy):**
   - Bộ danh mục lõi `CORE_ACADEMIC_TOPICS`: Chuẩn đầu ra (MOS/IC3), Word & Đồ án, Excel & Số liệu, Prompt AI & Kỹ năng, Olympic & Thuật toán, Slide bài giảng, Ebook & Sách.
   - **Tự động gom Tag tùy biến (`extractDynamicTopics`):** Quét toàn bộ dữ liệu Buổi sinh hoạt (`TagChuyenDe`) và Kho học liệu (`PhanLoai`) để tự động nhận diện và đưa các Tag mới do Admin tạo vào dải Filter Pills.
   - **So sánh chuẩn hóa (`matchesTopicCategory`):** So khớp không phân biệt hoa thường, hỗ trợ từ khóa mở rộng và tag tự do.
   - **Render dải nút đồng nhất (`renderTopicFilterBarHtml`):** Sinh chuỗi HTML các nút `.bht-category-pill` tái sử dụng hoàn toàn giữa 2 bên Quản trị và Thành viên.
   - **Đồng bộ Form Tạo/Sửa:** Tự động gom các tag đã tạo trước đó vào `<optgroup label="── Phân loại đã tạo trước đó ──">`.

2. **Trải Nghiệm Cuộn Nâng Cao Trên Cả Mobile & Desktop:**
   - **Mobile Touch Swiping:** Vuốt chạm cảm ứng mượt mà với `touch-action: manipulation`, ẩn thanh cuộn thô (`.scrollbar-none`, `.scrollbar-hide`).
   - **Desktop Mouse Drag-to-Scroll (`initHorizontalDragScroll`):** Nhấn giữ chuột trái kéo qua lại như trên điện thoại; con trỏ chuyển thành `grab` / `grabbing`.
   - **Chống click nhầm (Drag Threshold):** Ngăn kích hoạt sự kiện `click` của nút tag khi người dùng đang thực hiện động tác kéo chuột (> 6px).
   - **Desktop Wheel-to-Horizontal-Scroll:** Tự động chuyển đổi lăn chuột giữa (`deltaY`) thành cuộn ngang dải tag mà không cần giữ phím `Shift`.

---

## 6. Chế Độ Xem Trước Giao Diện Thành Viên Cho Quản Trị Viên (Admin View-as-Member & Impersonation)

Tính năng cho phép Quản trị viên (Admin) trải nghiệm hệ thống dưới góc nhìn người học mà không phải đăng xuất hay mất phiên làm việc:

1. **Chuyển đổi 1-Click Không Mất Phiên (Zero Token Loss):**
   - Nút **`[👁️ Xem vai trò Thành viên]`** được tích hợp ngay trên Sidebar (Desktop) và Topbar (Mobile) của Admin Portal (`data-action="switch-to-member-view"`).
   - Khi bấm, hệ thống kích hoạt cờ `sessionStorage.setItem('bht_viewing_as_member', 'true')` và chuyển hướng sang `view-member` thông qua `initMemberView(true)`.
   - **Bảo toàn bảo mật:** Token quản trị thật (`bht_token`) và vai trò thật (`bht_role = ADMIN`) trong `localStorage` được giữ nguyên vẹn 100%.

2. **Khung Banner Cảnh Báo Trực Quan (Sticky Preview Banner):**
   - Khi ở chế độ xem thử nghiệm, một banner nổi bật `#admin-preview-mode-banner` hiển thị trang trọng ở đầu trang Thành viên với nhãn `PREVIEW`.
   - Nút **`[Quay lại Cổng Quản Trị]`** xuất hiện đồng thời trên Banner, Sidebar Thành viên (`#sidebar-return-admin-container`) và Topbar Mobile (`#mobile-return-admin-btn`) với action `return-to-admin-view`.
   - Bấm quay lại lập tức xóa cờ preview và đưa Quản trị viên trở về Admin Portal ngay tức thì kèm Toast thông báo.

3. **Chế Độ Xem Theo Danh Nghĩa Từng Sinh Viên (Specific Member Impersonation):**
   - Tại bảng Quản lý Nhân sự Thành viên (`admin-members-tbody`), mỗi hàng sinh viên có nút **`[👁️ Xem]`** (`data-action="view-as-member"`).
   - Khi Admin bấm vào nút này, hệ thống lưu thông tin `{ mssv, hoTen, email }` vào `bht_viewing_as_member` và nạp giao diện Thành viên.
   - Toàn bộ dữ liệu Điểm rèn luyện (ĐRL), Lịch sử điểm danh học vụ, Danh sách bài tập đã nộp / cần làm sẽ phản ánh chính xác 100% hồ sơ học tập của sinh viên đó, giúp Ban Học Thuật kiểm tra phản ánh của sinh viên một cách trực quan nhất.


