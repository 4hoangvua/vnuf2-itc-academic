---
trigger: model_decision
description: Cách tổ chức NỘI DUNG cho tài liệu đặc tả, thiết kế, kỹ thuật của dự án phần mềm hoặc web (kiến trúc, dữ liệu, luồng nghiệp vụ, bảo mật, hiệu năng, kiểm thử)
---

---
name: technical-design-doc
description: "Cách tổ chức NỘI DUNG cho tài liệu đặc tả, thiết kế, kỹ thuật của dự án phần mềm hoặc web (kiến trúc, dữ liệu, luồng nghiệp vụ, bảo mật, hiệu năng, kiểm thử). Dùng khi người dùng muốn tài liệu rõ ràng, có hệ thống, theo kiểu tài liệu thiết kế UML. Quy định mục nào cần sơ đồ nào, bảng nào, cách viết. Dùng kèm general-docx-formatting để định dạng file Word."
---
# Tài liệu thiết kế kỹ thuật: cách tổ chức nội dung

Mục tiêu: người đọc không biết gì về dự án vẫn hiểu hệ thống gồm gì, chạy thế nào, vì sao thiết kế như vậy, và kiểm chứng ra sao.

## 1. Quy trình trước khi viết

1. Đọc mã nguồn hoặc tài liệu có sẵn. Không bịa tên tệp, hàm, bảng, cột. Chỗ chưa biết ghi "Chưa xác định" và hỏi lại người dùng.
2. Lập danh sách thực thể (dữ liệu), tác nhân (người dùng), luồng nghiệp vụ, module. Từ danh sách này mới chọn sơ đồ.
3. Lập bảng truy vết sơ bộ: yêu cầu, thành phần thực hiện, cách kiểm thử.

## 2. Khung mục chuẩn (bỏ mục không phù hợp, giữ thứ tự)

1. Tổng quan: bài toán, mục tiêu, phạm vi, ngoài phạm vi, thuật ngữ.
2. Yêu cầu: bảng yêu cầu chức năng (FR-01...) và phi chức năng (NFR-01...), mỗi dòng có mô tả, mức ưu tiên.
3. Mô hình hóa hệ thống (chọn đúng loại sơ đồ, xem bảng dưới).
4. Đặc tả chi tiết: mỗi module, lớp, API có một bảng đặc tả cột cố định.
5. Quyết định thiết kế: bảng Vấn đề, Phương án, Lựa chọn, Lý do, Đánh đổi.
6. Phi chức năng: bảo mật, hiệu năng, độ tin cậy, mỗi mục có số đo hoặc tiêu chí kiểm tra được.
7. Kiểm thử: ca kiểm thử và ma trận truy vết yêu cầu, thành phần, ca kiểm thử.
8. Kết luận: hạn chế, rủi ro, hướng phát triển.

## 3. Chọn sơ đồ theo câu hỏi cần trả lời

- Ai dùng hệ thống để làm gì: sơ đồ use case.
- Hệ thống gồm khối nào, chạy ở đâu: sơ đồ thành phần (component) và sơ đồ triển khai (deployment).
- Dữ liệu gì, liên hệ ra sao: ERD kèm từ điển dữ liệu (bảng: tên cột, kiểu, khóa, ràng buộc, ý nghĩa).
- Một luồng diễn ra theo thứ tự nào: sơ đồ tuần tự, mỗi luồng chính một sơ đồ.
- Thực thể có trạng thái (ví dụ Open/Closed, Pending/Approved/Rejected): sơ đồ trạng thái (state machine).
- Thuật toán, quy trình có rẽ nhánh: sơ đồ hoạt động.
- Phần mềm hướng đối tượng: sơ đồ lớp, kèm bảng đặc tả từng lớp và bảng quan hệ (loại quan hệ, bản số, cách cài đặt).
- Phần mềm JavaScript theo module: bảng module (tên tệp, trách nhiệm, phụ thuộc vào, được gọi bởi) kèm sơ đồ thành phần.

## 4. Cách viết và trình bày bảng

- Mỗi mục lớn mở bằng 1 đến 2 câu nêu mục đích. Mỗi sơ đồ có đoạn "cách đọc" ngay sau: nêu thành phần chính, thứ tự bước, điểm cần chú ý.
- Mỗi bảng có nhận xét liền kề, không chỉ đặt bảng rồi bỏ đó.
- Cỡ chữ trong bảng: thống nhất 13 pt (Times New Roman), màu đen 100%, không giảm xuống 12 pt.
- Trình bày text trong ô bảng: không thụt đầu dòng (thụt lề trái 0, thụt đầu dòng 0), dãn dòng 1.5 lines, giãn đoạn 0 pt. Tiêu đề cột in đậm, căn giữa. Cột số thứ tự, mã số, ngày tháng căn giữa. Cột nội dung mô tả căn trái hoặc căn đều hai bên.
- Bố cục độ rộng cột: phải tính toán tỷ lệ dxa hợp lý dựa trên độ dài nội dung để tránh chữ bị ngắt vụn hoặc rớt dòng lộn xộn.
- Mỗi quyết định thiết kế phải có lý do và đánh đổi. Không viết lời quảng cáo hay từ tuyệt đối ("hiện đại", "tuyệt đối", "triệt tiêu hoàn toàn"). Thay bằng số đo hoặc cơ chế cụ thể ("chặn bằng cơ chế X, kiểm thử bằng Y").
- Mọi con số (thời gian, dung lượng, giới hạn) ghi rõ nguồn: đo thực tế, cấu hình trong mã, hoặc giới hạn của nền tảng.
- Thống nhất thuật ngữ và tên định danh: một khái niệm một tên, giữ nguyên chữ hoa chữ thường như trong mã.
- Danh sách thuộc tính, cột, tham số thì dùng bảng, không dùng danh sách gạch đầu dòng dài.

## 5. Sơ đồ

- Vẽ bằng công cụ có mã nguồn (Graphviz, matplotlib, Mermaid), lưu ảnh PNG độ phân giải từ 200 dpi.
- Đen trắng, nền trắng, cùng một bộ ký hiệu UML chuẩn trong toàn tài liệu, có hình chú giải ký hiệu ở lần đầu dùng.
- Mỗi sơ đồ chỉ trả lời một câu hỏi. Quá 10 hộp thì tách sơ đồ hoặc rút gọn thành phần, phần đầy đủ để ở bảng đặc tả.
- Sau khi vẽ phải xem lại ảnh: chữ không bị cắt, đường nối không đè lên chữ, không đường chéo nhau nếu tránh được.

## 6. Quy chuẩn kỹ thuật tệp Word (.docx) và chống lỗi XML

- Style Heading: Phải sử dụng đúng style hệ thống của Word (`Heading 1`, `Heading 2`, `Heading 3`, `Heading 4`) để Word nhận diện cấu trúc cây tại Navigation Pane và Mục lục tự động.
- Trật tự Schema OpenXML: Thuộc tính `w:pStyle` bắt buộc phải là phần tử con đầu tiên bên trong `w:pPr`. Tuyệt đối không append `w:pStyle` ở cuối `w:pPr` sau `w:spacing` hoặc `w:jc` vì sẽ gây lỗi cấu trúc XML khiến Word báo "unreadable content".
- Tránh ghi đè XML thô gây hỏng namespace (`xmlns:w`, `xmlns:r`).
- Chỉ xuất và bàn giao tệp Word (.docx), không tạo tệp PDF nếu người dùng không yêu cầu cụ thể.

## 7. Tự kiểm tra trước khi giao

- Mở tệp trực tiếp trong Microsoft Word và WordCraft để kiểm tra: không có hộp thoại cảnh báo lỗi cấu trúc, Navigation Pane hiển thị đầy đủ các cấp Heading 1 đến Heading 4.
- Mỗi yêu cầu ở mục 2 đều có thành phần thực hiện và ca kiểm thử trong ma trận truy vết.
- Mỗi thực thể trong ERD có từ điển dữ liệu, mỗi luồng chính có sơ đồ tuần tự, mỗi thực thể có trạng thái có sơ đồ trạng thái.
- Tên trong sơ đồ, bảng và văn bản khớp nhau.
- Bảng biểu ngay ngắn, cỡ chữ đúng 13 pt, không còn lời quảng cáo hoặc con số không rõ nguồn.