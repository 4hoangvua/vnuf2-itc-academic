# HỆ THỐNG QUY TẮC CỐT LÕI (CORE SYSTEM RULES)
> **Dự án:** Cổng Thông Tin & Quản Lý Ban Học Thuật - CLB Tin Học VNUF2  
> **Áp dụng:** Toàn bộ quá trình lập trình, bảo trì và mở rộng hệ thống (Frontend & Backend).

---

## 1. QUY TẮC PHÍA FRONTEND (ANTI-SPAGHETTI & BẢO MẬT XSS)

1. **Cấm Window Aliases & Inline Events:**
   - **TUYỆT ĐỐI CẤM** gán hàm trực tiếp vào đối tượng toàn cục `window` (ví dụ: `window.handleX = ...` hoặc `window.BHT = ...`).
   - **TUYỆT ĐỐI CẤM** sử dụng các thuộc tính inline sự kiện trong HTML (ví dụ: `onclick="..."`, `onsubmit="..."`, `onchange="..."`).
   - **BẮT BUỘC** áp dụng mô hình **Event Delegation tập trung** thông qua thuộc tính chuẩn `data-action="..."` và `data-id="..."` sử dụng helper `attachEventDelegation()` và `attachFormDelegation()` trong `utils/dom.js`.

2. **Chống Tấn Công XSS & Chuẩn Hóa UI Components:**
   - **TUYỆT ĐỐI CẤM** ghép trực tiếp dữ liệu từ người dùng hoặc API vào chuỗi HTML mà không qua bộ lọc.
   - **BẮT BUỘC** bọc mọi biến dữ liệu động (`HoTen`, `TenFile`, `TenBuoiHop`, `Feedback`, `MoTa`, `MSSV`, `Email`) bằng hàm `escapeHTML(str)` trong `utils/dom.js`.
   - **TUYỆT ĐỐI CẤM** viết chuỗi HTML trực tiếp bên trong `admin.js` và `member.js`. Mọi giao diện động bắt buộc phải gọi qua các hàm component trong `frontend/modules/templates.js` (`uiButton`, `uiStatusBadge`, `uiMonoBadge`, `uiEmptyState`, `renderSubmissionRow`, `renderSessionCard`, `renderAttendeeRow`, `renderMemberRow`, `renderDocCard`).

3. **Giao Tiếp API & Điều Khiển Trạng Thái (State Management):**
   - **TUYỆT ĐỐI CẤM** gọi trực tiếp hàm `fetch()` trong các Controller (`member.js`, `admin.js`, `auth.js`). Mọi truy vấn mạng **bắt buộc** đi qua hàm `callApi(action, payload, options)` trong `services/api.js`.
   - **BẮT BUỘC** quản lý trạng thái giao diện qua **Reactive Store (`modules/store.js`)**. Sử dụng `getState()`, `setState()`, và `subscribe()` để cập nhật dữ liệu tự động, loại bỏ việc thao tác biến rời rạc.
   - **BẮT BUỘC** sử dụng helper `withButtonLock(btnEl, asyncFn)` hoặc `setButtonLoading()` để tự động khóa nút bấm và hiển thị spinner khi thực hiện tác vụ ghi dữ liệu (Mutation), ngăn ngừa double-click.

---

## 2. QUY TẮC PHÍA BACKEND (GAS CHỊU TẢI CAO & BẢO MẬT PHÂN QUYỀN)

1. **Bảo Mật Xác Thực Token & Chống Giả Mạo Danh Tính:**
   - **TUYỆT ĐỐI CẤM** tin tưởng `mssv` hoặc `role` gửi lên từ `payload` của Client cho các thao tác nhạy cảm (điểm danh, nộp bài, xem lịch sử, phân quyền admin).
   - **BẮT BUỘC** trích xuất và xác thực thông qua `sessionToken` tại `Router.js`.
   - Đối với nhóm hành động của thành viên (`MEMBER_ACTIONS`), Router **bắt buộc** tự động tiêm `currentUser.mssv` đã được chứng thực từ token vào dữ liệu xử lý.
   - Đối với nhóm hành động quản trị (`ADMIN_ACTIONS`), Router **bắt buộc** kiểm tra `currentUser.role === 'ADMIN'`. Nếu sai, lập tức từ chối với mã lỗi `403 FORBIDDEN`.

2. **Tối Ưu Khóa Đồng Thời (`withScriptLock`) & Chống Nghẽn GAS:**
   - **QUY TẮC SỐNG CÒN:** **TUYỆT ĐỐI CẤM** đặt các tác vụ nặng hoặc gọi dịch vụ ngoài (`DriveApp.createFile()`, `GmailApp.sendEmail()`, `UrlFetchApp.fetch()`) nằm **BÊN TRONG** hàm khóa `withScriptLock()`.
   - Với chức năng nộp bài (`submitTaskAssignment`): Giải mã chuỗi Base64 và tạo file trên Google Drive **trước khi mở khóa**. Sau khi có link file, chỉ mở `withScriptLock(10000)` trong vài chục mili-giây để append đúng 1 dòng vào Sheet `BaiNop` rồi nhả khóa ngay lập tức.
   - Khóa Script Lock luôn thiết lập timeout 10 giây (`CONFIG.LOCK_TIMEOUT_MS = 10000`). Nếu không lấy được khóa, **bắt buộc** trả về mã lỗi chuẩn `{ success: false, errorCode: 'LOCK_TIMEOUT' }` để Frontend tự động kích hoạt cơ chế Retry + Jitter.

3. **Tối Ưu Hóa I/O Google Sheets (Batch Processing & Caching):**
   - **TUYỆT ĐỐI CẤM** dùng vòng lặp gọi `getValue()` / `setValue()` từng ô riêng lẻ trên Sheet.
   - **BẮT BUỘC** sử dụng module `DbHelper.js` để đọc toàn bộ dữ liệu Sheet 1 lần duy nhất theo lô qua `getDataRange().getValues()` và chuyển đổi sang mảng Object.
   - **BẮT BUỘC** sử dụng `CacheService` cho các truy vấn đọc nhiều (`getAttendanceSessions`, `getAllTasks`, `getAllDocuments`) và phiên điểm danh mở (`OPEN_SESSION_CACHE`) để giảm tải triệt để cho Google Sheets.
   - **BẮT BUỘC** gọi `invalidateSheetCache()` hoặc `invalidateOpenSessionCache()` ngay sau khi hoàn thành bất kỳ thao tác ghi (Mutation).

---

## 3. CHECKLIST KIỂM TRA TRƯỚC KHI TRẢ CODE MỚI (VERIFICATION CHECKLIST)

Mỗi khi tạo mới hoặc chỉnh sửa code trong dự án, lập trình viên/AI cần rà soát qua 6 tiêu chí:

- [ ] **1. Không có `window.*`:** Toàn bộ hàm mới được xuất dạng ES6 module (`export`) và gắn qua `data-action` hoặc event listener chuyên biệt.
- [ ] **2. Không có `onclick` inline:** Mọi thẻ HTML mới không chứa thuộc tính `onclick`, `onchange`, `onsubmit`.
- [ ] **3. Đã escape XSS:** Mọi biến nối chuỗi vào HTML đều được bọc qua `escapeHTML()`.
- [ ] **4. An toàn ScriptLock:** Không có bất kỳ dòng `DriveApp` hay `MailApp` nào nằm trong `withScriptLock()`.
- [ ] **5. Xác thực an toàn:** Mọi API mới của Member đều lấy `mssv` từ `currentUser` (Session Token), không dùng `payload.mssv`.
- [ ] **6. Không code viết tắt:** Không sử dụng code rút gọn, placeholder `// ...` gây đứt gãy hệ thống.
