// ====================================================================
// MODULE XÁC THỰC & ĐĂNG NHẬP (ZERO-PASSWORD OTP AUTH MODULE)
// ====================================================================

import { callApi, isMockMode, setToken, clearToken, getToken } from '../services/api.js';
import { appState, store, showToast, showView, showGlobalLoading, hideGlobalLoading, setButtonLoading, showFormError, clearFormError } from './ui.js';
import { initMemberView } from './member.js';
import { initAdminView } from './admin.js';

/**
 * Khởi tạo kiểm tra phiên đăng nhập hiện tại
 */
export async function checkAuthSession() {
  const cachedMssv = localStorage.getItem('bht_mssv') || '';
  const cachedRole = localStorage.getItem('bht_role') || '';
  const currentToken = getToken();

  // 1. Optimistic Shell: Hiển thị ngay khung giao diện tĩnh 0ms trước khi fetch API
  if (cachedRole === 'ADMIN') {
    initAdminView(true);
  } else if (cachedRole === 'MEMBER') {
    initMemberView(true);
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
    const res = await callApi('getAuthStatus', { token: currentToken, cachedMssv: cachedMssv });
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
      handleAuthSuccess(res.user);
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
  if (appState.otpTimer) clearInterval(appState.otpTimer);
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
  if (appState.otpTimer) clearInterval(appState.otpTimer);

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
      clearInterval(appState.otpTimer);
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
 * Xử lý sau khi người dùng đăng nhập thành công
 */
function handleAuthSuccess(user, token) {
  const currentToken = token || getToken();
  store.setState({ user: user, token: currentToken });
  localStorage.setItem('bht_mssv', user.mssv);
  localStorage.setItem('bht_role', user.role || 'MEMBER');
  sessionStorage.setItem('bht_user', JSON.stringify(user));

  if (user.role === 'ADMIN') {
    initAdminView(true);
  } else {
    initMemberView(true);
  }

  // Cập nhật lại thanh Dev Helper hiển thị đúng nút chuyển vai trò
  if (window.renderDevHelperBanner) {
    window.renderDevHelperBanner();
  }
}
