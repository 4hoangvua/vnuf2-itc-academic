# SỔ TAY HƯỚNG DẪN QUẢN TRỊ VIÊN MỚI (ADMIN HANDBOOK)
> **Cổng Quản Lý Ban Học Thuật – CLB Tin Học VNUF2**  
> **Dành cho:** Ban Chủ nhiệm, Trưởng/Phó Ban và các Quản trị viên mới tiếp nhận hệ thống.

---

## 1. ĐĂNG NHẬP VÀO HỆ THỐNG

1. **Truy cập đường link:**  
   - Bản chính thức: [https://4hoangvua.github.io/vnuf2-itc-academic/](https://4hoangvua.github.io/vnuf2-itc-academic/)
   - Bản thử nghiệm nội bộ: `http://localhost:5500/frontend/index.html` (khi chạy local).
2. **Nhập Mã Số Sinh Viên (MSSV) của Admin:**
   - Điền MSSV đã được phân quyền Admin (ví dụ: `2251120001` hoặc `2251120002`).
   - Bấm **"Tiếp tục"**.
3. **Xác thực mã OTP 6 số:**
   - Hệ thống tự động gửi mã OTP 6 số về Gmail của bạn (có hiệu lực trong 5 phút).
   - *(Nếu đang ở chế độ thử nghiệm Mock Data, mã OTP mặc định luôn là: `123456`).*
   - Nhập 6 số và bấm **"Đăng nhập"** để vào thẳng **Admin Portal**.
4. **Lưu ý:** Hệ thống tự động ghi nhớ phiên qua Token bảo mật, bạn không cần phải đăng nhập lại mỗi khi mở lại trình duyệt.

---

## 2. TỔNG QUAN 5 PHÂN HỆ QUẢN TRỊ CHÍNH

Thanh điều hướng bên trái (hoặc thanh menu dưới cùng trên điện thoại) gồm 5 khu vực nghiệp vụ:

```text
┌────────────────────────────────────────────────────────────┐
│  1. Duyệt bài nộp        ──> Chấm bài tập, phản hồi SV     │
│  2. Buổi học & Chuyên đề ──> Lịch sinh hoạt, PIN, Slide    │
│  3. Nhân sự Thành viên   ──> Danh sách SV, mở khóa, reset  │
│  4. Kho học liệu & Slide ──> Đăng giáo trình, tài liệu     │
│  5. Sự Kiện & Gửi Thư    ──> Bật/tắt sự kiện, Mailer Studio│
└────────────────────────────────────────────────────────────┘
```

---

## 3. HƯỚNG DẪN TỪNG CHỨC NĂNG CỤ THỂ

### 3.1. Tab 1: Duyệt Bài Nộp Của Thành Viên (`Duyệt bài nộp`)
Nơi tiếp nhận toàn bộ bài tập thực hành do thành viên gửi về:
- **Bộ lọc trạng thái:** Bấm chọn các tab `Chờ duyệt (Pending)`, `Đã duyệt (Approved)`, `Cần sửa (Rejected)` hoặc `Tất cả` để lọc nhanh danh sách.
- **Tìm kiếm:** Gõ tên sinh viên, MSSV hoặc tên file vào ô tìm kiếm.
- **Chấm bài:**
  1. Bấm vào bài nộp bất kỳ trong bảng để mở thanh nhận xét bên phải (`Review Drawer`).
  2. Bấm vào link file Google Drive để mở xem trực tiếp bài làm của sinh viên.
  3. Nhập lời nhận xét / góp ý học thuật vào ô **"Nhận xét của Ban Học Thuật"**.
  4. Bấm **"Duyệt Đạt"** (hệ thống cộng điểm) hoặc **"Yêu cầu nộp lại"** (sinh viên sẽ nhận được thông báo để sửa bài).

---

### 3.2. Tab 2: Quản Lý Buổi Sinh Hoạt & Chuyên Đề (`Buổi học & Chuyên đề`)
Trung tâm điều phối lịch sinh hoạt hàng tuần của CLB:

1. **Tạo buổi sinh hoạt mới:**
   - Bấm nút **`+ Tạo buổi học mới`**.
   - Điền: Tên buổi học, Ngày giờ diễn ra, Phòng học (ví dụ: `Lab 3 - Giảng đường A`), Phân loại chủ đề (MOS, Word, Excel, AI, hoặc tự tạo chủ đề mới).
   - Dán link slide Google Drive và tóm tắt nội dung kiến thức.
   - Bấm **"Lưu & Khởi tạo"** -> Mã PIN 6 số sẽ được hệ thống sinh ngẫu nhiên tự động.

2. **Xem chi tiết và điều hành buổi học (Màn hình Chi tiết Toàn Trang):**
   - Bấm vào bất kỳ thẻ buổi học nào trong danh sách:
     - **Sub-tab "Nội dung & Slide":** Cập nhật tài liệu giảng dạy.
     - **Sub-tab "Danh sách Điểm danh":** 
       - Xem mã PIN đang mở.
       - Nút **"Khóa điểm danh"** / **"Mở điểm danh"**.
       - Nút **"Đổi PIN mới"** (nếu nghi ngờ bị lộ mã).
       - Bảng danh sách sinh viên đã điểm danh (nhảy số tức thì theo thời gian thực).
       - **Điểm danh bổ sung thủ công:** Khi sinh viên quên điện thoại, hết pin hoặc lỗi kết nối, Admin chỉ cần nhập MSSV vào ô *Điểm danh bù bằng MSSV* rồi bấm **"Điểm danh bù"**. Sinh viên sẽ được thêm ngay vào danh sách có mặt và nếu trước đó có gửi đơn vắng thì đơn sẽ tự động được hủy.
       - **Bảng Đơn Xin Vắng Mặt & Xét Duyệt (Popup Modal):**
         - Theo dõi danh sách đơn vắng của buổi học (có phân trang riêng biệt).
         - Bấm **"Xét duyệt"** để mở Popup Modal: Lựa chọn **"Duyệt đơn (Nghỉ có phép)"** hoặc **"Từ chối (Nghỉ không phép)"** và điền lời nhắn phản hồi gửi tới sinh viên.
     - **Sub-tab "Bài tập & Giao nhiệm vụ":** Giao bài tập về nhà cho buổi đó kèm hạn chót (Deadline) và chấm bài trực tiếp tại chỗ.

3. **Chế độ Máy Chiếu Hội Trường (`Projector Mode`):**
   - Trong phòng học, bấm nút icon **Máy chiếu** (`Chế độ Máy Chiếu PIN`).
   - Màn hình sẽ chuyển sang chế độ nền đen tương phản cao:
     - Hiển thị mã PIN 6 số siêu to khổng lồ, sinh viên ngồi cuối lớp cũng nhìn rõ.
     - Đồng hồ đếm ngược và chỉ số sinh viên đã điểm danh tự động nhảy số khi có người điểm danh thành công.

---

### 3.3. Tab 3: Quản Lý Nhân Sự Thành Viên (`Nhân sự Thành viên`)
Quản lý danh sách thành viên chính thức của Ban Học Thuật:
- **Thêm thành viên mới:** Bấm **`+ Thêm thành viên`** -> Nhập MSSV, Họ tên, Gmail và phân quyền (`MEMBER` hoặc `ADMIN`).
- **Nút `[👁️ Xem]`:** Xem ngay giao diện Thành viên dưới danh nghĩa sinh viên đó để kiểm tra lịch sử điểm danh, bài nộp hoặc tiến độ Điểm rèn luyện khi sinh viên thắc mắc.
- **Nút `[Reset Email]`:** Xóa liên kết Gmail cũ trong trường hợp sinh viên nhập nhầm email hoặc muốn đổi sang email khác.
- **Nút `[Khóa / Mở khóa]`:** Vô hiệu hóa quyền truy cập đối với những sinh viên đã nghỉ sinh hoạt hoặc vi phạm quy chế.

---

### 3.4. Tab 4: Kho Học Liệu & Slide (`Kho học liệu & Slide`)
Thư viện số lưu trữ tài liệu học tập mở cho thành viên:
- Bấm **`+ Đăng tài liệu mới`** để thêm giáo trình, slide bài giảng, đề thi mẫu, tài liệu MOS, Prompt AI.
- Phân loại rõ ràng theo danh mục để sinh viên dễ dàng tìm kiếm.
- Có thể chỉnh sửa hoặc xóa tài liệu bất cứ lúc nào.

---

### 3.5. Tab 5: Quản Lý Sự Kiện & Gửi Thư Tự Động (`Sự Kiện & Gửi Thư`)
Trung tâm điều phối các lễ hội học thuật (20/10, Tết, 8/3, Sinh nhật CLB) và hệ thống Mailer Studio:

1. **Bộ Chọn Kích Hoạt Sự Kiện:**
   - Nằm ngay đầu Tab Sự Kiện với các thẻ sự kiện trực quan.
   - Bấm vào thẻ để kích hoạt: Sự kiện được chọn sẽ hiển thị huy hiệu xanh **`ĐANG CHẠY`** và đồng bộ ngay lập tức tới mọi sinh viên đang truy cập web.
   - Muốn đưa web về chế độ bình thường: Bấm nút **`Tắt Sự Kiện`** (đưa toàn bộ cổng về giao diện học thuật tiêu chuẩn).

2. **Lập Lịch Trình Tự Động (Auto-Scheduler):**
   - Chọn ngày giờ bắt đầu và ngày giờ kết thúc. Hệ thống tự động kích hoạt/kết thúc sự kiện đúng giờ mà không cần Admin phải trực web.
   - Chọn đối tượng nhận đặc quyền: *Chỉ Nữ sinh* (20/10, 8/3) hoặc *Toàn bộ thành viên CLB* (Tết, Sinh nhật).
   - Bấm **"Lưu & Kích Hoạt Lịch"** để lưu cấu hình.

3. **Soạn Thảo Thư & Xem Trước Trực Quan (Email Live Preview):**
   - Soạn tiêu đề email và nội dung thư chúc mừng.
   - Sử dụng các thẻ biến nhanh: `+{HoTen}`, `+{MSSV}`, `+{TenSuKien}`, `+{LinkWeb}` để tự động cá nhân hóa từng bức thư.
   - Khung bên phải mô phỏng trực tiếp hộp thư của sinh viên theo thời gian thực (Live Preview) giúp Admin kiểm tra kỹ trước khi bấm gửi.

4. **Hàng Đợi Phát Thư Hàng Loạt Có Chọn Lọc (Bulk Dispatch Queue):**
   - Bảng danh sách sinh viên hợp lệ nhận thư kèm địa chỉ email và trạng thái sẵn sàng.
   - **Tính năng chọn lọc người nhận:**
     - Tích chọn hoặc bỏ chọn từng cá nhân qua ô checkbox đầu mỗi dòng.
     - Dùng nút **`Chọn tất cả`** hoặc **`Bỏ chọn`** trên thanh công cụ để thao tác nhanh.
     - Huy hiệu đếm số lượng: `Đã chọn: X / Y người`.
   - Nút **`Gửi Email Tới [X] Người Đã Chọn`**: Bấm xác nhận để hệ thống gửi thư chúc mừng kèm thẻ quà tặng trực tiếp tới hòm thư của các sinh viên được chọn.

---

## 4. CHỨC NĂNG TIỆN ÍCH DÀNH RIÊNG CHO ADMIN

### 4.1. Chế Độ Xem Thử Nghiệm Giao Diện Thành Viên (View-as-Member)
Bạn muốn biết sinh viên nhìn thấy gì mà không muốn phải đăng xuất tài khoản Admin?
- **Cách bật:** Bấm nút **`[👁️ Xem vai trò Thành viên]`** ở thanh bên trái (Desktop) hoặc icon con mắt ở góc trên (Mobile).
- **Trải nghiệm:** Bạn sẽ vào thẳng Cổng Thành viên, có thể thử nhập PIN, nộp bài, xem lộ trình học tập.
- **Cách quay lại:** Bấm nút **`[Quay lại Cổng Quản Trị]`** trên thanh Banner màu xanh ở đầu trang hoặc ở thanh bên trái. Bạn sẽ trở về ngay lập tức, phiên Admin không hề bị gián đoạn.

### 4.2. Đổi Giao Diện Sáng / Tối (Light & Dark Mode)
- Bấm nút icon **Mặt trăng / Mặt trời** ở góc dưới thanh điều hướng để chuyển đổi qua lại giữa nền trắng dịu mắt và nền tối than chì chống mỏi mắt.

### 4.3. Nút "Làm mới dữ liệu" (Refresh)
- Khi đang theo dõi điểm danh hoặc chấm bài, bấm nút **`Làm mới`** (icon xoay tròn) để cập nhật dữ liệu mới nhất từ máy chủ ngay lập tức mà không cần bấm F5 trình duyệt.

---

## 5. MỘT SỐ NGUYÊN TẮC BẢO MẬT & VẬN HÀNH QUAN TRỌNG

1. **Khóa PIN điểm danh sau khi kết thúc buổi học:**  
   Sau khi kết thúc thời gian điểm danh trên lớp, Admin hãy nhớ bấm **"Khóa điểm danh"** để tránh trường hợp mã PIN bị chia sẻ ra ngoài cho người không đi học.
2. **Tuyệt đối không tiết lộ tài khoản Admin:**  
   Tài khoản Admin có toàn quyền xóa buổi học, chỉnh sửa thành viên và duyệt bài. Mỗi Admin chỉ nên sử dụng MSSV chính chủ của mình.
3. **Cần hỗ trợ kỹ thuật:**  
   Liên hệ trực tiếp bộ phận kỹ thuật qua Zalo: **0865.441.920** (hoặc link hỗ trợ dưới chân trang đăng nhập).
