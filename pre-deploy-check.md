# QUY TRÌNH KIỂM TRA TRƯỚC KHI DEPLOY (`pre-deploy-check.md`)
> **Dự án:** Cổng Quản Lý Ban Học Thuật - CLB Tin Học VNUF2  
> **Mục tiêu:** Đảm bảo hệ thống đạt chuẩn an toàn 100%, không bị sập khi 30–50 người thao tác đồng thời và không bị lỗi cache trình duyệt khi người dùng truy cập.

---

## 1. TỔNG QUAN CHECKLIST TRƯỚC KHI TRIỂN KHAI

| Hạng mục kiểm tra | Tiêu chuẩn bắt buộc | Công cụ / Lệnh kiểm tra |
| :--- | :--- | :--- |
| **Bảo mật XSS** | Mọi biến động đều bọc qua `escapeHTML()` | Rà soát `innerHTML` trong `templates.js` |
| **Bảo mật Token** | Không tin `payload.mssv`, lấy từ `currentUser` | Rà soát `gas-backend/Router.js` |
| **Chịu tải GAS** | KHÔNG có `DriveApp`/`MailApp` trong `withScriptLock` | Grep `withScriptLock` trong `gas-backend/` |
| **I/O Google Sheets** | 100% đọc/ghi theo lô (Batch I/O) qua `DbHelper` | Grep `getValue()` / `setValue()` trong code |
| **Frontend Code** | 0 `window.*`, 0 `onclick` inline, 100% `data-action` | `git grep "onclick"` |
| **Cache Busting** | Đánh số phiên bản `?v=...` chống dính cache cũ | Kiểm tra thẻ `<script>` / `<link>` trong `index.html` |
| **Automated Tests** | 14/14 core architecture unit tests PASSED | Chạy `node test_core.mjs` |

---

## 2. QUY TRÌNH KIỂM TRA CHI TIẾT

### GIAI ĐOẠN 1: RÀ SOÁT BẢO MẬT & PHÂN QUYỀN
- [ ] **1. Chống Giả Mạo Danh Tính Sinh Viên (Identity Spoofing):**
  - Mở `gas-backend/Router.js`: Kiểm tra các action `checkInAttendance`, `submitTaskAssignment`, `getMemberSubmissions`.
  - Đảm bảo `mssv` được gán từ `currentUser.mssv` (đã xác thực từ Token).
  - Tuyệt đối không cho phép client tự gửi `{ mssv: '2351120015' }` để điểm danh hay nộp bài hộ người khác.
- [ ] **2. Bảo Mật Quyền Quản Trị Viên (Admin Guard):**
  - Đảm bảo mọi `ADMIN_ACTIONS` đều đi qua kiểm tra:
    ```javascript
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return jsonResponse({ success: false, errorCode: 'FORBIDDEN', message: 'Truy cập bị từ chối!' });
    }
    ```
- [ ] **3. Lọc Dữ Liệu Chống Tấn Công XSS:**
  - Kiểm tra `frontend/modules/templates.js`: Đảm bảo `escapeHTML()` được bọc quanh:
    - Họ tên sinh viên (`HoTen`)
    - Tên bài nộp (`TenFile`)
    - Tiêu đề & mô tả buổi học (`TenBuoiHop`, `NoiDungChuyenDe`)
    - Nhận xét phản hồi (`Feedback`)

---

### GIAI ĐOẠN 2: RÀ SOÁT HIỆU NĂNG & CHỊU TẢI ĐỒNG THỜI (GAS CONCURRENCY)
- [ ] **4. Cách Ly Tác Vụ Nặng Ra Khỏi Khóa Script Lock:**
  - Mở `gas-backend/Service_Submit.js`: Xác nhận `DriveApp.createFile()` chạy **TRƯỚC KHI** gọi `withScriptLock()`.
  - Mở `gas-backend/Service_Task.js`: Xác nhận `DriveApp.createFolder()` chạy **TRƯỚC KHI** gọi `withScriptLock()`.
  - Mở `gas-backend/Service_Auth.js`: Xác nhận `GmailApp.sendEmail()` chạy **NGOÀI** khóa.
- [ ] **5. Điểm Danh Tốc Độ Cao Bằng RAM Cache:**
  - Mở `gas-backend/Service_Member.js`: Xác nhận hàm `checkInAttendance` sử dụng `OPEN_SESSION_CACHE` trong `CacheService` để kiểm tra mã PIN tức thì, chỉ mở khóa micro-lock vài mili-giây để append MSSV vào Sheet.
- [ ] **6. Xử Lý Khi Khóa Timeout:**
  - Xác nhận hàm `withScriptLock()` trong `DbHelper.js` trả về đúng mã lỗi `LOCK_TIMEOUT` khi bị nghẽn:
    ```javascript
    { success: false, errorCode: 'LOCK_TIMEOUT', message: 'Hệ thống đang bận...' }
    ```
  - Kiểm tra `frontend/services/api.js` có logic tự động Retry tối đa 4 lần với Exponential Backoff + Jitter.

---

### GIAI ĐOẠN 3: KIỂM TRA CHẤT LƯỢNG MÃ NGUỒN FRONTEND
- [ ] **7. Không Gán Biến Toàn Cục `window.*`:**
  - Kiểm tra file `frontend/app.js`: Tất cả hàm được điều phối qua `CENTRAL_ACTION_MAP`.
- [ ] **8. Không Có Thuộc Tính Inline Trong HTML:**
  - Chạy lệnh kiểm tra:
    ```powershell
    git grep -i "onclick=" frontend/
    git grep -i "onsubmit=" frontend/
    ```
    Kết quả mong đợi: **Không tìm thấy kết quả nào.**
- [ ] **9. Chạy Bộ Test Tự Động:**
  - Chạy lệnh trong terminal:
    ```powershell
    node test_core.mjs
    ```
    Kết quả bắt buộc: `ALL 14 CORE ARCHITECTURE TESTS PASSED! (0 failures)`.

---

### GIAI ĐOẠN 4: ĐÁNH SỐ PHIÊN BẢN CHỐNG DÍNH CACHE (CACHE BUSTING)
Khi deploy lên GitHub Pages hoặc Web Server, trình duyệt của sinh viên thường lưu cache các file `.js` và `.css` cũ, dẫn đến việc không nhận được các bản vá mới.

- [ ] **10. Cập Nhật Query Parameter `?v=...` Trong `frontend/index.html`:**
  Trước khi commit deploy, cập nhật số phiên bản theo ngày giờ (VD: `20261016_v1`):
  ```html
  <!-- CSS Stylesheet -->
  <link rel="stylesheet" href="css/styles.css?v=20261016_v1">

  <!-- Main App Module -->
  <script type="module" src="app.js?v=20261016_v1"></script>
  ```
- [ ] **11. Kiểm Tra Cấu Hình Google Apps Script Thực Tế:**
  - Trong `gas-backend/Config.js`: Điền chính xác `CONFIG.SHEET_ID` và `CONFIG.ROOT_FOLDER_ID`.
  - Trên Apps Script: Deploy dạng Web App với cấu hình:
    - **Execute as:** `Me (tài khoản Google của bạn)`.
    - **Who has access:** `Anyone`.
  - Copy URL dạng `https://script.google.com/macros/s/.../exec` để cấu hình vào Frontend.

---

## 3. LỆNH TERMINAL RÀ SOÁT NHANH (QUICK AUDIT SCRIPT)

Bạn có thể chạy chuỗi lệnh sau trong PowerShell để kiểm tra nhanh toàn bộ hệ thống:

```powershell
# 1. Chạy test suite lõi
node test_core.mjs

# 2. Quét sạch các inline handlers vi phạm
Get-ChildItem -Path frontend -Recurse -Include *.html,*.js | Select-String -Pattern "onclick=", "onsubmit="

# 3. Kiểm tra xem có DriveApp nằm trong withScriptLock không
Select-String -Path gas-backend/*.js -Pattern "withScriptLock\([\s\S]*DriveApp"
```
*(Nếu terminal không trả về cảnh báo nào và test đạt 14/14 thì hệ thống đã SẴN SÀNG 100% ĐỂ DEPLOY).*
