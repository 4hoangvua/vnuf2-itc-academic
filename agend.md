# SYSTEM SPECIFICATION & AI AGENT RULES: HỆ THỐNG QUẢN LÝ BAN HỌC THUẬT (GAS WEB APP)

## 1. Bối cảnh & Vai trò của AI Agent (Context & Role)
Bạn là một Senior Full-stack Developer chuyên sâu về **Google Apps Script (GAS)**, **HTML Service**, **Tailwind CSS** và tối ưu hóa hệ sinh thái **Google Workspace (Sheets, Drive)**. 
Nhiệm vụ của bạn là hỗ trợ xây dựng một ứng dụng **Web App nội bộ quản lý Ban Học thuật (CLB Tin học)** chạy hoàn toàn miễn phí trên nền tảng Google Apps Script, được phát triển dưới local bằng công cụ `clasp` và **Antigravity IDE**.

---

## 2. Quy tắc Kỹ thuật Bắt buộc cho AI Agent (Strict Engineering Rules)

Khi sinh mã nguồn (code generation) cho dự án này, Agent **BẮT BUỘC** phải tuân thủ các quy tắc sống còn sau đây để vượt qua giới hạn (Quota & Timeout 6 phút) của Google Apps Script:

1. **Quy tắc Định dạng File dưới Local (`clasp`):**
   - Toàn bộ file Backend viết dưới máy tính phải dùng đuôi `.js` (khi `clasp push` sẽ tự chuyển thành `.gs`).
   - Toàn bộ file trong dự án GAS nằm chung trong một **Global Scope** (không dùng `import`/`export` của ES6 giữa các file `.js`).
   - Google Apps Script **không hỗ trợ thư mục con thực sự** trên đám mây. Nếu để file trong thư mục dưới local, cần cấu hình `rootDir` trong `.clasp.json` hoặc đặt phẳng các file cùng cấp theo quy ước đặt tên rõ ràng (VD: `Backend_Auth.js`, `View_Admin.html`).

2. **Quy tắc Giao tiếp Frontend - Backend:**
   - **KHÔNG** dùng `fetch()` hay `XMLHttpRequest` để gọi lại chính Web App (tránh lỗi CORS và redirect của Google).
   - **BẮT BUỘC** sử dụng `google.script.run.withSuccessHandler(...).withFailureHandler(...).tenHamBackend(thamSo)` cho mọi tương tác bất đồng bộ.
   - Mọi dữ liệu trả về từ Backend lên Frontend qua `google.script.run` phải được `JSON.stringify()` hoặc đảm bảo các đối tượng `Date` đã được chuyển thành chuỗi (ISO String / Formatted String), vì `google.script.run` sẽ trả về `null` nếu object chứa trực tiếp kiểu `Date` nguyên thủy của JS.

3. **Quy tắc Chống Xung đột Dữ liệu (Concurrency & Race Condition):**
   - Với quy mô ~50 người truy cập đồng thời (như nộp bài sát giờ, điểm danh), mọi hàm có thao tác **GHI / CẬP NHẬT** vào Google Sheets (`appendRow`, `setValue`, `setValues`) **BẮT BUỘC** phải bọc trong hàm helper `withScriptLock`:
     ```javascript
     function withScriptLock(callback, timeoutMs = 15000) {
       const lock = LockService.getScriptLock();
       const hasLock = lock.tryLock(timeoutMs); // Lưu ý: tryLock trả về boolean, waitLock trả về void
       if (!hasLock) {
         return { success: false, message: 'Hệ thống đang bận xử lý nhiều yêu cầu đồng thời, vui lòng thử lại sau vài giây!' };
       }
       try {
         const result = callback();
         SpreadsheetApp.flush(); // Ép cập nhật dữ liệu ngay lập tức
         return result;
       } catch (err) {
         console.error('withScriptLock error:', err);
         return { success: false, message: 'Lỗi thực thi dữ liệu: ' + err.toString() };
       } finally {
         lock.releaseLock();
       }
     }
     ```

4. **Quy tắc Tối ưu hóa Request & Quota Hệ sinh thái (Quota Optimization):**
   - **TUYỆT ĐỐI KHÔNG** sử dụng cơ chế *Polling* (gọi `setInterval` liên tục mỗi vài giây lên server) ở trang Admin. Chỉ tải dữ liệu 1 lần khi mở trang (`Load on Demand`), cập nhật giao diện trực tiếp (Optimistic UI) hoặc thông qua nút bấm **"Làm mới (Refresh)"**.
   - **Client-side Search:** Khi người dùng gõ vào ô tìm kiếm (tìm thành viên, tìm task, tìm bài nộp), **KHÔNG** gọi request lên server theo từng ký tự gõ. Phải tải mảng dữ liệu về lưu trong biến toàn cục của trình duyệt (`window.appState` hoặc `sessionStorage`) và lọc trực tiếp bằng JavaScript trên trình duyệt.
   - **Chống Double-Click:** Mọi nút bấm gửi dữ liệu (Nộp bài, Tạo Task, Điểm danh) phải bị khóa (`disabled = true`) và hiển thị trạng thái Loading ngay lập tức khi click cho đến khi nhận được phản hồi từ server.
   - **Giới hạn Quota Email:** Tài khoản Google cá nhân (`@gmail.com`) có giới hạn gửi qua `MailApp.sendEmail` tối đa **100 email/ngày** (Workspace là 1.500 email/ngày). Hệ thống kết hợp lưu `bht_mssv` vào `localStorage` ở Client để sau khi xác thực OTP 1 lần, các lần truy cập tiếp theo sẽ tự động đăng nhập mà không tiêu tốn thêm quota gửi email.

5. **Quy tắc Quản lý Đăng nhập & Xác thực (Passwordless Auth & 2-Step OTP):**
   - **KHÔNG** xây dựng hệ thống lưu trữ mật khẩu.
   - Web App được cấu hình Deploy ở chế độ: `Execute as: Me` (Chạy dưới quyền chủ sở hữu để có quyền ghi Sheet/Drive) và `Who has access: Anyone with a Google account`.
   - Sử dụng cơ chế 2 bước: Nhập MSSV -> Hệ thống tự động gửi mã OTP xác thực (6 chữ số ngẫu nhiên, TTL 5 phút lưu trong `CacheService`) về Gmail đã đăng ký qua `MailApp.sendEmail`.
   - Lưu trạng thái thông tin thành viên đã xác thực vào `localStorage` (MSSV) và `sessionStorage` (thông tin phiên) ở phía Client để tự động đăng nhập lại và chuyển tab mượt mà trong kiến trúc Single Page Application (SPA).

6. **Quy tắc Trải nghiệm & Thông báo Phản hồi (Toast & Modern Feedback UI):**
   - **TUYỆT ĐỐI KHÔNG** sử dụng hộp thoại `alert(...)` mặc định của trình duyệt trong toàn bộ hệ thống (kể cả Member và Admin). Hộp thoại native gây gián đoạn luồng sử dụng, thô sơ và không đồng bộ với giao diện hiện đại.
   - Toàn bộ thông báo phản hồi thao tác người dùng (Nộp bài, Điểm danh, Đánh giá bài nộp, Tạo Task, Cập nhật trạng thái, Lỗi nhập liệu, Dung lượng file vượt giới hạn, Lỗi kết nối máy chủ) **BẮT BUỘC** phải sử dụng Component Toast Notification toàn cục (`showToast(message, type)`).
   - Hỗ trợ 4 cấp độ trạng thái rõ rệt: `success` (xanh ngọc/emerald), `error` (đỏ hoa hồng/rose), `warning` (vàng hổ phách/amber), `info` (xanh dương/sky).
   - Toast hiển thị nổi (floating) ở góc dưới phải với phong cách Glassmorphism (`backdrop-blur-md`), tự động trượt ra mượt mà và biến mất sau 4 giây hoặc có thể đóng thủ công bằng nút tắt `x`.

---

## 3. Cấu trúc Cơ sở dữ liệu (Google Sheets Schema)

Tất cả dữ liệu nằm trong 1 file Google Sheets duy nhất (được khai báo qua `SHEET_ID` trong `Config.js`). Bao gồm 5 trang tính (Tabs) với tên và thứ tự cột cố định từ cột A (index 0) trở đi:

### Tab 1: `ThanhVien` (Danh sách trắng & Phân quyền)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- | :--- |
| A (0) | `MSSV` | String | Mã số sinh viên (Khóa chính). |
| B (1) | `HoTen` | String | Họ và tên thành viên. |
| C (2) | `Email` | String | Gmail cá nhân (Có thể để trống ban đầu để sinh viên tự liên kết ở lần đăng nhập đầu tiên). |
| D (3) | `Role` | String | `ADMIN` (Trưởng/Phó ban) hoặc `MEMBER` (Thành viên). |
| E (4) | `TrangThai` | String | `Active` (Đang hoạt động) hoặc `Inactive` (Tạm nghỉ). |
| F (5) | `NgayThamGia`| String | Ngày vào ban (DD/MM/YYYY). |

### Tab 2: `NhiemVu` (Quản lý Task & Folder nộp bài)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- | :--- |
| A (0) | `TaskID` | String | Mã nhiệm vụ tự sinh (VD: `TASK_001`). |
| B (1) | `TieuDe` | String | Tên nhiệm vụ / Bài tập. |
| C (2) | `MoTa` | String | Nội dung yêu cầu chi tiết. |
| D (3) | `NguoiNhan` | String | `ALL` (Cả ban) hoặc danh sách `MSSV` cách nhau bởi dấu phẩy. |
| E (4) | `Deadline` | String | Hạn chót nộp bài (Định dạng ISO `YYYY-MM-DDTHH:mm`). |
| F (5) | `FolderID` | String | ID của thư mục trên Google Drive dành riêng cho Task này (Tự động tạo khi Admin tạo Task). |
| G (6) | `TrangThai` | String | `Open` (Đang mở) hoặc `Closed` (Đã đóng). |

### Tab 3: `BaiNop` (Lịch sử nộp sản phẩm & Duyệt bài)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- | :--- |
| A (0) | `SubID` | String | Mã lượt nộp tự sinh (VD: `SUB_1700001`). |
| B (1) | `TaskID` | String | Mã nhiệm vụ tương ứng. |
| C (2) | `MSSV` | String | Mã sinh viên người nộp. |
| D (3) | `HoTen` | String | Họ tên người nộp. |
| E (4) | `Email` | String | Email người nộp. |
| F (5) | `TenFile` | String | Tên file sau khi đã chuẩn hóa (`[MSSV]_[HoTen]_[TenGoc]`). |
| G (6) | `DriveLink` | String | URL xem trực tiếp file trên Google Drive (`file.getUrl()`). |
| H (7) | `ThoiGianNop`| String | Thời gian nộp thực tế (`DD/MM/YYYY HH:mm:ss`). |
| I (8) | `TrangThaiDuyet`| String | `Pending` (Chờ duyệt), `Approved` (Đạt), `Rejected` (Cần sửa lại). |
| J (9) | `Feedback` | String | Nhận xét của Trưởng ban. |

### Tab 4: `DiemDanh` (Quản lý họp ban / Workshop)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- | :--- |
| A (0) | `SessionID` | String | Mã buổi sinh hoạt (VD: `MEET_01`). |
| B (1) | `TenBuoiHop`| String | Chủ đề buổi họp / đào tạo. |
| C (2) | `MaPin` | String | Mã PIN 4-6 số để thành viên nhập điểm danh. |
| D (3) | `TrangThai` | String | `Open` (Cho phép điểm danh) hoặc `Closed` (Đã khóa). |
| E (4) | `DS_CoMat` | String | Chuỗi JSON hoặc danh sách `MSSV` đã điểm danh thành công. |

### Tab 5: `TaiLieu` (Kho học liệu nội bộ)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- | :--- |
| A (0) | `DocID` | String | Mã tài liệu. |
| B (1) | `TenTaiLieu`| String | Tên tài liệu / Template. |
| C (2) | `PhanLoai` | String | `Slide`, `Code`, `QuyDinh`, `BieuMau`. |
| D (3) | `LinkDrive` | String | Đường dẫn tài liệu. |
| E (4) | `MoTa` | String | Ghi chú hướng dẫn sử dụng. |

---

## 4. Kiến trúc Lưu trữ Google Drive (Drive Storage Flow)

1. Có 1 thư mục gốc trên Google Drive, lưu ID trong biến `ROOT_FOLDER_ID` tại `Config.js`.
2. Khi Admin tạo một nhiệm vụ mới (VD: `TieuDe = "Soạn Slide Python"`), hàm Backend sẽ gọi:
   ```javascript
   const rootFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
   const taskFolder = rootFolder.createFolder(`[${taskId}]_${tieuDe}`);
   const folderId = taskFolder.getId();
   ```
   Sau đó lưu `folderId` vào cột F của bảng `NhiemVu`.
3. Khi Thành viên nộp file:
   - Frontend dùng `FileReader` chuyển file thành chuỗi `base64` (cắt bỏ phần header `data:...;base64,`).
   - Gửi `{ taskId, fileName, mimeType, base64Data }` xuống Backend.
   - Backend giải mã:
     ```javascript
     const decoded = Utilities.base64Decode(base64Data);
     const blob = Utilities.newBlob(decoded, mimeType, `${mssv}_${hoTen}_${fileName}`);
     const targetFolder = DriveApp.getFolderById(taskFolderId);
     const uploadedFile = targetFolder.createFile(blob);
     const fileUrl = uploadedFile.getUrl();
     ```

---

## 5. Cấu trúc File Dự án (File Structure)

Dự án đặt toàn bộ mã nguồn trong thư mục `src/` (cấu hình `"rootDir": "./src"` trong `.clasp.json`):

```text
📁 project-root/
 ├── 📄 .clasp.json                # Cấu hình ID Script và rootDir: "./src"
 ├── 📄 agend.md                 # Tài liệu đặc tả hệ thống cho AI Agent (File này)
 └── 📁 src/
      ├── 📄 appsscript.json        # Khai báo OAuth Scopes và cấu hình WebApp
      ├── 📄 Config.js              # Chứa SHEET_ID, ROOT_FOLDER_ID và hàm helper đọc/ghi Sheet
      ├── 📄 Main.js                # Chứa doGet(e) và hàm include(filename) để render HTML
      ├── 📄 Service_Auth.js        # Logic kiểm tra Email, ghép nối MSSV lần đầu (First-time Bind)
      ├── 📄 Service_Task.js        # Logic tạo Task (kèm tạo Folder Drive), lấy danh sách Task
      ├── 📄 Service_Submit.js      # Logic nhận file Base64, đẩy lên Drive, ghi Sheet có LockService
      ├── 📄 Service_Member.js      # Logic quản lý thành viên, tạo phiên điểm danh và chấm công
      ├── 📄 Index.html             # Khung SPA chính, chứa Sidebar, Header, Loading Overlay
      ├── 📄 Styles.html            # Nhúng Tailwind CSS CDN và các class tùy chỉnh
      ├── 📄 Scripts.html           # Quản lý State ở Client, hàm gọi google.script.run, lọc tìm kiếm
      ├── 📄 View_BindAccount.html  # Màn hình yêu cầu nhập MSSV cho người mới chưa có Gmail trong Sheet
      ├── 📄 View_Member.html       # Giao diện Thành viên (Xem việc, Nộp bài, Điểm danh, Tài liệu)
      └── 📄 View_Admin.html        # Giao diện Trưởng ban (Thống kê, Giao việc, Duyệt bài, Quản lý TV)
```

---

## 6. Chi tiết Luồng Nghiệp vụ Cốt lõi (Core Business Logic)

### 6.1. Luồng Xác thực & Ghép nối Tài khoản (2-Step Gmail OTP & Session Persistence)

> **Bối cảnh kỹ thuật thực tế:**  
> Do Web App được triển khai ở chế độ `Execute as: Me` trên tài khoản Google cá nhân (`@gmail.com`), hàm `Session.getActiveUser().getEmail()` sẽ trả về chuỗi rỗng `""` đối với khách truy cập ngoài nhằm bảo vệ quyền riêng tư của Google. Vì vậy, hệ thống đã được thiết kế lại theo luồng **Xác thực 2 bước qua mã OTP gửi về Gmail** kết hợp bộ nhớ đệm `localStorage` ở Client để người dùng chỉ cần xác thực một lần.

#### Giai đoạn 1: Kiểm tra phiên truy cập (`getAuthStatus(cachedMssv)`)
Khi vừa tải trang, Client gửi lên `cachedMssv` (lấy từ `localStorage.getItem('bht_mssv')`):
1. **Trường hợp A (Có `userEmail` - dành cho chính chủ deploy hoặc cùng Workspace domain):**
   - Tìm kiếm `userEmail` trong cột Email của bảng `ThanhVien`.
   - Nếu `TrangThai === 'Inactive'` -> Trả về `status: 'BLOCKED'`.
   - Nếu tìm thấy và `Active` -> Trả về `status: 'AUTHENTICATED'` kèm thông tin `user`.
   - Nếu chưa có trong danh sách -> Trả về `status: 'NEED_BINDING'`.
2. **Trường hợp B (Không có `userEmail` - người dùng thông thường):**
   - **Nếu có `cachedMssv` hợp lệ trong `localStorage`:** Hệ thống tự động đối chiếu trong bảng `ThanhVien`. Nếu tài khoản còn `Active`, chuyển thẳng vào giao diện mà **không cần đăng nhập lại**.
   - **Nếu không có `cachedMssv` hoặc là thiết bị mới:** Trả về `status: 'PROMPT_MSSV'`, hiển thị màn hình đăng nhập (`View_BindAccount.html`).

---

#### Giai đoạn 2: Yêu cầu gửi mã xác thực (`requestLoginOtp(rawMssv, rawEmail)`)
Khi người dùng nhập `MSSV` trên màn hình:
1. Hệ thống tìm kiếm dòng có `MSSV` tương ứng trong bảng `ThanhVien` (có kèm hàm chuẩn hóa số mũ khoa học `E+`).
2. **Kiểm tra tính hợp lệ:**
   - Nếu không tìm thấy MSSV: Báo lỗi *"Mã sinh viên không nằm trong danh sách Ban Học Thuật!"*.
   - Nếu `TrangThai === 'Inactive'`: Báo lỗi *"Tài khoản của bạn đang ở trạng thái Tạm khóa!"*.
3. **Phân loại thành viên:**
   - **Thành viên cũ (Cột Email đã có sẵn trong Sheet):** Hệ thống tự động lấy địa chỉ Gmail này làm `targetEmail`.
   - **Thành viên mới lần đầu vào hệ thống (Cột Email trong Sheet đang trống):**
     - Giao diện tự động mở rộng ô nhập địa chỉ Gmail cá nhân.
     - Kiểm tra định dạng Regex email hợp lệ.
     - Kiểm tra email có bị trùng với thành viên khác trong ban hay không.
4. **Tạo OTP & Gửi Email:**
   - Sinh mã OTP ngẫu nhiên gồm 6 chữ số.
   - Lưu vào `CacheService.getScriptCache()` với key `OTP_[MSSV]` trong thời hạn **5 phút (300 giây)**.
   - Gửi email định dạng HTML chuyên nghiệp qua `MailApp.sendEmail` tới `targetEmail`.
   - Trả về kết quả thành công kèm địa chỉ email đã che mờ (VD: `ho***@gmail.com`) để người dùng dễ kiểm tra hộp thư.

---

#### Giai đoạn 3: Xác thực mã OTP & Hoàn tất đăng nhập (`verifyLoginOtp(rawMssv, inputOtp)`)
Người dùng nhập 6 số OTP (có đồng hồ đếm ngược 5:00 và nút "Gửi lại mã OTP"):
1. Hệ thống đọc mã từ `CacheService`. Nếu không thấy -> Báo lỗi *"Mã OTP đã hết hạn hoặc chưa được tạo"*.
2. Nếu mã OTP khớp:
   - Xóa mã OTP khỏi `CacheService` để tránh tấn công Replay.
   - Bọc trong `withScriptLock`: Nếu thành viên mới chưa có email trong Sheet, hệ thống tự động ghi địa chỉ Gmail vừa xác minh vào Cột C của bảng `ThanhVien`.
   - Trả về thông tin sinh viên `{ mssv, hoTen, email, role, trangThai, ngayThamGia }`.
3. Phía Client nhận phản hồi:
   - Lưu `mssv` vào `localStorage.setItem('bht_mssv', user.mssv)`.
   - Lưu toàn bộ `user` vào `sessionStorage`.
   - Chuyển hướng ngay lập tức vào **Giao diện Thành viên (Member View)** hoặc **Giao diện Trưởng ban (Admin View)** tùy theo `role`.

### 6.2. Các phân khu trên Giao diện Thành viên (`View_Member.html`)
- **Dashboard cá nhân:** Hiển thị số nhiệm vụ được giao, số bài đã nộp, số buổi họp đã tham gia.
- **Nhiệm vụ & Nộp bài:** 
  - Hiển thị danh sách các Task đang `Open` được giao cho `ALL` hoặc có chứa `MSSV` của thành viên đó.
  - Tự động đối chiếu với bảng `BaiNop` để hiển thị trạng thái ngay trên từng thẻ Task: *Chưa nộp*, *Đã nộp (Chờ duyệt)*, *Đã duyệt (kèm Feedback)*, hoặc *Yêu cầu sửa lại*.
  - Có nút **"Nộp bài / Nộp lại"** mở Modal chọn file từ máy tính. Kiểm tra nếu `new Date() > new Date(deadline)` thì khóa nút hoặc gắn nhãn *[Nộp trễ]*.
- **Điểm danh nhanh:** Một ô nhập mã PIN 4-6 số khi đi họp ban. Bấm xác nhận -> Ghi MSSV vào cột `DS_CoMat` của phiên họp đang mở.
- **Kho tài liệu:** Danh sách tài liệu học thuật có thanh tìm kiếm lọc tức thì ngay trên trình duyệt.

### 6.3. Các phân khu trên Giao diện Trưởng ban (`View_Admin.html`)
- **Thống kê tổng quan (Overview Cards):** Tổng số thành viên, Tổng số Task đang chạy, Số bài nộp đang chờ duyệt (`Pending`), Tỷ lệ hoàn thành nhiệm vụ.
- **Quản lý Nhiệm vụ (Task Management):**
  - Nút **"Tạo nhiệm vụ mới"**: Nhập Tiêu đề, Mô tả, chọn hạn chót (Deadline), đối tượng nhận -> Tự động tạo Folder trên Drive và thêm dòng mới vào Sheet `NhiemVu`.
  - Nút đóng/mở Task.
- **Duyệt bài nộp (Review Hub):**
  - Hiển thị bảng danh sách toàn bộ bài nộp từ Sheet `BaiNop`.
  - Có bộ lọc trên Client (Lọc theo Task, lọc theo trạng thái `Pending`/`Approved`/`Rejected`, ô tìm kiếm theo Tên/MSSV).
  - Nút bấm mở xem file trực tiếp trên Google Drive ở tab mới.
  - Cột thao tác nhanh: Nhập `Feedback`, bấm nút **Duyệt (Approve)** hoặc **Yêu cầu sửa (Reject)**.
- **Quản lý Nhân sự & Điểm danh:**
  - Xem danh sách thành viên, thêm nhanh thành viên mới (chỉ cần nhập `MSSV`, `HoTen`, `Role`, để trống cột `Email` cho thành viên tự vào liên kết).
  - Nút **"Reset Email"** trong trường hợp thành viên muốn đổi sang tài khoản Gmail khác.
  - Tạo phiên điểm danh mới kèm mã PIN ngẫu nhiên và bật/tắt trạng thái cho phép điểm danh.

### 6.4. Hệ thống Thông báo Toàn cục & Phản hồi Tương tác (Global Toast System)
- **Cơ chế hoạt động:**
  - Thay thế 100% các lệnh `alert(...)` mặc định của trình duyệt bằng hàm `showToast(message, type)`.
  - Phân loại 4 nhóm thông báo với tone màu chuẩn UI/UX:
    - `success`: Xanh ngọc (`bg-emerald-950/95`, border `border-emerald-700/60`, text `text-emerald-100`) - thông báo thành công (nộp bài, điểm danh, tạo task, duyệt bài, v.v.).
    - `error`: Đỏ tươi (`bg-rose-950/95`, border `border-rose-700/60`, text `text-rose-100`) - lỗi kết nối, tài khoản bị khóa, thao tác thất bại.
    - `warning`: Vàng cam (`bg-amber-950/95`, border `border-amber-700/60`, text `text-amber-100`) - cảnh báo dung lượng file (>15MB), chưa chọn file.
    - `info`: Xanh dương (`bg-slate-900/95`, border `border-slate-700/60`, text `text-white`) - thông báo trạng thái đang tải, liên hệ BCN.
  - **Tự động đóng & Điều khiển:** Tự động ẩn sau 4000ms hoặc người dùng có thể click nút đóng `x` để ẩn ngay lập tức.
  - **Lớp chặn tương tác:** Kết hợp với `#global-loading-overlay` khi tải trang lần đầu và disable các nút bấm nộp/tạo dữ liệu để ngăn chặn double-click.

---

## 7. Cấu hình `appsscript.json` Chuẩn (Required Manifest)

File `src/appsscript.json` bắt buộc phải khai báo đầy đủ các OAuth Scopes sau để không bị lỗi thiếu quyền khi thao tác với Drive, Sheets, gửi OTP qua Mail và lấy Email người dùng:

```json
{
  "timeZone": "Asia/Ho_Chi_Minh",
  "dependencies": {},
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  },
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/script.send_mail",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "runtimeVersion": "V8"
}
```

---

## 8. Thứ tự Thực thi Dành cho AI Agent (Step-by-Step Execution Plan)

Khi người dùng yêu cầu bắt đầu viết code, AI Agent hãy thực hiện tuần tự theo từng bước (Module) dưới đây để đảm bảo code sạch, chạy được ngay và không bị quá tải độ dài phản hồi:

- **Bước 1 (Core Backend & Config):** Viết file `src/appsscript.json`, `src/Config.js` (chứa các hàm đọc/ghi dữ liệu Sheet sang dạng mảng JSON dễ dùng, hàm bọc `LockService`) và `src/Main.js` (`doGet`, `include`).
- **Bước 2 (Authentication & Member Service):** Viết `src/Service_Auth.js` và `src/Service_Member.js` xử lý đăng nhập, ghép nối MSSV lần đầu, quản lý thành viên và điểm danh.
- **Bước 3 (Task & Submission Service):** Viết `src/Service_Task.js` và `src/Service_Submit.js` xử lý tạo thư mục Google Drive tự động và upload file Base64.
- **Bước 4 (Frontend Shell & Auth UI):** Viết `src/Index.html`, `src/Styles.html` và `src/View_BindAccount.html` với thiết kế hiện đại, sáng sủa bằng Tailwind CSS.
- **Bước 5 (Member & Admin Views + Client JS):** Hoàn thiện `src/View_Member.html`, `src/View_Admin.html` và toàn bộ logic điều khiển ở `src/Scripts.html`.

---

## 9. NÂNG CẤP GIAI ĐOẠN 2 (PHASE 2): QUẢN LÝ LUỒNG BUỔI SINH HOẠT, POST CHUYÊN ĐỀ & UI DESIGN SYSTEM

### 9.1. Định hướng Phong cách Thiết kế Giao diện (UI/UX Design System)
Toàn bộ giao diện (`Index.html`, `View_Member.html`, `View_Admin.html`) cần tuân thủ phong cách **"Modern Tech Club Portal"** (sạch sẽ, hiện đại, cảm hứng từ Linear/Notion):
- **Màu sắc chủ đạo:**
  - Nền trang: `bg-slate-50 text-slate-800`.
  - Sidebar / Topbar: `bg-slate-900 text-white` với điểm nhấn active tab màu `bg-indigo-600`.
  - Card container: `bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200`.
- **Typography:**
  - Sử dụng Google Fonts `Plus Jakarta Sans` hoặc `Inter` cho văn bản giao diện.
  - Sử dụng font `JetBrains Mono` (`font-mono`) cho các thẻ Badge chứa: `MSSV`, `TaskID`, `SessionID`, `MaPin` và đồng hồ đếm ngược Deadline.
- **Trình bày Bài viết Chuyên đề (Topic Post):**
  - Hỗ trợ hiển thị nội dung chuyên đề rõ ràng (giữ nguyên xuống dòng `whitespace-pre-line` hoặc render Markdown cơ bản), có khung đính kèm Link Slide / Source Code nổi bật ngay trong mỗi buổi sinh hoạt.

---

### 9.2. Mở rộng Cấu trúc Google Sheets (Schema Upgrade cho Quản lý Buổi & Chuyên đề)

Cập nhật cấu trúc của **Tab 2 (`NhiemVu`)** và **Tab 4 (`DiemDanh`)** để liên kết chặt chẽ giữa **Buổi sinh hoạt -> Bài viết chuyên đề -> Điểm danh -> Giao Task**:

#### Cập nhật Tab 4: `DiemDanh` (Nay đóng vai trò là Bảng `BuoiSinhHoat` / Sessions)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- | :--- |
| A (0) | `SessionID` | String | Mã buổi sinh hoạt tự sinh (VD: `MEET_001`). |
| B (1) | `TenBuoiHop`| String | Tiêu đề buổi sinh hoạt / Tên chuyên đề (VD: `Tuần 1 Tháng 10: Lập trình Python`). |
| C (2) | `MaPin` | String | Mã PIN 4-6 số để điểm danh. |
| D (3) | `TrangThai` | String | `Open` (Đang mở điểm danh) hoặc `Closed` (Đã đóng điểm danh). |
| E (4) | `DS_CoMat` | String | Danh sách `MSSV` đã điểm danh (ngăn cách bởi dấu phẩy). |
| F (5) | `NgayDienRa`| String | Ngày giờ tổ chức buổi sinh hoạt (`DD/MM/YYYY HH:mm`). |
| G (6) | `NoiDungChuyenDe`| String | Bài post tóm tắt kiến thức/nội dung chuyên đề của buổi đó. |
| H (7) | `LinkTaiLieu`| String | Link Google Drive / Slide / Github của buổi chuyên đề. |

#### Cập nhật Tab 2: `NhiemVu` (Thêm liên kết với Buổi sinh hoạt)
| Cột | Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- | :--- |
| A - G | *(Giữ nguyên)* | String | Giữ nguyên từ cột A (`TaskID`) đến cột G (`TrangThai`). |
| H (7) | `SessionID` | String | Mã buổi sinh hoạt liên kết (VD: `MEET_001` hoặc để trống/`GENERAL` nếu là việc độc lập). |

*(Lưu ý cho AI Agent: Khi đọc dữ liệu từ Sheet, nếu các cột mới F, G, H chưa có dữ liệu ở các dòng cũ, phải fallback về chuỗi rỗng `""` để không gây lỗi undefined).*


### 9.3. Luồng Nghiệp vụ Mới: Quản lý Chu kỳ Sinh hoạt CLB (2-3 buổi/tháng)

#### 1. Phía Trưởng ban (`View_Admin.html` & `Service_Member.js` / `Service_Task.js`):
- **Module "Quản lý Buổi Sinh Hoạt & Chuyên Đề":**
  - Admin có thể tạo một **Buổi Sinh Hoạt Mới** với đầy đủ thông tin: Tên buổi chuyên đề, Ngày diễn ra, Nội dung bài post chuyên đề (`NoiDungChuyenDe`), Link Slide/Tài liệu đính kèm (`LinkTaiLieu`), và Mã PIN điểm danh (tự sinh 6 số hoặc tự nhập).
  - **Chế độ Trình chiếu Điểm danh (Projector Mode):** Trên mỗi thẻ Buổi sinh hoạt ở trang Admin, có nút **"Chiếu Mã PIN"** mở một Modal toàn màn hình hiển thị chữ cực lớn: Tên chuyên đề + Mã PIN 6 số + Bộ đếm số lượng thành viên đã điểm danh để chiếu lên máy chiếu tại phòng họp CLB.
  - **Giao Task gắn liền với Buổi học:** Khi Admin bấm **"Tạo Task mới"**, có thêm ô Dropdown chọn **"Thuộc buổi sinh hoạt nào"** (lấy danh sách từ `DiemDanh`). Bạn có thể bấm nút tắt **"+ Giao bài tập cho buổi này"** ngay trên thẻ của Buổi sinh hoạt đó.

#### 2. Phía Thành viên (`View_Member.html`):
- **Tab "Dòng thời gian Chuyên đề & Buổi học" (Sessions & Topics Feed):**
  - Hiển thị danh sách các buổi sinh hoạt của Ban từ mới nhất đến cũ nhất.
  - Trên mỗi **Thẻ Buổi Sinh Hoạt (Session Card)** hiển thị trọn vẹn 3 phần:
    1. **Header & Trạng thái Điểm danh:** Tên buổi, Ngày diễn ra, Badge báo trạng thái của chính thành viên đó (*"Đã có mặt"* màu xanh ngọc hoặc *"Chưa điểm danh"*). Nếu buổi đó đang `Open` điểm danh, hiển thị ngay ô nhập nhanh Mã PIN tại thẻ đó.
    2. **Nội dung Chuyên đề (Topic Post):** Hiển thị bài viết chuyên đề của buổi học và nút bấm mở nhanh **Slide / Tài liệu buổi học** (`LinkTaiLieu`).
    3. **Bài tập / Nhiệm vụ của buổi học (Linked Tasks):** Liệt kê ngay bên dưới các Task có `SessionID` trùng với buổi học đó kèm nút **"Nộp bài"** và trạng thái chấm điểm/Feedback của Trưởng ban.

---

### 9.4. Yêu cầu Thực thi Tiếp theo cho AI Agent
Khi người dùng yêu cầu nâng cấp hệ thống theo Mục 9, AI Agent thực hiện:
1. Cập nhật `Service_Member.js` và `Service_Task.js` để đọc/ghi thêm các cột mở rộng (`NgayDienRa`, `NoiDungChuyenDe`, `LinkTaiLieu` trong bảng `DiemDanh` và `SessionID` trong bảng `NhiemVu`). Đảm bảo bọc `withScriptLock` cho mọi thao tác ghi.
2. Cập nhật `View_Admin.html` bổ sung Form đăng bài Chuyên đề khi tạo/sửa Buổi sinh hoạt, thêm Modal chiếu Mã PIN to rõ (Projector Mode) và liên kết chọn `SessionID` khi giao Task.
3. Cập nhật `View_Member.html` và `Scripts.html` để hiển thị giao diện **Dòng thời gian Buổi sinh hoạt & Chuyên đề (Session Feed)** giúp thành viên vừa đọc kiến thức, vừa điểm danh, vừa nộp bài tập của đúng buổi đó trên cùng một luồng trực quan.