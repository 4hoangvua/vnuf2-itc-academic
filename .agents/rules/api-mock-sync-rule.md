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

## 2. QUY TRÌNH BẮT BUỘC KHI THÊM / SỬA MỘT ACTION MỚI

Mỗi khi định nghĩa thêm hoặc thay đổi bất kỳ Action nào, lập trình viên/AI **BẮT BUỘC** cập nhật đồng bộ qua 4 vị trí sau:

### Vị trí 1: Khai báo nhóm quyền tại `gas-backend/Config.js`
Phải đăng ký action vào đúng mảng:
- `PUBLIC_ACTIONS`: Không cần token (`ping`, `requestLoginOtp`, `verifyLoginOtp`, `getAuthStatus`).
- `MEMBER_ACTIONS`: Cần token thành viên, tự tiêm `currentUser.mssv` (`checkInAttendance`, `submitTaskAssignment`, `getMemberSubmissions`...).
- `ADMIN_ACTIONS`: Cần token admin (`role === 'ADMIN'`) (`createAttendanceSession`, `createTask`, `reviewSubmission`...).
- `QUERY_ACTIONS`: Truy vấn đọc dữ liệu (`getAttendanceSessions`, `getAllTasks`, `getAllDocuments`...).

### Vị trí 2: Xử lý định tuyến tại `gas-backend/Router.js` & `Service_*.js`
- Tiếp nhận action trong switch-case.
- Trả về đúng mã lỗi chuẩn (`UNAUTHORIZED`, `FORBIDDEN`, `LOCK_TIMEOUT`, `BAD_REQUEST`).

### Vị trí 3: Cập nhật hàm giả lập trong `frontend/services/mockData.js`
- Thêm case tương ứng vào `mockCallApi(action, payload)`.
- **Cấu trúc trường dữ liệu (Schema & Types) của Mock PHẢI GIỐNG 100% dữ liệu từ Sheet thật** (ví dụ: `SessionID`, `TenBuoiHop`, `MaPin`, `TrangThai`, `DS_CoMat` dạng JSON string mảng MSSV).
- Lưu thay đổi vào `localStorage.getItem('bht_mock_store')` để dữ liệu mock có tính liên tục khi refresh trang.

### Vị trí 4: Cấu hình Cache Invalidation trong `frontend/services/api.js`
Nếu Action là một thao tác thay đổi dữ liệu (Mutation), **BẮT BUỘC** đăng ký vào `MUTATION_INVALIDATION_MAP` trong `api.js`:
```javascript
const MUTATION_INVALIDATION_MAP = {
  // Mỗi khi Action này thành công, tự động xóa cache của các Query sau:
  'tenActionMoi': ['getAttendanceSessions', 'getAllTasks']
};
```
Đồng thời đảm bảo `api.js` tự động phát sự kiện đồng bộ `bht_sync_event` sau khi ghi dữ liệu thành công.

---

## 3. CHECKLIST ĐỒNG BỘ (SYNC VERIFICATION)

Trước khi coi một Action là hoàn thành:
- [ ] 1. Đổi sang `Mock Dev Mode` trên thanh Dev Helper -> Chạy thử tính năng -> Hoạt động trơn tru.
- [ ] 2. Kiểm tra `localStorage` -> Key cache cũ đã bị xóa sạch (Invalidation).
- [ ] 3. Mở tab thứ 2 của trình duyệt -> Dữ liệu mới xuất hiện tự động qua `bht_sync_event`.
- [ ] 4. Không có thuộc tính nào tồn tại ở Backend mà bị thiếu ở MockData hoặc ngược lại.
