// ====================================================================
// QUẢN LÝ NHÂN SỰ & ĐIỂM DANH HỌP BAN (SERVICE MEMBER & ATTENDANCE)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================

/**
 * Lấy danh sách toàn bộ thành viên (Dành cho Quản trị viên)
 */
function getAllMembers() {
  try {
    const rows = getSheetRowsAsObjects(CONFIG.SHEET_NAMES.THANH_VIEN, true);
    return { success: true, data: rows };
  } catch (err) {
    return { success: false, message: 'Lỗi tải danh sách thành viên: ' + err.toString() };
  }
}

/**
 * Thêm mới một thành viên vào danh sách Ban Học Thuật (Admin)
 * @param {Object} memberData { mssv, hoTen, role }
 */
function addMember(memberData) {
  try {
    if (!memberData || !memberData.mssv || !memberData.hoTen) {
      return { success: false, message: 'Vui lòng cung cấp đầy đủ MSSV và Họ tên!' };
    }

    const cleanMssv = String(memberData.mssv).trim().toUpperCase();
    const cleanHoTen = String(memberData.hoTen).trim();
    const role = (memberData.role || 'MEMBER').toUpperCase();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.THANH_VIEN);
      const data = sheet.getDataRange().getValues();

      // Kiểm tra trùng lặp MSSV
      for (let i = 1; i < data.length; i++) {
        let rowMssv = String(data[i][0] || '').trim().toUpperCase();
        if (rowMssv.includes('E')) {
          const num = Number(rowMssv);
          if (!isNaN(num)) rowMssv = num.toLocaleString('fullwide', { useGrouping: false });
        }
        if (rowMssv === cleanMssv) {
          return { success: false, message: `MSSV ${cleanMssv} đã tồn tại trong hệ thống!` };
        }
      }

      const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
      // [MSSV, HoTen, Email, Role, TrangThai, NgayThamGia]
      sheet.appendRow([cleanMssv, cleanHoTen, '', role, 'Active', today]);
      invalidateSheetCache(CONFIG.SHEET_NAMES.THANH_VIEN);

      return { success: true, message: `Đã thêm thành viên ${cleanHoTen} (${cleanMssv}) thành công!` };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi thêm thành viên: ' + err.toString() };
  }
}

/**
 * Xóa liên kết Gmail để thành viên liên kết lại tài khoản khác (Admin)
 * @param {string} mssv
 */
function resetMemberEmail(mssv) {
  try {
    const cleanMssv = String(mssv || '').trim().toUpperCase();
    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.THANH_VIEN);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        let rowMssv = String(data[i][0] || '').trim().toUpperCase();
        if (rowMssv.includes('E')) {
          const num = Number(rowMssv);
          if (!isNaN(num)) rowMssv = num.toLocaleString('fullwide', { useGrouping: false });
        }
        if (rowMssv === cleanMssv) {
          sheet.getRange(i + 1, 3).setValue(''); // Xóa cột Email (Cột 3)
          invalidateSheetCache(CONFIG.SHEET_NAMES.THANH_VIEN);
          return { success: true, message: `Đã đặt lại (reset) liên kết Email cho MSSV ${cleanMssv}!` };
        }
      }
      return { success: false, message: `Không tìm thấy MSSV ${cleanMssv}!` };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi reset email: ' + err.toString() };
  }
}

/**
 * Bật/tắt trạng thái thành viên (Active <-> Inactive)
 */
function toggleMemberStatus(mssv, newStatus) {
  try {
    const cleanMssv = String(mssv || '').trim().toUpperCase();
    const statusVal = String(newStatus || 'Active').trim();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.THANH_VIEN);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        let rowMssv = String(data[i][0] || '').trim().toUpperCase();
        if (rowMssv.includes('E')) {
          const num = Number(rowMssv);
          if (!isNaN(num)) rowMssv = num.toLocaleString('fullwide', { useGrouping: false });
        }
        if (rowMssv === cleanMssv) {
          sheet.getRange(i + 1, 5).setValue(statusVal); // Cột TrangThai (Cột 5)
          invalidateSheetCache(CONFIG.SHEET_NAMES.THANH_VIEN);
          return { success: true, message: `Đã đổi trạng thái của ${cleanMssv} thành ${statusVal}!` };
        }
      }
      return { success: false, message: `Không tìm thấy MSSV ${cleanMssv}!` };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi đổi trạng thái: ' + err.toString() };
  }
}

// --------------------------------------------------------------------
// PHÂN HỆ BUỔI SINH HOẠT & CHUYÊN ĐỀ (SESSIONS & TOPICS)
// --------------------------------------------------------------------

/**
 * Lấy danh sách các buổi sinh hoạt/họp ban và chuyên đề
 */
function getAttendanceSessions() {
  try {
    const rows = getSheetRowsAsObjects(CONFIG.SHEET_NAMES.DIEM_DANH, true);
    // Chuẩn hóa dữ liệu fallback cho các cột F, G, H
    rows.forEach(s => {
      s.NgayDienRa = String(s.NgayDienRa || '');
      s.NoiDungChuyenDe = String(s.NoiDungChuyenDe || '');
      s.LinkTaiLieu = String(s.LinkTaiLieu || '');
      s.DS_CoMat = String(s.DS_CoMat || '[]');
    });
    // Sắp xếp các buổi mới nhất lên đầu
    rows.sort((a, b) => String(b.SessionID || '').localeCompare(String(a.SessionID || '')));
    return { success: true, data: rows };
  } catch (err) {
    return { success: false, message: 'Lỗi khi tải danh sách buổi sinh hoạt: ' + err.toString() };
  }
}

/**
 * Tạo một buổi họp/sinh hoạt mới kèm nội dung chuyên đề và mã PIN (Admin)
 * @param {Object} sessionData { tenBuoiHop, maPin, ngayDienRa, noiDungChuyenDe, linkTaiLieu }
 */
function createAttendanceSession(sessionData) {
  try {
    if (!sessionData || !sessionData.tenBuoiHop || !sessionData.maPin) {
      return { success: false, message: 'Vui lòng nhập tên buổi họp và mã PIN điểm danh!' };
    }

    const sessionId = 'MEET_' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss');
    const tenBuoiHop = String(sessionData.tenBuoiHop).trim();
    const maPin = String(sessionData.maPin).trim();
    const ngayDienRa = String(sessionData.ngayDienRa || '').trim();
    const noiDungChuyenDe = String(sessionData.noiDungChuyenDe || '').trim();
    const linkTaiLieu = String(sessionData.linkTaiLieu || '').trim();
    const tagChuyenDe = String(sessionData.tagChuyenDe || 'GENERAL').trim();
    const phongHoc = String(sessionData.phongHoc || '').trim();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.DIEM_DANH);
      // Schema: SessionID, TenBuoiHop, MaPin, TrangThai, DS_CoMat, NgayDienRa, NoiDungChuyenDe, LinkTaiLieu, TagChuyenDe, PhongHoc
      sheet.appendRow([sessionId, tenBuoiHop, maPin, 'Open', '[]', ngayDienRa, noiDungChuyenDe, linkTaiLieu, tagChuyenDe, phongHoc]);
      
      invalidateOpenSessionCache();
      invalidateSheetCache(CONFIG.SHEET_NAMES.DIEM_DANH);
      return { 
        success: true, 
        message: `Đã tạo buổi sinh hoạt: "${tenBuoiHop}" (Mã PIN: ${maPin})`,
        sessionId: sessionId 
      };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi tạo buổi sinh hoạt: ' + err.toString() };
  }
}

/**
 * Cập nhật thông tin chi tiết buổi học (Admin)
 * @param {Object} sessionData { sessionId, tenBuoiHop, ngayDienRa, noiDungChuyenDe, linkTaiLieu, tagChuyenDe, phongHoc }
 */
function updateAttendanceSession(sessionData) {
  try {
    if (!sessionData || !sessionData.sessionId) {
      return { success: false, message: 'Thiếu mã buổi sinh hoạt!' };
    }

    const sessionId = String(sessionData.sessionId).trim();
    const tenBuoiHop = String(sessionData.tenBuoiHop || '').trim();
    const ngayDienRa = String(sessionData.ngayDienRa || '').trim();
    const noiDungChuyenDe = String(sessionData.noiDungChuyenDe || '').trim();
    const linkTaiLieu = String(sessionData.linkTaiLieu || '').trim();
    const tagChuyenDe = String(sessionData.tagChuyenDe || '').trim();
    const phongHoc = String(sessionData.phongHoc || '').trim();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.DIEM_DANH);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim() === sessionId) {
          if (tenBuoiHop) sheet.getRange(i + 1, 2).setValue(tenBuoiHop);
          sheet.getRange(i + 1, 6).setValue(ngayDienRa);
          sheet.getRange(i + 1, 7).setValue(noiDungChuyenDe);
          sheet.getRange(i + 1, 8).setValue(linkTaiLieu);
          if (tagChuyenDe) sheet.getRange(i + 1, 9).setValue(tagChuyenDe);
          if (phongHoc) sheet.getRange(i + 1, 10).setValue(phongHoc);
          
          invalidateOpenSessionCache();
          invalidateSheetCache(CONFIG.SHEET_NAMES.DIEM_DANH);
          return { success: true, message: 'Đã cập nhật thông tin buổi sinh hoạt thành công!' };
        }
      }
      return { success: false, message: 'Không tìm thấy buổi sinh hoạt tương ứng!' };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi cập nhật buổi sinh hoạt: ' + err.toString() };
  }
}

const updateAttendanceTopic = updateAttendanceSession;

/**
 * Xóa buổi sinh hoạt (Admin)
 * @param {string} sessionId
 */
function deleteAttendanceSession(sessionId) {
  try {
    if (!sessionId) {
      return { success: false, message: 'Thiếu mã buổi sinh hoạt cần xóa!' };
    }

    const cleanId = String(sessionId).trim();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.DIEM_DANH);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim() === cleanId) {
          sheet.deleteRow(i + 1);
          invalidateOpenSessionCache();
          invalidateSheetCache(CONFIG.SHEET_NAMES.DIEM_DANH);
          return { success: true, message: `Đã xóa buổi sinh hoạt ${cleanId} thành công!` };
        }
      }
      return { success: false, message: 'Không tìm thấy buổi sinh hoạt cần xóa!' };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi xóa buổi sinh hoạt: ' + err.toString() };
  }
}

/**
 * Đóng hoặc mở lại phiên điểm danh (Admin)
 */
function toggleAttendanceSession(sessionId, targetStatus) {
  try {
    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.DIEM_DANH);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim() === String(sessionId).trim()) {
          sheet.getRange(i + 1, 4).setValue(targetStatus); // Cột TrangThai (Cột 4)
          invalidateOpenSessionCache();
          return { success: true, message: `Buổi sinh hoạt đã chuyển sang trạng thái: ${targetStatus}` };
        }
      }
      return { success: false, message: 'Không tìm thấy phiên điểm danh tương ứng!' };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi cập nhật trạng thái điểm danh: ' + err.toString() };
  }
}

/**
 * Xử lý Điểm danh PIN tốc độ cao (Check-in Attendance)
 * TỐI ƯU CHỊU TẢI 30-50 NGƯỜI CÙNG LÚC:
 * 1. Kiểm tra session mở & đối chiếu PIN qua CacheService trước (không tốn I/O Sheet).
 * 2. Chỉ khóa đúng vài chục mili-giây để đọc và ghi Cột 5 (DS_CoMat).
 * 3. Nếu lock quá 10s, trả về mã lỗi LOCK_TIMEOUT để Client kích hoạt Retry + Jitter.
 * 
 * @param {string} pinCode Mã PIN do Admin cung cấp
 * @param {string} mssv MSSV thành viên (đã được Router trích xuất an toàn từ Session Token)
 */
function checkInAttendance(pinCode, mssv) {
  try {
    const cleanPin = String(pinCode || '').trim();
    const cleanMssv = String(mssv || '').trim().toUpperCase();

    if (!cleanPin || !cleanMssv) {
      return { success: false, message: 'Vui lòng cung cấp đầy đủ thông tin điểm danh!' };
    }

    // 1. Kiểm tra nhanh mã PIN qua bộ nhớ đệm Cache
    const openSession = getOpenSessionFromCacheOrSheet();
    if (!openSession) {
      return { success: false, message: 'Hiện tại không có buổi sinh hoạt nào đang mở điểm danh!' };
    }

    if (openSession.maPin !== cleanPin) {
      return { success: false, message: 'Mã PIN điểm danh không chính xác!' };
    }

    // 2. Mở micro-lock ghi nhận MSSV vào DS_CoMat
    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.DIEM_DANH);
      const data = sheet.getDataRange().getValues();

      let targetRowIndex = -1;
      let targetSession = null;

      for (let i = 1; i < data.length; i++) {
        const rowId = String(data[i][0] || '').trim();
        const rowPin = String(data[i][2] || '').trim();
        const rowStatus = String(data[i][3] || '').trim().toLowerCase();

        if (rowId === openSession.sessionId && rowStatus === 'open' && rowPin === cleanPin) {
          targetRowIndex = i + 1;
          targetSession = {
            id: rowId,
            ten: data[i][1],
            dsCoMatRaw: String(data[i][4] || '[]')
          };
          break;
        }
      }

      if (targetRowIndex === -1 || !targetSession) {
        invalidateOpenSessionCache();
        return { success: false, message: 'Buổi sinh hoạt đã đóng hoặc mã PIN đã thay đổi!' };
      }

      // Parse danh sách sinh viên có mặt
      let ds = [];
      try {
        ds = JSON.parse(targetSession.dsCoMatRaw);
        if (!Array.isArray(ds)) ds = [];
      } catch (e) {
        ds = targetSession.dsCoMatRaw ? targetSession.dsCoMatRaw.split(',').map(s => s.trim()) : [];
      }

      // Kiểm tra xem MSSV đã điểm danh chưa
      if (ds.includes(cleanMssv)) {
        return { success: false, message: `Bạn (${cleanMssv}) đã điểm danh buổi này rồi!` };
      }

      // Thêm MSSV vào danh sách và cập nhật đúng Cột 5
      ds.push(cleanMssv);
      sheet.getRange(targetRowIndex, 5).setValue(JSON.stringify(ds));

      // Xóa cache danh sách điểm danh
      invalidateSheetCache(CONFIG.SHEET_NAMES.DIEM_DANH);

      return {
        success: true,
        message: `Điểm danh thành công buổi sinh hoạt: "${targetSession.ten}"!`,
        sessionId: targetSession.id
      };
    });

    return lockResult;

  } catch (err) {
    console.error('[Service_Member] Lỗi checkInAttendance:', err);
    return { success: false, message: 'Lỗi trong quá trình điểm danh: ' + err.toString() };
  }
}
