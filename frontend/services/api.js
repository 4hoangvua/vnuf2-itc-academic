// ====================================================================
// LỚP DỊCH VỤ GIAO TIẾP API TẬP TRUNG (FRONTEND API SERVICE)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================
// 1. Chống lỗi CORS triệt để trên Google Apps Script (Content-Type: text/plain;charset=utf-8).
// 2. Tự động đính kèm session token vào mọi request body: { action, token, payload }.
// 3. Cơ chế Auto-Retry với Exponential Backoff + Jitter khi gặp LOCK_TIMEOUT hoặc nghẽn mạng.
// 4. Request Deduplication chống spam click & gọi trùng lặp (in-flight request pooling).
// 5. Cache Stale-While-Revalidate (0.1s tải trang) + Cache Invalidation tức thì.
// 6. Đồng bộ đa tab (Cross-tab Realtime Sync) qua StorageEvent và CustomEvent.
// ====================================================================

import { handleMockAction } from './mockData.js';

/**
 * @typedef {import('../types.js').ApiResponse} ApiResponse
 * @typedef {import('../types.js').UserSession} UserSession
 */

export const API_CONFIG = {
  // Điền URL Web App Google Apps Script (/exec)
  DEFAULT_GAS_URL: 'https://script.google.com/macros/s/AKfycby0HwfnxfbqyfhmuIPKQpxK9pYCxc8DgvAtGWMNq62AbkOdYnhEIAczpmYj-mi3M2Ehqg/exec',

  // Tự động kích hoạt Mock Mode trên localhost/file:// khi chưa cấu hình URL
  AUTO_MOCK_ON_LOCALHOST: true,

  // Thời gian sống tối đa của Cache Stale-While-Revalidate (10 phút)
  CACHE_TTL_MS: 10 * 60 * 1000,

  // Thời gian dữ liệu được xem là tươi mới (không kích hoạt revalidate ngầm lên GAS)
  STALE_TIME_MS: 90 * 1000, // 90 giây

  // Số lần thử lại tối đa khi gặp sự cố mạng hoặc LOCK_TIMEOUT
  MAX_RETRIES: 4,

  // Thời gian chờ gốc (Base Delay) cho Exponential Backoff (mili-giây)
  BASE_RETRY_DELAY_MS: 600,

  // Danh sách các Action được áp dụng Cache tức thì (Read-heavy Queries)
  CACHEABLE_ACTIONS: [
    'getAllTasks',
    'getAllMembers',
    'getAttendanceSessions',
    'getAllDocuments',
    'getAllSubmissions',
    'getMemberSubmissions',
    'getQuizBySession',
    'getMemberQuizProfile',
    'getPersonalQuizPool',
    'getAppInitData',
    'getAllCampaigns'
  ]
};

/**
 * Bản đồ liên kết các thao tác ghi dữ liệu (Mutation) và các khóa Cache cần xóa ngay lập tức
 */
export const MUTATION_INVALIDATION_MAP = {
  createAttendanceSession: ['getAttendanceSessions'],
  updateAttendanceSession: ['getAttendanceSessions'],
  deleteAttendanceSession: ['getAttendanceSessions', 'getAllTasks'],
  updateAttendanceTopic: ['getAttendanceSessions'],
  toggleAttendanceSession: ['getAttendanceSessions'],
  checkInAttendance: ['getAttendanceSessions'],
  createTask: ['getAllTasks', 'getAttendanceSessions'],
  updateTask: ['getAllTasks', 'getAttendanceSessions'],
  deleteTask: ['getAllTasks', 'getAttendanceSessions'],
  toggleTaskStatus: ['getAllTasks', 'getAttendanceSessions'],
  submitTaskAssignment: ['getAllSubmissions', 'getMemberSubmissions', 'getAllTasks'],
  reviewSubmission: ['getAllSubmissions', 'getMemberSubmissions'],
  addMember: ['getAllMembers'],
  toggleMemberStatus: ['getAllMembers'],
  resetMemberEmail: ['getAllMembers'],
  addDocument: ['getAllDocuments'],
  createDocument: ['getAllDocuments'],
  updateDocument: ['getAllDocuments'],
  deleteDocument: ['getAllDocuments'],
  saveQuiz: ['getQuizBySession'],
  toggleQuizStatus: ['getQuizBySession'],
  submitQuiz: ['getQuizBySession', 'getMemberQuizProfile'],
  deleteQuiz: ['getQuizBySession'],
  resetQuizSubmission: ['getQuizBySession', 'getQuizResultsBySession'],
  resetAllQuizSubmissions: ['getQuizBySession', 'getQuizResultsBySession'],
  recordQuizAnswer: ['getMemberQuizProfile', 'getPersonalQuizPool'],
  toggleQuestionBookmark: ['getMemberQuizProfile', 'getPersonalQuizPool'],
  clearWrongHistory: ['getMemberQuizProfile', 'getPersonalQuizPool'],
  saveMemberGift: ['getAllMembers'],
  applyQuizBonusVoucher: ['getQuizBySession', 'getMemberQuizProfile', 'getQuizResultsBySession'],
  setActiveCampaign: ['getActiveCampaign', 'getAllCampaigns'],
  saveCampaignConfig: ['getActiveCampaign', 'getAllCampaigns'],
  sendEventBulkEmail: ['getActiveCampaign', 'getAllCampaigns'],
  redeemPrivilegeVoucher: ['getQuizBySession', 'getMemberQuizProfile', 'getQuizResultsBySession', 'getAllSubmissions', 'getMemberSubmissions', 'getActiveCampaign']
};

// Bể lưu trữ các request đang chạy để Deduplicate (Chống gọi trùng lặp khi Double-click)
const inFlightRequests = new Map();

// Bộ bọc an toàn tránh lỗi DOMException trong Incognito hoặc môi trường chặn storage
const memoryStore = new Map();
const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        const val = localStorage.getItem(key);
        if (val !== null && val !== undefined) return val;
      }
    } catch (e) {}
    return memoryStore.get(key) || null;
  },
  setItem: (key, val) => {
    memoryStore.set(key, String(val));
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(key, String(val));
      }
    } catch (e) {}
  },
  removeItem: (key) => {
    memoryStore.delete(key);
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
        localStorage.removeItem(key);
      }
    } catch (e) {}
  }
};

/**
 * Lấy Token xác thực hiện tại từ localStorage
 */
export function getToken() {
  return safeStorage.getItem('bht_token') || '';
}

/**
 * Lưu Token xác thực vào localStorage
 */
export function setToken(token) {
  if (token) {
    safeStorage.setItem('bht_token', String(token).trim());
  } else {
    safeStorage.removeItem('bht_token');
  }
}

/**
 * Xóa Token xác thực (khi đăng xuất hoặc token hết hạn)
 */
export function clearToken() {
  safeStorage.removeItem('bht_token');
}

/**
 * Lấy URL Google Apps Script Web App
 */
export function getApiUrl() {
  const custom = safeStorage.getItem('bht_gas_api_url');
  // Nếu url cũ lưu trong localStorage là url bị lỗi trước đây, tự động dọn dẹp để nhận DEFAULT_GAS_URL mới
  if (custom && custom.includes('AKfycbwdMssefZxnsEr8cTZYXX0Id-CIOPy-5Tv6ggJu2h7PRPC2SAdsCHPvxqKHcGjdGmujTg')) {
    safeStorage.removeItem('bht_gas_api_url');
    return API_CONFIG.DEFAULT_GAS_URL;
  }
  return custom || API_CONFIG.DEFAULT_GAS_URL || '';
}

/**
 * Cập nhật URL Google Apps Script
 */
export function setApiUrl(url) {
  const cleanUrl = String(url || '').trim();
  if (cleanUrl) {
    safeStorage.setItem('bht_gas_api_url', cleanUrl);
    console.log('[API] Đã cập nhật GAS API URL:', cleanUrl);
  } else {
    safeStorage.removeItem('bht_gas_api_url');
    console.log('[API] Đã xóa GAS API URL, hệ thống sẽ ưu tiên Mock Mode.');
  }
}

/**
 * Kiểm tra xem hệ thống có đang chạy ở chế độ Mock Data hay không
 */
export function isMockMode() {
  const currentUrl = getApiUrl();

  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:' ||
    new URLSearchParams(window.location.search).has('dev')
  );

  // Trên Production / GitHub Pages: Bắt buộc dùng API thật (trừ khi chưa cấu hình URL)
  if (!isLocal) {
    if (!currentUrl) return true;
    return false;
  }

  // Trên Localhost / Dev:
  const manualMock = safeStorage.getItem('bht_force_mock');
  if (manualMock === 'true') return true;
  if (manualMock === 'false') return false;

  if (!currentUrl) return true;

  return API_CONFIG.AUTO_MOCK_ON_LOCALHOST && !manualMock;
}

/**
 * Bật / Tắt cưỡng bức chế độ Mock Data
 */
export function toggleMockMode(forceBool) {
  if (typeof forceBool === 'boolean') {
    safeStorage.setItem('bht_force_mock', String(forceBool));
  } else {
    const current = isMockMode();
    safeStorage.setItem('bht_force_mock', String(!current));
  }
  console.log('[API] Chế độ Mock Data hiện tại:', isMockMode());
  return isMockMode();
}

/**
 * HÀM GỌI API CHÍNH DÙNG CHUNG TOÀN HỆ THỐNG
 * Tích hợp đầy đủ: Token-Based Auth, Request Deduplication, Auto-Retry, Cache & Sync
 * 
 * @param {string} action Tên hành động nghiệp vụ
 * @param {any} payload Dữ liệu gửi kèm
 * @param {Object} options Tùy chọn mở rộng { skipCache: boolean, skipDedupe: boolean, method: 'POST'|'GET' }
 * @returns {Promise<any>}
 */
export async function callApi(action, payload = {}, options = {}) {
  // 1. KIỂM TRA CHẾ ĐỘ MOCK DEV
  if (isMockMode()) {
    const mockRes = await handleMockAction(action, payload);
    if (mockRes && mockRes.success) {
      handleMutationInvalidation(action);
    }
    return mockRes;
  }

  const apiUrl = getApiUrl();
  if (!apiUrl) {
    console.warn(`[API] Chưa có GAS Web App URL, fallback sang Mock cho action "${action}"`);
    const mockRes = await handleMockAction(action, payload);
    if (mockRes && mockRes.success) {
      handleMutationInvalidation(action);
    }
    return mockRes;
  }

  // 2. KHÓA TRÙNG LẶP REQUEST (REQUEST DEDUPLICATION)
  // Nếu cùng 1 action + payload đang in-flight, tái sử dụng Promise đang chạy
  const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const dedupeKey = `${action}::${payloadStr}`;

  if (!options.skipDedupe && inFlightRequests.has(dedupeKey)) {
    console.log(`[API Dedupe] Tái sử dụng in-flight request cho action "${action}"`);
    return inFlightRequests.get(dedupeKey);
  }

  // 3. XỬ LÝ CACHE STALE-WHILE-REVALIDATE (0.1S TẢI TRANG)
  const isCacheable = API_CONFIG.CACHEABLE_ACTIONS.includes(action) && !options.skipCache;
  const cacheKey = `bht_cache_${action}_${payloadStr}`;

  if (isCacheable) {
    const cachedEntry = getLocalCache(cacheKey);
    if (cachedEntry) {
      const cacheAge = Date.now() - (cachedEntry.timestamp || 0);
      const isFresh = cacheAge < (API_CONFIG.STALE_TIME_MS || 90000);

      // Nếu dữ liệu vẫn còn tươi mới (< 90s), trả về ngay và TUYỆT ĐỐI KHÔNG gửi request ngầm lên máy chủ
      if (isFresh) {
        return cachedEntry.data;
      }

      // Nếu dữ liệu đã cũ (stale) nhưng trong hạn TTL, trả ngay cho UI và revalidate ngầm 1 lần duy nhất
      revalidateCacheInBackground(apiUrl, action, payload, cacheKey);
      return cachedEntry.data;
    }
  }

  // 4. THỰC THI GỬI REQUEST VỚI AUTO-RETRY VÀ EXPONENTIAL BACKOFF + JITTER
  const requestPromise = executeWithRetry(apiUrl, action, payload, options)
    .then(response => {
      // Nếu thành công và là dữ liệu danh mục, lưu vào cache
      if (response && response.success && isCacheable) {
        setLocalCache(cacheKey, response);
      }

      // Xử lý token hết hạn từ máy chủ
      if (response && response.errorCode === 'UNAUTHORIZED') {
        clearToken();
        window.dispatchEvent(new CustomEvent('bht_auth_expired', { detail: response }));
      }

      // Tự động xóa cache và phát sóng đồng bộ đa tab khi có thao tác ghi (Mutation)
      if (response && response.success) {
        handleMutationInvalidation(action);
      }

      return response;
    })
    .catch(networkErr => {
      console.error(`[API Error] Thất bại toàn bộ retry cho action "${action}":`, networkErr);

      // Nếu mạng lỗi hoàn toàn nhưng có cache cũ, trả về cache cứu cánh
      if (isCacheable) {
        const fallbackCache = getLocalCache(cacheKey, true);
        if (fallbackCache) {
          console.warn('[API Cache] Phục hồi từ Cache ngoại tuyến do mất kết nối mạng.');
          return fallbackCache.data;
        }
      }

      return {
        success: false,
        errorCode: 'NETWORK_FAILURE',
        message: 'Không thể kết nối đến máy chủ Google Apps Script: ' + (networkErr.message || networkErr.toString())
      };
    })
    .finally(() => {
      inFlightRequests.delete(dedupeKey);
    });

  inFlightRequests.set(dedupeKey, requestPromise);
  return requestPromise;
}

/**
 * Cơ chế Auto-Retry với Exponential Backoff + Random Jitter
 * Công thức chờ: delay = baseDelay * (2 ^ attempt) + randomJitter(0-1000ms)
 * Rải đều tải ngẫu nhiên khi 30-50 thành viên thao tác đồng thời.
 */
async function executeWithRetry(url, action, payload, options) {
  let attempt = 0;
  const maxRetries = API_CONFIG.MAX_RETRIES;
  const baseDelay = API_CONFIG.BASE_RETRY_DELAY_MS;

  while (attempt <= maxRetries) {
    try {
      const response = await sendGasRequest(url, action, payload, options.method || 'POST');

      // Kiểm tra nếu Backend phản hồi mã LOCK_TIMEOUT hoặc SERVER_BUSY
      const isLockTimeout = response && (
        response.errorCode === 'LOCK_TIMEOUT' ||
        response.errorCode === 'SERVER_BUSY' ||
        (response.message && (
          response.message.includes('đang bận') ||
          response.message.includes('vui lòng thử lại') ||
          response.message.includes('Lock timeout')
        ))
      );

      if (isLockTimeout && attempt < maxRetries) {
        attempt++;
        const jitter = Math.floor(Math.random() * 1000);
        const delay = Math.round(baseDelay * Math.pow(2, attempt) + jitter);
        console.warn(`[API Retry] Máy chủ bận (LOCK_TIMEOUT). Thử lại lần ${attempt}/${maxRetries} sau ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;

    } catch (err) {
      // Bắt các lỗi kết nối mạng (Fetch error, Timeout, HTTP 5xx)
      if (attempt < maxRetries) {
        attempt++;
        const jitter = Math.floor(Math.random() * 1000);
        const delay = Math.round(baseDelay * Math.pow(2, attempt) + jitter);
        console.warn(`[API Retry] Lỗi kết nối mạng (${err.message}). Thử lại lần ${attempt}/${maxRetries} sau ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Gửi HTTP request đến Google Apps Script
 * ĐẢM BẢO CHỐNG LỖI CORS: Luôn dùng Content-Type: text/plain;charset=utf-8
 * ĐẢM BẢO BẢO MẬT: Luôn tự động gắn Token vào request body { action, token, payload }
 */
async function sendGasRequest(url, action, payload, method = 'POST') {
  const currentToken = getToken();

  if (method === 'GET') {
    const queryParams = new URLSearchParams({
      action: action,
      token: currentToken,
      ...(typeof payload === 'object' ? payload : { raw: payload })
    });
    const fetchUrl = url.includes('?') ? `${url}&${queryParams}` : `${url}?${queryParams}`;
    const res = await fetch(fetchUrl, { method: 'GET' });
    return await res.json();
  }

  // Phương thức POST với Content-Type text/plain vượt rào cản CORS
  const requestBody = {
    action: action,
    token: currentToken,
    payload: payload
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Máy chủ Google Apps Script phản hồi mã lỗi HTTP: ${response.status}`);
  }

  return await response.json();
}

/**
 * Cập nhật ngầm dữ liệu cache từ server (Background Revalidation)
 * Có cơ chế chống gọi trùng lặp nền (Background Deduplication)
 */
const activeRevalidations = new Set();
async function revalidateCacheInBackground(apiUrl, action, payload, cacheKey) {
  if (activeRevalidations.has(cacheKey)) return;
  activeRevalidations.add(cacheKey);

  try {
    const freshRes = await sendGasRequest(apiUrl, action, payload, 'POST');
    if (freshRes && freshRes.success) {
      setLocalCache(cacheKey, freshRes);
    }
  } catch (err) {
    console.warn('[API Background] Tự động cập nhật cache thất bại:', err);
  } finally {
    activeRevalidations.delete(cacheKey);
  }
}


/**
 * Xóa sạch toàn bộ cache API trong localStorage
 */
export function invalidateCache(actionPrefixes = []) {
  try {
    if (typeof localStorage === 'undefined') return;
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bht_cache_')) {
        if (!actionPrefixes || actionPrefixes.length === 0) {
          keysToRemove.push(key);
        } else {
          const match = actionPrefixes.some(prefix => key.startsWith(`bht_cache_${prefix}_`));
          if (match) keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(k => safeStorage.removeItem(k));
    if (keysToRemove.length > 0) {
      console.log(`[API Cache] Đã xóa ${keysToRemove.length} mục cache:`, actionPrefixes);
    }
  } catch (e) {
    console.warn('[API Cache] Lỗi khi xóa cache:', e);
  }
}

/**
 * Xóa sạch toàn bộ cache API trong localStorage
 */
export function clearAllApiCache() {
  invalidateCache([]);
}

/**
 * Phát tín hiệu đồng bộ Realtime đa tab (Cross-tab Realtime Sync)
 */
export function broadcastDataSync(actionType, extraData = {}) {
  try {
    invalidateCache(MUTATION_INVALIDATION_MAP[actionType] || []);
    const payload = JSON.stringify({
      action: actionType,
      data: extraData,
      time: Date.now()
    });
    safeStorage.setItem('bht_sync_event', payload);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('bht_sync_event', { detail: { action: actionType, data: extraData } }));
    }
  } catch (e) {}
}

/**
 * Xử lý tự động xóa cache và đồng bộ sau khi gọi mutation thành công
 */
function handleMutationInvalidation(action) {
  const targets = MUTATION_INVALIDATION_MAP[action];
  if (targets) {
    invalidateCache(targets);
    // Các thao tác trả lời trắc nghiệm & bookmark là tác vụ cá nhân tức thì, không phát broadcast làm reload giao diện
    if (action !== 'recordQuizAnswer' && action !== 'toggleQuestionBookmark' && action !== 'saveMemberGift') {
      broadcastDataSync(action);
    }
  }
}

/**
 * Lưu quà 20/10 của thành viên lên máy chủ hoặc Mock data
 * @param {string} userId MSSV của thành viên
 * @param {Object} giftData Thông tin quà 20/10 { giftId, giftTitle, claimCode, claimedAt, used }
 */
export async function saveMemberGift(userId, giftData) {
  return await callApi('saveMemberGift', { userId, giftData });
}

// --------------------------------------------------------------------
// HELPER BỘ NHỚ ĐỆM LOCALSTORAGE
// --------------------------------------------------------------------

function getLocalCache(key, acceptExpired = false) {
  try {
    const raw = safeStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    const isExpired = Date.now() - entry.timestamp > API_CONFIG.CACHE_TTL_MS;
    if (isExpired && !acceptExpired) return null;
    return entry;
  } catch (e) {
    return null;
  }
}

function setLocalCache(key, data) {
  try {
    const entry = {
      timestamp: Date.now(),
      data: data
    };
    safeStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('[API Cache] Không thể ghi cache (có thể vượt quota localStorage):', e);
  }
}

/**
 * Áp dụng Voucher 20/10 (+10 điểm) vào bài thi trắc nghiệm
 * @param {string} sessionId Mã buổi học
 * @param {string} mssv Mã số sinh viên
 * @param {string} giftCode Mã voucher 20/10
 * @returns {Promise<ApiResponse>}
 */
export async function applyQuizBonusVoucher(sessionId, mssv, giftCode) {
  return await callApi('applyQuizBonusVoucher', {
    sessionId: sessionId,
    mssv: mssv,
    giftCode: giftCode
  });
}

/**
 * Lấy sự kiện đặc quyền đang kích hoạt
 * @returns {Promise<ApiResponse>}
 */
export async function getActiveCampaign() {
  return await callApi('getActiveCampaign', {});
}

/**
 * Lấy tất cả danh mục sự kiện đặc quyền (Dành cho Admin)
 * @returns {Promise<ApiResponse>}
 */
export async function getAllCampaigns() {
  return await callApi('getAllCampaigns', {});
}

/**
 * Cập nhật sự kiện kích hoạt (Dành cho Admin)
 * @param {string} campaignId Mã sự kiện (OCT20, TET, MARCH8, ANNIVERSARY, NONE)
 * @returns {Promise<ApiResponse>}
 */
export async function setActiveCampaign(campaignId) {
  return await callApi('setActiveCampaign', { campaignId });
}

/**
 * Áp dụng voucher đặc quyền học thuật tổng quát
 * @param {Object} payload { voucherCode, targetType, targetId, mssv, effectType, effectValue }
 * @returns {Promise<ApiResponse>}
 */
export async function redeemPrivilegeVoucher(payload) {
  return await callApi('redeemPrivilegeVoucher', payload);
}

/**
 * Lấy toàn bộ gói dữ liệu khởi động ứng dụng trong 1 request duy nhất (API Bundling)
 * @param {Object} options Tùy chọn { skipCache: boolean }
 * @returns {Promise<ApiResponse>}
 */
export async function getAppInitData(options = {}) {
  return await callApi('getAppInitData', {}, options);
}

/**
 * Nạp gói dữ liệu khởi động (Bootstrap Data) vào Cache Stale-While-Revalidate
 * Giúp triệt tiêu toàn bộ 6-7 request riêng lẻ lúc khởi động
 * @param {Object} bootstrapData Gói dữ liệu từ getAuthStatus hoặc getAppInitData
 * @param {string} role Vai trò 'ADMIN' hoặc 'MEMBER'
 * @param {string} mssv Mã số sinh viên
 */
export function hydrateAppFromBootstrap(bootstrapData, role, mssv) {
  if (!bootstrapData || typeof bootstrapData !== 'object') return false;

  const cleanRole = String(role || '').trim().toUpperCase();
  const cleanMssv = String(mssv || '').trim().toUpperCase();

  const setCache = (action, payloadObj, data) => {
    try {
      const payloadStr = JSON.stringify(payloadObj);
      const cacheKey = `bht_cache_${action}_${payloadStr}`;
      setLocalCache(cacheKey, { success: true, data: data });
    } catch (e) {}
  };

  if (Array.isArray(bootstrapData.tasks)) {
    setCache('getAllTasks', {}, bootstrapData.tasks);
  }
  if (Array.isArray(bootstrapData.attendance)) {
    setCache('getAttendanceSessions', {}, bootstrapData.attendance);
  }
  if (Array.isArray(bootstrapData.docs)) {
    setCache('getAllDocuments', {}, bootstrapData.docs);
  }
  if (bootstrapData.activeCampaign !== undefined && bootstrapData.activeCampaign !== null) {
    setCache('getActiveCampaign', {}, bootstrapData.activeCampaign);
  }

  if (cleanRole === 'ADMIN') {
    if (Array.isArray(bootstrapData.members)) {
      setCache('getAllMembers', {}, bootstrapData.members);
    }
    if (Array.isArray(bootstrapData.submissions)) {
      setCache('getAllSubmissions', {}, bootstrapData.submissions);
    }
  } else if (cleanMssv) {
    if (Array.isArray(bootstrapData.submissions)) {
      setCache('getMemberSubmissions', { mssv: cleanMssv }, bootstrapData.submissions);
    }
  }

  return true;
}

