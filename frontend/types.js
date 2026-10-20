// ====================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU TẬP TRUNG (JSDOC TYPE DEFINITIONS)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================
// File này cung cấp hợp đồng dữ liệu chuẩn (Type Contract) cho toàn bộ
// các module Frontend: Chấm dứt nhầm lẫn giữa camelCase và PascalCase,
// đồng bộ 100% với Google Sheets Backend & Mock Data.
// ====================================================================

/**
 * @typedef {'ADMIN' | 'MEMBER'} UserRole
 */

/**
 * @typedef {'Active' | 'Inactive'} MemberStatus
 */

/**
 * @typedef {'Open' | 'Closed'} SessionStatus
 */

/**
 * @typedef {'Pending' | 'Approved' | 'Rejected'} SubmissionStatus
 */

/**
 * @typedef {Object} Gift2010
 * @property {string} giftId - Mã phần quà (vd: DEADLINE_24H, BONUS_10PT, VIP_DEBUG, COFFEE_MENTOR)
 * @property {string} giftTitle - Tên quà tặng
 * @property {string} claimCode - Mã nhận quà duy nhất (vd: ITC2010-83921-204)
 * @property {string} claimedAt - Thời gian mở quà (ISO 8601)
 * @property {boolean} [used] - Trạng thái đã sử dụng quà
 */

/**
 * @typedef {Object} Member
 * @property {string} MSSV - Mã số sinh viên (10 chữ số)
 * @property {string} HoTen - Họ và tên đầy đủ của sinh viên
 * @property {string} Email - Địa chỉ Gmail sinh viên VNUF2
 * @property {UserRole} Role - Vai trò trong hệ thống (ADMIN hoặc MEMBER)
 * @property {MemberStatus} TrangThai - Trạng thái hoạt động
 * @property {string} [NgayThamGia] - Ngày gia nhập ban học thuật (ISO hoặc dd/MM/yyyy)
 * @property {'male' | 'female'} [Sex] - Giới tính thành viên (male | female)
 * @property {Gift2010|string|null} [gift2010] - Quà tặng 20/10 đồng bộ đa thiết bị
 */

/**
 * @typedef {Object} AttendanceSession
 * @property {string} SessionID - Mã định danh buổi sinh hoạt (vd: MEET_20261016)
 * @property {string} TenBuoiHop - Tên chuyên đề hoặc nội dung buổi họp
 * @property {string} MaPin - Mã PIN 6 chữ số dùng để điểm danh
 * @property {SessionStatus} TrangThai - Trạng thái buổi học ('Open' | 'Closed')
 * @property {string} DS_CoMat - Chuỗi JSON lưu mảng MSSV có mặt (vd: '["2351120015", "2351120016"]')
 * @property {string} NgayDienRa - Ngày giờ diễn ra (ISO 8601 hoặc dd/MM/yyyy)
 * @property {string} [NoiDungChuyenDe] - Tóm tắt nội dung bài giảng
 * @property {string} [LinkTaiLieu] - Đường dẫn tới slide hoặc tài liệu Google Drive
 * @property {string} [PhongHoc] - Địa điểm phòng học (vd: 'Lab 02 - Tầng 3 Nhà A3')
 * @property {string} [TagChuyenDe] - Nhãn phân loại chuyên đề (MOS_IC3, WORD_RESEARCH, EXCEL_DATA, PROMPT_AI, GENERAL, ...)
 * @property {Object} [BaiTap] - Đối tượng bài tập liên kết nếu có
 */

/**
 * @typedef {Object} Task
 * @property {string} TaskID - Mã định danh nhiệm vụ (vd: TASK_01)
 * @property {string} TieuDe - Tiêu đề bài tập / nhiệm vụ
 * @property {string} MoTa - Hướng dẫn làm bài & yêu cầu nộp
 * @property {string} NguoiNhan - Đối tượng nhận ('ALL' hoặc MSSV cụ thể)
 * @property {string} Deadline - Hạn nộp bài (ISO hoặc yyyy-MM-dd HH:mm)
 * @property {string} FolderID - ID thư mục Google Drive lưu bài làm
 * @property {SessionStatus} TrangThai - Trạng thái nhận bài ('Open' | 'Closed')
 * @property {string} [SessionID] - Mã buổi học gắn với bài tập này
 */

/**
 * @typedef {Object} Submission
 * @property {string} SubID - Mã định danh bài nộp (hoặc SubmissionID)
 * @property {string} TaskID - Mã bài tập liên kết
 * @property {string} MSSV - Mã sinh viên người nộp
 * @property {string} HoTen - Họ tên sinh viên
 * @property {string} Email - Email sinh viên
 * @property {string} TenFile - Tên tệp tin nộp
 * @property {string} DriveLink - Đường dẫn tải tệp trên Google Drive
 * @property {string} ThoiGianNop - Thời gian nộp bài (ISO hoặc yyyy-MM-dd HH:mm:ss)
 * @property {SubmissionStatus} TrangThaiDuyet - Trạng thái chấm ('Pending' | 'Approved' | 'Rejected')
 * @property {string} [Feedback] - Nhận xét, góp ý của Mentor / Quản trị viên
 */

/**
 * @typedef {Object} AcademicDocument
 * @property {string} DocID - Mã tài liệu học liệu (vd: DOC_01)
 * @property {string} TenTaiLieu - Tên tài liệu
 * @property {string} PhanLoai - Phân loại học liệu (Slide, Word, Excel, MOS, Prompt AI, ...)
 * @property {string} LinkDrive - Đường dẫn Google Drive
 * @property {string} [MoTa] - Tóm tắt nội dung học liệu
 */

/**
 * @typedef {Object} UserSession
 * @property {string} mssv - MSSV người dùng hiện tại
 * @property {string} hoTen - Họ tên người dùng
 * @property {string} email - Email người dùng
 * @property {UserRole} role - Vai trò ('ADMIN' | 'MEMBER')
 * @property {MemberStatus} [trangThai] - Trạng thái hoạt động
 * @property {'male' | 'female'} [sex] - Giới tính thành viên
 * @property {Gift2010|string|null} [gift2010] - Quà 20/10 đã nhận
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Kết quả gọi API (true/false)
 * @property {any} [data] - Dữ liệu trả về từ máy chủ
 * @property {string} [message] - Thông báo hiển thị cho người dùng
 * @property {string} [errorCode] - Mã lỗi chuẩn nếu thất bại
 */

export {};
