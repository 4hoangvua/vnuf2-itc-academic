---
name: add-feature-workflow
description: Quy trình chuẩn 6 bước khi triển khai một tính năng mới trong dự án Ban Học Thuật (từ Backend GAS đến Frontend Event Delegation)
---

# QUY TRÌNH 6 BƯỚC PHÁT TRIỂN TÍNH NĂNG MỚI (6-STEP FEATURE WORKFLOW)
> **Dự án:** Cổng Quản Lý Ban Học Thuật - CLB Tin Học VNUF2  
> **Áp dụng:** Mọi yêu cầu thêm mới màn hình, API, chức năng hay phân hệ nghiệp vụ.

---

## TỔNG QUAN LUỒNG PHÁT TRIỂN

```text
[Bước 1: Config.js]       ──> Khai báo tên Action, quyền hạn & hằng số hệ thống
         │
[Bước 2: Service_*.js]    ──> Xử lý nghiệp vụ, tách Drive/Mail ra ngoài Lock
         │
[Bước 3: Router.js]        ──> Middleware kiểm tra Token, Guard Role, tiêm currentUser
         │
[Bước 4: Mock & Api.js]   ──> Giả lập mockData.js, cấu hình MUTATION_INVALIDATION_MAP
         │
[Bước 5: Store & Template]──> Cập nhật store.js, viết pure template trong templates.js (escapeHTML)
         │
[Bước 6: Controller & App]──> Viết controller, withButtonLock, đăng ký CENTRAL_ACTION_MAP
```

---

## CHI TIẾT TỪNG BƯỚC THỰC HIỆN

### BƯỚC 1: KHAI BÁO CẤU HÌNH (`gas-backend/Config.js`)
1. Xác định phân loại quyền cho Action mới và thêm vào đúng mảng:
   - `PUBLIC_ACTIONS`: Người dùng vãng lai, chưa đăng nhập (`ping`, `requestLoginOtp`, `verifyLoginOtp`, `getAuthStatus`).
   - `MEMBER_ACTIONS`: Thành viên CLB, bắt buộc Session Token (`checkInAttendance`, `submitTaskAssignment`...).
   - `ADMIN_ACTIONS`: Quản trị viên, bắt buộc Token và `role === 'ADMIN'` (`createAttendanceSession`, `reviewSubmission`...).
   - `QUERY_ACTIONS`: Hành động đọc dữ liệu (`getAttendanceSessions`, `getAllTasks`...).
2. Khai báo thêm tên Sheet, ID Thư mục hoặc hằng số TTL Cache nếu cần thiết.

---

### BƯỚC 2: XÂY DỰNG LOGIC DỊCH VỤ (`gas-backend/Service_*.js`)
1. **Quy tắc vàng về ScriptLock:**
   - **TUYỆT ĐỐI KHÔNG** gọi `DriveApp.createFile()`, `DriveApp.createFolder()`, `GmailApp.sendEmail()`, `UrlFetchApp.fetch()` nằm bên trong `withScriptLock()`.
   - Phải xử lý file Drive hoặc gửi email trước, khi có link/kết quả mới mở khóa để ghi Sheet.
2. **Quy tắc tối ưu I/O Google Sheets:**
   - Dùng `DbHelper.readSheetData(sheetName)` đọc theo lô qua `getDataRange().getValues()`.
   - Tuyệt đối không dùng vòng lặp gọi `getValue()`/`setValue()` từng ô.
   - Thao tác ghi bọc trong `withScriptLock(10000)`. Nếu timeout, hệ thống tự trả về `{ success: false, errorCode: 'LOCK_TIMEOUT' }`.
   - Gọi `DbHelper.invalidateSheetCache(sheetName)` ngay sau khi ghi dữ liệu thành công.

---

### BƯỚC 3: ĐỊNH TUYẾN & BẢO MẬT PHÂN QUYỀN (`gas-backend/Router.js`)
1. Tiếp nhận Action mới trong hàm `doPost(e)` hoặc các route phụ trợ.
2. **Chống giả mạo danh tính:**
   - Nếu là `MEMBER_ACTIONS`: Lấy `currentUser.mssv` đã được Router chứng thực qua Token để truyền vào Service. **Cấm lấy `payload.mssv` từ Client.**
   - Nếu là `ADMIN_ACTIONS`: Router tự động chặn với mã lỗi `403 FORBIDDEN` nếu `currentUser.role !== 'ADMIN'`.
3. Trả về đúng JSON Envelope chuẩn: `{ success: true, data: ..., message: ... }`.

---

### BƯỚC 4: ĐỒNG BỘ MOCK DATA & API SERVICE (`frontend/services/`)
1. **Cập nhật `frontend/services/mockData.js`:**
   - Thêm case xử lý trong hàm `mockCallApi(action, payload)`.
   - Cấu trúc các trường dữ liệu (Schema) của Mock **phải khớp 100%** với dữ liệu Google Sheets thật.
   - Cập nhật state nội bộ và ghi vào `localStorage.setItem('bht_mock_store', ...)` để dữ liệu không bị mất khi F5.
2. **Cập nhật `frontend/services/api.js`:**
   - Nếu Action là Mutation (thay đổi dữ liệu): Thêm vào `MUTATION_INVALIDATION_MAP` để tự động xóa cache các danh mục liên quan.
   - Kiểm tra cơ chế Auto-Retry với Jitter hoạt động khi backend phản hồi `LOCK_TIMEOUT`.

---

### BƯỚC 5: STATE PHẢN ỨNG & HTML TEMPLATES (`frontend/modules/`)
1. **Cập nhật Store (`modules/store.js`):**
   - Nếu dữ liệu mới cần dùng chung ở nhiều nơi, khai báo state trong `store.js` và cập nhật bằng `store.setState({ ... })`.
2. **Tách biệt Template vào `modules/templates.js` hoặc Sub-Templates:**
   - Viết các hàm Template Literals xuất ra chuỗi HTML tinh gọn.
   - Nếu là phân hệ độc lập hoặc lớn (như Quiz, Rubric chấm bài), **bắt buộc** tách vào file riêng trong `frontend/modules/templates/` (ví dụ: `modules/templates/quizTemplates.js`), sau đó re-export qua `modules/templates.js`.
   - **BẮT BUỘC** bọc mọi biến dữ liệu người dùng qua hàm `escapeHTML(str)` từ `utils/dom.js`.
   - **BẮT BUỘC** dùng thuộc tính `data-action="..."` và `data-id="..."`, **CẤM** gắn `onclick` inline.

---

### BƯỚC 6: CONTROLLER SUB-MODULES & EVENT DELEGATION (`modules/` & `app.js`)
1. **Viết Controller logic trong Sub-Modules chuyên trách:**
   - **TUYỆT ĐỐI KHÔNG** nhồi nhét code vào file gốc `admin.js` hay `member.js`.
   - Phân loại và đặt hàm nghiệp vụ vào đúng Sub-Module tương ứng:
     - Admin: `frontend/modules/admin/adminMembers.js`, `adminSessions.js`, `adminQuiz.js`, `adminDocs.js`, `adminSubmissions.js`.
     - Member: `frontend/modules/member/memberSessions.js`, `memberQuiz.js`, `memberDocs.js`, `memberSubmissions.js`.
   - Re-export toàn bộ hàm cần dùng ra ngoài qua Barrel file (`admin.js`, `member.js`) bằng cú pháp `export * from './admin/admin<Feature>.js'`.
   - **Quy tắc ES Module Live Bindings:** Biến import từ module khác là Read-only. Khi cần gán lại state giữa các module, bắt buộc sử dụng các hàm setter (ví dụ: `setCurrentMemberDetailSessionId(id)`).
   - Gọi API qua `await callApi(action, payload)`. Cấm dùng `fetch()` trực tiếp.
   - Dùng helper `withButtonLock(btnEl, asyncFn)` để tự động disable nút và hiện spinner khi gọi API, ngăn double-click.
2. **Đăng ký Action vào `frontend/app.js`:**
   - Mở `CENTRAL_ACTION_MAP` trong `app.js` và ánh xạ tên `data-action`:
     ```javascript
     'ten-action-moi': (el, ev, ds) => handleTenActionMoi(ds.id, ds.status),
     ```
   - Nếu là Form submit, đăng ký vào `CENTRAL_FORM_MAP`:
     ```javascript
     'ten-form-moi': (form, ev) => handleFormSubmitMoi(ev),
     ```
3. **Kiểm thử nghiệm thu:**
   - Chạy lệnh `node test_core.mjs` để đảm bảo 100% test suites vượt qua (226/226 tests).
   - Kiểm tra trên trình duyệt ở cả 2 vai trò Admin và Member.

---

## QUY TRÌNH DEPLOY & ĐỒNG BỘ CODE (GIT PUSH & CLASP PUSH)

Hệ thống phân tách rạch ròi 2 kênh quản lý và triển khai:

### 1. Triển khai Backend (Google Apps Script qua Clasp):
- Thư mục `gas-backend/` và các file cấu hình `.clasp.json`, `.clasprc.json` được **lưu trữ tại local** và bắt buộc phải nằm trong `.gitignore` (ngăn chặn rò rỉ Script ID, Sheet ID, Folder ID nhạy cảm lên GitHub).
- **Đẩy code Backend lên Apps Script:**
  ```powershell
  npx @google/clasp push
  # hoặc: clasp push
  ```
- **Kéo code Backend mới nhất từ Apps Script về local:**
  ```powershell
  npx @google/clasp pull
  # hoặc: clasp pull
  ```
- **LƯU Ý SỐNG CÒN:** Tuyệt đối không xóa thư mục `gas-backend/` hay `.clasp.json` ở local. Nếu vô tình bị xóa do `git pull` các commit cũ từ GitHub, khôi phục lại tức thì bằng:
  - `npx @google/clasp pull`
  - Hoặc: `git checkout e05dd8a~1 -- gas-backend/ .clasp.json` rồi unstage (`git restore --staged gas-backend/ .clasp.json`).

### 2. Triển khai Frontend (Git & GitHub):
- Chỉ commit và push các thay đổi của `frontend/`, tài liệu, rules, skills hoặc test scripts lên GitHub.
- Trước khi push code Git:
  1. Kiểm tra `git status` đảm bảo không có file nhạy cảm (`gas-backend/`, `.clasp.json`, `.env`) bị vô tình đưa vào commit.
  2. Chạy `node test_core.mjs` để đảm bảo 100% tests vượt qua.
  3. Thực hiện commit có ý nghĩa và `git push origin main`.
