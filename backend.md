# HƯỚNG DẪN KIẾN TRÚC & DỊCH VỤ BACKEND (`backend.md`)
> **Nền tảng:** Google Apps Script (GAS) kết hợp Google Sheets & Google Drive  
> **Mô hình:** Headless JSON RESTful API (Phục vụ độc lập cho Web App GitHub Pages / Localhost)  
> **Khả năng chịu tải:** Tối ưu hóa xử lý đồng thời 30–50 thành viên thao tác cùng lúc (Điểm danh PIN, Nộp bài tập).

---

## 1. Cấu Trúc Thư Mục Backend (`gas-backend/`)

```text
gas-backend/
├── appsscript.json             # File cấu hình quyền truy cập (OAuth Scopes, V8 Engine)
├── Config.js                   # Cấu hình ID Spreadsheet, Root Drive Folder, hằng số tên Sheet, phân loại quyền Action
├── DbHelper.js                 # Helper xử lý Batch I/O Sheet, Server CacheService và Khóa đồng thời withScriptLock
├── Router.js                   # Bộ định tuyến tập trung: Xử lý doGet, doPost và Middleware xác thực Token/Phân quyền Role
├── Service_Auth.js             # Dịch vụ xác thực: Sinh sessionToken (UUID), Cache OTP 5 phút, gửi mã qua Gmail
├── Service_Member.js           # Dịch vụ nhân sự & Buổi sinh hoạt: Điểm danh PIN tốc độ cao (OPEN_SESSION_CACHE)
├── Service_Task.js             # Dịch vụ nhiệm vụ: Tạo bài tập, tự động cấp phát Folder trên Google Drive
├── Service_Submit.js           # Dịch vụ nộp bài: Lưu tệp Base64 vào Google Drive TRƯỚC khi khóa, duyệt bài
├── Service_Doc.js              # Dịch vụ kho tài liệu học thuật: Phân loại chuyên đề, lưu trữ link Drive
├── Service_Quiz.js             # Dịch vụ trắc nghiệm & ôn luyện: Đề thi, bảng xếp hạng, Zen Focus Arena, hồ sơ luyện tập
└── Service_Campaign.js         # Dịch vụ sự kiện, hẹn giờ tự động, gửi email hàng loạt có chọn lọc và đổi voucher đặc quyền
```

---

## 2. Cấu Trúc Cơ Sở Dữ Liệu Google Sheets

Hệ thống lưu trữ trên Google Spreadsheet thông qua các sheet tiêu chuẩn:

| Tên Sheet | Mục đích | Các cột dữ liệu (Schema) |
| :--- | :--- | :--- |
| `ThanhVien` | Quản lý nhân sự | `MSSV`, `HoTen`, `Email`, `Lớp`, `Ban`, `Role` (ADMIN/MEMBER), `TrangThai` (Active/Inactive), `NgayThamGia`, `Sex` (male/female), `Gift2010` (JSON thông tin quà 20/10) |
| `DiemDanh` | Buổi học & Chuyên đề | `SessionID`, `TenBuoiHop`, `MaPin`, `TrangThai` (Open/Closed), `DS_CoMat` (JSON array MSSV), `NgayDienRa`, `NoiDungChuyenDe`, `LinkTaiLieu`, `TagChuyenDe`, `PhongHoc` |
| `NhiemVu` | Danh mục bài tập | `TaskID`, `TieuDe`, `MoTa`, `NguoiNhan` (ALL hoặc MSSV), `Deadline`, `FolderID`, `TrangThai` (Open/Closed), `SessionID` |
| `BaiNop` | Danh sách nộp bài | `SubID`, `TaskID`, `MSSV`, `HoTen`, `Email`, `TenFile`, `DriveLink`, `ThoiGianNop`, `TrangThaiDuyet` (Pending/Approved/Rejected), `Feedback` |
| `TaiLieu` | Kho học liệu CLB | `DocID`, `TenTaiLieu`, `PhanLoai`, `LinkDrive`, `MoTa` |
| `TracNghiem` | Ngân hàng đề thi trắc nghiệm | `QuizID`, `SessionID`, `TieuDe`, `ThoiGianLamBai`, `TrangThai` (Open/Closed), `DanhSachCauHoi` (JSON), `DiemToiDa`, `NgayTao` |
| `KetQuaQuiz` | Lịch sử nộp bài & Bảng điểm | `ResultID`, `QuizID`, `MSSV`, `HoTen`, `DiemSo`, `CauDung`, `TongCau`, `ChiTietTraLoi` (JSON), `ThoiGianNop`, `TrangThai` (Pass/Fail) |
| `HoSoQuiz` | Hồ sơ gamification & Ôn luyện | `MSSV`, `WrongQuestionIds` (JSON), `BookmarkedQuestionIds` (JSON), `StreakDays`, `LastActiveDate` |
| `DonXinVang` | Đơn xin vắng sinh hoạt & duyệt phép | `AbsenceID`, `SessionID`, `MSSV`, `HoTen`, `Email`, `LyDo`, `ChiTiet`, `MinhChungLink`, `ThoiGianGui`, `TrangThaiDuyet` (Pending/Approved/Rejected/Cancelled), `Feedback`, `NguoiDuyet`, `ThoiGianDuyet` |

---

## 3. Cơ Chế Xử Lý JSON API & Vượt Rào Cản CORS

### 3.1. Điểm Tiếp Nhận Request (`Router.js`)
- `doGet(e)`: Nhận request qua URL parameter (dùng để ping kiểm tra kết nối hoặc lấy dữ liệu công khai).
- `doPost(e)`: Nhận request qua body JSON từ `fetch()` của Frontend với cấu trúc chuẩn:
  ```json
  {
    "action": "tên_hành_động",
    "token": "mã_session_token_uuid",
    "payload": { ... }
  }
  ```

### 3.2. Chống Lỗi CORS Preflight (OPTIONS Request)
- Trình duyệt web tự động gửi yêu cầu preflight `OPTIONS` khi fetch có header `Content-Type: application/json`.
- Google Apps Script **không hỗ trợ** xử lý `OPTIONS` preflight, dẫn đến lỗi CORS.
- **Giải pháp chuẩn:** Frontend bắt buộc gửi với header `Content-Type: text/plain;charset=utf-8`. Backend nhận dữ liệu thô từ `e.postData.contents` và parse bằng `JSON.parse()`.
- Phản hồi từ Backend luôn trả về qua `ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON)`.

---

## 4. Các Dịch Vụ Nghiệp Vụ & Bảo Mật Middleware

### 4.1. Xác Thực Token-Based & Middleware Phân Quyền (`Service_Auth.js` & `Router.js`)
1. **Quy trình cấp phát Token an toàn:**
   - Khi sinh viên gọi `verifyLoginOtp(mssv, otp)` thành công, Backend sinh một `sessionToken = Utilities.getUuid()`.
   - Lưu thông tin phiên vào `CacheService` với key `AUTH_TOKEN_<token>` trong thời hạn 6 tiếng, đồng thời lưu dự phòng vào `PropertiesService`.
   - Đối tượng phiên lưu trữ bao gồm: `{ mssv, hoTen, email, role, trangThai, createdAt }`.
2. **Middleware Phân quyền tại `Router.js`:**
   - **`PUBLIC_ACTIONS`** (`ping`, `requestLoginOtp`, `verifyLoginOtp`, `getAuthStatus`): Cho phép truy cập không cần token.
   - **`MEMBER_ACTIONS`** (`checkInAttendance`, `submitTaskAssignment`, `getMemberSubmissions`, `logoutUser`, `saveMemberGift`, `submitQuiz`, `submitAbsenceRequest`, `getMemberAbsenceRequests`, `cancelAbsenceRequest`...): Bắt buộc có token hợp lệ. Router tự động tiêm `currentUser.mssv`, `currentUser.hoTen`, `currentUser.email` vào payload. **Tuyệt đối không tin tưởng hay nhận MSSV giả mạo từ client.**
   - **`ADMIN_ACTIONS`** (`createAttendanceSession`, `createTask`, `reviewSubmission`, `getAllMembers`, `getAllAbsenceRequests`, `reviewAbsenceRequest`, `adminManualCheckIn`...): Bắt buộc token hợp lệ và `currentUser.role === 'ADMIN'`. Nếu vi phạm, trả về mã lỗi `403 FORBIDDEN`.
   - **`QUERY_ACTIONS`** (`getAttendanceSessions`, `getAllTasks`, `getAllDocuments`, `getAbsenceRequestsBySession`, `getAppInitData`): Cho phép mọi người dùng đã xác thực truy vấn.

### 4.2. Buổi Sinh Hoạt & Điểm Danh PIN Tốc Độ Cao (`Service_Member.js`)
- `getAttendanceSessions()`: Tải danh sách buổi họp, kết hợp `CacheService` phía máy chủ để giảm tải I/O.
- `createAttendanceSession(data)`: Tạo buổi họp mới, tự động sinh mã PIN ngẫu nhiên, vô hiệu hóa cache cũ.
- `checkInAttendance(pinCode, mssv)`:
  - **Tối ưu chịu tải 30–50 người cùng lúc:** Sử dụng `CacheService` lưu thông tin phiên đang mở (`OPEN_SESSION_CACHE`) để kiểm tra mã PIN tức thì trong RAM mà không cần đọc Sheet mỗi lượt.
  - Khi khớp mã PIN, mở micro-lock `withScriptLock(10000)` trong vài chục mili-giây để đọc và ghi danh sách MSSV vào cột `DS_CoMat`.

### 4.3. Quản Lý Nhiệm Vụ & Nộp Bài Thực Hành (`Service_Task.js` & `Service_Submit.js`)
- `createTask(data)`: Tạo thư mục nhiệm vụ trên Google Drive trước, sau đó lock ghi dòng mới vào sheet `NhiemVu`.
- `submitTaskAssignment(data, currentUser)`:
  - **Quy tắc sống còn:** Giải mã Base64 và gọi `DriveApp.createFile()` **HOÀN TOÀN BÊN NGOÀI KHÓA SCRIPT LOCK** để tránh block luồng của các thành viên khác.
  - Sau khi có URL tệp thành công, chỉ mở `withScriptLock(10000)` trong vài chục mili-giây để append một dòng ghi nhận vào sheet `BaiNop` rồi nhả khóa ngay.
  - MSSV, Họ tên, Email luôn được lấy trực tiếp từ `currentUser` (Session Token) bảo đảm chính chủ.
- `reviewSubmission(data)`: Quản trị viên cập nhật trạng thái duyệt bài (`Approved` / `Rejected`) và lưu nhận xét phản hồi.

### 4.4. Trắc Nghiệm Ôn Luyện & Thi Thật (`Service_Quiz.js`)
1. **Lưu trữ & Bảo mật đề thi (`getQuizBySession`, `saveQuiz`):**
   - Đề thi lưu trữ dưới dạng JSON mảng câu hỏi trong sheet `TracNghiem`.
   - **Bảo mật chống lộ đề:** Khi sinh viên chưa hoàn thành bài thi chính thức, API tự động lược bỏ `dapAnDung` và `giaiThich` trước khi trả về client. Chỉ khi đã nộp bài thành công hoặc người yêu cầu là Quản trị viên (`role === 'ADMIN'`), các trường đáp án và giải thích mới được trả về.
2. **Nộp bài thi chính thức (`submitQuiz`):**
   - **Single Official Submission Guard:** Kiểm tra sheet `KetQuaQuiz`. Nếu sinh viên đã có bản ghi thi chính thức cho `QuizID` đó, chặn với mã lỗi `ALREADY_SUBMITTED`.
   - Chế độ ôn luyện tự do (`isPractice = true`) cho phép sinh viên nộp bài nhiều lần để xem điểm và giải thích mà không ảnh hưởng kết quả thi chính thức.
   - Chấm điểm tự động trên server, tính điểm theo thang 100 và ghi nhận vào `KetQuaQuiz`.
3. **Ôn luyện Gamification (`recordQuizAnswer`, `toggleQuestionBookmark`, `getPersonalQuizPool`):**
   - Lưu trữ các câu hỏi làm sai (`WrongQuestionIds`) và câu hỏi đánh dấu sao (`BookmarkedQuestionIds`) trong sheet `HoSoQuiz`.
   - Hỗ trợ Zen Focus Arena lấy ngân hàng câu hỏi sai / bookmark để sinh viên ôn tập trước kỳ thi.
   - Các thao tác ghi nhận câu trả lời cá nhân được tối ưu ghi không block hệ thống.

### 4.5. Kho Học Liệu & Quản Lý Tài Liệu (`Service_Doc.js`)
- `getAllDocuments()`: Đọc danh sách tài liệu từ sheet `TaiLieu`, hỗ trợ CacheService 3 phút.
- `createDocument`, `updateDocument`, `deleteDocument`: Quản lý tài liệu theo danh mục chuẩn học thuật và danh mục tùy biến.

### 4.6. Quản Lý Sự Kiện, Auto-Scheduler, Gửi Mail & Đổi Voucher Đặc Quyền (`Service_Campaign.js`)
1. **Quản lý Chiến dịch & Hẹn giờ tự động (`getAllCampaigns`, `getActiveCampaign`, `setActiveCampaign`, `saveCampaignConfig`):**
   - Hỗ trợ danh mục chiến dịch mẫu: `OCT20` (20/10), `TET` (Tết Khai Xuân), `MARCH8` (8/3), `ANNIVERSARY` (Sinh nhật CLB), và `NONE` (Tắt sự kiện về chế độ thường).
   - Lưu trữ cấu hình chiến dịch, ngày bắt đầu (`startDate`), ngày kết thúc (`endDate`), đối tượng (`targetAudience`: `all` / `female`) và email template vào `ScriptProperties` (`BHT_CAMPAIGN_CONFIG`, `BHT_ACTIVE_CAMPAIGN_ID`).
   - Chuẩn hóa Envelope dữ liệu: `{ success: true, data: { activeCampaignId, campaigns, lastEmailDispatch } }` bảo đảm đồng bộ "Zero Discrepancy" giữa GAS Production và Mock Dev.
2. **Phát gửi Email hàng loạt có chọn lọc (`sendEventBulkEmail`):**
   - **Gửi Email ngoài Lock:** Gọi `MailApp.sendEmail()` hoàn toàn bên ngoài `withScriptLock()` để không bao giờ gây nghẽn tiến trình của toàn hệ thống.
   - **Hỗ trợ chọn lọc danh sách người nhận (`selectedMssvs`):** Cho phép Admin chỉ định mảng MSSV cần gửi thay vì gửi tràn lan. Nếu mảng `selectedMssvs` được cung cấp, hệ thống chỉ lọc gửi cho các MSSV này.
   - Cá nhân hóa các biến động: `{hoTen}`, `{mssv}`, `{tenChienDich}`, `{linkWeb}`, `{loiChuc}`.
   - Kiểm soát hạn ngạch `MailApp.getRemainingDailyQuota()` và tự động lưu nhật ký gửi gần nhất vào `ScriptProperties` (`BHT_LAST_EMAIL_DISPATCH`).
3. **Đổi Voucher Đặc quyền Học thuật (`redeemPrivilegeVoucher`):**
   - Áp dụng mã quà tặng sinh ngẫu nhiên từ sự kiện vào các tác vụ thực tế:
     - **Gia hạn bài tập:** Tự động cộng thêm +24h / +48h vào hạn nộp của sinh viên.
     - **Cộng điểm bài thi Trắc nghiệm:** Tự động cộng +10 điểm / +15 điểm trực tiếp vào kết quả bài thi trong sheet `KetQuaQuiz`.
   - Đánh dấu trạng thái quà đã sử dụng trong cột `Gift2010` của sheet `ThanhVien` để chống tái sử dụng mã voucher (`markMemberGiftUsedInSheet`).

### 4.7. Quản Lý Đơn Xin Vắng Mặt & Điểm Danh Bổ Sung Thủ Công (`Service_Member.js` & `Service_Auth.js`)
1. **Nộp và Quản lý Đơn Xin Vắng Mặt:**
   - `submitAbsenceRequest(data, currentUser)`: Sinh viên nộp đơn báo vắng. Hệ thống tự động kiểm tra:
     - Buổi sinh hoạt phải còn đang mở (chặn nếu `TrangThai === 'Closed'`).
     - Sinh viên chưa có mặt trong danh sách `DS_CoMat` của buổi đó.
     - Chống nộp trùng đơn cho cùng một buổi học.
     - Tự động sinh `AbsenceID` và lưu vào sheet `DonXinVang` với trạng thái ban đầu `Pending`.
   - `getMemberAbsenceRequests(mssv)`: Tra cứu toàn bộ lịch sử đơn xin vắng của sinh viên (bỏ qua các đơn đã hủy `Cancelled`).
   - `cancelAbsenceRequest(absenceId, mssv)`: Cho phép sinh viên tự hủy đơn xin vắng khi đơn còn ở trạng thái `Pending`.
   - `getAllAbsenceRequests()` & `getAbsenceRequestsBySession(sessionId)`: Quản trị viên truy vấn danh sách đơn xin vắng (hỗ trợ CacheService 3 phút).
2. **Phê Duyệt Đơn Xin Vắng (Admin Review):**
   - `reviewAbsenceRequest(data, reviewerMssv)`: Quản trị viên phê duyệt (`Approved` - Nghỉ có phép) hoặc từ chối (`Rejected` - Nghỉ không phép).
   - Ghi nhận `Feedback` nhận xét, `NguoiDuyet` (Admin MSSV) và `ThoiGianDuyet`. Thao tác được bọc trong `withScriptLock()` và tự động xóa cache `DON_XIN_VANG`.
3. **Điểm Danh Bổ Sung Thủ Công Bằng MSSV (`adminManualCheckIn`):**
   - `adminManualCheckIn(data, reviewerMssv)`: Dành cho Quản trị viên điểm danh bù cho sinh viên (quên điện thoại, lỗi mạng, hỗ trợ sự kiện).
   - Thêm MSSV vào mảng `DS_CoMat` trong sheet `DiemDanh` qua `withScriptLock()`.
   - **Tự động hủy đơn vắng (Auto Cancel):** Nếu sinh viên đã gửi đơn xin vắng trước đó cho buổi này, hệ thống tự động cập nhật đơn sang `Cancelled` vì sinh viên đã có mặt thực tế.
4. **Khởi Động Nhanh Qua Single-Request Bootstrap (`getAppInitData`):**
   - Đóng gói toàn bộ tài nguyên khởi tạo (`tasks`, `attendance`, `docs`, `submissions`, `members`, `activeCampaign`, `absences`) chỉ trong 1 HTTP request duy nhất, giảm 85% số lượt kết nối mạng ban đầu và triệt tiêu CLS.

---

## 5. An Toàn Dữ Liệu & Khóa Đồng Thời (`withScriptLock`)

Mọi thao tác ghi/sửa dữ liệu trên Google Sheets đều được quản lý tập trung trong `DbHelper.js`:

```javascript
function withScriptLock(callback, timeoutMs = CONFIG.LOCK_TIMEOUT_MS) {
  const lock = LockService.getScriptLock();
  let acquired = false;
  try {
    acquired = lock.tryLock(timeoutMs); // Chờ tối đa 10 giây
    if (!acquired) {
      // Trả về mã lỗi chuẩn để Frontend tự động kích hoạt Retry + Jitter
      return {
        success: false,
        errorCode: 'LOCK_TIMEOUT',
        message: 'Hệ thống đang bận xử lý nhiều yêu cầu đồng thời, vui lòng thử lại sau vài giây!'
      };
    }
    const result = callback();
    SpreadsheetApp.flush();
    return result;
  } catch (error) {
    console.error('[LockService] Lỗi thực thi thao tác có khóa:', error);
    return {
      success: false,
      errorCode: 'LOCK_EXECUTION_ERROR',
      message: 'Lỗi ghi nhận dữ liệu: ' + (error.message || error.toString())
    };
  } finally {
    if (acquired) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}
```

---

## 6. Hướng Dẫn Triển Khai (Deploy Web App)

1. Mở thư mục `gas-backend/` và đẩy code lên dự án Apps Script bằng clasp: `npx @google/clasp push` hoặc sao chép trực tiếp vào Script Editor.
2. Trên giao diện Apps Script: Chọn **Deploy** -> **New Deployment**.
3. Chọn loại: **Web App**.
4. Thiết lập quan trọng:
   - **Execute as:** `Me (tài khoản Google của bạn)`.
   - **Who has access:** `Anyone (Bất kỳ ai)`.
5. Bấm **Deploy** và sao chép đường dẫn **Web App URL** (có dạng `https://script.google.com/macros/s/.../exec`).
6. Dán URL này vào Frontend thông qua giao diện hoặc lưu vào `bht_gas_api_url` trong `localStorage` để kết nối hệ thống thật.
