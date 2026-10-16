// ====================================================================
// CẤU HÌNH HỆ THỐNG TOÀN CỤC (CENTRAL CONFIGURATION)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================

const CONFIG = {
  // ID file Google Sheet quản lý chung (có 5 tab theo đặc tả)
  SHEET_ID: '1dfISUGTsbEZ1289jN0i1SDB_MpXdoorgQA14mCttdus',
  
  // ID thư mục Google Drive gốc lưu trữ tài liệu & bài nộp
  ROOT_FOLDER_ID: '1yeKM77HthrvSuej1Y3b4t4XHYkpJ1sEW',

  // Tên các Tab tính trong Google Sheet
  SHEET_NAMES: {
    THANH_VIEN: 'ThanhVien',
    NHIEM_VU: 'NhiemVu',
    BAI_NOP: 'BaiNop',
    DIEM_DANH: 'DiemDanh',
    TAI_LIEU: 'TaiLieu'
  },

  // Cấu trúc tiêu đề chuẩn cho từng Tab (Chống lỗi thiếu Header Row)
  SCHEMA_HEADERS: {
    ThanhVien: ['MSSV', 'HoTen', 'Email', 'Role', 'TrangThai', 'NgayThamGia'],
    NhiemVu: ['TaskID', 'TieuDe', 'MoTa', 'NguoiNhan', 'Deadline', 'FolderID', 'TrangThai', 'SessionID'],
    BaiNop: ['SubID', 'TaskID', 'MSSV', 'HoTen', 'Email', 'TenFile', 'DriveLink', 'ThoiGianNop', 'TrangThaiDuyet', 'Feedback'],
    DiemDanh: ['SessionID', 'TenBuoiHop', 'MaPin', 'TrangThai', 'DS_CoMat', 'NgayDienRa', 'NoiDungChuyenDe', 'LinkTaiLieu', 'TagChuyenDe', 'PhongHoc'],
    TaiLieu: ['DocID', 'TenTaiLieu', 'PhanLoai', 'LinkDrive', 'MoTa']
  },

  // Thời gian chờ khóa tối đa cho Script Lock (10 giây)
  LOCK_TIMEOUT_MS: 10000,

  // Cấu hình Session Token xác thực
  AUTH: {
    TOKEN_PREFIX: 'AUTH_TOKEN_',
    TOKEN_TTL_SECONDS: 6 * 3600, // 6 tiếng
    OTP_TTL_SECONDS: 300,        // 5 phút
    OTP_PREFIX: 'OTP_'
  },

  // Cấu hình Cache dữ liệu phía Server (CacheService)
  CACHE: {
    SHEET_DATA_TTL: 180,         // Cache mảng dữ liệu sheet 3 phút
    OPEN_SESSION_KEY: 'OPEN_SESSION_CACHE',
    OPEN_SESSION_TTL: 3600       // Cache phiên điểm danh đang mở 1 tiếng
  },

  // Phân loại quyền truy cập theo từng Action (Middleware phân quyền)
  ROLES: {
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER'
  },

  // 1. Nhóm Action công khai (Không cần Token)
  PUBLIC_ACTIONS: [
    'ping',
    'getAuthStatus',
    'requestLoginOtp',
    'verifyLoginOtp'
  ],

  // 2. Nhóm Action của Thành viên (Cần Token, bắt buộc dùng currentUser.mssv)
  MEMBER_ACTIONS: [
    'checkInAttendance',
    'submitTaskAssignment',
    'getMemberSubmissions',
    'logoutUser'
  ],

  // 3. Nhóm Action của Ban Quản trị (Cần Token, bắt buộc role === 'ADMIN')
  ADMIN_ACTIONS: [
    'getAllMembers',
    'addMember',
    'resetMemberEmail',
    'toggleMemberStatus',
    'createAttendanceSession',
    'updateAttendanceSession',
    'deleteAttendanceSession',
    'updateAttendanceTopic',
    'toggleAttendanceSession',
    'createTask',
    'updateTask',
    'deleteTask',
    'toggleTaskStatus',
    'reviewSubmission',
    'getAllSubmissions',
    'addDocument',
    'updateDocument',
    'deleteDocument'
  ],

  // 4. Nhóm Action truy vấn chung (Đã đăng nhập - Member & Admin đều dùng được)
  QUERY_ACTIONS: [
    'getAttendanceSessions',
    'getAllTasks',
    'getAllDocuments'
  ]
};

/**
 * Định dạng thời gian hiện tại theo chuỗi DD/MM/YYYY HH:mm:ss
 */
function formatCurrentDateTime() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
}

/**
 * Xóa dấu tiếng Việt phục vụ chuẩn hóa tên file / tên folder Google Drive
 */
function removeVietnameseTones(str) {
  if (!str) return '';
  str = String(str);
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  // Loại bỏ ký tự đặc biệt không an toàn cho tên file
  return str.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}
