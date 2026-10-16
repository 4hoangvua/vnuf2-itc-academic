// ====================================================================
// DỊCH VỤ XÁC THỰC TOKEN-BASED & OTP KHÔNG MẬT KHẨU (SERVICE AUTH)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================

/**
 * Xác thực Session Token từ CacheService hoặc ScriptProperties fallback
 * @param {string} token Chuỗi token UUID
 * @returns {Object|null} Thông tin người dùng { mssv, hoTen, email, role, trangThai, ... } hoặc null
 */
function validateTokenSession(token) {
  if (!token) return null;
  const cleanToken = String(token).trim();
  if (!cleanToken) return null;

  const tokenKey = CONFIG.AUTH.TOKEN_PREFIX + cleanToken;
  const cache = CacheService.getScriptCache();

  // 1. Kiểm tra nhanh trong CacheService
  const cachedJson = cache.get(tokenKey);
  if (cachedJson) {
    try {
      const session = JSON.parse(cachedJson);
      // Kiểm tra thời hạn 6 tiếng
      if (session && session.mssv && (Date.now() - (session.createdAt || 0) < CONFIG.AUTH.TOKEN_TTL_SECONDS * 1000)) {
        return session;
      }
    } catch (e) {
      console.warn('Lỗi phân tích JSON session trong cache:', e);
    }
  }

  // 2. Fallback sang PropertiesService nếu cache bị dọn
  try {
    const props = PropertiesService.getScriptProperties();
    const propJson = props.getProperty(tokenKey);
    if (propJson) {
      const session = JSON.parse(propJson);
      if (session && session.mssv && (Date.now() - (session.createdAt || 0) < CONFIG.AUTH.TOKEN_TTL_SECONDS * 1000)) {
        // Nạp lại vào CacheService để tăng tốc các request kế tiếp
        try {
          const remainingTtl = Math.max(60, Math.floor(CONFIG.AUTH.TOKEN_TTL_SECONDS - (Date.now() - session.createdAt) / 1000));
          cache.put(tokenKey, JSON.stringify(session), remainingTtl);
        } catch (reCacheErr) {}
        return session;
      } else {
        // Đã quá hạn -> xóa khỏi Properties
        props.deleteProperty(tokenKey);
      }
    }
  } catch (propErr) {
    console.warn('Lỗi kiểm tra fallback properties:', propErr);
  }

  return null;
}

/**
 * Kiểm tra trạng thái xác thực của người dùng thông qua Token hoặc MSSV cached
 * @param {string} token Session token gửi từ Client
 * @param {string} cachedMssv MSSV lưu tại localStorage (dùng để gợi ý trạng thái)
 */
function getAuthStatus(token, cachedMssv) {
  try {
    // 1. Kiểm tra bằng Token đã cấp
    if (token) {
      const session = validateTokenSession(token);
      if (session) {
        if (session.trangThai === 'Inactive') {
          return {
            status: 'BLOCKED',
            message: 'Tài khoản của bạn đang ở trạng thái Tạm khóa (Inactive). Vui lòng liên hệ Ban Chủ Nhiệm để kích hoạt lại!'
          };
        }
        return {
          status: 'AUTHENTICATED',
          user: {
            mssv: session.mssv,
            hoTen: session.hoTen,
            email: session.email,
            role: session.role,
            trangThai: session.trangThai,
            ngayThamGia: session.ngayThamGia
          }
        };
      }
    }

    // 2. Nếu không có token hợp lệ, kiểm tra xem MSSV có trong danh sách không để hướng dẫn đăng nhập
    if (cachedMssv) {
      const cleanCachedMssv = String(cachedMssv).trim().toUpperCase();
      const members = getSheetRowsAsObjects(CONFIG.SHEET_NAMES.THANH_VIEN, true);
      const member = members.find(m => {
        let mssvStr = String(m.MSSV || '').trim().toUpperCase();
        if (mssvStr.includes('E')) {
          const num = Number(mssvStr);
          if (!isNaN(num)) mssvStr = num.toLocaleString('fullwide', { useGrouping: false });
        }
        return mssvStr === cleanCachedMssv;
      });

      if (member) {
        if (String(member.TrangThai || '').trim().toLowerCase() === 'inactive') {
          return {
            status: 'BLOCKED',
            message: 'Tài khoản của bạn đang ở trạng thái Tạm khóa (Inactive)!'
          };
        }
        // MSSV hợp lệ nhưng chưa xác thực Token -> Yêu cầu nhập OTP
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

  } catch (err) {
    console.error('[Service_Auth] Lỗi getAuthStatus:', err);
    return {
      status: 'ERROR',
      message: 'Có lỗi xảy ra khi kiểm tra quyền truy cập: ' + err.toString()
    };
  }
}

/**
 * Gửi mã OTP xác thực 6 số về Gmail của thành viên
 * QUY TẮC AN TOÀN & CHỊU TẢI: MailApp.sendEmail() KHÔNG được nằm bên trong withScriptLock().
 * @param {string} rawMssv Mã số sinh viên
 * @param {string} rawEmail Email nếu là lần đầu liên kết
 */
function requestLoginOtp(rawMssv, rawEmail) {
  try {
    const cleanMssv = String(rawMssv || '').trim().toUpperCase();
    if (!cleanMssv) {
      return { success: false, message: 'Vui lòng nhập Mã số sinh viên (MSSV)!' };
    }

    const members = getSheetRowsAsObjects(CONFIG.SHEET_NAMES.THANH_VIEN, true);
    const member = members.find(m => {
      let mssvStr = String(m.MSSV || '').trim().toUpperCase();
      if (mssvStr.includes('E')) {
        const num = Number(mssvStr);
        if (!isNaN(num)) mssvStr = num.toLocaleString('fullwide', { useGrouping: false });
      }
      return mssvStr === cleanMssv;
    });

    if (!member) {
      return { success: false, message: `Mã sinh viên "${cleanMssv}" không nằm trong danh sách Ban Học Thuật!` };
    }

    if (String(member.TrangThai || '').toLowerCase() === 'inactive') {
      return { success: false, message: 'Tài khoản của bạn đang ở trạng thái Tạm khóa (Inactive). Vui lòng liên hệ Trưởng ban!' };
    }

    let targetEmail = String(member.Email || '').trim().toLowerCase();
    const inputEmail = String(rawEmail || '').trim().toLowerCase();

    // Nếu trong Sheet chưa có email (Lần đầu đăng nhập)
    if (!targetEmail) {
      if (!inputEmail) {
        return {
          success: false,
          needEmailInput: true,
          message: 'Chào mừng bạn đến với ban! Đây là lần đầu bạn đăng nhập, vui lòng nhập địa chỉ Gmail để nhận mã xác thực OTP.'
        };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputEmail)) {
        return { success: false, needEmailInput: true, message: 'Địa chỉ Gmail không đúng định dạng!' };
      }

      const isEmailTaken = members.some(m => String(m.Email || '').trim().toLowerCase() === inputEmail);
      if (isEmailTaken) {
        return { success: false, needEmailInput: true, message: `Email ${inputEmail} đã được một thành viên khác sử dụng!` };
      }

      targetEmail = inputEmail;
    }

    // Sinh mã OTP 6 số ngẫu nhiên
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Lưu OTP vào CacheService trong 5 phút (300 giây)
    const cache = CacheService.getScriptCache();
    cache.put(CONFIG.AUTH.OTP_PREFIX + cleanMssv, JSON.stringify({ otp: otp, email: targetEmail }), CONFIG.AUTH.OTP_TTL_SECONDS);

    // Gửi email bên ngoài mọi Lock để không làm nghẽn tiến trình của 30-50 người khác
    const emailSubject = `[Ban Học Thuật - CLB Tin Học] Mã OTP xác thực: ${otp}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0F6256; margin: 0;">Ban Học Thuật - CLB Tin Học VNUF2</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Cổng thông tin & Nộp bài trực tuyến</p>
        </div>
        <p style="font-size: 14px; color: #334155;">Xin chào <strong>${member.HoTen || cleanMssv}</strong>,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.5;">Hệ thống nhận được yêu cầu đăng nhập bằng MSSV <strong>${cleanMssv}</strong>. Dưới đây là mã xác thực OTP của bạn:</p>
        <div style="background-color: #f0fdfa; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; border: 1px dashed #0F6256;">
          <span style="font-size: 28px; font-weight: bold; color: #0F6256; letter-spacing: 6px; font-family: monospace;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center;">Mã xác thực có hiệu lực trong <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho người khác!</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
      </div>
    `;

    MailApp.sendEmail({
      to: targetEmail,
      subject: emailSubject,
      htmlBody: emailBody
    });

    const atIndex = targetEmail.indexOf('@');
    let maskedEmail = targetEmail;
    if (atIndex > 2) {
      maskedEmail = targetEmail.substring(0, 2) + '***' + targetEmail.substring(atIndex);
    }

    return {
      success: true,
      message: `Đã gửi mã OTP 6 số đến email ${maskedEmail}. Vui lòng kiểm tra hộp thư!`,
      emailMasked: maskedEmail,
      mssv: cleanMssv,
      needEmailInput: false
    };

  } catch (err) {
    console.error('[Service_Auth] Lỗi requestLoginOtp:', err);
    return { success: false, message: 'Lỗi khi gửi mã xác thực: ' + err.toString() };
  }
}

/**
 * Xác thực mã OTP, cấp phát sessionToken (UUID) và lưu vào CacheService/PropertiesService
 * @param {string} rawMssv Mã số sinh viên
 * @param {string} inputOtp Mã OTP 6 chữ số
 */
function verifyLoginOtp(rawMssv, inputOtp) {
  try {
    const cleanMssv = String(rawMssv || '').trim().toUpperCase();
    const cleanOtp = String(inputOtp || '').trim();

    if (!cleanMssv || !cleanOtp) {
      return { success: false, message: 'Vui lòng nhập đầy đủ MSSV và mã OTP!' };
    }

    const cache = CacheService.getScriptCache();
    const cachedDataStr = cache.get(CONFIG.AUTH.OTP_PREFIX + cleanMssv);

    if (!cachedDataStr) {
      return { success: false, message: 'Mã OTP đã hết hạn hoặc chưa được tạo. Vui lòng bấm gửi lại mã!' };
    }

    let cachedData;
    try {
      cachedData = JSON.parse(cachedDataStr);
    } catch (e) {
      return { success: false, message: 'Lỗi xác thực dữ liệu cache OTP!' };
    }

    if (String(cachedData.otp).trim() !== cleanOtp) {
      return { success: false, message: 'Mã OTP không chính xác. Vui lòng kiểm tra lại trong Gmail!' };
    }

    // Xóa OTP khỏi cache sau khi dùng thành công
    cache.remove(CONFIG.AUTH.OTP_PREFIX + cleanMssv);

    // 1. Tìm thông tin thành viên và liên kết email nếu là lần đầu (dùng micro-lock ngắn)
    let memberData = null;

    const lockResult = withScriptLock(() => {
      const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.THANH_VIEN);
      const data = sheet.getDataRange().getValues();

      let targetRowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        let rowMssv = String(data[i][0] || '').trim().toUpperCase();
        if (rowMssv.includes('E')) {
          const num = Number(rowMssv);
          if (!isNaN(num)) rowMssv = num.toLocaleString('fullwide', { useGrouping: false });
        }

        if (rowMssv === cleanMssv) {
          targetRowIndex = i + 1;
          memberData = {
            mssv: data[i][0],
            hoTen: data[i][1],
            email: data[i][2],
            role: data[i][3],
            trangThai: data[i][4],
            ngayThamGia: data[i][5]
          };
          break;
        }
      }

      if (targetRowIndex === -1 || !memberData) {
        return { success: false, message: 'Không tìm thấy dữ liệu sinh viên trong bảng!' };
      }

      // Cập nhật email vào Cột C nếu trước đó trống
      if (!memberData.email && cachedData.email) {
        sheet.getRange(targetRowIndex, 3).setValue(cachedData.email);
        memberData.email = cachedData.email;
        invalidateSheetCache(CONFIG.SHEET_NAMES.THANH_VIEN);
      }

      return { success: true };
    });

    if (!lockResult || !lockResult.success) {
      return lockResult || { success: false, message: 'Không thể cập nhật thông tin thành viên!' };
    }

    // 2. Định dạng thông tin người dùng
    let ngayThamGiaClean = '';
    if (memberData.ngayThamGia instanceof Date) {
      ngayThamGiaClean = Utilities.formatDate(memberData.ngayThamGia, Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
    } else {
      ngayThamGiaClean = String(memberData.ngayThamGia || '');
    }

    let finalMssv = cleanMssv;
    if (memberData.mssv) {
      const rawMssvStr = String(memberData.mssv).trim();
      if (rawMssvStr.toUpperCase().includes('E')) {
        const num = Number(rawMssvStr);
        if (!isNaN(num)) finalMssv = num.toLocaleString('fullwide', { useGrouping: false });
      } else {
        finalMssv = rawMssvStr;
      }
    }

    // 3. SINH SESSION TOKEN (UUID) VÀ LƯU VÀO CACHESERVICE + PROPERTIES
    const sessionToken = Utilities.getUuid();
    const sessionData = {
      token: sessionToken,
      mssv: finalMssv,
      hoTen: String(memberData.hoTen || ''),
      email: String(memberData.email || cachedData.email || ''),
      role: String(memberData.role || 'MEMBER').toUpperCase(),
      trangThai: String(memberData.trangThai || 'Active'),
      ngayThamGia: ngayThamGiaClean,
      createdAt: Date.now()
    };

    const tokenKey = CONFIG.AUTH.TOKEN_PREFIX + sessionToken;

    // Lưu vào CacheService (6 tiếng)
    try {
      cache.put(tokenKey, JSON.stringify(sessionData), CONFIG.AUTH.TOKEN_TTL_SECONDS);
    } catch (cErr) {
      console.warn('Lỗi lưu session vào cache:', cErr);
    }

    // Lưu vào PropertiesService dự phòng
    try {
      const props = PropertiesService.getScriptProperties();
      props.setProperty(tokenKey, JSON.stringify(sessionData));
    } catch (pErr) {
      console.warn('Lỗi lưu session vào properties:', pErr);
    }

    return {
      success: true,
      message: 'Xác thực OTP thành công!',
      token: sessionToken,
      user: {
        mssv: sessionData.mssv,
        hoTen: sessionData.hoTen,
        email: sessionData.email,
        role: sessionData.role,
        trangThai: sessionData.trangThai,
        ngayThamGia: sessionData.ngayThamGia
      }
    };

  } catch (err) {
    console.error('[Service_Auth] Lỗi verifyLoginOtp:', err);
    return { success: false, message: 'Lỗi khi xác thực OTP: ' + err.toString() };
  }
}

/**
 * Đăng xuất người dùng: Thu hồi token trong CacheService và PropertiesService
 * @param {string} token Session token cần hủy
 */
function logoutUser(token) {
  if (!token) return { success: true, message: 'Đã đăng xuất!' };
  try {
    const tokenKey = CONFIG.AUTH.TOKEN_PREFIX + String(token).trim();
    CacheService.getScriptCache().remove(tokenKey);
    try {
      PropertiesService.getScriptProperties().deleteProperty(tokenKey);
    } catch (e) {}
    return { success: true, message: 'Đăng xuất thành công, phiên làm việc đã bị hủy!' };
  } catch (err) {
    return { success: true, message: 'Đã hoàn tất đăng xuất.' };
  }
}
