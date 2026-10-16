// ====================================================================
// QUẢN LÝ NHIỆM VỤ & TỰ ĐỘNG TẠO THƯ MỤC GOOGLE DRIVE (SERVICE TASK)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================

/**
 * Lấy danh sách toàn bộ nhiệm vụ (Task)
 */
function getAllTasks() {
  try {
    const tasks = getSheetRowsAsObjects(CONFIG.SHEET_NAMES.NHIEM_VU, true);
    // Chuẩn hóa SessionID nếu chưa có
    tasks.forEach(t => {
      t.SessionID = String(t.SessionID || 'GENERAL').trim();
    });
    return { success: true, data: tasks };
  } catch (err) {
    return { success: false, message: 'Lỗi tải danh sách nhiệm vụ: ' + err.toString() };
  }
}

/**
 * Tạo một nhiệm vụ mới kèm thư mục lưu bài trên Google Drive (Admin)
 * @param {Object} taskData { tieuDe, moTa, nguoiNhan, deadline, sessionId }
 */
function createTask(taskData) {
  try {
    if (!taskData || !taskData.tieuDe || !taskData.deadline) {
      return { success: false, message: 'Vui lòng cung cấp đầy đủ Tiêu đề và Hạn chót (Deadline)!' };
    }

    const tieuDe = String(taskData.tieuDe).trim();
    const moTa = String(taskData.moTa || '').trim();
    const nguoiNhan = String(taskData.nguoiNhan || 'ALL').trim();
    const deadline = String(taskData.deadline).trim(); // Định dạng ISO YYYY-MM-DDTHH:mm
    const sessionId = String(taskData.sessionId || 'GENERAL').trim();

    const taskId = 'TASK_' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd_HHmmss');

    // 1. Tự động tạo thư mục trên Google Drive NGOÀI KHÓA LOCK
    let folderId = '';
    try {
      const rootFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
      const safeTitle = removeVietnameseTones(tieuDe);
      const taskFolder = rootFolder.createFolder(`[${taskId}]_${safeTitle}`);
      folderId = taskFolder.getId();
    } catch (driveErr) {
      console.error('[Service_Task] Lỗi khi tạo Folder trên Drive:', driveErr);
      return {
        success: false,
        message: 'Lỗi khi tạo thư mục trên Google Drive: ' + driveErr.toString() + '. Vui lòng kiểm tra quyền truy cập ROOT_FOLDER_ID!'
      };
    }

    // 2. Lưu thông tin vào Sheet NhiemVu
    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.NHIEM_VU);
      // Schema: TaskID, TieuDe, MoTa, NguoiNhan, Deadline, FolderID, TrangThai, SessionID
      sheet.appendRow([taskId, tieuDe, moTa, nguoiNhan, deadline, folderId, 'Open', sessionId]);
      invalidateSheetCache(CONFIG.SHEET_NAMES.NHIEM_VU);

      return {
        success: true,
        message: `Đã tạo nhiệm vụ "${tieuDe}" thành công!`,
        taskId: taskId,
        folderId: folderId
      };
    });

    return lockResult;

  } catch (err) {
    return { success: false, message: 'Lỗi khi tạo nhiệm vụ: ' + err.toString() };
  }
}

/**
 * Đóng hoặc mở lại nhiệm vụ (Admin)
 */
function toggleTaskStatus(taskId, targetStatus) {
  try {
    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.NHIEM_VU);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim() === String(taskId).trim()) {
          sheet.getRange(i + 1, 7).setValue(targetStatus); // Cột TrangThai (Cột 7)
          invalidateSheetCache(CONFIG.SHEET_NAMES.NHIEM_VU);
          return { success: true, message: `Nhiệm vụ đã chuyển sang trạng thái: ${targetStatus}` };
        }
      }
      return { success: false, message: 'Không tìm thấy nhiệm vụ tương ứng!' };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi cập nhật trạng thái nhiệm vụ: ' + err.toString() };
  }
}

/**
 * Cập nhật thông tin nhiệm vụ (Admin)
 * @param {Object} taskData { taskId, tieuDe, moTa, nguoiNhan, deadline, sessionId, trangThai }
 */
function updateTask(taskData) {
  try {
    if (!taskData || !taskData.taskId) {
      return { success: false, message: 'Thiếu mã nhiệm vụ cần cập nhật!' };
    }

    const taskId = String(taskData.taskId).trim();
    const tieuDe = String(taskData.tieuDe || '').trim();
    const moTa = String(taskData.moTa || '').trim();
    const nguoiNhan = String(taskData.nguoiNhan || '').trim();
    const deadline = String(taskData.deadline || '').trim();
    const sessionId = String(taskData.sessionId || '').trim();
    const trangThai = String(taskData.trangThai || '').trim();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.NHIEM_VU);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim() === taskId) {
          // Schema: TaskID, TieuDe, MoTa, NguoiNhan, Deadline, FolderID, TrangThai, SessionID
          if (tieuDe) sheet.getRange(i + 1, 2).setValue(tieuDe);
          if (moTa !== undefined) sheet.getRange(i + 1, 3).setValue(moTa);
          if (nguoiNhan) sheet.getRange(i + 1, 4).setValue(nguoiNhan);
          if (deadline) sheet.getRange(i + 1, 5).setValue(deadline);
          if (trangThai) sheet.getRange(i + 1, 7).setValue(trangThai);
          if (sessionId) sheet.getRange(i + 1, 8).setValue(sessionId);

          invalidateSheetCache(CONFIG.SHEET_NAMES.NHIEM_VU);
          return { success: true, message: `Đã cập nhật bài tập "${tieuDe || taskId}" thành công!` };
        }
      }
      return { success: false, message: 'Không tìm thấy bài tập tương ứng!' };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi cập nhật bài tập: ' + err.toString() };
  }
}

/**
 * Xóa nhiệm vụ (Admin)
 * @param {string} taskId
 */
function deleteTask(taskId) {
  try {
    if (!taskId) {
      return { success: false, message: 'Thiếu mã nhiệm vụ cần xóa!' };
    }

    const cleanId = String(taskId).trim();

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.NHIEM_VU);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim() === cleanId) {
          sheet.deleteRow(i + 1);
          invalidateSheetCache(CONFIG.SHEET_NAMES.NHIEM_VU);
          return { success: true, message: `Đã xóa bài tập ${cleanId} thành công!` };
        }
      }
      return { success: false, message: 'Không tìm thấy bài tập cần xóa!' };
    });

    return lockResult;
  } catch (err) {
    return { success: false, message: 'Lỗi khi xóa bài tập: ' + err.toString() };
  }
}
