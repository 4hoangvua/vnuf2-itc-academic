# QUY TẮC THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (`ui-design-rule.md`)
> **Dự án:** Cổng Quản Lý Ban Học Thuật - CLB Tin Học VNUF2  
> **Phong cách:** Editorial Academic Studio (Lấy cảm hứng từ Notion, Stripe Docs, Read.cv)  
> **Mục tiêu:** Trang nhã, chuẩn mực học thuật, hiện đại, tối ưu hiệu năng và hiển thị vượt trội trên mọi thiết bị.

---

## 1. HỆ MÀU CHỦ ĐẠO (ACADEMIC COLOR PALETTE)

Toàn bộ giao diện phải tuân thủ nghiêm ngặt bảng màu thương hiệu định nghĩa qua CSS Variables trong `styles.css`:

1. **Màu Nhấn Thương Hiệu (`Academic Deep Teal`):**
   - **Light Mode:** `--accent-base: #0F6256` (Màu xanh cổ vịt trầm, trang nhã, tạo cảm giác học thuật sâu sắc).
   - **Dark Mode:** `--accent-base: #2DD4BF` (Màu ngọc bích sáng, tương phản cao trên nền tối).
   - **Lớp nền phụ trợ:**
     - `--accent-soft: rgba(15, 98, 86, 0.08)` (Light) / `rgba(45, 212, 191, 0.12)` (Dark) dùng cho badge, active tab, hover container.
     - `--accent-subtle: rgba(15, 98, 86, 0.04)` (Light) dùng cho highlight nhẹ.

2. **Hệ Màu Nền & Bề Mặt (Canvas & Surface):**
   - **Light Mode:** Canvas dịu mắt `--bg-canvas: #F8F9FA`, Surface trắng tinh `--bg-surface: #FFFFFF`, Khối nổi `--bg-elevated: #FFFFFF`.
   - **Dark Mode:** Canvas nền đen than `--bg-canvas: #0E1110`, Surface xám sâu `--bg-surface: #161918`, Khối nổi `--bg-elevated: #1F2321`.
   - **Cấm Tuyệt Đối:** Không dùng màu đen thuần `#000000` hoặc trắng gắt cho toàn trang; phải giữ độ mềm mại cho mắt sinh viên khi đọc tài liệu lâu.

3. **Hệ Thống Viền Siêu Mảnh (Hairline Borders):**
   - Toàn bộ card, table, header, tab bar phân tách bằng viền mảnh đúng 1px: `--border-hairline: rgba(0, 0, 0, 0.08)` (Light) và `rgba(255, 255, 255, 0.08)` (Dark).
   - Bo góc chuẩn mực: Card và Container bo `10px` – `14px`, Button và Input bo `8px`, Tag/Badge bo `6px` hoặc pill tròn.

---

## 2. QUY CHUẨN TIỀN TỐ CLASS CSS (`.bht-*`)

Để tránh xung đột với Tailwind hoặc các thư viện khác, toàn bộ các thành phần UI dùng chung **BẮT BUỘC** sử dụng tiền tố `.bht-*`:

| Thành phần | Class chuẩn | Quy ước sử dụng |
| :--- | :--- | :--- |
| **Nút bấm** | `.bht-btn`, `.bht-btn-primary`, `.bht-btn-secondary`, `.bht-btn-danger`, `.bht-btn-ghost` | Kích thước: `-xs`, `-sm`, `-md`, `-lg`. Luôn có icon FontAwesome đi kèm. |
| **Thẻ chứa** | `.bht-card` | Khối nội dung có viền hairline, nền surface, bo góc và đổ bóng nhẹ. |
| **Huy hiệu** | `.bht-badge`, `.bht-badge-ok`, `.bht-badge-warn`, `.bht-badge-err` | Thẻ trạng thái nhỏ gọn (Đang mở, Đã nộp, Chờ duyệt, Khóa). |
| **Huy hiệu Kỹ thuật** | `.bht-badge-mono` | Font Monospace, tracking rộng, hiển thị mã ID. |
| **Ô nhập liệu** | `.bht-input`, `.bht-select`, `.bht-textarea` | Viền hairline, focus đổi viền sang Teal, padding gọn gàng. |
| **Bảng dữ liệu** | `.bht-table`, `.bht-table-container` | Bảng hiển thị danh sách có header cố định, hover dòng dịu mắt. |
| **Menu Tab** | `.bht-nav-item`, `.bht-nav-item.active` | Nút chuyển tab kiểu Notion / Stripe. |

> ⚠️ **Cấm Tuyệt Đối:** Không viết thuộc tính `style="..."` inline trực tiếp trong HTML trừ các trường hợp động bắt buộc (như `style="width: 75%"` cho thanh tiến trình).

---

## 3. HỆ THỐNG FONT CHỮ 3 TẦNG (3-TIER TYPOGRAPHY)

Giao diện áp dụng chính xác 3 họ font chữ phục vụ cho 3 mục đích chuyên biệt:

```text
1. Newsreader (Editorial Serif) ──> Tiêu đề lớn, Banner, Tên buổi sinh hoạt, Trích dẫn học thuật
2. Plus Jakarta Sans / Inter   ──> Nội dung văn bản, Menu, Nhãn form, Nút bấm, Bảng thông tin
3. JetBrains Mono (Monospace)   ──> MSSV, SessionID, TaskID, MaPin, Deadline, Timestamp, Base64/Link
```

### Quy tắc áp dụng:
1. **Tiêu đề học thuật (`.bht-heading-serif`):**
   - Phải áp dụng cho `h1`, `h2`, `h3`, tiêu đề trang, tiêu đề chuyên đề tuần.
   - Thể hiện sự trang trọng, uy tín của một ban học thuật trực thuộc trường đại học.
2. **Ký hiệu kỹ thuật (`font-mono` / `.font-mono`):**
   - **BẮT BUỘC 100%** hiển thị font Monospace cho:
     - Mã số sinh viên: `2351120015`
     - Mã buổi học: `MEET_20261016`
     - Mã nhiệm vụ: `TASK_01`
     - Mã PIN điểm danh: `839201` (tracking rộng, font to đậm)
     - Thời gian deadline: `2026-10-20 23:59`
     - Tên file nộp: `BaoCao_Tuan1.pdf`

---

## 4. KIẾN TRÚC MÀN HÌNH MASTER-DETAIL (CHỐNG LẠM DỤNG MODAL)

Nhằm mang lại trải nghiệm chuyên nghiệp và không gian thao tác rộng rãi:

1. **Tuyệt đối không nhồi nhét nghiệp vụ chính vào Modal Popup:**
   - **SAI (Anti-pattern):** Mở popup modal nhỏ để vừa chiếu PIN, vừa xem danh sách 50 người điểm danh, vừa chấm bài tập. Người dùng sẽ bị ngột ngạt và khó thao tác trên di động.
   - **ĐÚNG (Master-Detail):** Khi người dùng bấm vào một buổi học:
     - Giao diện chuyển sang chế độ **Sub-view Chi Tiết Toàn Trang** (`admin-tab-session-detail` hoặc `member-tab-session-detail`).
     - Có nút **"Quay lại danh sách"** kèm breadcrumb rõ ràng.
     - Sử dụng hệ thống **Sub-tabs ngang** phân tách rõ: `Nội dung & Slide` | `Danh sách Điểm danh` | `Bài tập & Chấm bài` | `Trắc nghiệm`.

2. **Khi nào ĐƯỢC dùng Modal:**
   - Chỉ dùng Modal cho các thao tác **ngắn hạn, đơn mục tiêu** (Quick Action):
     - Form tạo nhanh buổi học (`modal-create-attendance`).
     - Form giao nhiệm vụ mới (`modal-create-task`).
     - Hộp chọn file kéo thả để nộp bài (`modal-submit-task`).
     - Popup phóng to PIN điểm danh phục vụ đọc mã trong phòng học (`modal-admin-pin-quickview`).
     - Màn hình đen tương phản cao cho máy chiếu hội trường (`modal-projector-mode`).

---

## 5. TƯƠNG THÍCH LIGHT/DARK MODE & CHỐNG CHỚP MẮT (ANTI-FOUC)

1. **Cơ chế lưu trữ:**
   - Giá trị theme được lưu trong `localStorage` với key `bht_theme` (`'light'` hoặc `'dark'`).
2. **Kỹ thuật chống FOUC (Flash of Unstyled Content):**
   - Bắt buộc duy trì đoạn script tự thực thi inline trong thẻ `<head>` của `index.html`:
     ```html
     <script>
       const t = localStorage.getItem('bht_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
       if (t === 'dark') document.documentElement.classList.add('dark');
       document.documentElement.setAttribute('data-theme', t);
     </script>
     ```
3. **Đồng bộ icon & label:**
   - Mỗi khi đổi theme qua action `toggle-theme`, hàm `toggleTheme()` trong `ui.js` phải tự động cập nhật toàn bộ icon mặt trăng/mặt trời (`.js-theme-icon`) trên cả desktop và mobile.

---

## 6. QUY TẮC TƯƠNG TÁC DOM, EVENT DELEGATION & TRẢI NGHIỆM THAO TÁC (INTERACTION & UX RULES)

1. **Phân Tách Nghiêm Ngặt Giữa Form Submit và Click Delegation (Chống Lỗi Bubble Click trên Form):**
   - **Hiện tượng lỗi:** Khi thẻ `<form data-action="...">` chứa các phần tử con (`<input>`, `<select>`, `<textarea>`), nếu bộ lắng nghe sự kiện `click` sử dụng `event.target.closest('[data-action]')`, mọi thao tác nhấp chuột để focus ô nhập liệu hoặc bôi đen văn bản sẽ bubble lên thẻ `<form>` cha và kích hoạt nhầm action của form.
   - **Quy chuẩn bắt buộc trong `attachEventDelegation`:**
     ```javascript
     const actionEl = event.target.closest('[data-action]');
     if (!actionEl || !rootEl.contains(actionEl)) return;

     // BẮT BUỘC: Bỏ qua nếu sự kiện click bắt trúng thẻ FORM
     if (eventType === 'click' && actionEl.tagName === 'FORM') {
       return;
     }
     ```
   - Mọi hành động gửi dữ liệu của `<form>` chỉ được kích hoạt duy nhất thông qua sự kiện `submit` (ngăn reload bằng `e.preventDefault()` trong `attachFormDelegation`).
   - Tuyệt đối không gán `data-action` trùng lặp trên cả thẻ `<form>` lẫn nút `<button type="submit">` bên trong.

2. **Chuẩn Hóa Ô Nhập Liệu Kỹ Thuật (Mobile Keypad Optimization):**
   - Các ô nhập mã số như PIN điểm danh (6 chữ số) hoặc MSSV (10 chữ số) **bắt buộc** khai báo đầy đủ các thuộc tính HTML5:
     ```html
     <input 
       type="text" 
       inputmode="numeric" 
       pattern="[0-9]{6}" 
       minlength="6" 
       maxlength="6" 
       required 
       placeholder="PIN 6 số..."
       class="bht-input font-mono text-center font-bold tracking-widest"
     >
     ```
   - Thuộc tính `inputmode="numeric"` kích hoạt bàn phím số tự động trên điện thoại (iOS & Android), tối ưu trải nghiệm nhập mã điểm danh nhanh trong hội trường.

3. **Trạng Thái Rỗng Chuẩn Mực (Academic Empty State):**
   - Tuyệt đối không để màn hình trắng hoặc làm biến mất layout khi danh sách dữ liệu (Buổi sinh hoạt, Bài tập, Tài liệu, Hàng đợi chấm) chưa có dữ liệu.
   - Bắt buộc render khối Empty State trang nhã qua template chuẩn:
     ```html
     <div class="col-span-full bht-card p-8 text-center text-ink-muted">
       <i class="fa-solid fa-calendar-xmark text-3xl mb-2 text-ink-faint"></i>
       <p class="text-sm">Chưa có dữ liệu nào được ghi nhận!</p>
     </div>
     ```
   - Luôn có icon học thuật mờ nhạt và câu thông điệp hướng dẫn rõ ràng.

4. **Trạng Thái Loading Cho Nút Bấm (Button Loading Feedback & Anti-Spam):**
   - Khi người dùng bấm nút thực hiện tác vụ ghi/thay đổi dữ liệu (Điểm danh, Nộp bài, Tạo buổi học, Duyệt bài, Lưu thông tin):
     - Lập tức vô hiệu hóa nút (`btn.disabled = true;`) để chống gửi request nhiều lần (Double-submit / Spamming).
     - Hiển thị spinner quay tròn: `btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1.5"></i> Đang xử lý...';`.
     - Phục hồi lại trạng thái và icon ban đầu trong khối `finally` hoặc sau khi nhận phản hồi từ Backend.

5. **Chuẩn Hóa Thư Viện UI Components (`frontend/modules/templates.js` & Sub-Templates):**
   - **TUYỆT ĐỐI CẤM** viết chuỗi HTML trực tiếp bên trong các Controller (`admin/*.js` và `member/*.js`).
   - Mọi thành phần giao diện động **BẮT BUỘC** phải gọi thông qua các hàm component chuẩn hóa trong `frontend/modules/templates.js` hoặc sub-templates chuyên biệt như `frontend/modules/templates/quizTemplates.js`:
     - Nhóm Atomic: `uiButton()`, `uiStatusBadge()`, `uiMonoBadge()`, `uiEmptyState()`.
     - Nhóm Composite: `renderSubmissionRow()`, `renderSessionCard()`, `renderAttendeeRow()`, `renderMemberRow()`, `renderDocCard()`.
     - Nhóm Phân hệ Quiz: `renderZenQuestionCard()`, `renderZenFooterDock()`, `renderQuizQuestionGridContent()`, `renderMemberQuizView()`.
   - Toàn bộ dữ liệu đầu vào của component bắt buộc phải được lọc qua `escapeHTML()` trước khi render để chống XSS 100%.

6. **Trải Nghiệm Toàn Màn Hình Zen Focus Arena & Bảo Vệ Tiến Trình Làm Bài:**
   - Khi sinh viên đang trong phòng luyện tập hoặc làm bài thi (`isTakingMemberQuiz === true`):
     - **Miễn nhiễm với Sync đa tab:** Cấm mọi cơ chế tự động nạp lại view (`loadMemberData()`) do sự kiện đồng bộ chéo `bht_sync_event` gây đóng modal hoặc reset bài làm.
     - **Cơ chế Tự Động Chuyển Câu (Auto-next 1.2s):** Khi chọn đáp án đúng trong chế độ ôn luyện, hiển thị giải thích tức thì và chuyển câu sau 1.2s mượt mà, giữ nguyên chế độ toàn màn hình 100%.
     - **Ghi nhớ Sub-Tab:** Khi người dùng submit hoặc chuyển đổi giữa các trạng thái trong cùng một Session Detail, hệ thống phải bảo lưu active sub-tab (`currentMemberSessionSubTab`), tuyệt đối không được tự ý reset người dùng về tab Thông tin ban đầu.

---

## 7. QUY CHUẨN RESPONSIVE MOBILE PHÂN HỆ TRẮC NGHIỆM & ZEN ARENA (MOBILE QUIZ ERGONOMICS)

Để đảm bảo sinh viên và admin thao tác thoải mái trên mọi kích cỡ màn hình di động (từ 320px đến 430px như iPhone SE, iPhone 15 Pro Max, Samsung Galaxy, Pixel):

1. **Thanh Điều Hướng 3 Chốt Đáy Màn Hình (Three-Anchor Navigation Dock):**
   - **Quy tắc 1 dòng duy nhất:** Thanh đáy (`renderZenFooterDock`) chứa 3 thành phần: `[Nút Trước]`, `[Số câu Đã làm]`, `[Nút Tiếp / Nộp bài]`. Bắt buộc giữ cả 3 nút trên một hàng ngang duy nhất, tuyệt đối không được để tràn dòng rớt nút xuống dưới.
   - **Rút gọn nhãn linh hoạt (Responsive Labels):**
     - Nút Trước: Hiển thị `<i class="fa-solid fa-arrow-left"></i> <span class="hidden xs:inline sm:inline">Trước</span>`
     - Nút Ma trận câu hỏi ở giữa: `<strong class="font-mono">${answeredCount}/${totalCount}</strong> <span class="hidden sm:inline">Đã làm</span>`
     - Nút Tiếp / Nộp: `<span class="sm:hidden">${isPractice ? 'Xong' : 'Nộp bài'}</span><span class="hidden sm:inline">${isPractice ? 'Hoàn thành Ôn luyện' : 'Nộp Bài Thi'}</span>`
   - **Touch target:** Tối thiểu 40px chiều cao, có hiệu ứng `active:scale-95` tạo cảm giác phản hồi xúc giác tốt khi chạm.

2. **Cắt Bỏ Khoảng Chiều Cao Cứng Nhắc (Anti Fixed Min-Height trên Mobile):**
   - **Lỗi cũ:** Đặt `min-h-[480px]` hoặc `min-h-[520px]` khiến màn hình điện thoại thấp (667px) bị cuộn 2 tầng lồng nhau ngay cả với câu hỏi 1 dòng ngắn.
   - **Chuẩn hóa:** Dùng `min-h-0 sm:min-h-[380px]`. Padding card trên di động giảm từ `p-6/p-8` xuống `p-4 sm:p-6 md:p-8`, bo góc `rounded-2xl sm:rounded-3xl`.

3. **Ẩn Lời Nhắc Phím Tắt Trên Thiết Bị Cảm Ứng (Touch Ergonomics):**
   - Điện thoại di động và máy tính bảng không có bàn phím vật lý để bấm số 1-4 hay phím mũi tên.
   - Chuỗi gợi ý phím tắt bắt buộc bọc trong class: `<span class="hidden sm:inline-block font-mono text-[11px] text-ink-muted">Phím tắt: 1-4...</span>` để tiết kiệm diện tích quý giá cho nội dung câu hỏi.

4. **Tối Ưu Header Rút Gọn (Micro-Header Navigation):**
   - Nút "Thoát" trong Zen Arena rút gọn nhãn trên màn hình hẹp: `<i class="fa-solid fa-arrow-left text-xs"></i> <span class="hidden xs:inline sm:inline">Thoát</span>`.
   - Khối đếm ngược Timer dạng pill nhỏ gọn: `px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs`.
   - Tiêu đề buổi học ở giữa header ẩn trên mobile (`hidden md:block text-center truncate`) để nhường không gian cho Timer và Counter.

5. **Định Dạng Bảng Dữ Liệu Bảng Điểm & Lời Giải Trên Di Động (Compact Table & Card Wrapping):**
   - Bảng điểm Admin (`renderAdminQuizPanel`): Các cột phụ như `Thời gian` đặt `hidden lg:table-cell`, cột `Số câu đúng` đặt `hidden md:table-cell`. Màn hình mobile chỉ hiển thị 5 cột chính: `Hạng | MSSV | Họ tên | Điểm | Thao tác`.
   - Danh sách xem lại bài làm (`renderMemberQuizView`): Từng lựa chọn đáp án chuyển đổi từ hàng ngang sang `flex-col sm:flex-row sm:items-center` để các huy hiệu `Đáp án đúng` / `Bạn đã chọn` không bị co dúm hoặc tràn viền card khi nội dung câu trả lời dài.
   - Các nút CTA chính (Bắt đầu thi, Vào phòng ôn luyện, Xem lời giải) sử dụng `w-full sm:w-auto` để ngón cái bấm chuẩn xác 100%.


