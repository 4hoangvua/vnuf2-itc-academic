// ====================================================================
// QUẢN LÝ NỘP BÀI TẬP, LƯU TRỮ DRIVE & KHO HỌC LIỆU (SERVICE SUBMIT & DOCS)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================

/**
 * Xử lý tiếp nhận nộp bài từ thành viên (Upload file Base64 lên Drive & Ghi Sheet)
 * TỐI ƯU HÓA CHỊU TẢI:
 * 1. Giải mã Base64 và tạo file trên Google Drive TRƯỚC KHI mở khóa LockService.
 * 2. Chỉ mở withScriptLock() trong vài chục mili-giây để append đúng 1 dòng vào Sheet BaiNop.
 * 3. Chống giả mạo MSSV bằng cách dùng currentUser từ Router.
 * 
 * @param {Object} payload { taskId, fileName, mimeType, base64Data }
 * @param {Object} currentUser { mssv, hoTen, email, role } từ Session Token
 */
function submitTaskAssignment(payload, currentUser) {
  try {
    if (!payload || !payload.taskId || !payload.base64Data || !payload.fileName) {
      return { success: false, message: 'Thông tin nộp bài không hợp lệ hoặc thiếu tệp đính kèm!' };
    }

    const taskId = String(payload.taskId).trim();
    // Sử dụng thông tin chính chủ từ Token được Router truyền vào
    const mssv = currentUser ? currentUser.mssv : String(payload.mssv || '').trim().toUpperCase();
    const hoTen = currentUser ? currentUser.hoTen : String(payload.hoTen || '').trim();
    const email = currentUser ? currentUser.email : String(payload.email || '').trim();
    const rawFileName = String(payload.fileName).trim();
    const mimeType = payload.mimeType || 'application/octet-stream';

    // 1. Kiểm tra thông tin Task (sử dụng cache server)
    const tasks = getSheetRowsAsObjects(CONFIG.SHEET_NAMES.NHIEM_VU, true);
    const task = tasks.find(t => String(t.TaskID).trim() === taskId);

    if (!task) {
      return { success: false, message: 'Nhiệm vụ không tồn tại trên hệ thống!' };
    }

    if (String(task.TrangThai || '').toLowerCase() === 'closed') {
      return { success: false, message: 'Nhiệm vụ này đã đóng, không thể nộp bài thêm!' };
    }

    const taskFolderId = task.FolderID;
    if (!taskFolderId) {
      return { success: false, message: 'Chưa cấu hình thư mục Google Drive cho nhiệm vụ này!' };
    }

    // 2. Decode Base64 và tải file lên Google Drive NGOÀI KHÓA LOCK
    let fileUrl = '';
    const safeBaseName = removeVietnameseTones(rawFileName);
    const finalFileName = `[${mssv}]_[${removeVietnameseTones(hoTen)}]_${safeBaseName}`;

    try {
      const decodedBytes = Utilities.base64Decode(payload.base64Data);
      const blob = Utilities.newBlob(decodedBytes, mimeType, finalFileName);
      const targetFolder = DriveApp.getFolderById(taskFolderId);
      const uploadedFile = targetFolder.createFile(blob);
      fileUrl = uploadedFile.getUrl();
    } catch (driveErr) {
      console.error('[Service_Submit] Lỗi khi lưu file vào Drive:', driveErr);
      return { success: false, message: 'Lỗi khi lưu file vào Google Drive: ' + driveErr.toString() };
    }

    // 3. Ghi thông tin lượt nộp vào Sheet BaiNop (Chỉ lock vài mili-giây để ghi dòng)
    const subId = 'SUB_' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss');
    const submitTime = formatCurrentDateTime();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.BAI_NOP);
      // Schema: SubID, TaskID, MSSV, HoTen, Email, TenFile, DriveLink, ThoiGianNop, TrangThaiDuyet, Feedback
      sheet.appendRow([
        subId,
        taskId,
        mssv,
        hoTen,
        email,
        finalFileName,
        fileUrl,
        submitTime,
        'Pending',
        ''
      ]);

      invalidateSheetCache(CONFIG.SHEET_NAMES.BAI_NOP);

      return {
        success: true,
        message: 'Nộp bài thành công!',
        subId: subId,
        fileUrl: fileUrl,
        submitTime: submitTime
      };
    });

    return lockResult;

  } catch (err) {
    console.error('[Service_Submit] Lỗi submitTaskAssignment:', err);
    return { success: false, message: 'Lỗi khi nộp bài: ' + err.toString() };
  }
}

/**
 * Lấy toàn bộ danh sách bài nộp (Admin)
 */
function getAllSubmissions() {
  try {
    const submissions = getSheetRowsAsObjects(CONFIG.SHEET_NAMES.BAI_NOP, true);
    return { success: true, data: submissions };
  } catch (err) {
    return { success: false, message: 'Lỗi tải danh sách bài nộp: ' + err.toString() };
  }
}

/**
 * Lấy danh sách bài nộp của một thành viên cụ thể (Member)
 */
function getMemberSubmissions(mssv) {
  try {
    const cleanMssv = String(mssv || '').trim().toUpperCase();
    const submissions = getSheetRowsAsObjects(CONFIG.SHEET_NAMES.BAI_NOP, true);
    const memberSubs = submissions.filter(s => String(s.MSSV || '').trim().toUpperCase() === cleanMssv);
    return { success: true, data: memberSubs };
  } catch (err) {
    return { success: false, message: 'Lỗi tải lịch sử nộp bài: ' + err.toString() };
  }
}

/**
 * Duyệt bài nộp và gửi nhận xét phản hồi (Admin)
 * @param {Object} reviewData { subId, trangThaiDuyet, feedback }
 */
function reviewSubmission(reviewData) {
  try {
    if (!reviewData || !reviewData.subId) {
      return { success: false, message: 'Thiếu mã bài nộp cần duyệt!' };
    }

    const subId = String(reviewData.subId).trim();
    const trangThaiDuyet = String(reviewData.trangThaiDuyet || 'Approved').trim(); // Approved, Rejected, Pending
    const feedback = String(reviewData.feedback || '').trim();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.BAI_NOP);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim() === subId) {
          sheet.getRange(i + 1, 9).setValue(trangThaiDuyet); // Cột TrangThaiDuyet (Cột 9)
          sheet.getRange(i + 1, 10).setValue(feedback);        // Cột Feedback (Cột 10)
          
          invalidateSheetCache(CONFIG.SHEET_NAMES.BAI_NOP);

          return {
            success: true,
            message: `Đã cập nhật bài nộp ${subId}: ${trangThaiDuyet}!`
          };
        }
      }
      return { success: false, message: 'Không tìm thấy bài nộp tương ứng!' };
    });

    return lockResult;

  } catch (err) {
    return { success: false, message: 'Lỗi khi duyệt bài: ' + err.toString() };
  }
}

// --------------------------------------------------------------------
// PHÂN HỆ TÀI LIỆU HỌC THUẬT (DOCUMENTS HUB)
// --------------------------------------------------------------------

/**
 * Lấy danh sách tài liệu
 */
function getAllDocuments() {
  try {
    const docs = getSheetRowsAsObjects(CONFIG.SHEET_NAMES.TAI_LIEU, true);
    return { success: true, data: docs };
  } catch (err) {
    return { success: false, message: 'Lỗi khi tải kho tài liệu: ' + err.toString() };
  }
}

/**
 * Thêm tài liệu mới vào kho (Admin)
 * @param {Object} docData { tenTaiLieu, phanLoai, linkDrive, moTa }
 */
function addDocument(docData) {
  try {
    if (!docData || !docData.tenTaiLieu || !docData.linkDrive) {
      return { success: false, message: 'Vui lòng nhập tên tài liệu và liên kết Drive!' };
    }

    const docId = 'DOC_' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss');
    const tenTaiLieu = String(docData.tenTaiLieu).trim();
    const phanLoai = String(docData.phanLoai || 'Slide').trim();
    const linkDrive = String(docData.linkDrive).trim();
    const moTa = String(docData.moTa || '').trim();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.TAI_LIEU);
      // Schema: DocID, TenTaiLieu, PhanLoai, LinkDrive, MoTa
      sheet.appendRow([docId, tenTaiLieu, phanLoai, linkDrive, moTa]);
      invalidateSheetCache(CONFIG.SHEET_NAMES.TAI_LIEU);
      return { success: true, message: `Đã thêm tài liệu "${tenTaiLieu}" vào kho!` };
    });

    return lockResult;

  } catch (err) {
    return { success: false, message: 'Lỗi khi thêm tài liệu: ' + err.toString() };
  }
}

/**
 * Cập nhật thông tin tài liệu học thuật (Admin)
 * @param {Object} docData { docId, tenTaiLieu, phanLoai, linkDrive, moTa }
 */
function updateDocument(docData) {
  try {
    if (!docData || !docData.docId) {
      return { success: false, message: 'Thiếu mã tài liệu cần cập nhật!' };
    }

    const docId = String(docData.docId).trim();
    const tenTaiLieu = String(docData.tenTaiLieu || '').trim();
    const phanLoai = String(docData.phanLoai || '').trim();
    const linkDrive = String(docData.linkDrive || '').trim();
    const moTa = String(docData.moTa || '').trim();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.TAI_LIEU);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim() === docId) {
          // Schema: DocID, TenTaiLieu, PhanLoai, LinkDrive, MoTa
          if (tenTaiLieu) sheet.getRange(i + 1, 2).setValue(tenTaiLieu);
          if (phanLoai) sheet.getRange(i + 1, 3).setValue(phanLoai);
          if (linkDrive) sheet.getRange(i + 1, 4).setValue(linkDrive);
          if (moTa !== undefined) sheet.getRange(i + 1, 5).setValue(moTa);

          invalidateSheetCache(CONFIG.SHEET_NAMES.TAI_LIEU);
          return { success: true, message: `Đã cập nhật tài liệu "${tenTaiLieu || docId}" thành công!` };
        }
      }
      return { success: false, message: 'Không tìm thấy tài liệu tương ứng!' };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi cập nhật tài liệu: ' + err.toString() };
  }
}

/**
 * Xóa tài liệu khỏi kho (Admin)
 * @param {string} docId
 */
function deleteDocument(docId) {
  try {
    if (!docId) {
      return { success: false, message: 'Thiếu mã tài liệu cần xóa!' };
    }

    const cleanId = String(docId).trim();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.TAI_LIEU);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim() === cleanId) {
          sheet.deleteRow(i + 1);
          invalidateSheetCache(CONFIG.SHEET_NAMES.TAI_LIEU);
          return { success: true, message: `Đã xóa tài liệu ${cleanId} thành công!` };
        }
      }
      return { success: false, message: 'Không tìm thấy tài liệu cần xóa!' };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi xóa tài liệu: ' + err.toString() };
  }
}
