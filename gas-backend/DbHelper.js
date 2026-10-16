// ====================================================================
// MODULE TRUY XUẤT DỮ LIỆU & BẢO VỆ ĐỒNG THỜI (DATABASE & LOCK HELPER)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================

/**
 * Lấy đối tượng Spreadsheet chính của hệ thống
 */
function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SHEET_ID);
}

/**
 * Lấy hoặc tạo Sheet theo tên và đảm bảo có dòng tiêu đề chuẩn ở Dòng 1.
 * Đảm bảo cấu trúc cột luôn đồng nhất, tự động chèn header nếu thiếu.
 * @param {string} sheetName Tên sheet cần mở hoặc tạo
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const expectedHeaders = CONFIG.SCHEMA_HEADERS[sheetName];
  if (expectedHeaders && expectedHeaders.length > 0) {
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      sheet.appendRow(expectedHeaders);
    } else {
      const cellA1 = String(sheet.getRange(1, 1).getValue() || '').trim().toLowerCase();
      const expectedFirst = expectedHeaders[0].toLowerCase();
      if (cellA1 !== expectedFirst) {
        // Dòng 1 chứa dữ liệu thay vì tiêu đề -> chèn dòng tiêu đề lên đầu
        sheet.insertRowBefore(1);
        sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      } else {
        // Kiểm tra mở rộng thêm cột nếu schema đã cập nhật
        const lastCol = sheet.getLastColumn();
        if (lastCol < expectedHeaders.length) {
          sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
        }
      }
    }
  }

  return sheet;
}

/**
 * Alias đảm bảo header của sheet
 */
function ensureSheetHeaders(sheetName) {
  return getOrCreateSheet(sheetName);
}

/**
 * Đọc toàn bộ dữ liệu Sheet theo lô (Batch I/O: 1 lần đọc duy nhất qua getDataRange().getValues()).
 * Chuyển đổi ma trận 2 chiều thành mảng các Object dựa trên hàng tiêu đề.
 * Hỗ trợ bộ nhớ đệm CacheService phía Server để giảm tải tối đa cho Google Sheets.
 * 
 * @param {string} sheetName Tên tab trong Sheet
 * @param {boolean} useCache Có dùng cache server không
 * @param {number} cacheTtlSeconds Thời gian lưu cache (giây)
 * @returns {Array<Object>} Mảng các đối tượng dữ liệu
 */
function getSheetRowsAsObjects(sheetName, useCache = false, cacheTtlSeconds = CONFIG.CACHE.SHEET_DATA_TTL) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'DB_CACHE_' + sheetName;

  if (useCache) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        console.warn('Lỗi đọc cache server cho sheet:', sheetName, e);
      }
    }
  }

  const sheet = ensureSheetHeaders(sheetName);
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  const headers = data[0].map(h => String(h || '').trim());
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Bỏ qua dòng rỗng hoàn toàn
    const isRowEmpty = row.every(cell => cell === '' || cell === null || cell === undefined);
    if (isRowEmpty) continue;

    const rowObj = { _rowIndex: i + 1 }; // 1-indexed trong Google Sheets
    headers.forEach((header, colIdx) => {
      if (!header) return;
      let val = row[colIdx];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
      } else if (val === null || val === undefined) {
        val = '';
      }
      rowObj[header] = val;
    });
    rows.push(rowObj);
  }

  // Lưu vào Cache nếu được bật và kích thước dữ liệu hợp lệ (< 95KB per chunk của CacheService)
  if (useCache && rows.length > 0) {
    try {
      const jsonString = JSON.stringify(rows);
      if (jsonString.length < 95000) {
        cache.put(cacheKey, jsonString, cacheTtlSeconds);
      }
    } catch (e) {
      console.warn('Không thể lưu cache cho sheet:', sheetName, e);
    }
  }

  return rows;
}

/**
 * Xóa cache của một Sheet khi có thao tác thêm/sửa/xóa dữ liệu (Mutation)
 * @param {string} sheetName Tên sheet cần xóa cache
 */
function invalidateSheetCache(sheetName) {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove('DB_CACHE_' + sheetName);
  } catch (e) {
    console.warn('Lỗi khi xóa cache của sheet:', sheetName, e);
  }
}

/**
 * Bọc các thao tác ghi dữ liệu bằng Script Lock để chống race condition.
 * Nếu không lấy được khóa sau timeoutMs, trả về mã lỗi LOCK_TIMEOUT chuẩn hóa để Frontend tự động Retry.
 * 
 * QUY TẮC SỐNG CÒN: Chỉ đặt các thao tác ghi Sheet bên trong callback,
 * KHÔNG ĐƯỢC đặt DriveApp.createFile() hoặc GmailApp.sendEmail() bên trong hàm này!
 * 
 * @param {Function} callback Hàm thực hiện thao tác ghi
 * @param {number} timeoutMs Thời gian tối đa chờ khóa (mili-giây)
 * @returns {any} Kết quả từ callback hoặc đối tượng lỗi LOCK_TIMEOUT
 */
function withScriptLock(callback, timeoutMs = CONFIG.LOCK_TIMEOUT_MS) {
  const lock = LockService.getScriptLock();
  let acquired = false;

  try {
    acquired = lock.tryLock(timeoutMs);
    if (!acquired) {
      console.warn(`[LockService] Không thể lấy khóa sau ${timeoutMs}ms.`);
      return {
        success: false,
        errorCode: 'LOCK_TIMEOUT',
        message: 'Hệ thống đang bận xử lý nhiều yêu cầu đồng thời, vui lòng thử lại sau vài giây!'
      };
    }

    const result = callback();
    SpreadsheetApp.flush();
    return result;

  } catch (error) {
    console.error('[LockService] Lỗi khi thực thi thao tác có khóa:', error);
    return {
      success: false,
      errorCode: 'LOCK_EXECUTION_ERROR',
      message: 'Lỗi ghi nhận dữ liệu: ' + (error.message || error.toString())
    };
  } finally {
    if (acquired) {
      try {
        lock.releaseLock();
      } catch (releaseErr) {
        console.warn('[LockService] Lỗi nhả khóa:', releaseErr);
      }
    }
  }
}

/**
 * Lấy thông tin phiên điểm danh đang mở ('Open') từ CacheService hoặc Sheet
 * Giúp Member xác thực mã PIN tức thì mà không cần quét toàn bộ Sheet mỗi lần 30-50 người cùng điểm danh.
 * @returns {Object|null} Thông tin phiên điểm danh { sessionId, tenBuoiHop, maPin, rowIndex }
 */
function getOpenSessionFromCacheOrSheet() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.CACHE.OPEN_SESSION_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  // Quét Sheet DiemDanh
  const sheet = ensureSheetHeaders(CONFIG.SHEET_NAMES.DIEM_DANH);
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return null;

  for (let i = 1; i < data.length; i++) {
    const status = String(data[i][3] || '').trim().toLowerCase();
    if (status === 'open') {
      const sessionObj = {
        sessionId: String(data[i][0] || '').trim(),
        tenBuoiHop: String(data[i][1] || '').trim(),
        maPin: String(data[i][2] || '').trim(),
        rowIndex: i + 1
      };
      // Lưu cache 1 giờ (sẽ bị xóa khi admin đóng/đổi phiên)
      try {
        cache.put(CONFIG.CACHE.OPEN_SESSION_KEY, JSON.stringify(sessionObj), CONFIG.CACHE.OPEN_SESSION_TTL);
      } catch (e) {}
      return sessionObj;
    }
  }

  return null;
}

/**
 * Vô hiệu hóa cache phiên điểm danh đang mở khi Admin tạo, đổi PIN hoặc đóng phiên
 */
function invalidateOpenSessionCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(CONFIG.CACHE.OPEN_SESSION_KEY);
    invalidateSheetCache(CONFIG.SHEET_NAMES.DIEM_DANH);
  } catch (e) {}
}
