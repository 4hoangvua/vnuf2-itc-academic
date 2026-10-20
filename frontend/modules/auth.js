// ====================================================================
// MODULE XÁC THỰC & ĐĂNG NHẬP (ZERO-PASSWORD OTP AUTH MODULE)
// ====================================================================

import { callApi, isMockMode, setToken, clearToken, getToken, hydrateAppFromBootstrap } from '../services/api.js';
import { appState, store, showToast, showView, showGlobalLoading, hideGlobalLoading, setButtonLoading, showFormError, clearFormError, registerViewCleanup, runViewCleanup } from './ui.js';
import { initMemberView, loadMemberData } from './member.js';
import { initAdminView, loadAdminData } from './admin.js';

/**
 * Khởi tạo kiểm tra phiên đăng nhập hiện tại
 */
export async function checkAuthSession() {
  const cachedMssv = localStorage.getItem('bht_mssv') || '';
  const cachedRole = String(localStorage.getItem('bht_role') || '').trim().toUpperCase();
  const currentToken = getToken();

  // 1. Optimistic Shell: Hiển thị ngay khung giao diện tĩnh 0ms trước khi fetch API (fetchApi = false để tránh gọi 5-7 request rời rạc)
  if (cachedRole === 'ADMIN') {
    if (sessionStorage.getItem('bht_viewing_as_member')) {
      initMemberView(true, false);
    } else {
      initAdminView(true, false);
    }
  } else if (cachedRole === 'MEMBER') {
    initMemberView(true, false);
  } else {
    showGlobalLoading('Đang kiểm tra quyền truy cập...');
  }

  // Ràng buộc mặt nạ chỉ nhập số cho ô MSSV và OTP (MSSV từ 8 đến 20 số)
  if (!window._authInputsBound) {
    window._authInputsBound = true;
    const mssvInput = document.getElementById('input-bind-mssv');
    const otpInput = document.getElementById('input-otp-code');
    if (mssvInput) mssvInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 20);
    });
    if (otpInput) otpInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    });
  }

  try {
    const res = await callApi('getAuthStatus', {
      token: currentToken,
      cachedMssv: cachedMssv,
      includeBootstrap: true
    });
    hideGlobalLoading();

    if (!res) {
      showToast('Không nhận được phản hồi từ máy chủ!', 'error');
      showView('view-unauthenticated');
      return;
    }

    if (res.status === 'PROMPT_MSSV') {
      appState.authMode = 'LOGIN_MSSV';
      const titleEl = document.getElementById('bind-title');
      if (titleEl) titleEl.textContent = 'Cổng Đăng Nhập';
      const descEl = document.getElementById('bind-desc');
      if (descEl) descEl.textContent = '';
      const errAlert = document.getElementById('bind-error-alert');
      if (errAlert) errAlert.classList.add('hidden');
      showView('view-bind-account');
      return;
    }

    if (res.status === 'NEED_BINDING') {
      appState.authMode = 'FIRST_TIME_BIND';
      const titleEl = document.getElementById('bind-title');
      const descEl = document.getElementById('bind-desc');
      if (titleEl) titleEl.textContent = 'Xác Thực Sinh Viên';
      if (descEl) descEl.textContent = res.message || 'Tài khoản chưa được liên kết. Vui lòng nhập MSSV.';
      showView('view-bind-account');
      return;
    }

    if (res.status === 'BLOCKED') {
      const descEl = document.getElementById('unauth-desc');
      if (descEl) descEl.textContent = res.message || 'Tài khoản của bạn đang bị khóa.';
      showView('view-unauthenticated');
      return;
    }

    if (res.status === 'AUTHENTICATED' && res.user) {
      if (res.bootstrapData) {
        hydrateAppFromBootstrap(res.bootstrapData, res.user.role, res.user.mssv);
      }
      handleAuthSuccess(res.user, null, true, res.bootstrapData);
      return;
    }

    // Trường hợp lỗi khác
    const descEl = document.getElementById('unauth-desc');
    if (descEl) descEl.textContent = res.message || 'Không thể xác thực quyền truy cập.';
    showView('view-unauthenticated');

  } catch (err) {
    hideGlobalLoading();
    console.error('Lỗi khi kiểm tra đăng nhập:', err);
    showToast('Lỗi kết nối xác thực: ' + (err.message || err.toString()), 'error');
    showView('view-unauthenticated');
  }
}

/**
 * Xử lý Bước 1: Gửi yêu cầu mã OTP
 */
export async function handleRequestOtp(e) {
  if (e && e.preventDefault) e.preventDefault();

  const mssvInput = document.getElementById('input-bind-mssv');
  const emailInput = document.getElementById('input-bind-email');
  // Hỗ trợ cả 2 ID nút gửi
  const btn = document.getElementById('btn-request-otp') || document.getElementById('btn-submit-mssv');
  const boxEmail = document.getElementById('box-input-email');

  const mssv = mssvInput ? mssvInput.value.trim().toUpperCase() : '';
  const email = emailInput ? emailInput.value.trim() : '';

  clearFormError('form-request-otp');

  if (!mssv) {
    showFormError('form-request-otp', 'Vui lòng nhập Mã số sinh viên (MSSV)!', mssvInput);
    return;
  }

  if (!/^\d{8,20}$/.test(mssv)) {
    showFormError('form-request-otp', 'Mã số sinh viên (MSSV) phải gồm từ 8 đến 20 chữ số!', mssvInput);
    return;
  }

  if (boxEmail && !boxEmail.classList.contains('hidden')) {
    if (!email) {
      showFormError('form-request-otp', 'Vui lòng nhập địa chỉ Gmail cá nhân!', emailInput);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFormError('form-request-otp', 'Địa chỉ Gmail không đúng định dạng (VD: sinhvien@gmail.com)!', emailInput);
      return;
    }
  }

  if (btn) setButtonLoading(btn, true);
  if (mssvInput) mssvInput.disabled = true;
  if (emailInput) emailInput.disabled = true;

  try {
    const res = await callApi('requestLoginOtp', { mssv: mssv, email: email });

    if (btn) setButtonLoading(btn, false);
    if (mssvInput) mssvInput.disabled = false;
    if (emailInput) emailInput.disabled = false;

    if (!res) {
      showFormError('form-request-otp', 'Không nhận được phản hồi từ máy chủ!');
      return;
    }

    if (res.needEmailInput) {
      if (boxEmail) boxEmail.classList.remove('hidden');
      if (emailInput) {
        emailInput.required = true;
      }
      showFormError('form-request-otp', res.message || 'Vui lòng nhập Gmail cá nhân của bạn!', emailInput);
      return;
    }

    if (res.success) {
      appState.pendingMssv = res.mssv || mssv;
      showToast(res.message, 'success');

      // Chuyển sang form nhập OTP
      const reqForm = document.getElementById('form-request-otp');
      const verForm = document.getElementById('form-verify-otp');
      if (reqForm) reqForm.classList.add('hidden');
      if (verForm) verForm.classList.remove('hidden');

      const maskedEl = document.getElementById('otp-sent-email') || document.getElementById('otp-target-email');
      if (maskedEl) maskedEl.textContent = res.emailMasked || 'Gmail của bạn';

      const otpInput = document.getElementById('input-otp-code') || document.getElementById('input-verify-otp');
      if (otpInput) {
        otpInput.value = '';
        otpInput.disabled = false;
        // Nếu ở Mock Mode, tự động điền sẵn mã 123456 để test siêu nhanh
        if (isMockMode()) {
          otpInput.value = '123456';
        }
        otpInput.focus();
      }

      // Thông báo rõ ràng mã OTP gợi ý khi ở chế độ Mock
      if (isMockMode()) {
        showToast('Mã OTP thử nghiệm của bạn là: 123456 (Đã tự động điền)', 'info');
      }

      startOtpCountdown(300); // 5 phút đếm ngược
    } else {
      showFormError('form-request-otp', res.message || 'Không thể gửi mã xác thực!', mssvInput);
    }

  } catch (err) {
    if (btn) setButtonLoading(btn, false);
    if (mssvInput) mssvInput.disabled = false;
    if (emailInput) emailInput.disabled = false;
    showFormError('form-request-otp', 'Lỗi hệ thống: ' + (err.message || err.toString()));
  }
}

/**
 * Xử lý Bước 2: Xác thực mã OTP 6 số
 */
export async function handleVerifyOtp(e) {
  if (e && e.preventDefault) e.preventDefault();

  const otpInput = document.getElementById('input-otp-code') || document.getElementById('input-verify-otp');
  const btn = document.getElementById('btn-verify-otp') || document.getElementById('btn-submit-otp');

  clearFormError('form-verify-otp');

  const otp = otpInput ? otpInput.value.trim() : '';
  if (!/^\d{6}$/.test(otp)) {
    showFormError('form-verify-otp', 'Mã OTP phải gồm đúng 6 chữ số!', otpInput);
    return;
  }

  if (btn) setButtonLoading(btn, true);
  if (otpInput) otpInput.disabled = true;

  try {
    const res = await callApi('verifyLoginOtp', {
      mssv: appState.pendingMssv,
      otp: otp
    });

    if (btn) setButtonLoading(btn, false);
    if (otpInput) otpInput.disabled = false;

    if (res && res.success && res.user) {
      if (appState.otpTimer) clearInterval(appState.otpTimer);
      showToast('Xác thực OTP thành công!', 'success');
      if (res.token) {
        setToken(res.token);
      }
      handleAuthSuccess(res.user, res.token);
    } else {
      showFormError('form-verify-otp', (res && res.message) ? res.message : 'Mã xác thực không chính xác hoặc đã hết hạn!', otpInput);
    }

  } catch (err) {
    if (btn) setButtonLoading(btn, false);
    if (otpInput) otpInput.disabled = false;
    showFormError('form-verify-otp', 'Lỗi xác thực: ' + (err.message || err.toString()), otpInput);
  }
}

/**
 * Quay lại bước nhập MSSV từ bước nhập OTP
 */
export function backToMssvStep() {
  if (appState.otpTimer) {
    clearInterval(appState.otpTimer);
    appState.otpTimer = null;
  }
  const reqForm = document.getElementById('form-request-otp');
  const verForm = document.getElementById('form-verify-otp');
  if (verForm) verForm.classList.add('hidden');
  if (reqForm) reqForm.classList.remove('hidden');

  const mssvInput = document.getElementById('input-bind-mssv');
  if (mssvInput) {
    mssvInput.disabled = false;
    mssvInput.focus();
  }
}

/**
 * Đếm ngược thời gian hết hạn mã OTP
 */
export function startOtpCountdown(seconds = 300) {
  if (appState.otpTimer) {
    clearInterval(appState.otpTimer);
    appState.otpTimer = null;
  }

  let remaining = seconds;
  const timerEl = document.getElementById('otp-countdown') || document.getElementById('otp-timer');
  const resendBtn = document.getElementById('btn-resend-otp');

  if (resendBtn) {
    resendBtn.classList.add('opacity-50', 'pointer-events-none');
    resendBtn.disabled = true;
  }

  const updateDisplay = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    if (timerEl) {
      timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  };

  updateDisplay();

  appState.otpTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      if (appState.otpTimer) {
        clearInterval(appState.otpTimer);
        appState.otpTimer = null;
      }
      if (timerEl) timerEl.textContent = '00:00';
      if (resendBtn) {
        resendBtn.classList.remove('opacity-50', 'pointer-events-none');
        resendBtn.disabled = false;
      }
      showToast('Mã OTP đã hết hiệu lực, bạn có thể bấm gửi lại mã mới!', 'warning');
    } else {
      updateDisplay();
    }
  }, 1000);

  // Đăng ký dọn dẹp timer vào View Lifecycle để tránh memory leak khi đổi view hoặc đăng xuất
  registerViewCleanup(() => {
    if (appState.otpTimer) {
      clearInterval(appState.otpTimer);
      appState.otpTimer = null;
    }
  });
}

/**
 * Gửi lại mã OTP
 */
export async function handleResendOtp() {
  const emailInput = document.getElementById('input-bind-email');
  const email = emailInput ? emailInput.value.trim() : '';
  const resendBtn = document.getElementById('btn-resend-otp');

  if (resendBtn) {
    resendBtn.classList.add('opacity-50', 'pointer-events-none');
    resendBtn.textContent = 'Đang gửi...';
  }

  showToast('Đang gửi lại mã OTP...', 'info');

  try {
    const res = await callApi('requestLoginOtp', {
      mssv: appState.pendingMssv,
      email: email
    });

    if (resendBtn) resendBtn.textContent = 'Gửi lại mã OTP';

    if (res && res.success) {
      startOtpCountdown(300);
      showToast(res.message, 'success');
      if (isMockMode()) {
        showToast('Mã OTP mới: 123456', 'info');
      }
    } else {
      if (resendBtn) resendBtn.classList.remove('opacity-50', 'pointer-events-none');
      showToast((res && res.message) ? res.message : 'Không thể gửi lại mã OTP!', 'error');
    }
  } catch (err) {
    if (resendBtn) {
      resendBtn.classList.remove('opacity-50', 'pointer-events-none');
      resendBtn.textContent = 'Gửi lại mã OTP';
    }
    showToast('Lỗi: ' + (err.message || err.toString()), 'error');
  }
}

/**
 * Đăng xuất khỏi hệ thống
 */
export async function handleLogout() {
  if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?')) {
    // Kích hoạt dọn dẹp toàn bộ timers, subscriptions và handlers trước khi thoát
    runViewCleanup();

    try {
      await callApi('logoutUser', {});
    } catch (e) {
      console.warn('Lỗi gọi API logout:', e);
    }
    clearToken();
    localStorage.removeItem('bht_mssv');
    localStorage.removeItem('bht_role');
    sessionStorage.clear();
    store.reset();
    
    // Xóa sạch toàn bộ cache dữ liệu để người dùng tiếp theo nhận dữ liệu mới 100%
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('bht_cache_')) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    location.reload();
  }
}

/**
 * Cập nhật tên hiển thị người dùng tức thì lên toàn bộ các phần tử giao diện
 * @param {Object} user 
 */
export function updateUserHeaderDisplay(user) {
  if (!user) return;
  const validName = String(user.hoTen || user.HoTen || '').trim();
  const validMssv = String(user.mssv || user.MSSV || '').trim();
  const validEmail = String(user.email || user.Email || '').trim();

  // 1. Cập nhật Admin Header
  const adminNameEl = document.getElementById('admin-display-name');
  const adminEmailEl = document.getElementById('admin-display-email');
  if (adminNameEl && validName) adminNameEl.textContent = validName;
  if (adminEmailEl && (validEmail || validMssv)) adminEmailEl.textContent = validEmail || validMssv;

  // 2. Cập nhật Member Header & Greeting
  const memNameEl = document.getElementById('member-display-name');
  const memMssvEl = document.getElementById('member-display-mssv');
  const welcomeEl = document.getElementById('member-welcome-name');
  const welcomeMssvEl = document.getElementById('member-welcome-mssv');

  if (memNameEl && validName) memNameEl.textContent = validName;
  if (memMssvEl && validMssv) memMssvEl.textContent = validMssv;

  if (welcomeEl && validName) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Chào buổi sáng' : (hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối');
    welcomeEl.textContent = `${validName} (${timeGreeting})`;
  }
  if (welcomeMssvEl && validMssv) welcomeMssvEl.textContent = validMssv;

  // 3. Cập nhật Banner Xem trước Admin (nếu có)
  const bannerTitle = document.getElementById('admin-preview-banner-title');
  const viewingAs = sessionStorage.getItem('bht_viewing_as_member');
  if (bannerTitle && viewingAs && viewingAs !== 'true' && validName) {
    bannerTitle.textContent = `Xem trước: Sinh viên ${validName} (${validMssv})`;
  }
}

/**
 * Xử lý sau khi người dùng đăng nhập thành công
 */
function handleAuthSuccess(user, token, isSessionVerification = false, bootstrapData = null) {
  const currentToken = token || getToken();
  const cleanRole = String(user.role || 'MEMBER').trim().toUpperCase();
  const cachedRole = String(localStorage.getItem('bht_role') || '').trim().toUpperCase();
  const validName = String(user.hoTen || user.HoTen || '').trim();

  user.role = cleanRole;
  if (validName) {
    user.hoTen = validName;
    user.HoTen = validName;
    localStorage.setItem('bht_hoten', validName);
  }

  store.setState({ user: user, token: currentToken });
  localStorage.setItem('bht_mssv', user.mssv);
  localStorage.setItem('bht_role', cleanRole);
  sessionStorage.setItem('bht_user', JSON.stringify(user));

  // Nếu là phiên xác thực tự động khi mở trang và role không đổi, không nạp lại view lần 2 (tránh duplicate 5-11 request)
  const isAlreadyRendered = isSessionVerification && (cachedRole === cleanRole);

  if (!isAlreadyRendered) {
    if (cleanRole === 'ADMIN') {
      if (sessionStorage.getItem('bht_viewing_as_member')) {
        initMemberView(true, true);
      } else {
        initAdminView(true, true);
      }
    } else {
      initMemberView(true, true);
    }
  } else {
    // Nếu khung tĩnh đã được dựng trước (Optimistic Shell), kích hoạt nạp dữ liệu vào view
    // (Lúc này cache đã được hydrate 0ms từ bootstrapData nên loadMemberData / loadAdminData không gọi mạng)
    if (cleanRole === 'ADMIN') {
      if (sessionStorage.getItem('bht_viewing_as_member')) {
        loadMemberData(true, false);
      } else {
        loadAdminData(true, false);
      }
    } else {
      loadMemberData(true, false);
    }
  }

  // Luôn cập nhật tên hiển thị lên toàn bộ các vị trí trên giao diện
  updateUserHeaderDisplay(user);

  // Cập nhật lại thanh Dev Helper hiển thị đúng nút chuyển vai trò
  if (window.renderDevHelperBanner) {
    window.renderDevHelperBanner();
  }
}
