// ====================================================================
// BỘ ĐỊNH TUYẾN TẬP TRUNG & MIDDLEWARE BẢO MẬT (API ROUTER & MIDDLEWARE)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================

/**
 * Xử lý yêu cầu HTTP GET
 * Sử dụng để ping kiểm tra kết nối máy chủ
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'ping';

    if (action === 'ping') {
      return createJsonResponse({
        success: true,
        message: 'Google Apps Script API CLB Tin Học đang hoạt động bình thường!',
        serverTime: formatCurrentDateTime(),
        timestamp: new Date().toISOString()
      });
    }

    // Các action GET khác đều chuyển qua Router chính
    const result = handleActionRoute(action, null, params);
    return createJsonResponse(result);

  } catch (err) {
    console.error('[Router] Lỗi trong doGet:', err);
    return createJsonResponse({
      success: false,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi máy chủ nội bộ (doGet): ' + (err.message || err.toString()),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Xử lý yêu cầu HTTP POST
 * Nhận request JSON từ frontend: { action, token, payload }
 * với Content-Type: text/plain;charset=utf-8 để vượt rào CORS preflight của trình duyệt.
 */
function doPost(e) {
  try {
    let requestData = {};

    // 1. Phân tích nội dung JSON Body gửi lên
    if (e && e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        console.warn('[Router] Không thể parse body dưới dạng JSON:', parseErr);
        return createJsonResponse({
          success: false,
          errorCode: 'INVALID_JSON',
          message: 'Dữ liệu yêu cầu không đúng định dạng JSON hợp lệ!'
        });
      }
    }

    const action = requestData.action || (e && e.parameter ? e.parameter.action : null);
    const token = requestData.token || (requestData.payload ? requestData.payload.token : null);
    const payload = (requestData.payload !== undefined) ? requestData.payload : {};

    if (!action) {
      return createJsonResponse({
        success: false,
        errorCode: 'MISSING_ACTION',
        message: 'Thiếu tham số bắt buộc "action" trong yêu cầu API!'
      });
    }

    // 2. Chuyển qua tầng Router & Middleware xử lý
    const result = handleActionRoute(action, token, payload);
    return createJsonResponse(result);

  } catch (err) {
    console.error('[Router] Lỗi hệ thống trong doPost:', err);
    return createJsonResponse({
      success: false,
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Lỗi máy chủ nội bộ (doPost): ' + (err.message || err.toString()),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * TẦNG ĐIỀU PHỐI & MIDDLEWARE XÁC THỰC - PHÂN QUYỀN
 * @param {string} action Tên hành động nghiệp vụ
 * @param {string|null} token Mã session token của người dùng
 * @param {any} payload Dữ liệu tham số của request
 * @returns {Object} Đối tượng kết quả nghiệp vụ
 */
function handleActionRoute(action, token, payload) {
  const data = (typeof payload === 'object' && payload !== null) ? payload : { raw: payload };

  // ==================================================================
  // NHÓM 1: CÁC HÀNH ĐỘNG CÔNG KHAI (PUBLIC ACTIONS - KHÔNG CẦN TOKEN)
  // ==================================================================
  if (CONFIG.PUBLIC_ACTIONS.includes(action)) {
    switch (action) {
      case 'ping':
        return {
          success: true,
          message: 'Google Apps Script API Ban Học Thuật sẵn sàng!',
          serverTime: formatCurrentDateTime(),
          timestamp: new Date().toISOString()
        };

      case 'getAuthStatus':
        return getAuthStatus(token, data.cachedMssv || data.mssv);

      case 'requestLoginOtp':
        return requestLoginOtp(data.mssv, data.email);

      case 'verifyLoginOtp':
        return verifyLoginOtp(data.mssv, data.otp);

      default:
        break;
    }
  }

  // ==================================================================
  // MIDDLEWARE KIỂM TRA XÁC THỰC TOKEN (AUTHENTICATION GUARD)
  // ==================================================================
  const currentUser = validateTokenSession(token);
  if (!currentUser) {
    return {
      success: false,
      errorCode: 'UNAUTHORIZED',
      message: 'Phiên làm việc của bạn đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!'
    };
  }

  // Kiểm tra tài khoản có bị tạm khóa không
  if (currentUser.trangThai === 'Inactive') {
    return {
      success: false,
      errorCode: 'ACCOUNT_INACTIVE',
      message: 'Tài khoản của bạn đang ở trạng thái Tạm khóa (Inactive). Vui lòng liên hệ Trưởng ban!'
    };
  }

  // ==================================================================
  // NHÓM 2: CÁC HÀNH ĐỘNG DÀNH CHO ADMIN (ADMIN ACTIONS - YÊU CẦU ROLE ADMIN)
  // ==================================================================
  if (CONFIG.ADMIN_ACTIONS.includes(action)) {
    if (currentUser.role !== CONFIG.ROLES.ADMIN) {
      return {
        success: false,
        errorCode: 'FORBIDDEN',
        message: 'Bạn không có quyền thực hiện chức năng quản trị này (403 Forbidden)!'
      };
    }

    switch (action) {
      // Quản lý Nhân sự
      case 'getAllMembers':
        return getAllMembers();

      case 'addMember':
        return addMember(data);

      case 'resetMemberEmail':
        return resetMemberEmail(data.mssv);

      case 'toggleMemberStatus':
        return toggleMemberStatus(data.mssv, data.newStatus || data.status);

      // Quản lý Buổi sinh hoạt & Điểm danh
      case 'createAttendanceSession':
        return createAttendanceSession(data);

      case 'updateAttendanceSession':
      case 'updateAttendanceTopic':
        return updateAttendanceSession(data);

      case 'deleteAttendanceSession':
        return deleteAttendanceSession(data.sessionId || data.id);

      case 'toggleAttendanceSession':
        return toggleAttendanceSession(data.sessionId, data.targetStatus || data.status);

      // Quản lý Nhiệm vụ & Google Drive
      case 'createTask':
        return createTask(data);

      case 'updateTask':
        return updateTask(data);

      case 'deleteTask':
        return deleteTask(data.taskId || data.id);

      case 'toggleTaskStatus':
        return toggleTaskStatus(data.taskId, data.targetStatus || data.status);

      // Duyệt bài nộp & Tài liệu
      case 'getAllSubmissions':
        return getAllSubmissions();

      case 'reviewSubmission':
        return reviewSubmission(data);

      case 'addDocument':
        return addDocument(data);

      case 'updateDocument':
        return updateDocument(data);

      case 'deleteDocument':
        return deleteDocument(data.docId || data.id);

      default:
        break;
    }
  }

  // ==================================================================
  // NHÓM 3: CÁC HÀNH ĐỘNG DÀNH CHO THÀNH VIÊN (MEMBER ACTIONS)
  // NGUYÊN TẮC BẢO MẬT CỐT LÕI: Luôn sử dụng currentUser.mssv từ Token,
  // tuyệt đối KHÔNG tin tưởng mssv gửi lên từ client!
  // ==================================================================
  if (CONFIG.MEMBER_ACTIONS.includes(action)) {
    switch (action) {
      case 'checkInAttendance':
        // currentUser.mssv được truyền trực tiếp vào hàm nghiệp vụ
        return checkInAttendance(data.pinCode || data.pin, currentUser.mssv);

      case 'submitTaskAssignment':
        // Gắn thông tin chính chủ từ token vào payload nộp bài
        data.mssv = currentUser.mssv;
        data.hoTen = currentUser.hoTen;
        data.email = currentUser.email;
        return submitTaskAssignment(data, currentUser);

      case 'getMemberSubmissions':
        return getMemberSubmissions(currentUser.mssv);

      case 'logoutUser':
        return logoutUser(token);

      default:
        break;
    }
  }

  // ==================================================================
  // NHÓM 4: CÁC HÀNH ĐỘNG TRUY VẤN CHUNG (QUERY ACTIONS - ĐÃ ĐĂNG NHẬP)
  // ==================================================================
  if (CONFIG.QUERY_ACTIONS.includes(action)) {
    switch (action) {
      case 'getAttendanceSessions':
        return getAttendanceSessions();

      case 'getAllTasks':
        return getAllTasks();

      case 'getAllDocuments':
        return getAllDocuments();

      default:
        break;
    }
  }

  // Mặc định: Hành động không tồn tại
  return {
    success: false,
    errorCode: 'ACTION_NOT_FOUND',
    message: `Hành động "${action}" không tồn tại hoặc chưa được định nghĩa trong API Router!`
  };
}

/**
 * Trả về phản hồi JSON chuẩn hóa qua ContentService
 * @param {Object} data Dữ liệu JSON cần trả về
 */
function createJsonResponse(data) {
  const outputString = JSON.stringify(data);
  return ContentService.createTextOutput(outputString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Hàm kích hoạt cấp quyền bổ sung (Mail, Drive, Sheets)
 * Dành cho bước khởi tạo Web App lần đầu
 */
function authorizeApp() {
  const quota = MailApp.getRemainingDailyQuota();
  console.log('Ủy quyền hệ thống thành công! Hạn ngạch email còn lại:', quota);
}
