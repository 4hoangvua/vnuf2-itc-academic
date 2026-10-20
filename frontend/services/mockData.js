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
      MSSV: '257480104007',
      HoTen: 'Trần Đình Hoàng',
      Email: 'hoangstricker@gmail.com',
      Lop: 'K70-HTTT',
      'Lớp': 'K70-HTTT',
      Ban: 'Ban học thuật',
      Role: 'ADMIN',
      TrangThai: 'Active',
      NgayThamGia: '18/10/2026',
      Sex: 'male',
      gift2010: null
    },
    {
      MSSV: '2251120001',
      HoTen: 'Nguyễn Văn Hoàng',
      Email: 'hoangnv.vnuf2@gmail.com',
      Lop: 'K67-HTTT',
      'Lớp': 'K67-HTTT',
      Ban: 'Ban học thuật',
      Role: 'ADMIN',
      TrangThai: 'Active',
      NgayThamGia: '10/09/2024',
      Sex: 'male',
      gift2010: null
    },
    {
      MSSV: '2251120002',
      HoTen: 'Trần Thị Thu Trang',
      Email: 'thutrang.cntt@gmail.com',
      Lop: 'K67-CNTT',
      'Lớp': 'K67-CNTT',
      Ban: 'Ban học thuật',
      Role: 'MEMBER',
      TrangThai: 'Active',
      NgayThamGia: '15/09/2024',
      Sex: 'female',
      gift2010: {
        giftId: 'BONUS_10PT',
        giftTitle: 'Voucher Cộng +10 Điểm Học Thuật',
        claimCode: 'ITC2010-7B1C2-888',
        claimedAt: '2026-10-20T08:00:00.000Z',
        used: false
      }
    },
    {
      MSSV: '2351120015',
      HoTen: 'Lê Hoàng Minh',
      Email: 'minhlh.k68@gmail.com',
      Lop: 'K68-CNTT',
      'Lớp': 'K68-CNTT',
      Ban: 'Ban học thuật',
      Role: 'MEMBER',
      TrangThai: 'Active',
      NgayThamGia: '01/10/2025',
      Sex: 'male',
      gift2010: null
    },
    {
      MSSV: '2351120028',
      HoTen: 'Phạm Phương Anh',
      Email: 'phuonganh.cntt@gmail.com',
      Lop: 'K68-HTTT',
      'Lớp': 'K68-HTTT',
      Ban: 'Ban học thuật',
      Role: 'MEMBER',
      TrangThai: 'Active',
      NgayThamGia: '05/10/2025',
      Sex: 'female',
      gift2010: {
        giftId: 'DEADLINE_24H',
        giftTitle: 'Thẻ Gia Hạn Deadline +24H',
        claimCode: 'ITC2010-F3E8A-901',
        claimedAt: '2026-10-20T08:30:00.000Z',
        used: false
      }
    },
    {
      MSSV: '2451120033',
      HoTen: 'Vũ Quốc Bảo',
      Email: '',
      Lop: 'K69-CNTT',
      'Lớp': 'K69-CNTT',
      Ban: 'Ban học thuật',
      Role: 'MEMBER',
      TrangThai: 'Active',
      NgayThamGia: '10/10/2026',
      Sex: 'male',
      gift2010: null
    },
    {
      MSSV: '2251120099',
      HoTen: 'Đỗ Tiến Đạt',
      Email: 'tiendat.old@gmail.com',
      Lop: 'K67-CNTT',
      'Lớp': 'K67-CNTT',
      Ban: 'Ban học thuật',
      Role: 'MEMBER',
      TrangThai: 'Inactive',
      NgayThamGia: '01/09/2023',
      Sex: 'male',
      gift2010: null
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
      TenFile: '[2251120002]_[Tran_Thi_Thu_Trang]_refactor_2010_GIFT.zip',
      DriveLink: 'https://drive.google.com/mock-file-05',
      ThoiGianNop: '16/10/2026 10:00:00',
      TrangThaiDuyet: 'Approved',
      Feedback: 'Cấu trúc module rõ ràng, phân trang chuẩn chỉ. [QUÀ 20/10] Áp dụng Voucher +10 điểm học thuật.',
      giftCode: 'ITC2010-7B1C2-888'
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
      TenFile: '[2351120028]_[Pham_Phuong_Anh]_es6_refactor_2010_GIFT.zip',
      DriveLink: 'https://drive.google.com/mock-file-07',
      ThoiGianNop: '16/10/2026 12:15:00',
      TrangThaiDuyet: 'Pending',
      Feedback: '',
      giftCode: 'ITC2010-F3E8A-901'
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
  ],

  // 6. Ngân hàng đề trắc nghiệm ôn tập & củng cố kiến thức theo buổi sinh hoạt
  quizzes: [
    {
      QuizID: 'QUIZ_20261015_01',
      SessionID: 'MEET_20261015_190000',
      TieuDe: 'Trắc nghiệm 10 phút: Kiến trúc Headless & Git Collaboration',
      MoTa: 'Củng cố kiến thức về mô hình Headless, tương tác Apps Script API và quy trình phối hợp Git nhóm.',
      ThoiGianPhut: 10,
      TrangThai: 'Open', // 'Draft' | 'Open' | 'Closed'
      NgayTao: '15/10/2026 18:00',
      DanhSachCauHoi: [
        {
          id: 1,
          cauHoi: 'Mô hình Headless Architecture trong ứng dụng web có đặc điểm cốt lõi nào sau đây?',
          luaChon: [
            'Frontend và Backend tích hợp chặt chẽ trong cùng một file mã nguồn duy nhất',
            'Tách biệt hoàn toàn tầng giao diện (Frontend) và tầng logic/dữ liệu (Backend) qua API',
            'Không cần sử dụng CSS và HTML để render trang web',
            'Chỉ chạy được trên môi trường máy chủ nội bộ (Localhost)'
          ],
          dapAnDung: 1,
          giaiThich: 'Kiến trúc Headless tách rời hoàn toàn Frontend (ví dụ GitHub Pages) và Backend (Google Apps Script API), giao tiếp độc lập thông qua HTTP/JSON.'
        },
        {
          id: 2,
          cauHoi: 'Để tải toàn bộ các commit mới từ remote repository về và tự động gộp vào nhánh hiện tại, ta dùng lệnh Git nào?',
          luaChon: [
            'git fetch origin',
            'git pull origin <branch>',
            'git commit -am "update"',
            'git merge --remote-only'
          ],
          dapAnDung: 1,
          giaiThich: 'Lệnh git pull kết hợp giữa git fetch (tải metadata và object mới về) và git merge (gộp nhánh upstream vào nhánh đang checkout).'
        },
        {
          id: 3,
          cauHoi: 'Tại sao khi gửi request POST từ GitHub Pages sang Google Apps Script API cần dùng Content-Type: text/plain?',
          luaChon: [
            'Để tránh kích hoạt Preflight CORS (OPTIONS request) mà Google Apps Script không hỗ trợ',
            'Để dữ liệu được mã hóa bảo mật hơn định dạng JSON',
            'Vì Google Apps Script không thể đọc dữ liệu dạng văn bản',
            'Google Apps Script chỉ chấp nhận phương thức GET'
          ],
          dapAnDung: 0,
          giaiThich: 'Khi dùng text/plain, trình duyệt coi đây là Simple Request nên không gửi OPTIONS preflight, khắc phục triệt để lỗi chặn CORS của Google Apps Script.'
        },
        {
          id: 4,
          cauHoi: 'Lệnh Git nào sau đây giúp kiểm tra trạng thái các file đã thay đổi, đã stage hoặc untracked?',
          luaChon: [
            'git log --oneline',
            'git status',
            'git branch -a',
            'git show-branch'
          ],
          dapAnDung: 1,
          giaiThich: 'git status cung cấp bức tranh toàn diện về thư mục làm việc (Working Tree) và khu vực chuẩn bị commit (Staging Area).'
        },
        {
          id: 5,
          cauHoi: 'Kỹ thuật ScriptLock (LockService) trong Google Apps Script được áp dụng nhằm mục đích gì?',
          luaChon: [
            'Tăng tốc độ tải trang cho trình duyệt client',
            'Ngăn ngừa xung đột ghi đồng thời (Race Condition) khi nhiều sinh viên nộp bài cùng lúc',
            'Khóa quyền chỉnh sửa file của chủ sở hữu Google Drive',
            'Tự động gửi email thông báo kết quả cho phụ huynh'
          ],
          dapAnDung: 1,
          giaiThich: 'LockService.getScriptLock() tạo khóa mutex độc quyền để chỉ một phiên ghi dữ liệu vào Google Sheets tại một thời điểm, bảo vệ toàn vẹn dữ liệu.'
        }
      ]
    },
    {
      QuizID: 'QUIZ_20261022_01',
      SessionID: 'MEET_20261022_190000',
      TieuDe: 'Trắc nghiệm: Quy chuẩn Soạn thảo Văn bản & Báo cáo VNUF2',
      MoTa: 'Kiểm tra nắm vững thể thức văn bản: canh lề, kiểu heading, styles và mục lục tự động.',
      ThoiGianPhut: 15,
      TrangThai: 'Closed',
      NgayTao: '22/10/2026 18:00',
      DanhSachCauHoi: [
        {
          id: 1,
          cauHoi: 'Quy chuẩn lề trang cho báo cáo tiểu luận / khóa luận tốt nghiệp theo thể thức chuẩn là gì?',
          luaChon: [
            'Trên 2cm, Dưới 2cm, Trái 3cm, Phải 2cm',
            'Trên 2.5cm, Dưới 2.5cm, Trái 2.5cm, Phải 2.5cm',
            'Trên 1.5cm, Dưới 1.5cm, Trái 2cm, Phải 1.5cm',
            'Trên 3cm, Dưới 3cm, Trái 3cm, Phải 3cm'
          ],
          dapAnDung: 0,
          giaiThich: 'Quy định chuẩn của Bộ GD&ĐT và VNUF2: Lề trên 20-25mm, dưới 20-25mm, trái 30-35mm (đóng gáy), phải 15-20mm.'
        },
        {
          id: 2,
          cauHoi: 'Trong Microsoft Word, để tạo mục lục tự động chính xác, người soạn thảo bắt buộc phải sử dụng công cụ nào?',
          luaChon: [
            'Chỉnh cỡ chữ to nhỏ thủ công và in đậm từng tiêu đề',
            'Gán các cấp độ Styles (Heading 1, Heading 2, Heading 3...) chuẩn',
            'Dùng dấu chấm (...) kéo dài sang số trang ở lề phải',
            'Chèn bảng Table ẩn đường viền để căn chỉnh số trang'
          ],
          dapAnDung: 1,
          giaiThich: 'Mục lục tự động (Table of Contents) quét dựa trên cây cấu trúc Heading Styles để lập danh mục và định vị số trang.'
        }
      ]
    },
    {
      QuizID: 'QUIZ_OOP_CPP_01',
      SessionID: 'MEET_20261008_190000',
      TieuDe: 'Ngân Hàng Trắc Nghiệm: Lập Trình Hướng Đối Tượng OOP C++',
      MoTa: 'Tuyển tập các câu hỏi cốt lõi về 4 tính chất OOP, hàm ảo (virtual), nạp chồng toán tử và giải phóng bộ nhớ trong C++.',
      ThoiGianPhut: 20,
      TrangThai: 'Open',
      NgayTao: '08/10/2026 18:00',
      DanhSachCauHoi: [
        {
          id: 1,
          cauHoi: 'Tính chất nào trong OOP giúp gom dữ liệu và hàm xử lý vào trong một lớp, đồng thời che giấu chi tiết nội bộ bằng private/protected?',
          luaChon: [
            'Tính kế thừa (Inheritance)',
            'Tính đóng gói (Encapsulation)',
            'Tính đa hình (Polymorphism)',
            'Tính trừu tượng (Abstraction)'
          ],
          dapAnDung: 1,
          giaiThich: 'Đóng gói (Encapsulation) gom thuộc tính và phương thức vào class, hạn chế truy cập trực tiếp từ bên ngoài qua access modifiers để bảo toàn tính toàn vẹn dữ liệu.'
        },
        {
          id: 2,
          cauHoi: 'Trong C++, từ khóa nào được sử dụng trước khai báo phương thức của lớp cơ sở để kích hoạt cơ chế liên kết động (Dynamic Binding / Late Binding)?',
          luaChon: [
            'friend',
            'virtual',
            'static',
            'explicit'
          ],
          dapAnDung: 1,
          giaiThich: 'Từ khóa virtual cho phép hàm được ghi đè (override) tại các lớp con và trình biên dịch xác định hàm thực thi tại thời điểm runtime (đa hình động).'
        },
        {
          id: 3,
          cauHoi: 'Một hàm thuần ảo (Pure Virtual Function) trong C++ được khai báo với cú pháp kết thúc nào sau đây?',
          luaChon: [
            '= null;',
            '= default;',
            '= 0;',
            '= void;'
          ],
          dapAnDung: 2,
          giaiThich: 'Cú pháp virtual void foo() = 0; biến hàm thành thuần ảo, và lớp chứa nó trở thành Lớp trừu tượng (Abstract Class) không thể khởi tạo đối tượng trực tiếp.'
        },
        {
          id: 4,
          cauHoi: 'Đặc điểm nào sau đây là ĐÚNG đối với hàm tạo (Constructor) trong C++?',
          luaChon: [
            'Có kiểu trả về là void',
            'Phải có tên trùng khớp với tên của Lớp (Class) và không có kiểu trả về',
            'Chỉ được phép khai báo duy nhất một hàm tạo trong một lớp',
            'Được gọi thủ công bởi lập trình viên sau khi đối tượng đã tạo xong'
          ],
          dapAnDung: 1,
          giaiThich: 'Constructor trùng tên với class, không khai báo kiểu trả về (kể cả void), tự động được hệ thống triệu gọi ngay khi đối tượng được cấp phát bộ nhớ.'
        },
        {
          id: 5,
          cauHoi: 'Hàm hủy (Destructor) trong C++ có ký tự đặc biệt nào đứng ngay trước tên của lớp?',
          luaChon: [
            'Dấu và (&)',
            'Dấu sao (*)',
            'Dấu ngã (~)',
            'Dấu chấm than (!)'
          ],
          dapAnDung: 2,
          giaiThich: 'Destructor có dấu ngã ~ trước tên class (ví dụ ~SinhVien()), không có tham số và không có kiểu trả về, tự động giải phóng tài nguyên khi đối tượng kết thúc vòng đời.'
        },
        {
          id: 6,
          cauHoi: 'Cơ chế friend (hàm bạn / lớp bạn) trong C++ mang lại đặc quyền nào?',
          luaChon: [
            'Tự động sao chép toàn bộ mã nguồn của lớp khác',
            'Cho phép hàm hoặc lớp bên ngoài truy cập trực tiếp vào các thành viên private và protected của lớp khai báo nó',
            'Ngăn chặn mọi lớp con kế thừa lại phương thức',
            'Tăng gấp đôi tốc độ xử lý vòng lặp'
          ],
          dapAnDung: 1,
          giaiThich: 'Khai báo friend cho phép hàm hoặc lớp ngoài truy cập dữ liệu private/protected của lớp, thường dùng khi nạp chồng toán tử nhập xuất (operator<<, operator>>).'
        },
        {
          id: 7,
          cauHoi: 'Trong biểu đồ lớp UML, quan hệ Composition (Hợp thành / Cấu thành chặt chẽ) được biểu diễn bằng ký hiệu nào?',
          luaChon: [
            'Hình thoi rỗng (White diamond)',
            'Hình thoi tô đặc màu đen (Solid black diamond)',
            'Mũi tên nét đứt (Dashed arrow)',
            'Đường thẳng không có mũi tên'
          ],
          dapAnDung: 1,
          giaiThich: 'Composition (thoi đặc) thể hiện quan hệ has-a chặt chẽ, đối tượng con phụ thuộc hoàn toàn vào vòng đời của đối tượng cha (cha mất thì con bị hủy).'
        },
        {
          id: 8,
          cauHoi: 'Để ngăn ngừa rò rỉ bộ nhớ (Memory Leak) khi hủy đối tượng con thông qua con trỏ lớp cơ sở, hàm hủy của lớp cơ sở CẦN được khai báo là gì?',
          luaChon: [
            'Hàm inline',
            'Hàm static',
            'Hàm virtual destructor',
            'Hàm const'
          ],
          dapAnDung: 2,
          giaiThich: 'Virtual destructor (virtual ~Base()) đảm bảo khi gọi delete con trỏ lớp cơ sở, hàm hủy của lớp con (Derived) sẽ được triệu gọi trước, sau đó mới đến hàm hủy lớp cha.'
        }
      ]
    }
  ],

  // 7. Lịch sử làm bài trắc nghiệm & điểm số tích lũy của thành viên
  quizResults: [
    {
      ResultID: 'RES_2351120015_QUIZ_20261015_01',
      QuizID: 'QUIZ_20261015_01',
      SessionID: 'MEET_20261015_190000',
      MSSV: '2351120015',
      HoTen: 'Lê Hoàng Minh',
      DiemSo: 80,
      SoCauDung: 4,
      TongSoCau: 5,
      ChiTietTraLoi: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 0 },
      ThoiGianNop: '15/10/2026 20:30:15',
      ThoiGianLamGiay: 285
    },
    {
      ResultID: 'RES_2251120002_QUIZ_20261015_01',
      QuizID: 'QUIZ_20261015_01',
      SessionID: 'MEET_20261015_190000',
      MSSV: '2251120002',
      HoTen: 'Trần Thị Thu Trang',
      DiemSo: 100,
      SoCauDung: 5,
      TongSoCau: 5,
      ChiTietTraLoi: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 1 },
      ThoiGianNop: '15/10/2026 20:25:40',
      ThoiGianLamGiay: 210
    },
    {
      ResultID: 'RES_2351120028_QUIZ_20261015_01',
      QuizID: 'QUIZ_20261015_01',
      SessionID: 'MEET_20261015_190000',
      MSSV: '2351120028',
      HoTen: 'Phạm Phương Anh',
      DiemSo: 60,
      SoCauDung: 3,
      TongSoCau: 5,
      ChiTietTraLoi: { 1: 1, 2: 0, 3: 0, 4: 1, 5: 0 },
      ThoiGianNop: '15/10/2026 20:32:10',
      ThoiGianLamGiay: 340
    }
  ],

  // 8. Hồ sơ học tập trắc nghiệm, Chuỗi ngày học (Streak) & Kho câu sai cá nhân (Gamification Engine)
  memberQuizProfiles: [
    {
      MSSV: '2351120015',
      StreakDays: 5,
      LastActiveDate: '19/10/2026',
      TotalQuestionsAnswered: 48,
      TotalCorrect: 42,
      Badges: ['STREAK_3', 'ACCURACY_80', 'FAST_LEARNER'],
      WrongQuestionIds: ['QUIZ_20261015_01_5', 'QUIZ_OOP_CPP_01_7'], // ID các câu từng chọn sai để ôn lại
      BookmarkedQuestionIds: ['QUIZ_20261015_01_3', 'QUIZ_OOP_CPP_01_2'] // Câu đánh dấu lưu lại
    },
    {
      MSSV: '2251120002',
      StreakDays: 12,
      LastActiveDate: '19/10/2026',
      TotalQuestionsAnswered: 85,
      TotalCorrect: 82,
      Badges: ['STREAK_7', 'STREAK_3', 'PERFECT_SCORE', 'ACCURACY_80'],
      WrongQuestionIds: [],
      BookmarkedQuestionIds: ['QUIZ_OOP_CPP_01_8']
    },
    {
      MSSV: '2451120033',
      StreakDays: 2,
      LastActiveDate: '18/10/2026',
      TotalQuestionsAnswered: 16,
      TotalCorrect: 12,
      Badges: ['FIRST_QUIZ'],
      WrongQuestionIds: ['QUIZ_20261015_01_2'],
      BookmarkedQuestionIds: ['QUIZ_OOP_CPP_01_1']
    }
  ],

  // 9. Cấu hình các chiến dịch sự kiện & đặc quyền học thuật (Universal Privilege Campaigns)
  activeCampaignId: 'OCT20',
  campaigns: [
    {
      id: 'OCT20',
      title: 'Hộp Quà 20/10 · Tôn Vinh Nữ Sinh VNUF2',
      subtitle: 'Dành riêng cho bóng hồng công nghệ VNUF2',
      targetAudience: 'female',
      icon: '🌸',
      themeColor: 'rose',
      greeting: 'Thân chúc bạn ngày 20/10 ngập tràn niềm vui, rực rỡ và luôn đam mê công nghệ!',
      bannerDesc: 'Ban gửi tặng bạn một hộp quà học thuật đặc biệt nhân ngày hôm nay!',
      maleReminder: 'Hôm nay là Ngày Phụ nữ Việt Nam 20/10. Hãy gửi lời chúc chân thành tới các cô giáo và bạn nữ nhé! 💐',
      gifts: [
        {
          giftId: 'DEADLINE_24H',
          effectType: 'EXTEND_DEADLINE',
          effectValue: 24,
          title: 'Thẻ Gia Hạn Deadline (+24h nộp bài tập)',
          shortTitle: 'Gia Hạn Deadline (+24h)',
          icon: 'fa-regular fa-clock',
          iconColor: 'text-rose-500',
          badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
          description: 'Bảo lưu tính đúng hạn khi nộp bài muộn tối đa 24 giờ.'
        },
        {
          giftId: 'BONUS_10PT',
          effectType: 'SCORE_BONUS',
          effectValue: 10,
          title: 'Voucher Cộng +10 Điểm Học Thuật',
          shortTitle: 'Cộng +10 Điểm',
          icon: 'fa-solid fa-award',
          iconColor: 'text-amber-500',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          description: 'Cộng trực tiếp +10 điểm vào bài thi trắc nghiệm hoặc bài tập thực hành.'
        },
        {
          giftId: 'VIP_DEBUG',
          effectType: 'VIP_DEBUG',
          effectValue: 1,
          title: 'Vé Debug Code 1-1 Với Mentor',
          shortTitle: 'Debug 1-1 Với Mentor',
          icon: 'fa-solid fa-wand-magic-sparkles',
          iconColor: 'text-purple-500',
          badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          description: 'Quyền đăng ký 1 buổi hướng dẫn gỡ lỗi trực tiếp cùng Mentor Ban Học Thuật.'
        }
      ]
    },
    {
      id: 'TET',
      title: 'Lì Xì Học Thuật Khai Xuân VNUF2',
      subtitle: 'Khai xuân như ý · Lộc mã vinh quy',
      targetAudience: 'all',
      icon: '🧧',
      themeColor: 'amber',
      greeting: 'Khai xuân như ý, code mượt không bug, GPA xuất sắc và gặt hái nhiều thành công rực rỡ!',
      bannerDesc: 'Ban Học Thuật gửi tặng bạn bao lì xì học thuật đầu xuân lấy may!',
      maleReminder: '',
      gifts: [
        {
          giftId: 'BONUS_15PT',
          effectType: 'SCORE_BONUS',
          effectValue: 15,
          title: 'Lì Xì May Mắn +15 Điểm Học Thuật',
          shortTitle: 'Lì Xì +15 Điểm',
          icon: 'fa-solid fa-coins',
          iconColor: 'text-amber-500',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          description: 'Cộng trực tiếp +15 điểm vào bài thi trắc nghiệm hoặc bài tập đầu xuân.'
        },
        {
          giftId: 'DEADLINE_48H',
          effectType: 'EXTEND_DEADLINE',
          effectValue: 48,
          title: 'Thẻ Du Xuân Gia Hạn Deadline (+48h)',
          shortTitle: 'Gia Hạn Du Xuân (+48h)',
          icon: 'fa-regular fa-calendar-plus',
          iconColor: 'text-emerald-500',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          description: 'Thoải mái du xuân! Tự động bảo lưu tính đúng hạn khi nộp bài muộn đến 48 giờ.'
        },
        {
          giftId: 'VIP_DEBUG_TET',
          effectType: 'VIP_DEBUG',
          effectValue: 1,
          title: 'Vé Khai Xuân Debug 1-1 Cùng Trưởng Ban',
          shortTitle: 'Khai Xuân Debug 1-1',
          icon: 'fa-solid fa-laptop-code',
          iconColor: 'text-red-500',
          badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
          description: '1 suất hỗ trợ review kiến trúc đồ án và debug chuyên sâu đầu năm.'
        }
      ]
    },
    {
      id: 'MARCH8',
      title: 'Hộp Quà 8/3 · Ngày Quốc Tế Phụ Nữ',
      subtitle: 'Tôn vinh bóng hồng công nghệ Ban Học Thuật',
      targetAudience: 'female',
      icon: '🌷',
      themeColor: 'purple',
      greeting: 'Chúc bạn ngày 8/3 luôn xinh đẹp, tự tin, rạng rỡ và chinh phục mọi đỉnh cao học thuật!',
      bannerDesc: 'Hộp quà 8/3 với các đặc quyền học thuật ngọt ngào gửi tặng riêng bạn!',
      maleReminder: 'Hôm nay là Ngày Quốc tế Phụ Nữ 8/3. Đừng quên gửi lời chúc tới những người phụ nữ tuyệt vời nhé! 💐',
      gifts: [
        {
          giftId: 'DEADLINE_24H_M8',
          effectType: 'EXTEND_DEADLINE',
          effectValue: 24,
          title: 'Thẻ Gia Hạn Deadline (+24h)',
          shortTitle: 'Gia Hạn Deadline (+24h)',
          icon: 'fa-regular fa-clock',
          iconColor: 'text-purple-500',
          badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
          description: 'Bảo lưu tính đúng hạn khi nộp bài muộn tối đa 24 giờ.'
        },
        {
          giftId: 'BONUS_10PT_M8',
          effectType: 'SCORE_BONUS',
          effectValue: 10,
          title: 'Voucher Hoa Hồng +10 Điểm Học Thuật',
          shortTitle: 'Voucher +10 Điểm',
          icon: 'fa-solid fa-award',
          iconColor: 'text-pink-500',
          badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
          description: 'Cộng trực tiếp +10 điểm vào bài thi trắc nghiệm hoặc bài tập thực hành.'
        },
        {
          giftId: 'VIP_DEBUG_M8',
          effectType: 'VIP_DEBUG',
          effectValue: 1,
          title: 'Vé Debug Code 1-1 Với Mentor',
          shortTitle: 'Debug 1-1 Với Mentor',
          icon: 'fa-solid fa-wand-magic-sparkles',
          iconColor: 'text-violet-500',
          badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
          description: 'Quyền đăng ký 1 buổi hướng dẫn gỡ lỗi trực tiếp cùng Mentor Ban Học Thuật.'
        }
      ]
    },
    {
      id: 'ANNIVERSARY',
      title: 'Quà Tri Ân Sinh Nhật CLB Tin Học VNUF2',
      subtitle: 'Tự hào truyền thống học thuật & sáng tạo',
      targetAudience: 'all',
      icon: '🎂',
      themeColor: 'teal',
      greeting: 'Mừng sinh nhật CLB Tin Học VNUF2! Chúc toàn thể thành viên luôn giữ vững ngọn lửa đam mê công nghệ!',
      bannerDesc: 'Ban gửi tặng toàn bộ thành viên hộp quà tri ân nhân ngày sinh nhật CLB!',
      maleReminder: '',
      gifts: [
        {
          giftId: 'BONUS_10PT_ANNI',
          effectType: 'SCORE_BONUS',
          effectValue: 10,
          title: 'Voucher Sinh Nhật +10 Điểm Học Thuật',
          shortTitle: 'Voucher +10 Điểm',
          icon: 'fa-solid fa-award',
          iconColor: 'text-teal-500',
          badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
          description: 'Cộng trực tiếp +10 điểm vào kết quả trắc nghiệm hoặc bài tập.'
        },
        {
          giftId: 'DEADLINE_24H_ANNI',
          effectType: 'EXTEND_DEADLINE',
          effectValue: 24,
          title: 'Thẻ Sinh Nhật Gia Hạn Deadline (+24h)',
          shortTitle: 'Gia Hạn Deadline (+24h)',
          icon: 'fa-regular fa-clock',
          iconColor: 'text-emerald-500',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          description: 'Bảo lưu tính đúng hạn khi nộp bài muộn tối đa 24 giờ.'
        },
        {
          giftId: 'STREAK_SHIELD_3D',
          effectType: 'STREAK_SHIELD',
          effectValue: 3,
          title: 'Khiên Bảo Toàn Chuỗi Học Tập (3 Ngày)',
          shortTitle: 'Khiên Streak 3 Ngày',
          icon: 'fa-solid fa-shield-heart',
          iconColor: 'text-indigo-500',
          badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          description: 'Tự động bảo vệ chuỗi ngày làm bài trắc nghiệm liên tục (Streak) nếu bạn lỡ quên 1-3 ngày.'
        }
      ]
    }
  ]
};

// Quản lý State Mock trong phiên làm việc localStorage
export function getLocalMockState() {
  const saved = localStorage.getItem('bht_mock_store');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      let hasChanges = false;
      // Tự động đồng bộ các thành viên và Role mới nhất vào mock store
      if (parsed.members) {
        INITIAL_MOCK_DATA.members.forEach(initM => {
          const existing = parsed.members.find(m => m.MSSV === initM.MSSV);
          if (existing) {
            if (existing.Role !== initM.Role || existing.Lop !== initM.Lop || existing.Ban !== initM.Ban) {
              existing.Role = initM.Role;
              existing.Lop = initM.Lop;
              existing['Lớp'] = initM['Lớp'];
              existing.Ban = initM.Ban;
              hasChanges = true;
            }
          } else {
            parsed.members.unshift(initM);
            hasChanges = true;
          }
        });
      }
      if (hasChanges) {
        localStorage.setItem('bht_mock_store', JSON.stringify(parsed));
      }
      // Tự động bổ sung ngân hàng đề thi và kết quả nếu phiên bản cũ chưa có
      if (!parsed.quizzes || !parsed.quizzes.some(q => q.QuizID === 'QUIZ_OOP_CPP_01')) {
        parsed.quizzes = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA.quizzes));
        hasChanges = true;
      }
      if (!parsed.quizResults || !parsed.quizResults.some(r => r.ResultID && r.ResultID.includes('2351120015'))) {
        parsed.quizResults = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA.quizResults));
        hasChanges = true;
      }
      if (!parsed.memberQuizProfiles || !parsed.memberQuizProfiles.some(p => p.MSSV === '2351120015')) {
        parsed.memberQuizProfiles = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA.memberQuizProfiles));
        hasChanges = true;
      }
      // Tự động đồng bộ trường Sex và gift2010 cho members nếu store cũ bị thiếu hoặc chưa chuẩn
      if (parsed.members && Array.isArray(parsed.members)) {
        parsed.members.forEach(m => {
          const initM = INITIAL_MOCK_DATA.members.find(x => x.MSSV === m.MSSV);
          if (initM) {
            if (initM.Sex && m.Sex !== initM.Sex) {
              m.Sex = initM.Sex;
              hasChanges = true;
            }
            if (!m.gift2010 && initM.gift2010) {
              m.gift2010 = JSON.parse(JSON.stringify(initM.gift2010));
              hasChanges = true;
            } else if (!('gift2010' in m)) {
              m.gift2010 = initM.gift2010 || null;
              hasChanges = true;
            }
          }
        });
      }
      // Tự động đồng bộ giftCode cho submissions mẫu nếu store cũ chưa có
      if (parsed.submissions && Array.isArray(parsed.submissions)) {
        parsed.submissions.forEach(sub => {
          const initSub = INITIAL_MOCK_DATA.submissions.find(s => s.SubID === sub.SubID);
          if (initSub && initSub.giftCode && !sub.giftCode) {
            sub.giftCode = initSub.giftCode;
            if (initSub.TenFile) sub.TenFile = initSub.TenFile;
            if (initSub.Feedback) sub.Feedback = initSub.Feedback;
            hasChanges = true;
          }
        });
      }
      // Tự động đồng bộ campaigns và activeCampaignId nếu store cũ chưa có
      if (!parsed.campaigns || !Array.isArray(parsed.campaigns) || parsed.campaigns.length === 0) {
        parsed.campaigns = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA.campaigns));
        hasChanges = true;
      }
      if (!parsed.activeCampaignId) {
        parsed.activeCampaignId = INITIAL_MOCK_DATA.activeCampaignId || 'OCT20';
        hasChanges = true;
      }
      if (hasChanges) {
        localStorage.setItem('bht_mock_store', JSON.stringify(parsed));
      }
      // Nếu store cũ chưa có bộ học liệu mới hoặc chưa có submissions đầy đủ, tự động làm mới
      if (parsed.documents && parsed.documents.some(d => d.DocID === 'DOC_MOS_001') && 
          parsed.attendance && parsed.attendance.some(s => s.PhongHoc) &&
          parsed.submissions && parsed.submissions.length >= 8 &&
          parsed.quizzes && parsed.quizzes.some(q => q.QuizID === 'QUIZ_OOP_CPP_01') &&
          parsed.memberQuizProfiles) {
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
              lop: member.Lop || member['Lớp'] || '',
              ban: member.Ban || '',
              role: member.Role,
              trangThai: member.TrangThai,
              ngayThamGia: member.NgayThamGia,
              sex: member.Sex || 'male',
              Sex: member.Sex || 'male',
              gift2010: member.gift2010 || null
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
          ngayThamGia: member.NgayThamGia,
          sex: member.Sex || 'male',
          Sex: member.Sex || 'male',
          gift2010: member.gift2010 || null
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
      const cleanLop = String(data.lop || data.Lop || data['Lớp'] || '').trim();
      const cleanBan = String(data.ban || data.Ban || 'Ban học thuật').trim();
      const newMem = {
        MSSV: newMssv,
        HoTen: String(data.hoTen || '').trim(),
        Email: '',
        Lop: cleanLop,
        'Lớp': cleanLop,
        Ban: cleanBan,
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
        if (data.folderId !== undefined) {
          let folderId = String(data.folderId || '').trim();
          if (folderId) {
            const m = folderId.match(/[-\w]{25,}/);
            if (m) folderId = m[0];
          }
          t.FolderID = folderId;
        }

        // Cập nhật lại session.BaiTap nếu có
        state.attendance.forEach(s => {
          if (s.BaiTap && s.BaiTap.TaskID === tid) {
            s.BaiTap = { ...t };
          }
        });

        saveLocalMockState(state);
        return { success: true, message: `Đã cập nhật bài tập "${t.TieuDe}" thành công!`, folderId: t.FolderID };
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
      const existingSubs = state.submissions.filter(s => s.TaskID === data.taskId && s.MSSV === data.mssv);
      if (existingSubs.length >= 3) {
        return {
          success: false,
          errorCode: 'SUBMISSION_LIMIT_EXCEEDED',
          message: 'Bạn đã đạt giới hạn nộp bài tối đa (3 lần) cho nhiệm vụ này!'
        };
      }
      const currentTurn = existingSubs.length + 1;
      const giftTag = data.giftCode ? ` [🎁 Quà 20/10: ${data.giftCode}]` : '';
      const cleanFileName = `[${data.mssv}]_[${data.hoTen || 'ThanhVien'}]_Lan${currentTurn}_${data.fileName || 'BaiNop.zip'}${giftTag}`;

      const newSub = {
        SubID: 'SUB_' + data.mssv + '_' + data.taskId + '_' + Date.now(),
        TaskID: data.taskId,
        MSSV: data.mssv,
        HoTen: data.hoTen,
        Email: data.email,
        TenFile: cleanFileName,
        DriveLink: 'https://drive.google.com/mock-upload-' + Date.now(),
        ThoiGianNop: new Date().toLocaleString('vi-VN'),
        TrangThaiDuyet: 'Pending',
        Feedback: data.giftCode ? `[🎁 Quà 20/10: ${data.giftCode}]` : (data.feedback || ''),
        giftCode: data.giftCode || ''
      };
      state.submissions.unshift(newSub);
      saveLocalMockState(state);
      return { 
        success: true, 
        message: `Nộp bài thành công (Lần ${currentTurn}/3)!`, 
        subId: newSub.SubID,
        fileUrl: newSub.DriveLink,
        submitTime: newSub.ThoiGianNop,
        turn: currentTurn
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

    // 6. QUIZ & PRACTICE MODULE ACTIONS
    case 'getQuizBySession': {
      const sessionId = String(data.sessionId || data.SessionID || '').trim();
      let currentMssv = String(data.mssv || data.MSSV || '').trim().toUpperCase();
      if (!currentMssv && typeof localStorage !== 'undefined') {
        currentMssv = String(localStorage.getItem('bht_mssv') || '').trim().toUpperCase();
      }
      const isAdmin = data.isAdmin === true || data.role === 'ADMIN';

      const quiz = (state.quizzes || []).find(q => String(q.SessionID).trim() === sessionId);
      if (!quiz) {
        return {
          success: true,
          data: {
            quiz: null,
            userResult: null,
            leaderboard: []
          }
        };
      }

      // Tìm kết quả làm bài của sinh viên này nếu có
      const userResult = (state.quizResults || []).find(
        r => String(r.QuizID) === String(quiz.QuizID) && String(r.MSSV).toUpperCase() === currentMssv
      ) || null;

      // Danh sách xếp hạng của bài thi này
      const sessionResults = (state.quizResults || [])
        .filter(r => String(r.QuizID) === String(quiz.QuizID))
        .sort((a, b) => (b.DiemSo - a.DiemSo) || (a.ThoiGianLamGiay - b.ThoiGianLamGiay));

      // Bảo mật: Nếu chưa nộp bài và không phải Admin: Nhánh 1 chỉ lấy SoCauThi câu đầu và giấu đáp án
      let returnedQuiz = quiz;
      if (!isAdmin && !userResult) {
        const examLimit = Number(quiz.SoCauThi) || (quiz.DanhSachCauHoi || []).length;
        const safeQuestions = (quiz.DanhSachCauHoi || []).slice(0, examLimit).map(q => ({
          id: q.id,
          cauHoi: q.cauHoi,
          luaChon: q.luaChon
        }));
        returnedQuiz = {
          ...quiz,
          DanhSachCauHoi: safeQuestions
        };
      }

      return {
        success: true,
        data: {
          quiz: returnedQuiz,
          userResult,
          leaderboard: sessionResults
        }
      };
    }

    case 'saveQuiz': {
      const qid = String(data.quizId || data.QuizID || '').trim();
      const sessionId = String(data.sessionId || data.SessionID || '').trim();
      if (!sessionId) {
        return { success: false, message: 'Thiếu SessionID của buổi học!' };
      }

      let existing = (state.quizzes || []).find(q => q.QuizID === qid || q.SessionID === sessionId);
      if (existing) {
        if (data.tieuDe !== undefined) existing.TieuDe = String(data.tieuDe).trim();
        if (data.moTa !== undefined) existing.MoTa = String(data.moTa).trim();
        if (data.thoiGianPhut !== undefined) existing.ThoiGianPhut = Number(data.thoiGianPhut) || 10;
        if (data.soCauThi !== undefined) existing.SoCauThi = Number(data.soCauThi) || 10;
        if (data.trangThai !== undefined) existing.TrangThai = String(data.trangThai).trim();
        if (data.danhSachCauHoi !== undefined) existing.DanhSachCauHoi = data.danhSachCauHoi;
        saveLocalMockState(state);
        return {
          success: true,
          message: `Đã cập nhật bộ đề trắc nghiệm "${existing.TieuDe}"!`,
          quizId: existing.QuizID,
          data: existing
        };
      } else {
        const newQuiz = {
          QuizID: qid || ('QUIZ_' + Date.now()),
          SessionID: sessionId,
          TieuDe: data.tieuDe || 'Trắc nghiệm kiểm tra nhanh kiến thức',
          MoTa: data.moTa || '',
          ThoiGianPhut: Number(data.thoiGianPhut) || 10,
          SoCauThi: Number(data.soCauThi) || 10,
          TrangThai: data.trangThai || 'Draft',
          NgayTao: new Date().toLocaleString('vi-VN'),
          DanhSachCauHoi: data.danhSachCauHoi || []
        };
        if (!state.quizzes) state.quizzes = [];
        state.quizzes.unshift(newQuiz);
        saveLocalMockState(state);
        return {
          success: true,
          message: `Đã tạo mới bộ đề trắc nghiệm "${newQuiz.TieuDe}"!`,
          quizId: newQuiz.QuizID,
          data: newQuiz
        };
      }
    }

    case 'toggleQuizStatus': {
      const qid = String(data.quizId || data.QuizID || '').trim();
      const sessionId = String(data.sessionId || data.SessionID || '').trim();
      const targetStatus = String(data.trangThai || data.TrangThai || 'Open').trim();

      const quiz = (state.quizzes || []).find(q => q.QuizID === qid || (sessionId && q.SessionID === sessionId));
      if (!quiz) {
        return { success: false, message: 'Không tìm thấy bộ đề trắc nghiệm!' };
      }

      quiz.TrangThai = targetStatus;
      saveLocalMockState(state);
      return {
        success: true,
        message: `Đã ${targetStatus === 'Open' ? 'mở' : 'đóng'} đề trắc nghiệm cho buổi học!`,
        trangThai: quiz.TrangThai
      };
    }

    case 'submitQuiz': {
      const qid = String(data.quizId || data.QuizID || '').trim();
      const sessionId = String(data.sessionId || data.SessionID || '').trim();
      let mssv = String(data.mssv || data.MSSV || '').trim().toUpperCase();
      let hoTen = String(data.hoTen || data.HoTen || '').trim();

      if (!mssv && typeof localStorage !== 'undefined') {
        mssv = String(localStorage.getItem('bht_mssv') || '').trim().toUpperCase();
      }
      if (!hoTen && mssv) {
        const mem = (state.members || []).find(m => String(m.MSSV).toUpperCase() === mssv);
        if (mem) hoTen = mem.HoTen;
      }
      if (!hoTen) hoTen = mssv || 'Thành Viên';

      const userAnswers = data.chiTietTraLoi || data.answers || {};
      const timeSpentSec = Number(data.thoiGianLamGiay || data.durationSeconds) || 0;

      const quiz = (state.quizzes || []).find(q => q.QuizID === qid || (sessionId && q.SessionID === sessionId));
      if (!quiz) {
        return { success: false, message: 'Bộ đề thi không tồn tại!' };
      }

      const isPractice = data.isPractice === true;

      if (!isPractice && quiz.TrangThai !== 'Open') {
        return { success: false, message: 'Đề thi hiện đang đóng, không nhận bài làm chính thức!' };
      }

      // Chấm điểm: Nhánh 1 (Thi chính thức) lấy đúng SoCauThi câu đầu, Nhánh 2 (Ôn luyện) lấy toàn bộ
      const allQuestions = quiz.DanhSachCauHoi || [];
      const gradedQuestions = !isPractice
        ? allQuestions.slice(0, Number(quiz.SoCauThi) || allQuestions.length)
        : allQuestions;

      let correctCount = 0;
      gradedQuestions.forEach(q => {
        if (Number(userAnswers[q.id]) === Number(q.dapAnDung)) {
          correctCount++;
        }
      });

      const totalCount = gradedQuestions.length || 1;
      const score = Math.round((correctCount / totalCount) * 100);

      if (!state.quizResults) state.quizResults = [];

      let resultRecord = state.quizResults.find(
        r => r.QuizID === quiz.QuizID && String(r.MSSV).toUpperCase() === mssv
      );

      // Nếu là nộp bài thi chính thức (không phải ôn luyện) mà đã có kết quả trước đó -> Chặn ghi đè!
      if (!isPractice && resultRecord) {
        return {
          success: false,
          errorCode: 'ALREADY_SUBMITTED',
          message: 'Bạn đã hoàn thành bài thi chính thức của buổi sinh hoạt này rồi! Điểm số đã được chốt trên bảng xếp hạng.',
          data: {
            result: resultRecord,
            quiz
          }
        };
      }

      // Nếu là thi chính thức lần đầu tiên -> Lưu vào danh sách xếp hạng
      if (!isPractice) {
        resultRecord = {
          ResultID: 'RES_' + mssv + '_' + quiz.QuizID + '_' + Date.now(),
          QuizID: quiz.QuizID,
          SessionID: quiz.SessionID,
          MSSV: mssv,
          HoTen: hoTen || mssv,
          DiemSo: score,
          SoCauDung: correctCount,
          TongSoCau: totalCount,
          ChiTietTraLoi: userAnswers,
          ThoiGianNop: new Date().toLocaleString('vi-VN'),
          ThoiGianLamGiay: timeSpentSec,
          IsOfficial: true
        };
        state.quizResults.unshift(resultRecord);
        saveLocalMockState(state);
      } else {
        // Chế độ ôn luyện -> Tạo kết quả tạm thời không ảnh hưởng bảng xếp hạng
        resultRecord = {
          ResultID: 'PRACTICE_' + Date.now(),
          QuizID: quiz.QuizID,
          SessionID: quiz.SessionID,
          MSSV: mssv,
          HoTen: hoTen || mssv,
          DiemSo: score,
          SoCauDung: correctCount,
          TongSoCau: totalCount,
          ChiTietTraLoi: userAnswers,
          ThoiGianNop: new Date().toLocaleString('vi-VN'),
          ThoiGianLamGiay: timeSpentSec,
          IsOfficial: false
        };
      }

      return {
        success: true,
        message: `Nộp bài thành công! Bạn đạt ${score}/100 điểm (${correctCount}/${totalCount} câu đúng).`,
        data: {
          result: resultRecord,
          quiz // Trả về đầy đủ quiz kèm dapAnDung và giaiThich để sinh viên xem lời giải củng cố kiến thức
        }
      };
    }

    case 'resetQuizSubmission': {
      const qid = String(data.quizId || data.QuizID || '').trim();
      const sessionId = String(data.sessionId || data.SessionID || '').trim();
      const mssv = String(data.mssv || data.MSSV || '').trim().toUpperCase();

      if (!state.quizResults) state.quizResults = [];
      state.quizResults = state.quizResults.filter(
        r => !(String(r.QuizID) === qid && String(r.MSSV).toUpperCase() === mssv)
      );
      saveLocalMockState(state);
      return {
        success: true,
        message: `Đã reset kết quả thi của sinh viên ${mssv}. Sinh viên có thể vào thi lại bài 10 phút!`
      };
    }

    case 'resetAllQuizSubmissions': {
      const qid = String(data.quizId || data.QuizID || '').trim();
      const sessionId = String(data.sessionId || data.SessionID || '').trim();

      if (!state.quizResults) state.quizResults = [];
      state.quizResults = state.quizResults.filter(r => String(r.QuizID) !== qid);

      // Mở lại đề thi để sinh viên làm lại bài
      const quiz = (state.quizzes || []).find(q => q.QuizID === qid || (sessionId && q.SessionID === sessionId));
      if (quiz) quiz.TrangThai = 'Open';

      saveLocalMockState(state);
      return {
        success: true,
        message: 'Đã reset toàn bộ kết quả thi và mở lại đề. Tất cả sinh viên có thể làm lại bài thi 10 phút từ đầu!'
      };
    }

    case 'applyQuizBonusVoucher': {
      const sessionId = String(data.sessionId || data.SessionID || '').trim();
      const mssv = String(data.mssv || data.MSSV || '').trim().toUpperCase();
      const giftCode = String(data.giftCode || '').trim();

      const quiz = (state.quizzes || []).find(q => q.SessionID === sessionId);
      if (!quiz) {
        return { success: false, message: 'Không tìm thấy bộ đề trắc nghiệm của buổi học!' };
      }

      const result = (state.quizResults || []).find(
        r => r.QuizID === quiz.QuizID && String(r.MSSV).toUpperCase() === mssv
      );
      if (!result) {
        return { success: false, message: 'Bạn chưa có bài thi chính thức để áp dụng voucher!' };
      }

      if (result.appliedGift2010) {
        return { success: false, message: 'Bạn đã áp dụng Voucher 20/10 (+10 điểm) cho bài thi này rồi!' };
      }

      const oldScore = Number(result.DiemSo) || 0;
      const newScore = Math.min(100, oldScore + 10);
      result.DiemSo = newScore;
      result.appliedGift2010 = true;
      result.giftCode = giftCode;

      // Đánh dấu quà đã dùng trong member
      const member = (state.members || []).find(m => String(m.MSSV).toUpperCase() === mssv);
      if (member && member.gift2010) {
        if (typeof member.gift2010 === 'object') member.gift2010.used = true;
      }

      saveLocalMockState(state);
      return {
        success: true,
        message: `Đã áp dụng Voucher 20/10 (+10 điểm)! Điểm thi của bạn tăng từ ${oldScore} lên ${newScore}/100.`,
        data: {
          newScore: newScore,
          appliedGift2010: true,
          result: result
        }
      };
    }

    case 'getQuizResultsBySession': {
      const sessionId = String(data.sessionId || data.SessionID || '').trim();
      const quiz = (state.quizzes || []).find(q => q.SessionID === sessionId);
      if (!quiz) {
        return { success: true, data: { quiz: null, results: [], stats: null } };
      }

      const results = (state.quizResults || []).filter(r => r.QuizID === quiz.QuizID);
      
      const stats = {
        totalSubmissions: results.length,
        avgScore: results.length ? Math.round(results.reduce((s, r) => s + r.DiemSo, 0) / results.length) : 0,
        questionStats: (quiz.DanhSachCauHoi || []).map(q => {
          const correct = results.filter(r => r.ChiTietTraLoi && Number(r.ChiTietTraLoi[q.id]) === Number(q.dapAnDung)).length;
          return {
            id: q.id,
            cauHoi: q.cauHoi,
            correctCount: correct,
            totalCount: results.length,
            accuracyRate: results.length ? Math.round((correct / results.length) * 100) : 0
          };
        })
      };

      return {
        success: true,
        data: {
          quiz,
          results,
          stats
        }
      };
    }

    case 'deleteQuiz': {
      const did = String(data.quizId || data.QuizID || '').trim();
      const idx = (state.quizzes || []).findIndex(q => q.QuizID === did);
      if (idx !== -1) {
        const deleted = state.quizzes.splice(idx, 1)[0];
        saveLocalMockState(state);
        return { success: true, message: `Đã xóa đề trắc nghiệm "${deleted.TieuDe}"!` };
      }
      return { success: false, message: 'Không tìm thấy bộ đề trắc nghiệm để xóa!' };
    }

    // 7. HỌC TẬP CÁ NHÂN HÓA, CHUỖI STREAK & KHO CÂU SAI (GAMIFICATION API)
    case 'getMemberQuizProfile': {
      const mssv = String(data.mssv || data.MSSV || '').trim().toUpperCase();
      if (!state.memberQuizProfiles) state.memberQuizProfiles = [];

      let profile = state.memberQuizProfiles.find(p => String(p.MSSV).toUpperCase() === mssv);
      if (!profile) {
        profile = {
          MSSV: mssv,
          StreakDays: 1,
          LastActiveDate: new Date().toLocaleDateString('vi-VN'),
          TotalQuestionsAnswered: 0,
          TotalCorrect: 0,
          Badges: [],
          WrongQuestionIds: [],
          BookmarkedQuestionIds: []
        };
        state.memberQuizProfiles.push(profile);
        saveLocalMockState(state);
      }

      return {
        success: true,
        data: profile
      };
    }

    case 'recordQuizAnswer': {
      const qid = String(data.quizId || data.QuizID || '').trim();
      const questionId = Number(data.questionId !== undefined ? data.questionId : data.id);
      const selectedIndex = Number(data.selectedIndex !== undefined ? data.selectedIndex : (data.selectedOption !== undefined ? data.selectedOption : data.selected));
      const mssv = String(data.mssv || data.MSSV || '').trim().toUpperCase();

      let quiz = (state.quizzes || []).find(q => q.QuizID === qid);
      if (!quiz) {
        quiz = (state.quizzes || []).find(q => (q.DanhSachCauHoi || []).some(item => Number(item.id) === questionId));
      }
      if (!quiz) {
        return { success: false, message: 'Không tìm thấy bộ đề thi!' };
      }

      const question = (quiz.DanhSachCauHoi || []).find(q => Number(q.id) === questionId);
      if (!question) {
        return { success: false, message: 'Không tìm thấy câu hỏi!' };
      }

      const isCorrect = Number(selectedIndex) === Number(question.dapAnDung);

      if (!state.memberQuizProfiles) state.memberQuizProfiles = [];
      let profile = state.memberQuizProfiles.find(p => String(p.MSSV).toUpperCase() === mssv);
      if (!profile) {
        profile = {
          MSSV: mssv,
          StreakDays: 1,
          LastActiveDate: new Date().toLocaleDateString('vi-VN'),
          TotalQuestionsAnswered: 0,
          TotalCorrect: 0,
          Badges: [],
          WrongQuestionIds: [],
          BookmarkedQuestionIds: []
        };
        state.memberQuizProfiles.push(profile);
      }

      profile.TotalQuestionsAnswered = (profile.TotalQuestionsAnswered || 0) + 1;

      // Cập nhật Streak học tập
      const todayStr = new Date().toLocaleDateString('vi-VN');
      if (profile.LastActiveDate !== todayStr) {
        profile.StreakDays = (profile.StreakDays || 0) + 1;
        profile.LastActiveDate = todayStr;
      }

      const qGlobalKey = `${quiz.QuizID}_${questionId}`;
      if (isCorrect) {
        profile.TotalCorrect = (profile.TotalCorrect || 0) + 1;
        // Đã trả lời đúng: Nếu đang có trong kho câu sai, tự động gỡ ra
        if (profile.WrongQuestionIds && profile.WrongQuestionIds.includes(qGlobalKey)) {
          profile.WrongQuestionIds = profile.WrongQuestionIds.filter(id => id !== qGlobalKey);
        }
      } else {
        // Trả lời sai: Tự động thêm vào kho câu sai nếu chưa có
        if (!profile.WrongQuestionIds) profile.WrongQuestionIds = [];
        if (!profile.WrongQuestionIds.includes(qGlobalKey)) {
          profile.WrongQuestionIds.push(qGlobalKey);
        }
      }

      // Tự động kiểm tra cấp huy hiệu
      if (!profile.Badges) profile.Badges = [];
      if (profile.StreakDays >= 3 && !profile.Badges.includes('STREAK_3')) profile.Badges.push('STREAK_3');
      if (profile.StreakDays >= 7 && !profile.Badges.includes('STREAK_7')) profile.Badges.push('STREAK_7');
      if (profile.TotalQuestionsAnswered >= 30 && !profile.Badges.includes('STUDY_WARRIOR')) profile.Badges.push('STUDY_WARRIOR');

      saveLocalMockState(state);

      return {
        success: true,
        data: {
          isCorrect,
          correctAnswer: question.dapAnDung,
          correctAnswerText: question.luaChon[question.dapAnDung],
          explanation: question.giaiThich || '',
          profile: {
            streakDays: profile.StreakDays,
            wrongCount: (profile.WrongQuestionIds || []).length,
            bookmarkCount: (profile.BookmarkedQuestionIds || []).length,
            totalAnswered: profile.TotalQuestionsAnswered,
            totalCorrect: profile.TotalCorrect
          }
        }
      };
    }

    case 'toggleQuestionBookmark': {
      const qid = String(data.quizId || data.QuizID || '').trim();
      const questionId = Number(data.questionId !== undefined ? data.questionId : data.id);
      const mssv = String(data.mssv || data.MSSV || '').trim().toUpperCase();

      if (!state.memberQuizProfiles) state.memberQuizProfiles = [];
      let profile = state.memberQuizProfiles.find(p => String(p.MSSV).toUpperCase() === mssv);
      if (!profile) {
        profile = {
          MSSV: mssv,
          StreakDays: 1,
          LastActiveDate: new Date().toLocaleDateString('vi-VN'),
          TotalQuestionsAnswered: 0,
          TotalCorrect: 0,
          Badges: [],
          WrongQuestionIds: [],
          BookmarkedQuestionIds: []
        };
        state.memberQuizProfiles.push(profile);
      }

      const qGlobalKey = `${qid}_${questionId}`;
      if (!profile.BookmarkedQuestionIds) profile.BookmarkedQuestionIds = [];
      
      const idx = profile.BookmarkedQuestionIds.indexOf(qGlobalKey);
      let isBookmarked = false;
      if (idx !== -1) {
        profile.BookmarkedQuestionIds.splice(idx, 1);
        isBookmarked = false;
      } else {
        profile.BookmarkedQuestionIds.push(qGlobalKey);
        isBookmarked = true;
      }

      saveLocalMockState(state);

      return {
        success: true,
        data: {
          isBookmarked,
          totalBookmarks: profile.BookmarkedQuestionIds.length
        }
      };
    }

    case 'getPersonalQuizPool': {
      const mssv = String(data.mssv || data.MSSV || '').trim().toUpperCase();
      const poolType = String(data.poolType || 'wrong').trim().toLowerCase(); // 'wrong' | 'bookmark'

      const profile = (state.memberQuizProfiles || []).find(p => String(p.MSSV).toUpperCase() === mssv);
      const targetKeys = profile ? (poolType === 'wrong' ? (profile.WrongQuestionIds || []) : (profile.BookmarkedQuestionIds || [])) : [];

      const questions = [];
      targetKeys.forEach(k => {
        const parts = k.split('_');
        const qId = Number(parts.pop());
        const quizId = parts.join('_');

        const quiz = (state.quizzes || []).find(q => q.QuizID === quizId);
        if (quiz) {
          const q = (quiz.DanhSachCauHoi || []).find(x => Number(x.id) === qId);
          if (q) {
            questions.push({
              ...q,
              quizId: quiz.QuizID,
              quizTitle: quiz.TieuDe,
              sessionID: quiz.SessionID
            });
          }
        }
      });

      return {
        success: true,
        data: {
          poolType,
          total: questions.length,
          questions
        }
      };
    }

    case 'clearWrongHistory': {
      const mssv = String(data.mssv || data.MSSV || '').trim().toUpperCase();
      const profile = (state.memberQuizProfiles || []).find(p => String(p.MSSV).toUpperCase() === mssv);
      if (profile) {
        profile.WrongQuestionIds = [];
        saveLocalMockState(state);
      }
      return {
        success: true,
        message: 'Đã xóa toàn bộ lịch sử câu hỏi làm sai!'
      };
    }

    case 'saveMemberGift': {
      const targetMssv = String(data.userId || data.mssv || data.MSSV || '').trim().toUpperCase();
      const giftData = data.giftData !== undefined ? data.giftData : data;
      const mem = (state.members || []).find(m => String(m.MSSV || '').trim().toUpperCase() === targetMssv);
      if (mem) {
        mem.gift2010 = giftData;
        saveLocalMockState(state);
      }
      return {
        success: true,
        data: giftData,
        message: 'Đã lưu thông tin quà tặng thành công!'
      };
    }

    // ====================================================================
    // PHÂN HỆ SỰ KIỆN & ĐẶC QUYỀN HỌC THUẬT TỔNG QUÁT (CAMPAIGN & PRIVILEGES)
    // ====================================================================
    case 'getAllCampaigns': {
      const defaultCampaigns = (state.campaigns || INITIAL_MOCK_DATA.campaigns || []).map(c => ({
        ...c,
        startDate: c.startDate || '2026-10-20T00:00',
        endDate: c.endDate || '2026-10-21T23:59',
        webLink: c.webLink || 'https://vnuf2-itc.edu.vn/app',
        emailSubject: c.emailSubject || `[VNUF2-ITC] Thân chúc bạn ngày ${c.title} & Món quà học thuật đặc biệt 🌸`,
        emailTemplate: c.emailTemplate || `Thân gửi {HoTen} (MSSV: {MSSV}),\n\nNhân dịp {TenSuKien}, Ban Học Thuật - CLB Tin học VNUF2 thân chúc bạn luôn tràn đầy niềm vui, sức khỏe và đạt nhiều kết quả học tập xuất sắc!\n\n🎁 Ban gửi tặng riêng bạn một Hộp Quà May Mắn Bí Ẩn trên Cổng Học Thuật. Bên trong chứa những đặc quyền học thuật và phần quà bất ngờ dành riêng cho bạn đang chờ tự tay khám phá!\n\n👉 Hãy truy cập ngay Cổng Quản Lý Học Thuật theo đường link dưới đây để tự tay bấm mở hộp quà nhé:\n{LinkWeb}\n\nThân ái,\nBan Học Thuật - CLB Tin Học VNUF2`
      }));

      return {
        success: true,
        data: {
          activeCampaignId: state.activeCampaignId || 'OCT20',
          campaigns: defaultCampaigns,
          lastEmailDispatch: state.lastEmailDispatch || null
        }
      };
    }

    case 'getActiveCampaign': {
      const activeId = state.activeCampaignId || 'OCT20';
      if (activeId === 'NONE') {
        return { success: true, data: null, activeCampaignId: 'NONE' };
      }
      const campaigns = state.campaigns || INITIAL_MOCK_DATA.campaigns;
      const campaign = campaigns.find(c => c.id === activeId) || campaigns[0];
      return {
        success: true,
        data: campaign,
        activeCampaignId: activeId
      };
    }

    case 'setActiveCampaign': {
      const targetId = String(data.campaignId || data.id || 'OCT20').trim().toUpperCase();
      state.activeCampaignId = targetId;
      if (data.startDate) {
        state.campaigns = (state.campaigns || INITIAL_MOCK_DATA.campaigns).map(c => 
          c.id === targetId ? { ...c, startDate: data.startDate, endDate: data.endDate || c.endDate } : c
        );
      }
      saveLocalMockState(state);
      const campaigns = state.campaigns || INITIAL_MOCK_DATA.campaigns;
      const matched = campaigns.find(c => c.id === targetId);
      const title = matched ? matched.title : (targetId === 'NONE' ? 'Đã tắt sự kiện' : targetId);
      return {
        success: true,
        activeCampaignId: targetId,
        message: `Đã kích hoạt sự kiện: "${title}"!`
      };
    }

    case 'saveCampaignConfig': {
      const targetId = String(data.campaignId || data.id || 'OCT20').trim().toUpperCase();
      const campaigns = state.campaigns || INITIAL_MOCK_DATA.campaigns;
      let updatedCamp = null;
      state.campaigns = campaigns.map(c => {
        if (c.id === targetId) {
          updatedCamp = {
            ...c,
            ...(data.startDate ? { startDate: data.startDate } : {}),
            ...(data.endDate ? { endDate: data.endDate } : {}),
            ...(data.emailSubject ? { emailSubject: data.emailSubject } : {}),
            ...(data.emailTemplate ? { emailTemplate: data.emailTemplate } : {}),
            ...(data.targetAudience ? { targetAudience: data.targetAudience } : {}),
            ...(data.webLink ? { webLink: data.webLink } : {})
          };
          return updatedCamp;
        }
        return c;
      });

      if (data.setActive) {
        state.activeCampaignId = targetId;
      }
      saveLocalMockState(state);

      return {
        success: true,
        message: 'Đã lưu cấu hình lịch trình & nội dung thư sự kiện thành công!',
        data: updatedCamp || { id: targetId }
      };
    }

    case 'sendEventBulkEmail': {
      const campaignId = String(data.campaignId || state.activeCampaignId || 'OCT20').trim().toUpperCase();
      const campaigns = state.campaigns || INITIAL_MOCK_DATA.campaigns;
      const campaign = campaigns.find(c => c.id === campaignId) || campaigns[0] || {};
      const targetFilter = String(data.targetFilter || campaign.targetAudience || 'all').toLowerCase();
      const subject = data.subject || campaign.emailSubject || `[VNUF2-ITC] Thân chúc mừng sự kiện ${campaign.title}`;
      const template = data.template || campaign.emailTemplate || '';

      const members = state.members || [];
      let targetMembers = members;
      if (targetFilter === 'female') {
        targetMembers = members.filter(m => String(m.Sex || '').trim().toLowerCase() === 'female');
      }

      if (Array.isArray(data.selectedMssvs) && data.selectedMssvs.length > 0) {
        const selectedSet = new Set(data.selectedMssvs.map(s => String(s).trim().toUpperCase()));
        targetMembers = targetMembers.filter(m => selectedSet.has(String(m.MSSV || '').trim().toUpperCase()));
      }

      const logs = [];
      let sentCount = 0;
      let skippedNoEmailCount = 0;

      for (const m of targetMembers) {
        const email = String(m.Email || '').trim();
        const hasValidEmail = email && email.includes('@');
        const mssv = String(m.MSSV || '').trim();
        const voucherCode = `ITC-${campaignId}-${mssv.slice(-5) || '99999'}`;
        const giftTitle = (campaign.gifts && campaign.gifts[0]) ? campaign.gifts[0].title : 'Quà Đặc Quyền Học Thuật';

        if (hasValidEmail) {
          sentCount++;
          logs.push({
            mssv: m.MSSV,
            hoTen: m.HoTen,
            email: email,
            status: 'SENT',
            deliveryType: 'Tự mở trên Web',
            giftTitle: giftTitle,
            claimCode: '(Chờ mở trên web)',
            sentAt: new Date().toLocaleTimeString('vi-VN')
          });
        } else {
          skippedNoEmailCount++;
          logs.push({
            mssv: m.MSSV,
            hoTen: m.HoTen,
            email: '(Chưa cập nhật)',
            status: 'SKIPPED_NO_EMAIL',
            deliveryType: 'Tự mở trên Web',
            giftTitle: giftTitle,
            claimCode: '(Chờ mở trên web)',
            sentAt: null
          });
        }
      }

      state.lastEmailDispatch = {
        campaignId,
        subject,
        targetFilter,
        dispatchedAt: new Date().toISOString(),
        totalTarget: targetMembers.length,
        sentCount,
        skippedNoEmailCount,
        logs
      };
      saveLocalMockState(state);

      return {
        success: true,
        message: `Đã gửi thành công ${sentCount} email tới các thành viên! (${skippedNoEmailCount} bạn thiếu email)`,
        data: state.lastEmailDispatch
      };
    }

    case 'redeemPrivilegeVoucher': {
      const voucherCode = String(data.voucherCode || data.giftCode || '').trim();
      const targetType = String(data.targetType || 'QUIZ').trim().toUpperCase(); // 'QUIZ' | 'SUBMISSION'
      const targetId = String(data.targetId || data.sessionId || data.taskId || '').trim();
      const mssv = String(data.mssv || data.MSSV || '').trim().toUpperCase();
      const effectType = String(data.effectType || 'SCORE_BONUS').trim().toUpperCase();
      const effectValue = Number(data.effectValue) || 10;

      if (!voucherCode) {
        return { success: false, message: 'Thiếu mã voucher đặc quyền!' };
      }

      if (targetType === 'QUIZ') {
        const quiz = (state.quizzes || []).find(q => q.SessionID === targetId || q.QuizID === targetId);
        if (!quiz) {
          return { success: false, message: 'Không tìm thấy bộ đề trắc nghiệm của buổi học!' };
        }
        const result = (state.quizResults || []).find(
          r => r.QuizID === quiz.QuizID && String(r.MSSV).toUpperCase() === mssv
        );
        if (!result) {
          return { success: false, message: 'Bạn chưa có bài thi chính thức để áp dụng voucher!' };
        }
        if (result.appliedGift2010 || result.appliedVoucherCode) {
          return { success: false, message: 'Bài thi này đã được áp dụng voucher trước đó!' };
        }

        const oldScore = Number(result.DiemSo) || 0;
        const newScore = Math.min(100, oldScore + effectValue);
        result.DiemSo = newScore;
        result.appliedGift2010 = true;
        result.appliedVoucherCode = voucherCode;
        result.giftCode = voucherCode;

        // Đánh dấu quà đã dùng
        const member = (state.members || []).find(m => String(m.MSSV).toUpperCase() === mssv);
        if (member && member.gift2010) {
          if (typeof member.gift2010 === 'object') member.gift2010.used = true;
        }

        saveLocalMockState(state);
        return {
          success: true,
          message: `Đã áp dụng Voucher đặc quyền (+${effectValue} điểm)! Điểm thi tăng từ ${oldScore} lên ${newScore}/100.`,
          data: {
            newScore,
            appliedGift2010: true,
            appliedVoucherCode: voucherCode
          }
        };
      } else if (targetType === 'SUBMISSION') {
        const sub = (state.submissions || []).find(s => (s.SubID === targetId || s.TaskID === targetId) && String(s.MSSV).toUpperCase() === mssv);
        if (sub) {
          sub.giftCode = voucherCode;
          sub.appliedVoucherCode = voucherCode;
          if (effectType === 'EXTEND_DEADLINE') {
            sub.Feedback = (sub.Feedback ? sub.Feedback + ' - ' : '') + `[ĐÃ DUYỆT GIA HẠN +${effectValue}H] Áp dụng Voucher ${voucherCode} (On-time).`;
          } else if (effectType === 'SCORE_BONUS') {
            sub.Feedback = (sub.Feedback ? sub.Feedback + ' - ' : '') + `[+${effectValue} ĐIỂM VOUCHER] Áp dụng đặc quyền ${voucherCode}.`;
          } else {
            sub.Feedback = (sub.Feedback ? sub.Feedback + ' - ' : '') + `[XÁC NHẬN ĐẶC QUYỀN] Áp dụng Voucher ${voucherCode}.`;
          }
          saveLocalMockState(state);
          return {
            success: true,
            message: `Đã áp dụng voucher đặc quyền vào bài nộp thành công!`,
            data: sub
          };
        }
        return { success: false, message: 'Không tìm thấy bài nộp tương ứng!' };
      }

      return { success: false, message: 'Loại mục tiêu không được hỗ trợ!' };
    }

    default:
      return { success: false, message: `Hành động Mock "${action}" chưa được hỗ trợ!` };
  }
}

export const mockCallApi = handleMockAction;
