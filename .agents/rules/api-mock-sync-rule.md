---
trigger: always_on
description: Quy định bắt buộc đồng bộ 100% cấu trúc dữ liệu giữa Backend GAS, MockData, và Cache Invalidation
---

# QUY TẮC ĐỒNG BỘ DỮ LIỆU API & MOCK DATA (`api-mock-sync-rule.md`)
> **Dự án:** Cổng Quản Lý Ban Học Thuật - CLB Tin Học VNUF2  
> **Nguyên tắc tối thượng:** "Zero Discrepancy" – Không có độ lệch cấu trúc giữa môi trường Mock Dev và Production Google Apps Script.

---

## 1. HỢP ĐỒNG DỮ LIỆU CHUẨN (STANDARD API CONTRACT)

Mọi yêu cầu và phản hồi dù chạy qua Google Apps Script thật hay chạy qua `mockData.js` đều phải tuân thủ nghiêm ngặt chuẩn Envelope sau:

### 1.1. Request Payload:
```json
{
  "action": "tên_hành_động_camelCase",
  "token": "session_token_uuid",
  "payload": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

### 1.2. Response Payload:
```json
// Thành công:
{
  "success": true,
  "data": [ ... ] hoặc { ... },
  "message": "Thông báo tùy chọn (nếu có)"
}

// Thất bại:
{
  "success": false,
  "errorCode": "MÃ_LỖI_CHUẨN",
  "message": "Nội dung lỗi chi tiết hiển thị cho người dùng"
}
```

---

## 2. DANH MỤC ACTIONS & HỢP ĐỒNG NGHIỆP VỤ HIỆN HÀNH

Hệ thống phân chia 4 nhóm quyền truy cập chuẩn hóa:

| Phân nhóm | Mục đích | Danh sách Actions chuẩn |
| :--- | :--- | :--- |
| **`PUBLIC_ACTIONS`** | Không cần Token, người dùng vãng lai | `ping`, `getAuthStatus`, `requestLoginOtp`, `verifyLoginOtp` |
| **`MEMBER_ACTIONS`** | Cần Token, Router tự tiêm `currentUser.mssv` | `checkInAttendance`, `submitTaskAssignment`, `getMemberSubmissions`, `logoutUser`, `submitQuiz`, `recordQuizAnswer`, `toggleQuestionBookmark`, `clearWrongHistory`, `saveMemberGift`, `applyQuizBonusVoucher`, `redeemPrivilegeVoucher`, `submitAbsenceRequest`, `getMemberAbsenceRequests`, `cancelAbsenceRequest` |
| **`ADMIN_ACTIONS`** | Cần Token & `role === 'ADMIN'` | `getAllMembers`, `addMember`, `resetMemberEmail`, `toggleMemberStatus`, `createAttendanceSession`, `updateAttendanceSession`, `deleteAttendanceSession`, `updateAttendanceTopic`, `toggleAttendanceSession`, `createTask`, `updateTask`, `deleteTask`, `toggleTaskStatus`, `getAllSubmissions`, `reviewSubmission`, `addDocument`, `createDocument`, `updateDocument`, `deleteDocument`, `saveQuiz`, `toggleQuizStatus`, `deleteQuiz`, `resetQuizSubmission`, `resetAllQuizSubmissions`, `getQuizResultsBySession`, `setActiveCampaign`, `saveCampaignConfig`, `sendEventBulkEmail`, `getAllAbsenceRequests`, `reviewAbsenceRequest`, `adminManualCheckIn` |
| **`QUERY_ACTIONS`** | Truy vấn đọc dữ liệu (đã xác thực) | `getAttendanceSessions`, `getAllTasks`, `getAllDocuments`, `getQuizBySession`, `getMemberQuizProfile`, `getPersonalQuizPool`, `getAllCampaigns`, `getActiveCampaign`, `getAbsenceRequestsBySession`, `getAppInitData` |

---

## 3. QUY TRÌNH BẮT BUỘC KHI THÊM / SỬA MỘT ACTION MỚI

Mỗi khi định nghĩa thêm hoặc thay đổi bất kỳ Action nào, lập trình viên/AI **BẮT BUỘC** cập nhật đồng bộ qua 5 vị trí sau:

### Vị trí 1: Khai báo nhóm quyền tại `gas-backend/Config.js`
Đăng ký action vào đúng mảng: `PUBLIC_ACTIONS`, `MEMBER_ACTIONS`, `ADMIN_ACTIONS`, hoặc `QUERY_ACTIONS`.

### Vị trí 2: Xử lý định tuyến tại `gas-backend/Router.js` & Dịch vụ nghiệp vụ `Service_*.js`
- Tiếp nhận action trong switch-case của `Router.js`.
- Ủy quyền xử lý cho Service tương ứng (`Service_Auth.js`, `Service_Member.js`, `Service_Task.js`, `Service_Submit.js`, `Service_Quiz.js`, `Service_Doc.js`, `Service_Campaign.js`).
- Trả về đúng mã lỗi chuẩn (`UNAUTHORIZED`, `FORBIDDEN`, `LOCK_TIMEOUT`, `BAD_REQUEST`).

### Vị trí 3: Cập nhật hàm giả lập trong `frontend/services/mockData.js`
- Thêm case tương ứng vào `handleMockAction(action, data)` (alias `mockCallApi`).
- **Cấu trúc trường dữ liệu (Schema & Types) của Mock PHẢI GIỐNG 100% dữ liệu từ Sheet thật**.
- Lưu thay đổi vào `localStorage.getItem('bht_mock_store')` để dữ liệu mock có tính liên tục khi refresh trang.

### Vị trí 4: Cấu hình Cache Invalidation & Sync Broadcast trong `frontend/services/api.js`
- Nếu Action là Mutation thay đổi dữ liệu chung: Đăng ký vào `MUTATION_INVALIDATION_MAP` trong `api.js`:
  ```javascript
  const MUTATION_INVALIDATION_MAP = {
    'tenActionMoi': ['getQueryLienQuan1', 'getQueryLienQuan2']
  };
  ```
- **Quy tắc cô lập Sync cá nhân (Individual Sync Isolation):** Các tác vụ chỉ ghi nhận trạng thái cục bộ cá nhân (như `recordQuizAnswer`, `toggleQuestionBookmark`) **CẤM** phát `broadcastDataSync` để tránh kích hoạt reload view làm gián đoạn bài làm thi/ôn luyện của sinh viên.

### Vị trí 5: Gọi API từ Sub-Module chuyên trách (Frontend Sub-Modules)
- **TUYỆT ĐỐI CẤM** viết thêm logic nghiệp vụ trực tiếp vào các file gốc `admin.js` hoặc `member.js`.
- Mọi hàm gọi API và xử lý dữ liệu phải nằm trong các sub-modules chuyên biệt:
  - Phía Admin: `frontend/modules/admin/admin<Domain>.js` (`adminMembers.js`, `adminSessions.js`, `adminQuiz.js`, `adminDocs.js`, `adminSubmissions.js`, `adminCampaigns.js`).
  - Phía Member: `frontend/modules/member/member<Domain>.js` (`memberSessions.js`, `memberQuiz.js`, `memberDocs.js`, `memberSubmissions.js`).
  - Phân hệ Lễ hội & Quà tặng: `frontend/modules/gift2010.js` (3D Unboxing, Confetti, Universal Campaign Selector).
  - Giao diện HTML Template: `frontend/modules/templates/` (tách theo domain như `quizTemplates.js`, `campaignTemplates.js`).
- Tái xuất (re-export) hàm qua file Barrel gốc (`admin.js`, `member.js`, `templates.js`) để đảm bảo tương thích ngược 100%.

---

## 4. CHECKLIST ĐỒNG BỘ TRƯỚC KHI DEPLOY & XÂY DỰNG API GAS THẬT

Trước khi triển khai action mới lên môi trường Google Apps Script thật:
- [ ] 1. **Kiểm tra Mock Dev Mode:** Tính năng hoạt động trơn tru trên `mockData.js`.
- [ ] 2. **Kiểm tra Schema Đồng Nhất:** Các key (như `SessionID`, `QuizID`, `DanhSachCauHoi`, `DapAnDung`, `ThoiGianLamBai`) khớp chính xác giữa Mock và Headers trên Google Sheet.
- [ ] 3. **Kiểm tra Cache Invalidation:** Gọi mutation xong, các truy vấn query liên quan tự động xóa cache và nạp lại dữ liệu mới nhất.
- [ ] 4. **Kiểm tra Guard Role & Identity Injection:** Router thật tự tiêm `currentUser.mssv` cho Member, và chặn 403 Forbidden đối với Admin actions.
- [ ] 5. **Kiểm tra Đối Xứng Payload Xác Thực (Symmetric Auth Payload):** Đối tượng `user` trả về từ `getAuthStatus` (cả Backend GAS lẫn `mockData.js`) phải chứa đầy đủ 100% các thuộc tính định danh cá nhân hoá (`sex`, `Sex`, `gift2010`, `lop`, `ban`...) giống như trong `verifyLoginOtp`. Ngăn ngừa tuyệt đối việc F5 / reload trang làm mất giới tính hay quà tặng của người dùng.
- [ ] 6. **Chạy Test Tự Động:** Chạy `node test_core.mjs` đảm bảo 100% test suites vượt qua (0 failure).

---

## 5. NGUYÊN TẮC PHÂN TÁCH KÊNH TRIỂN KHAI GIT (FRONTEND) VS CLASP (BACKEND GAS)

Để bảo mật tuyệt đối các cấu hình Google Apps Script, SheetID, RootFolderID và thông tin nhạy cảm của hệ thống:

1. **Kênh Git Remote (GitHub):**
   - **CHỈ ĐẨY MÃ NGUỒN FRONTEND, TÀI LIỆU VÀ CẤU HÌNH DỰ ÁN.**
   - Thư mục `gas-backend/`, các file `.clasp.json`, `.clasprc.json` **BẮT BUỘC** nằm trong `.gitignore`.
   - **Bảo toàn dữ liệu máy Local:** Việc ignore `gas-backend/` đảm bảo git không track hoặc push lên remote, trong khi toàn bộ mã nguồn backend trên máy local của lập trình viên vẫn được giữ nguyên vẹn 100%, tuyệt đối không được xóa.

2. **Kênh Clasp (Google Apps Script Backend):**
   - Mọi thay đổi trong `gas-backend/` (Router, Services, Config) chỉ được đồng bộ và triển khai trực tiếp lên Google Apps Script qua lệnh:
     ```powershell
     npm run push      # Tương đương: clasp push --force (đẩy code lên @HEAD)
     ```
   - **Triển khai phiên bản Web App thực tế:** Do Web App production gắn với version snapshot (không tự ăn theo @HEAD), sau khi `push` cần cập nhật deployment hiện tại:
     ```powershell
     npx @google/clasp deploy -i <DeploymentID> -d "Mô tả phiên bản mới"
     ```
   - Đồng bộ ngược từ Google Apps Script về máy local qua:
     ```powershell
     npm run pull      # Tương đương: clasp pull
     ```
