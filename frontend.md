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
│   ├── templates.js            # Barrel & Base Templates (Thẻ, Bảng, Huy hiệu, Taxonomy tags)
│   ├── templates/              # Sub-templates chuyên biệt theo phân hệ
│   │   ├── quizTemplates.js    # Template trắc nghiệm (Zen Focus Arena, Bảng câu hỏi, Scorecard, Review)
│   │   └── campaignTemplates.js# Template sự kiện & Email (Auto-Scheduler, Live Preview, Bulk Mailer với Checkbox)
│   ├── ui.js                   # Điều phối giao diện, Theme Sáng/Tối, Toast, Loading overlay
│   ├── auth.js                 # Xử lý xác thực OTP, đếm ngược 300s, Quản lý Token & Dọn sạch cache khi đăng xuất
│   ├── member.js               # Barrel module Thành viên (Re-export các sub-modules bên dưới)
│   ├── member/                 # Phân hệ thành viên tách nhỏ (Single Responsibility)
│   │   ├── memberSessions.js   # Dòng thời gian, Master-Detail chi tiết, Điểm danh PIN, Lộ trình học
│   │   ├── memberQuiz.js       # Phòng thi trắc nghiệm Zen Focus Arena, Bookmark, Luyện sai, Leaderboard
│   │   ├── memberDocs.js       # Kho tài liệu, Lọc phân loại chuyên đề học thuật
│   │   └── memberSubmissions.js# Danh sách bài nộp, Trạng thái chấm, Giới hạn nộp tối đa 3 lần
│   ├── admin.js                # Barrel module Quản trị viên (Re-export các sub-modules bên dưới)
│   ├── admin/                  # Phân hệ quản trị tách nhỏ (Single Responsibility)
│   │   ├── adminMembers.js     # Quản lý danh sách thành viên, thêm mới, reset Gmail, toggle active
│   │   ├── adminSessions.js    # Master-Detail buổi học, tạo/sửa session, chiếu PIN, quản lý bài tập
│   │   ├── adminQuiz.js        # Ngân hàng câu hỏi trắc nghiệm, tạo đề thi, reset lượt thi, thống kê
│   │   ├── adminDocs.js        # Quản lý kho học liệu, phân loại tài liệu
│   │   ├── adminSubmissions.js # Duyệt bài nộp, nhập điểm, feedback nhận xét cho sinh viên
│   │   └── adminCampaigns.js   # Điều hành sự kiện mẫu, hẹn giờ tự động, gửi email có chọn lọc người nhận
│   ├── gift2010.js             # Bộ chọn sự kiện Admin, 3D Card Shuffle Unboxing Arena, Particle Confetti, âm thanh
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

---

## 7. Kiến Trúc Module Hóa (Modular Architecture) & Định Hướng MVC / State Observer

Nhằm giải quyết triệt để tình trạng các file điều phối phình to (>2,500 dòng/file gây khó bảo trì), hệ thống đã được tái cấu trúc sang kiến trúc Module hóa dựa trên **Native ES6 Modules**:

### 7.1. Đánh giá tính hợp lý của việc tách file bằng ES Modules (`import`/`export`)
1. **Lợi ích vượt trội:**
   - **Tách biệt nghiệp vụ (Domain Separation):** Mỗi sub-module chỉ phục vụ đúng 1 phân hệ (`adminMembers`, `adminSessions`, `adminQuiz`, `memberQuiz`...). Dung lượng trung bình giảm xuống còn 200 – 700 dòng/file.
   - **Kiểm soát phạm vi biến (Scope Isolation):** Không còn tình trạng khai báo biến biến toàn cục trên `window`. Mỗi biến nội bộ được đóng gói chặt chẽ trong file.
   - **Tương thích ngược 100% (Barrel Re-export Pattern):** Các file gốc `admin.js`, `member.js`, `templates.js` đóng vai trò cổng giao tiếp tổng (`export * from ...`), giữ nguyên giao diện API bên ngoài cho `app.js` và bộ kiểm thử `test_core.mjs` (226/226 test suites passed).
2. **Quy tắc cốt lõi cần tuân thủ:**
   - **ES Modules Live Bindings là Read-Only:** Khi một module import một biến `let` từ module khác, biến đó chỉ đọc được chứ không thể gán lại trực tiếp (`a = b` sẽ gây `TypeError: Assignment to constant variable`). Mọi thao tác gán lại State giữa các module **bắt buộc** dùng hàm setter (ví dụ: `setCurrentMemberDetailSessionId(id)`).
   - **Phân cấp phụ thuộc 1 chiều (Unidirectional Dependency):** Cấm tạo import chéo phụ thuộc vòng (Circular Dependency). Luồng dữ liệu đi thẳng: `API/Mock` -> `Store` -> `Templates` -> `Sub-modules` -> `Main Module` -> `App.js`.

### 7.2. So sánh với mô hình MVC (Model - View - Controller)
Hệ thống hiện tại đã tiệm cận cấu trúc **MVC cải tiến (Store-based MVC)**:
- **Model (Dữ liệu & Nghiệp vụ):** `modules/store.js` (quản lý state ứng dụng), `services/api.js` (giao tiếp mạng, retry, deduplication), `services/mockData.js` (kho lưu trữ local).
- **View (Giao diện hiển thị):** `views/*.html` (khung cấu trúc), `modules/templates.js` & `modules/templates/quizTemplates.js` (hàm template literals sinh HTML thuần, escape XSS).
- **Controller (Điều phối hành động):** Các sub-modules trong `modules/admin/` và `modules/member/` (xử lý logic, gọi Model cập nhật và chỉ định View render).
- **Dispatcher / Router:** `app.js` với `CENTRAL_ACTION_MAP` và `CENTRAL_FORM_MAP` (Event Delegation tập trung).

### 7.3. Định hướng nâng cấp tiếp theo
1. **Mức 1 - Reactive Store Observer (Tự động cập nhật View):**
   - Nâng cấp `store.js` bằng Observer Pattern (`store.subscribe(key, callback)`). Khi State thay đổi, View tương ứng tự động re-render mà không cần Controller gọi hàm render thủ công.
2. **Mức 2 - Triển khai Bundler khi Deploy Production:**
   - Trong môi trường phát triển local, sử dụng native ESM giúp tải code tức thì không cần chờ compile.
   - Khi triển khai chính thức lên GitHub Pages hoặc nhúng vào Google Apps Script HTML Service, sử dụng Vite hoặc Rollup để đóng gói (bundle & minify) toàn bộ các sub-modules thành 1 file JS duy nhất để tối ưu tối đa số lượng HTTP request.

---

## 8. Phân Hệ Quản Lý Sự Kiện & Gửi Thư Tự Động (Campaigns & Mailer Studio)

Phân hệ mở rộng phụ trách các chiến dịch lễ hội (`OCT20`, `TET`, `MARCH8`, `ANNIVERSARY`) và công cụ gửi email tự động tới thành viên:

1. **Bộ Chọn Sự Kiện Độc Lập Tại Tab Sự Kiện (`#admin-campaign-selector-card`):**
   - Đặt trang trọng tại đầu Tab 5 (`admin-tab-campaigns`), tách biệt hoàn toàn khỏi Tab Thành viên để giữ nguyên tính chuẩn mực nhân sự.
   - Hiển thị trực quan 5 chế độ: 4 sự kiện mẫu kèm huy hiệu `ĐANG CHẠY` và nút `Tắt sự kiện` (đưa cổng về chế độ học thuật tiêu chuẩn).
   - Cơ chế fallback an toàn: Tự động dùng danh mục preset tĩnh nếu đường truyền backend chưa hoàn tất, đảm bảo khung chọn không bao giờ bị biến mất trên môi trường Production.

2. **Hàng Đợi Phát Thư Hàng Loạt Với Checkbox Từng Người (Bulk Dispatch Queue):**
   - **Lựa chọn linh hoạt (Individual Recipient Picker):** Mỗi sinh viên có email hợp lệ được cấp một checkbox riêng (`.js-campaign-recipient-cb`), mặc định tự động chọn toàn bộ.
   - **Thanh công cụ điều khiển nhanh:**
     - Checkbox "Chọn tất cả" tại header bảng.
     - Nút `[Chọn tất cả]` & `[Bỏ chọn]` thao tác 1-click.
     - Huy hiệu đếm số lượng thời gian thực: `Đã chọn: X / Y người`.
   - **Nút gửi thư thông minh:** Nhãn nút cập nhật tức thì `Gửi Email Tới [X] Người Đã Chọn`, tự động vô hiệu hóa nếu số lượng chọn bằng 0.
   - **Bảo lưu trạng thái lựa chọn:** Danh sách người nhận đã chọn được lưu theo từng sự kiện thông qua `adminRecipientSelectionMap[campaignId]`, không bị mất trạng thái khi chuyển đổi qua lại giữa các chiến dịch.

3. **Trải Nghiệm Mở Hộp Quà 3D (Card Shuffle Unboxing Arena) & Particle Confetti:**
   - Đấu trường bốc thăm 3D với 3 thẻ quà chuyển động xáo trộn mượt mà (Decelerated CSS Animation 5.6s).
   - Tích hợp 5 hiệu ứng tương tác cao cấp bằng Vanilla JS thuần:
     - Pháo hoa hạt 360 độ nở bung từ tâm nút bấm (`triggerExplosionConfetti`).
     - Hiệu ứng rơi đa chủ đề: Hoa đào, hoa mai, hoa sen, bướm bay lượn, cánh hoa hồng.
     - Lời chúc may mắn ngẫu nhiên đa ngành (không gò bó CNTT).
     - Âm thanh Web Audio API tổng hợp (không load file ngoài).
     - Nút điều khiển tiện ích: `⏩ Xem ngay` (bỏ qua xáo thẻ) và `🎲 Xáo thẻ lại`.

---

## 9. Phân Hệ Đơn Xin Vắng Mặt, Điểm Danh Bổ Sung Thủ Công & Tối Ưu Mobile

Nhằm đảm bảo tính minh bạch học vụ, quyền lợi rèn luyện (ĐRL) của sinh viên và sự thuận tiện cho Ban Quản trị:

1. **Phân Hệ Đơn Xin Vắng Mặt Phía Thành Viên (`memberSessions.js` & `modal-member-quick-absence`):**
   - **Singleton Quick Modal:** Tích hợp form báo vắng nhanh `#modal-member-quick-absence` trong `member.html`.
   - **Ràng buộc nghiệp vụ phía Client & Server:**
     - Tự động kiểm tra trạng thái buổi sinh hoạt: Buổi đã kết thúc (`Closed`) sẽ không hiển thị nút hoặc chặn gửi đơn với thông báo rõ ràng.
     - Sinh viên đã điểm danh có mặt trong buổi học sẽ không thể gửi đơn vắng.
     - Chống nộp trùng đơn cho cùng 1 buổi học.
   - **Hiển thị trực quan theo thời gian thực:**
     - Thẻ chuyên đề nổi bật (Spotlight Card) và Danh sách buổi học hiển thị huy hiệu: `Chờ duyệt đơn vắng` (vàng nhạt), `Đã duyệt nghỉ có phép` (xanh ngọc) hoặc `Bị từ chối` (đỏ).
     - **Bảng đối soát ĐRL:** Phân tách rõ ràng giữa *Vắng có phép* (được tính vào tỷ lệ chuyên cần) và *Vắng không phép*.
     - **Tự hủy đơn:** Sinh viên có thể tự hủy đơn xin vắng (`cancel-absence-request`) khi đơn còn ở trạng thái `Pending`.

2. **Phê Duyệt Đơn Vắng & Phân Trang Độc Lập Phía Quản Trị (`adminSessions.js` & `modal-admin-review-absence`):**
   - **Phân trang độc lập (`PaginationInstance`):** Bảng Đơn xin vắng mặt trong chi tiết buổi học sở hữu bộ phân trang riêng biệt (`#admin-detail-absence-pagination`), tách biệt với bảng Sinh viên đã có mặt.
   - **Modal Xét Duyệt Tập Trung (`#modal-admin-review-absence`):**
     - Khắc phục triệt để lỗi ghi đè trạng thái: Người duyệt lựa chọn rõ ràng giữa hai nút Radio: **"Phê duyệt (Nghỉ có phép)"** hoặc **"Từ chối (Nghỉ không phép)"**.
     - Nhập lời nhắn phản hồi (`Feedback`) học thuật gửi tới sinh viên.
     - Tự động kích hoạt cơ chế Button Loading và chống double-click khi gửi kết quả.

3. **Điểm Danh Bổ Sung Thủ Công Bằng MSSV (`adminManualCheckIn`):**
   - Form `#form-admin-manual-checkin` cho phép Quản trị viên nhập trực tiếp MSSV của sinh viên quên mang điện thoại hoặc gặp trục trặc mạng.
   - Khi điểm danh bù thành công:
     - Tự động thêm MSSV vào danh sách có mặt của buổi học.
     - **Tự động hủy đơn vắng liên kết:** Nếu sinh viên đó đã nộp đơn xin vắng trước đó, hệ thống tự động đổi trạng thái đơn sang `Cancelled`.
     - Tự động xóa cache và nạp lại cả 2 bảng (Danh sách có mặt & Đơn xin vắng) tức thì.

4. **Tối Ưu Mobile Ergonomics & Chống Biến Dạng Badge (Anti-Deform Badges):**
   - **Chống phình to huy hiệu Member:** Bổ sung thuộc tính `whitespace-nowrap` trên tất cả thẻ `<td>` và component `uiStatusBadge`, mở rộng độ rộng tối thiểu cột `<th>Điểm danh</th>` lên `min-w-[120px]`, đảm bảo badge luôn hiển thị dạng viên thuốc pill thon gọn, không bao giờ bị rớt dòng thành hình tròn hay quả trứng.
   - **Thanh điều hướng đáy Admin 5 Tabs (`grid-cols-5`):** Khắc phục lỗi thiếu Tab 5 (Sự kiện) trên thiết bị di động bằng cách chuyển cấu trúc sang `grid-cols-5 px-1 min-w-0`, các nhãn rút gọn tinh tế kèm icon cân đối trên mọi kích cỡ màn hình hẹp (320px – 430px).


