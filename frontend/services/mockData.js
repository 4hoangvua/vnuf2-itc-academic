// ====================================================================
// DỮ LIỆU MẪU & BỘ GIẢ LẬP LOCAL MOCK API (MOCK DATA SERVICE)
// ====================================================================
// Cho phép các thành viên CLB phát triển, kiểm thử UI/UX tức thì trên
// Antigravity / Live Server mà không cần kết nối mạng hoặc cấp quyền Sheet.
// ====================================================================

export const INITIAL_MOCK_DATA = {
  // 1. Danh sách thành viên mẫu
  members: [
    {
      MSSV: '2251120001',
      HoTen: 'Nguyễn Văn Hoàng',
      Email: 'hoangnv.vnuf2@gmail.com',
      Role: 'ADMIN',
      TrangThai: 'Active',
      NgayThamGia: '10/09/2024'
    },
    {
      MSSV: '2251120002',
      HoTen: 'Trần Thị Thu Trang',
      Email: 'thutrang.cntt@gmail.com',
      Role: 'ADMIN',
      TrangThai: 'Active',
      NgayThamGia: '15/09/2024'
    },
    {
      MSSV: '2351120015',
      HoTen: 'Lê Hoàng Minh',
      Email: 'minhlh.k68@gmail.com',
      Role: 'MEMBER',
      TrangThai: 'Active',
      NgayThamGia: '01/10/2025'
    },
    {
      MSSV: '2351120028',
      HoTen: 'Phạm Phương Anh',
      Email: 'phuonganh.cntt@gmail.com',
      Role: 'MEMBER',
      TrangThai: 'Active',
      NgayThamGia: '05/10/2025'
    },
    {
      MSSV: '2451120033',
      HoTen: 'Vũ Quốc Bảo',
      Email: '',
      Role: 'MEMBER',
      TrangThai: 'Active',
      NgayThamGia: '10/10/2026'
    },
    {
      MSSV: '2251120099',
      HoTen: 'Đỗ Tiến Đạt',
      Email: 'tiendat.old@gmail.com',
      Role: 'MEMBER',
      TrangThai: 'Inactive',
      NgayThamGia: '01/09/2023'
    }
  ],

  // 2. Danh sách buổi sinh hoạt & chuyên đề (kèm bài tập thực hành)
  attendance: [
    {
      SessionID: 'MEET_20261015_190000',
      TenBuoiHop: 'Sinh hoạt Chuyên đề 04: Kiến trúc Headless & Git Collaboration',
      MaPin: '839201',
      TrangThai: 'Open',
      DS_CoMat: JSON.stringify(['2251120001', '2351120015']),
      NgayDienRa: '15/10/2026 19:30',
      NoiDungChuyenDe: 'Tìm hiểu cách tách biệt Frontend GitHub Pages và Google Apps Script API. Thực hành chia module cho nhóm 5 người.',
      LinkTaiLieu: 'https://github.com',
      TagChuyenDe: 'GENERAL',
      PhongHoc: 'Phòng Lab 02 - Tầng 3 Nhà A3',
      BaiTap: {
        TaskID: 'TASK_20261015_001',
        TieuDe: 'Thực hành Refactor Module Frontend với ES6 Modules',
        MoTa: 'Chuyển đổi giao diện cũ sang mô hình module hóa độc lập, kiểm thử chức năng nộp bài và chạy thử nghiệm trên Live Server.',
        NguoiNhan: 'ALL',
        Deadline: '2026-10-22T23:59',
        FolderID: 'MOCK_FOLDER_TASK_001',
        TrangThai: 'Open',
        SessionID: 'MEET_20261015_190000'
      }
    },
    {
      SessionID: 'MEET_20261008_190000',
      TenBuoiHop: 'Sinh hoạt Chuyên đề 03: Thuật toán quy hoạch động căn bản',
      MaPin: '492019',
      TrangThai: 'Closed',
      DS_CoMat: JSON.stringify(['2251120001', '2251120002', '2351120015', '2351120028']),
      NgayDienRa: '08/10/2026 19:30',
      NoiDungChuyenDe: 'Phân tích các bài toán Knapsack, Dãy con tăng dài nhất (LIS) và các biến thể trong thi Olympic Tin học.',
      LinkTaiLieu: 'https://drive.google.com',
      TagChuyenDe: 'OLYMPIC',
      PhongHoc: 'Phòng Lab 01 - Tòa A3',
      BaiTap: {
        TaskID: 'TASK_20261008_002',
        TieuDe: 'Giải bộ 5 bài tập Quy hoạch động trên VNOJ',
        MoTa: 'Cài đặt bằng C++ hoặc Python, viết báo cáo độ phức tạp thuật toán và nộp file nén mã nguồn.',
        NguoiNhan: 'ALL',
        Deadline: '2026-10-14T23:59',
        FolderID: 'MOCK_FOLDER_TASK_002',
        TrangThai: 'Closed',
        SessionID: 'MEET_20261008_190000'
      }
    },
    {
      SessionID: 'MEET_20261022_190000',
      TenBuoiHop: 'Chuyên đề 05: Kỹ năng Định dạng Luận văn & Khóa luận tốt nghiệp chuẩn VNUF2',
      MaPin: '654321',
      TrangThai: 'Closed',
      DS_CoMat: JSON.stringify(['2251120001', '2351120015', '2351120028', '2451120033']),
      NgayDienRa: '22/10/2026 19:30',
      NoiDungChuyenDe: 'Hướng dẫn chuẩn hóa Heading, tạo Mục lục tự động, Danh mục hình ảnh/bảng biểu, đánh số trang La Mã/Ả Rập và trích dẫn tài liệu tham khảo theo chuẩn IEEE.',
      LinkTaiLieu: 'https://drive.google.com/vnuf2-word-template',
      TagChuyenDe: 'WORD_DO_AN',
      PhongHoc: 'Phòng 302 - Tòa Tri Thức',
      BaiTap: {
        TaskID: 'TASK_20261022_001',
        TieuDe: 'Định dạng bài báo cáo mẫu 15 trang chuẩn quy cách VNUF2',
        MoTa: 'Áp dụng Styles, tạo Multilevel List, ngắt Section Header/Footer khác nhau giữa các chương và xuất file PDF.',
        NguoiNhan: 'ALL',
        Deadline: '2026-10-29T23:59',
        FolderID: 'MOCK_FOLDER_TASK_003',
        TrangThai: 'Closed',
        SessionID: 'MEET_20261022_190000'
      }
    },
    {
      SessionID: 'MEET_20261029_190000',
      TenBuoiHop: 'Chuyên đề 06: Luyện thi Chuẩn đầu ra MOS Excel & Dashboard số liệu',
      MaPin: '987123',
      TrangThai: 'Closed',
      DS_CoMat: JSON.stringify(['2251120001', '2351120015']),
      NgayDienRa: '29/10/2026 19:30',
      NoiDungChuyenDe: 'Phân tích các dạng câu hỏi thường gặp trong kỳ thi MOS Excel 2019: VLOOKUP, INDEX-MATCH, PivotTable, Data Validation và biểu đồ chuyên nghiệp.',
      LinkTaiLieu: 'https://drive.google.com/vnuf2-mos-excel',
      TagChuyenDe: 'EXCEL_DATA',
      PhongHoc: 'Phòng Lab 02 - Tòa A3',
      BaiTap: {
        TaskID: 'TASK_20261029_001',
        TieuDe: 'Hoàn thành bộ đề thực hành MOS Excel Exam 1',
        MoTa: 'Thực hiện 7 Projects theo đúng thời gian chuẩn 50 phút và nộp file .xlsx kết quả.',
        NguoiNhan: 'ALL',
        Deadline: '2026-11-05T23:59',
        FolderID: 'MOCK_FOLDER_TASK_004',
        TrangThai: 'Open',
        SessionID: 'MEET_20261029_190000'
      }
    },
    {
      SessionID: 'SESSION_GENERAL',
      TenBuoiHop: 'Hoạt động & Nhiệm vụ chung của Ban',
      MaPin: '',
      TrangThai: 'Open',
      DS_CoMat: '[]',
      NgayDienRa: 'Học kỳ I · 2026–2027',
      NoiDungChuyenDe: 'Các nhiệm vụ học thuật chung, bài khảo sát năng lực đầu vào và phân nhóm học tập chuyên đề.',
      LinkTaiLieu: 'https://github.com',
      TagChuyenDe: 'GENERAL',
      PhongHoc: 'Hội trường A2 / Online Google Meet',
      BaiTap: {
        TaskID: 'TASK_GENERAL_001',
        TieuDe: 'Cập nhật tài khoản GitHub & Đăng ký nhóm chuyên đề',
        MoTa: 'Tạo tài khoản GitHub, fork repository Ban Học Thuật và nộp link GitHub cá nhân để cấp quyền thành viên.',
        NguoiNhan: 'ALL',
        Deadline: '2026-11-01T23:59',
        FolderID: 'MOCK_FOLDER_GENERAL',
        TrangThai: 'Open',
        SessionID: 'SESSION_GENERAL'
      }
    }
  ],

  // 3. Danh sách nhiệm vụ học thuật (tương thích ngược)
  tasks: [
    {
      TaskID: 'TASK_20261015_001',
      TieuDe: 'Thực hành Refactor Module Frontend với ES6 Modules',
      MoTa: 'Chuyển đổi giao diện cũ sang mô hình module hóa độc lập, kiểm thử chức năng nộp bài và chạy thử nghiệm trên Live Server.',
      NguoiNhan: 'ALL',
      Deadline: '2026-10-22T23:59',
      FolderID: 'MOCK_FOLDER_TASK_001',
      TrangThai: 'Open',
      SessionID: 'MEET_20261015_190000'
    },
    {
      TaskID: 'TASK_20261008_002',
      TieuDe: 'Giải bộ 5 bài tập Quy hoạch động trên VNOJ',
      MoTa: 'Cài đặt bằng C++ hoặc Python, viết báo cáo độ phức tạp thuật toán và nộp file nén mã nguồn.',
      NguoiNhan: 'ALL',
      Deadline: '2026-10-14T23:59',
      FolderID: 'MOCK_FOLDER_TASK_002',
      TrangThai: 'Closed',
      SessionID: 'MEET_20261008_190000'
    },
    {
      TaskID: 'TASK_20261022_001',
      TieuDe: 'Định dạng bài báo cáo mẫu 15 trang chuẩn quy cách VNUF2',
      MoTa: 'Áp dụng Styles, tạo Multilevel List, ngắt Section Header/Footer khác nhau giữa các chương và xuất file PDF.',
      NguoiNhan: 'ALL',
      Deadline: '2026-10-29T23:59',
      FolderID: 'MOCK_FOLDER_TASK_003',
      TrangThai: 'Closed',
      SessionID: 'MEET_20261022_190000'
    },
    {
      TaskID: 'TASK_20261029_001',
      TieuDe: 'Hoàn thành bộ đề thực hành MOS Excel Exam 1',
      MoTa: 'Thực hiện 7 Projects theo đúng thời gian chuẩn 50 phút và nộp file .xlsx kết quả.',
      NguoiNhan: 'ALL',
      Deadline: '2026-11-05T23:59',
      FolderID: 'MOCK_FOLDER_TASK_004',
      TrangThai: 'Open',
      SessionID: 'MEET_20261029_190000'
    },
    {
      TaskID: 'TASK_GENERAL_001',
      TieuDe: 'Cập nhật tài khoản GitHub & Đăng ký nhóm chuyên đề',
      MoTa: 'Tạo tài khoản GitHub, fork repository Ban Học Thuật và nộp link GitHub cá nhân để cấp quyền thành viên.',
      NguoiNhan: 'ALL',
      Deadline: '2026-11-01T23:59',
      FolderID: 'MOCK_FOLDER_GENERAL',
      TrangThai: 'Open',
      SessionID: 'SESSION_GENERAL'
    }
  ],

  // 4. Danh sách bài nộp
  submissions: [
    {
      SubID: 'SUB_20261015_193000',
      TaskID: 'TASK_20261015_001',
      MSSV: '2351120015',
      HoTen: 'Lê Hoàng Minh',
      Email: 'minhlh.k68@gmail.com',
      TenFile: '[2351120015]_[Le_Hoang_Minh]_refactor_frontend.zip',
      DriveLink: 'https://drive.google.com/mock-file-01',
      ThoiGianNop: '15/10/2026 20:15:00',
      TrangThaiDuyet: 'Pending',
      Feedback: ''
    },
    {
      SubID: 'SUB_20261010_142000',
      TaskID: 'TASK_20261008_002',
      MSSV: '2351120015',
      HoTen: 'Lê Hoàng Minh',
      Email: 'minhlh.k68@gmail.com',
      TenFile: '[2351120015]_[Le_Hoang_Minh]_dp_vnoj.cpp',
      DriveLink: 'https://drive.google.com/mock-file-02',
      ThoiGianNop: '10/10/2026 14:20:00',
      TrangThaiDuyet: 'Approved',
      Feedback: 'Thuật toán tối ưu tốt O(NlogN), code sạch sẽ, giải thích rõ các bước quy hoạch động.'
    },
    {
      SubID: 'SUB_20261023_083000',
      TaskID: 'TASK_20261022_001',
      MSSV: '2351120015',
      HoTen: 'Lê Hoàng Minh',
      Email: 'minhlh.k68@gmail.com',
      TenFile: '[2351120015]_[Le_Hoang_Minh]_BaoCao_VNUF2.docx',
      DriveLink: 'https://drive.google.com/mock-file-04',
      ThoiGianNop: '23/10/2026 08:30:00',
      TrangThaiDuyet: 'Approved',
      Feedback: 'Định dạng chuẩn chỉ, mục lục và danh mục bảng biểu tự động hoạt động chính xác. Đạt yêu cầu.'
    },
    {
      SubID: 'SUB_20261011_091000',
      TaskID: 'TASK_20261008_002',
      MSSV: '2351120028',
      HoTen: 'Phạm Phương Anh',
      Email: 'phuonganh.cntt@gmail.com',
      TenFile: '[2351120028]_[Pham_Phuong_Anh]_bai_tap_qhd.pdf',
      DriveLink: 'https://drive.google.com/mock-file-03',
      ThoiGianNop: '11/10/2026 09:10:00',
      TrangThaiDuyet: 'Approved',
      Feedback: 'Báo cáo chi tiết, giải thích rõ các bước lập bảng phương án.'
    },
    {
      SubID: 'SUB_20261016_100000',
      TaskID: 'TASK_20261015_001',
      MSSV: '2251120002',
      HoTen: 'Trần Thị Thu Trang',
      Email: 'thutrang.cntt@gmail.com',
      TenFile: '[2251120002]_[Tran_Thi_Thu_Trang]_refactor.zip',
      DriveLink: 'https://drive.google.com/mock-file-05',
      ThoiGianNop: '16/10/2026 10:00:00',
      TrangThaiDuyet: 'Approved',
      Feedback: 'Cấu trúc module rõ ràng, phân trang chuẩn chỉ.'
    },
    {
      SubID: 'SUB_20261016_110000',
      TaskID: 'TASK_20261029_001',
      MSSV: '2351120015',
      HoTen: 'Lê Hoàng Minh',
      Email: 'minhlh.k68@gmail.com',
      TenFile: '[2351120015]_[Le_Hoang_Minh]_mos_excel_project1.xlsx',
      DriveLink: 'https://drive.google.com/mock-file-06',
      ThoiGianNop: '16/10/2026 11:00:00',
      TrangThaiDuyet: 'Pending',
      Feedback: ''
    },
    {
      SubID: 'SUB_20261016_120000',
      TaskID: 'TASK_20261015_001',
      MSSV: '2351120028',
      HoTen: 'Phạm Phương Anh',
      Email: 'phuonganh.cntt@gmail.com',
      TenFile: '[2351120028]_[Pham_Phuong_Anh]_es6_refactor.zip',
      DriveLink: 'https://drive.google.com/mock-file-07',
      ThoiGianNop: '16/10/2026 12:15:00',
      TrangThaiDuyet: 'Pending',
      Feedback: ''
    },
    {
      SubID: 'SUB_20261016_130000',
      TaskID: 'TASK_GENERAL_001',
      MSSV: '2451120033',
      HoTen: 'Vũ Quốc Bảo',
      Email: 'baovq.k69@gmail.com',
      TenFile: '[2451120033]_[Vu_Quoc_Bao]_github_profile.txt',
      DriveLink: 'https://drive.google.com/mock-file-08',
      ThoiGianNop: '16/10/2026 13:30:00',
      TrangThaiDuyet: 'Approved',
      Feedback: 'Đã cấp quyền Collaborator vào repository.'
    },
    {
      SubID: 'SUB_20261016_140000',
      TaskID: 'TASK_20261008_002',
      MSSV: '2251120099',
      HoTen: 'Đỗ Tiến Đạt',
      Email: 'tiendat.old@gmail.com',
      TenFile: '[2251120099]_[Do_Tien_Dat]_qhd_vnoj.cpp',
      DriveLink: 'https://drive.google.com/mock-file-09',
      ThoiGianNop: '16/10/2026 14:00:00',
      TrangThaiDuyet: 'Rejected',
      Feedback: 'Thuật toán chưa tối ưu, bị Time Limit Exceeded ở test case 8 và 10. Cần viết lại bảng phương án.'
    },
    {
      SubID: 'SUB_20261016_150000',
      TaskID: 'TASK_20261022_001',
      MSSV: '2451120033',
      HoTen: 'Vũ Quốc Bảo',
      Email: 'baovq.k69@gmail.com',
      TenFile: '[2451120033]_[Vu_Quoc_Bao]_bao_cao_word.docx',
      DriveLink: 'https://drive.google.com/mock-file-10',
      ThoiGianNop: '16/10/2026 15:45:00',
      TrangThaiDuyet: 'Pending',
      Feedback: ''
    }
  ],

  // 5. Kho tài liệu học thuật (Phân loại đa dạng theo Chuẩn đầu ra, Word, Excel, AI, Olympic)
  documents: [
    {
      DocID: 'DOC_WORD_001',
      TenTaiLieu: 'Template Word Luận văn & Khóa luận Tốt nghiệp Chuẩn Thể thức VNUF2',
      PhanLoai: 'Word & Khóa luận',
      LinkDrive: 'https://drive.google.com',
      MoTa: 'Mẫu chuẩn bìa, lời cảm ơn, mục lục tự động, canh lề 3-2-2-2 và font Times New Roman chuẩn Bộ GD&ĐT.'
    },
    {
      DocID: 'DOC_MOS_001',
      TenTaiLieu: 'Bộ tài liệu Ôn thi Chuẩn đầu ra Tin học MOS Word & Excel 2019',
      PhanLoai: 'Chuẩn đầu ra (MOS/IC3)',
      LinkDrive: 'https://drive.google.com',
      MoTa: 'Tổng hợp 5 bộ đề ôn sát thực tế, video hướng dẫn từng bước và bộ câu hỏi trắc nghiệm lý thuyết.'
    },
    {
      DocID: 'DOC_AI_001',
      TenTaiLieu: 'Cẩm nang Prompt Engineering & Kỹ năng ứng dụng AI cho Sinh viên',
      PhanLoai: 'Prompt AI & Tools',
      LinkDrive: 'https://drive.google.com',
      MoTa: 'Hướng dẫn viết prompt học tập, tóm tắt tài liệu tiếng Anh, tạo dàn ý nghiên cứu khoa học và viết code hỗ trợ.'
    },
    {
      DocID: 'DOC_EXCEL_001',
      TenTaiLieu: 'Tuyển tập 50 hàm Excel nâng cao & Xây dựng Dashboard Quản lý',
      PhanLoai: 'Excel & Dữ liệu',
      LinkDrive: 'https://drive.google.com',
      MoTa: 'Các hàm XLOOKUP, FILTER, UNIQUE, SORT, kỹ thuật xử lý dữ liệu khảo sát và vẽ biểu đồ động chuyên nghiệp.'
    },
    {
      DocID: 'DOC_OLYMPIC_001',
      TenTaiLieu: 'Slide bài giảng: Lập trình C++ nâng cao & Cấu trúc dữ liệu STL',
      PhanLoai: 'Olympic & Thuật toán',
      LinkDrive: 'https://drive.google.com',
      MoTa: 'Vector, map, set, priority_queue, quy hoạch động và các kỹ thuật tối ưu I/O trong thi đấu lập trình.'
    },
    {
      DocID: 'DOC_OLYMPIC_002',
      TenTaiLieu: 'Bộ đề thi & Lời giải Olympic Tin học Sinh viên Toàn quốc 2021-2025',
      PhanLoai: 'Olympic & Thuật toán',
      LinkDrive: 'https://drive.google.com',
      MoTa: 'Tuyển tập đề thi khối Chuyên tin và Không chuyên tin có kèm code mẫu C++ và test case chi tiết.'
    }
  ]
};

// Quản lý State Mock trong phiên làm việc localStorage
export function getLocalMockState() {
  const saved = localStorage.getItem('bht_mock_store');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Nếu store cũ chưa có bộ học liệu mới hoặc chưa có submissions đầy đủ, tự động làm mới
      if (parsed.documents && parsed.documents.some(d => d.DocID === 'DOC_MOS_001') && 
          parsed.attendance && parsed.attendance.some(s => s.PhongHoc) &&
          parsed.submissions && parsed.submissions.length >= 8) {
        return parsed;
      }
    } catch (e) {
      console.warn('Lỗi parse mock store, khởi tạo lại từ đầu:', e);
    }
  }
  localStorage.setItem('bht_mock_store', JSON.stringify(INITIAL_MOCK_DATA));
  return JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
}

export function saveLocalMockState(state) {
  localStorage.setItem('bht_mock_store', JSON.stringify(state));
}

/**
 * Xử lý giả lập các action của Google Apps Script API
 */
export async function handleMockAction(action, payload) {
  // Giả lập độ trễ mạng tự nhiên 120ms
  await new Promise(resolve => setTimeout(resolve, 120));

  const state = getLocalMockState();
  const data = (typeof payload === 'object' && payload !== null) ? payload : { raw: payload };

  switch (action) {
    case 'ping':
      return {
        success: true,
        message: 'Mock API Server đang phản hồi tốt (Local Dev Mode)!',
        serverTime: new Date().toLocaleString('vi-VN'),
        isMock: true
      };

    // 1. AUTH
    case 'getAuthStatus': {
      const token = localStorage.getItem('bht_token') || '';
      
      // 1. Nếu có Session Token Mock hợp lệ
      if (token && token.startsWith('MOCK_TOKEN_')) {
        const targetMssv = token.replace('MOCK_TOKEN_', '').trim().toUpperCase();
        const member = state.members.find(m => m.MSSV === targetMssv);
        if (member) {
          if (member.TrangThai === 'Inactive') {
            return { status: 'BLOCKED', message: 'Tài khoản của bạn đang ở trạng thái Tạm khóa (Inactive)!' };
          }
          return {
            status: 'AUTHENTICATED',
            user: {
              mssv: member.MSSV,
              hoTen: member.HoTen,
              email: member.Email,
              role: member.Role,
              trangThai: member.TrangThai,
              ngayThamGia: member.NgayThamGia
            }
          };
        }
      }

      // 2. Không có Token hợp lệ: Kiểm tra MSSV lưu trữ để hỗ trợ gợi ý đăng nhập OTP (như GAS)
      const cleanCachedMssv = String(data.cachedMssv || data.mssv || payload || '').trim().toUpperCase();
      if (cleanCachedMssv) {
        const member = state.members.find(m => m.MSSV === cleanCachedMssv);
        if (member) {
          if (member.TrangThai === 'Inactive') {
            return { status: 'BLOCKED', message: 'Tài khoản của bạn đang ở trạng thái Tạm khóa (Inactive)!' };
          }
          return {
            status: 'PROMPT_MSSV',
            suggestedMssv: cleanCachedMssv,
            message: 'Vui lòng xác thực mã OTP để bắt đầu phiên làm việc mới an toàn.'
          };
        }
      }

      return {
        status: 'PROMPT_MSSV',
        message: 'Chào mừng bạn đến với Cổng Ban Học Thuật. Vui lòng nhập Mã số sinh viên (MSSV) để đăng nhập!'
      };
    }

    case 'requestLoginOtp': {
      const cleanMssv = String(data.mssv || '').trim().toUpperCase();
      const member = state.members.find(m => m.MSSV === cleanMssv);
      if (!member) {
        return { success: false, message: `Mã sinh viên "${cleanMssv}" không nằm trong danh sách Ban!` };
      }
      if (member.TrangThai === 'Inactive') {
        return { success: false, message: 'Tài khoản đang tạm khóa!' };
      }
      if (!member.Email && !data.email) {
        return {
          success: false,
          needEmailInput: true,
          message: 'Lần đầu đăng nhập, vui lòng nhập Gmail để nhận mã OTP!'
        };
      }
      return {
        success: true,
        message: 'Đã gửi mã OTP (Ở chế độ Mock, bạn hãy nhập mã: 123456)',
        emailMasked: (member.Email || data.email || 'mock***@gmail.com'),
        mssv: cleanMssv,
        needEmailInput: false
      };
    }

    case 'verifyLoginOtp': {
      const cleanMssv = String(data.mssv || '').trim().toUpperCase();
      const otp = String(data.otp || '').trim();
      const member = state.members.find(m => m.MSSV === cleanMssv);
      if (!member) {
        return { success: false, message: 'Không tìm thấy thông tin sinh viên!' };
      }
      // Mã OTP mặc định ở mock là 123456 hoặc bất kỳ 6 số nào
      if (otp !== '123456' && otp.length !== 6) {
        return { success: false, message: 'Mã OTP không đúng! (Gợi ý Mock: nhập 123456)' };
      }
      const mockToken = 'MOCK_TOKEN_' + member.MSSV;
      return {
        success: true,
        message: 'Xác thực OTP thành công!',
        token: mockToken,
        user: {
          mssv: member.MSSV,
          hoTen: member.HoTen,
          email: member.Email || 'sinhvien@gmail.com',
          role: member.Role,
          trangThai: member.TrangThai,
          ngayThamGia: member.NgayThamGia
        }
      };
    }

    case 'logoutUser': {
      return { success: true, message: 'Đã đăng xuất phiên mock thành công!' };
    }

    // 2. MEMBER
    case 'getAllMembers':
      return { success: true, data: state.members };

    case 'addMember': {
      const newMssv = String(data.mssv || '').trim().toUpperCase();
      if (state.members.some(m => m.MSSV === newMssv)) {
        return { success: false, message: `MSSV ${newMssv} đã tồn tại!` };
      }
      const newMem = {
        MSSV: newMssv,
        HoTen: String(data.hoTen || '').trim(),
        Email: '',
        Role: (data.role || 'MEMBER').toUpperCase(),
        TrangThai: 'Active',
        NgayThamGia: new Date().toLocaleDateString('vi-VN')
      };
      state.members.unshift(newMem);
      saveLocalMockState(state);
      return { success: true, message: `Đã thêm thành viên ${newMem.HoTen} thành công!` };
    }

    case 'resetMemberEmail': {
      const cleanMssv = String(data.mssv || payload || '').trim().toUpperCase();
      const m = state.members.find(x => x.MSSV === cleanMssv);
      if (m) {
        m.Email = '';
        saveLocalMockState(state);
        return { success: true, message: `Đã đặt lại (reset) liên kết Email cho ${cleanMssv}!` };
      }
      return { success: false, message: 'Không tìm thấy thành viên!' };
    }

    case 'toggleMemberStatus': {
      const cleanMssv = String(data.mssv || '').trim().toUpperCase();
      const status = String(data.status || data.newStatus || 'Active');
      const m = state.members.find(x => x.MSSV === cleanMssv);
      if (m) {
        m.TrangThai = status;
        saveLocalMockState(state);
        return { success: true, message: `Đã chuyển trạng thái ${cleanMssv} thành ${status}!` };
      }
      return { success: false, message: 'Không tìm thấy thành viên!' };
    }

    // 3. ATTENDANCE
    case 'getAttendanceSessions':
      return { success: true, data: state.attendance };

    case 'createAttendanceSession': {
      const sessionId = 'MEET_' + Date.now();
      let attachedTask = null;

      if (data.taskTitle || (data.baiTap && data.baiTap.tieuDe)) {
        const tTitle = data.taskTitle || data.baiTap.tieuDe;
        const tDeadline = data.taskDeadline || (data.baiTap ? data.baiTap.deadline : '') || data.ngayDienRa;
        const tDesc = data.taskDesc || (data.baiTap ? data.baiTap.moTa : '') || '';
        const tAssignee = data.taskAssignee || (data.baiTap ? data.baiTap.nguoiNhan : 'ALL') || 'ALL';

        attachedTask = {
          TaskID: 'TASK_' + Date.now(),
          TieuDe: tTitle,
          MoTa: tDesc,
          NguoiNhan: tAssignee,
          Deadline: tDeadline,
          FolderID: 'MOCK_FOLDER_' + Date.now(),
          TrangThai: 'Open',
          SessionID: sessionId
        };
        state.tasks.unshift(attachedTask);
      }

      const newSession = {
        SessionID: sessionId,
        TenBuoiHop: data.tenBuoiHop,
        MaPin: String(data.maPin),
        TrangThai: 'Open',
        DS_CoMat: '[]',
        NgayDienRa: data.ngayDienRa || '',
        TagChuyenDe: data.tagChuyenDe || 'GENERAL',
        PhongHoc: data.phongHoc || 'Phòng Lab 02 - Tầng 3 Nhà A3',
        NoiDungChuyenDe: data.noiDungChuyenDe || '',
        LinkTaiLieu: data.linkTaiLieu || '',
        BaiTap: attachedTask
      };
      state.attendance.unshift(newSession);
      saveLocalMockState(state);
      return { 
        success: true, 
        message: `Đã tạo buổi sinh hoạt "${newSession.TenBuoiHop}"!` + (attachedTask ? ' (Kèm bài tập)' : ''), 
        sessionId: newSession.SessionID,
        task: attachedTask
      };
    }

    case 'updateAttendanceSession': {
      const sid = String(data.sessionId || data.SessionID || '').trim();
      const s = state.attendance.find(x => x.SessionID === sid);
      if (s) {
        if (data.tenBuoiHop !== undefined) s.TenBuoiHop = String(data.tenBuoiHop).trim();
        if (data.ngayDienRa !== undefined) s.NgayDienRa = String(data.ngayDienRa).trim();
        if (data.tagChuyenDe !== undefined) s.TagChuyenDe = String(data.tagChuyenDe).trim();
        if (data.phongHoc !== undefined) s.PhongHoc = String(data.phongHoc).trim();
        if (data.noiDungChuyenDe !== undefined) s.NoiDungChuyenDe = String(data.noiDungChuyenDe).trim();
        if (data.linkTaiLieu !== undefined) s.LinkTaiLieu = String(data.linkTaiLieu).trim();
        if (data.maPin !== undefined) s.MaPin = String(data.maPin).trim();
        if (data.trangThai !== undefined) s.TrangThai = String(data.trangThai).trim();
        saveLocalMockState(state);
        return { success: true, message: `Đã cập nhật buổi học "${s.TenBuoiHop}" thành công!` };
      }
      return { success: false, message: 'Không tìm thấy buổi sinh hoạt!' };
    }

    case 'deleteAttendanceSession': {
      const sid = String(data.sessionId || data.SessionID || '').trim();
      const idx = state.attendance.findIndex(x => x.SessionID === sid);
      if (idx !== -1) {
        const deleted = state.attendance.splice(idx, 1)[0];
        // Bỏ liên kết hoặc xóa bài tập đi kèm
        state.tasks = state.tasks.filter(t => t.SessionID !== sid);
        saveLocalMockState(state);
        return { success: true, message: `Đã xóa buổi sinh hoạt "${deleted.TenBuoiHop}"!` };
      }
      return { success: false, message: 'Không tìm thấy buổi sinh hoạt để xóa!' };
    }

    case 'updateAttendanceTopic': {
      const sid = String(data.sessionId || '').trim();
      const s = state.attendance.find(x => x.SessionID === sid);
      if (s) {
        if (data.tenBuoiHop) s.TenBuoiHop = String(data.tenBuoiHop).trim();
        if (data.ngayDienRa !== undefined) s.NgayDienRa = String(data.ngayDienRa).trim();
        if (data.tagChuyenDe !== undefined) s.TagChuyenDe = String(data.tagChuyenDe).trim();
        if (data.phongHoc !== undefined) s.PhongHoc = String(data.phongHoc).trim();
        if (data.noiDungChuyenDe !== undefined) s.NoiDungChuyenDe = String(data.noiDungChuyenDe).trim();
        if (data.linkTaiLieu !== undefined) s.LinkTaiLieu = String(data.linkTaiLieu).trim();
        if (data.maPin) s.MaPin = String(data.maPin).trim();
        saveLocalMockState(state);
        return { success: true, message: 'Đã cập nhật nội dung chuyên đề thành công!' };
      }
      return { success: false, message: 'Không tìm thấy buổi sinh hoạt!' };
    }

    case 'toggleAttendanceSession': {
      const sid = String(data.sessionId || '').trim();
      const st = String(data.status || data.targetStatus || 'Open');
      const s = state.attendance.find(x => x.SessionID === sid);
      if (s) {
        s.TrangThai = st;
        saveLocalMockState(state);
        return { success: true, message: `Buổi sinh hoạt đã chuyển sang trạng thái: ${st}` };
      }
      return { success: false, message: 'Không tìm thấy buổi sinh hoạt!' };
    }

    case 'checkInAttendance': {
      const pin = String(data.pinCode || data.pin || '').trim();
      const mssv = String(data.mssv || '').trim().toUpperCase();
      const session = state.attendance.find(s => s.TrangThai === 'Open' && s.MaPin === pin);
      if (!session) {
        return { success: false, message: 'Mã PIN không đúng hoặc phiên điểm danh đã đóng!' };
      }
      let ds = [];
      try { ds = JSON.parse(session.DS_CoMat); } catch (e) { ds = []; }
      if (ds.includes(mssv)) {
        return { success: false, message: `Bạn (${mssv}) đã điểm danh buổi này rồi!` };
      }
      ds.push(mssv);
      session.DS_CoMat = JSON.stringify(ds);
      saveLocalMockState(state);
      return { 
        success: true, 
        message: `Điểm danh thành công buổi "${session.TenBuoiHop}"!`,
        sessionId: session.SessionID
      };
    }

    // 4. TASKS
    case 'getAllTasks':
      return { success: true, data: state.tasks };

    case 'createTask': {
      const newTask = {
        TaskID: 'TASK_' + Date.now(),
        TieuDe: data.tieuDe,
        MoTa: data.moTa || '',
        NguoiNhan: data.nguoiNhan || 'ALL',
        Deadline: data.deadline,
        FolderID: 'MOCK_FOLDER_' + Date.now(),
        TrangThai: 'Open',
        SessionID: data.sessionId || 'GENERAL'
      };
      state.tasks.unshift(newTask);

      // TỰ ĐỘNG GẮN BÀI TẬP VÀO BUỔI HỌC TƯƠNG ỨNG TRONG STORE
      if (data.sessionId && data.sessionId !== 'GENERAL') {
        const session = state.attendance.find(s => s.SessionID === data.sessionId);
        if (session) {
          session.BaiTap = newTask;
        }
      }

      saveLocalMockState(state);
      return { 
        success: true, 
        message: `Đã tạo nhiệm vụ "${newTask.TieuDe}" thành công!`, 
        taskId: newTask.TaskID,
        folderId: newTask.FolderID
      };
    }

    case 'updateTask': {
      const tid = String(data.taskId || data.TaskID || '').trim();
      const t = state.tasks.find(x => x.TaskID === tid);
      if (t) {
        if (data.tieuDe !== undefined) t.TieuDe = String(data.tieuDe).trim();
        if (data.moTa !== undefined) t.MoTa = String(data.moTa).trim();
        if (data.nguoiNhan !== undefined) t.NguoiNhan = String(data.nguoiNhan).trim();
        if (data.deadline !== undefined) t.Deadline = String(data.deadline).trim();
        if (data.trangThai !== undefined) t.TrangThai = String(data.trangThai).trim();
        if (data.sessionId !== undefined) t.SessionID = String(data.sessionId).trim();

        // Cập nhật lại session.BaiTap nếu có
        state.attendance.forEach(s => {
          if (s.BaiTap && s.BaiTap.TaskID === tid) {
            s.BaiTap = { ...t };
          }
        });

        saveLocalMockState(state);
        return { success: true, message: `Đã cập nhật bài tập "${t.TieuDe}" thành công!` };
      }
      return { success: false, message: 'Không tìm thấy bài tập!' };
    }

    case 'deleteTask': {
      const tid = String(data.taskId || data.TaskID || '').trim();
      const idx = state.tasks.findIndex(x => x.TaskID === tid);
      if (idx !== -1) {
        const deleted = state.tasks.splice(idx, 1)[0];
        // Xóa liên kết BaiTap trong session
        state.attendance.forEach(s => {
          if (s.BaiTap && s.BaiTap.TaskID === tid) {
            delete s.BaiTap;
          }
        });
        saveLocalMockState(state);
        return { success: true, message: `Đã xóa bài tập "${deleted.TieuDe}"!` };
      }
      return { success: false, message: 'Không tìm thấy bài tập để xóa!' };
    }

    case 'toggleTaskStatus': {
      const tid = String(data.taskId || '').trim();
      const st = String(data.status || data.targetStatus || 'Open');
      const t = state.tasks.find(x => x.TaskID === tid);
      if (t) {
        t.TrangThai = st;
        saveLocalMockState(state);
        return { success: true, message: `Nhiệm vụ đã chuyển sang: ${st}` };
      }
      return { success: false, message: 'Không tìm thấy nhiệm vụ!' };
    }

    // 5. SUBMISSIONS & DOCS
    case 'getAllSubmissions':
      return { success: true, data: state.submissions };

    case 'getMemberSubmissions': {
      const cleanMssv = String(data.mssv || payload || '').trim().toUpperCase();
      const filtered = state.submissions.filter(s => s.MSSV === cleanMssv);
      return { success: true, data: filtered };
    }

    case 'submitTaskAssignment': {
      const newSub = {
        SubID: 'SUB_' + Date.now(),
        TaskID: data.taskId,
        MSSV: data.mssv,
        HoTen: data.hoTen,
        Email: data.email,
        TenFile: data.fileName,
        DriveLink: 'https://drive.google.com/mock-upload-' + Date.now(),
        ThoiGianNop: new Date().toLocaleString('vi-VN'),
        TrangThaiDuyet: 'Pending',
        Feedback: ''
      };
      state.submissions.unshift(newSub);
      saveLocalMockState(state);
      return { 
        success: true, 
        message: 'Nộp bài thành công (Mock Mode)!', 
        subId: newSub.SubID,
        fileUrl: newSub.DriveLink,
        submitTime: newSub.ThoiGianNop
      };
    }

    case 'reviewSubmission': {
      const sub = state.submissions.find(s => s.SubID === data.subId);
      if (sub) {
        sub.TrangThaiDuyet = data.trangThaiDuyet;
        sub.Feedback = data.feedback || '';
        saveLocalMockState(state);
        return { success: true, message: `Đã cập nhật bài nộp ${data.subId}: ${data.trangThaiDuyet}!` };
      }
      return { success: false, message: 'Không tìm thấy bài nộp!' };
    }

    case 'getAllDocuments':
      return { success: true, data: state.documents };

    case 'createDocument':
    case 'addDocument': {
      const newDoc = {
        DocID: 'DOC_' + Date.now(),
        TenTaiLieu: data.tenTaiLieu,
        PhanLoai: data.phanLoai || 'Slide',
        LinkDrive: data.linkDrive,
        MoTa: data.moTa || ''
      };
      state.documents.unshift(newDoc);
      saveLocalMockState(state);
      return { 
        success: true, 
        message: `Đã thêm tài liệu "${newDoc.TenTaiLieu}" vào kho!`,
        docId: newDoc.DocID,
        data: newDoc 
      };
    }

    case 'updateDocument': {
      const did = String(data.docId || data.DocID || '').trim();
      const d = state.documents.find(x => x.DocID === did);
      if (d) {
        if (data.tenTaiLieu !== undefined) d.TenTaiLieu = String(data.tenTaiLieu).trim();
        if (data.phanLoai !== undefined) d.PhanLoai = String(data.phanLoai).trim();
        if (data.linkDrive !== undefined) d.LinkDrive = String(data.linkDrive).trim();
        if (data.moTa !== undefined) d.MoTa = String(data.moTa).trim();
        saveLocalMockState(state);
        return { success: true, message: `Đã cập nhật tài liệu "${d.TenTaiLieu}"!` };
      }
      return { success: false, message: 'Không tìm thấy tài liệu!' };
    }

    case 'deleteDocument': {
      const did = String(data.docId || data.DocID || '').trim();
      const idx = state.documents.findIndex(x => x.DocID === did);
      if (idx !== -1) {
        const deleted = state.documents.splice(idx, 1)[0];
        saveLocalMockState(state);
        return { success: true, message: `Đã xóa tài liệu "${deleted.TenTaiLieu}"!` };
      }
      return { success: false, message: 'Không tìm thấy tài liệu để xóa!' };
    }

    default:
      return { success: false, message: `Hành động Mock "${action}" chưa được hỗ trợ!` };
  }
}

export const mockCallApi = handleMockAction;
