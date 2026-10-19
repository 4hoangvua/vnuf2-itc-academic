// ====================================================================
// BOOTSTRAP ENTRY POINT (MAIN APP CONTROLLER)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================
// 1. Tuyệt đối KHÔNG gắn hàm vào global scope (window.*).
// 2. Sử dụng cơ chế Event Delegation tập trung qua data-action và data-id.
// 3. Kết nối Reactive Store điều phối luồng dữ liệu một chiều.
// ====================================================================

import { getApiUrl, setApiUrl, isMockMode, toggleMockMode, getToken, clearToken } from './services/api.js';
import { loadAllViews } from './services/viewLoader.js';
import {
  store,
  showToast,
  hideToast,
  showGlobalLoading,
  hideGlobalLoading,
  showView,
  toggleTheme,
  initTheme,
  toggleSidebar,
  initSidebar,
  attachEventDelegation,
  attachFormDelegation,
  initHorizontalDragScroll
} from './modules/ui.js';

import {
  checkAuthSession,
  handleRequestOtp,
  handleVerifyOtp,
  handleResendOtp,
  backToMssvStep,
  handleLogout
} from './modules/auth.js?v=20261017_1';

import {
  initMemberView,
  refreshMemberData,
  switchMemberTab,
  openSubmitModal,
  closeSubmitModal,
  handleFileSelected,
  handleUploadSubmission,
  handleQuickAttendance,
  handleSearchDocs,
  openMemberSessionDetail,
  closeMemberSessionDetailModal,
  backToMemberSessionsList,
  switchMemberSessionSubTab,
  handleCheckInFromDetail,
  filterSessionsByCategory,
  filterDocsByCategory,
  openQuickPinModal,
  closeQuickPinModal,
  handleSubmitQuickPinModal,
  filterMemberAuditTable,
  handleStartMemberQuiz,
  handleSelectQuizOption,
  handleSubmitMemberQuiz,
  handleRetakeMemberQuiz,
  handleNextQuizQuestion,
  handlePrevQuizQuestion,
  handleJumpQuizQuestion,
  handleToggleQuizAutoNext,
  handleToggleQuizBookmark,
  handleSwitchQuizPool,
  handleOpenQuizGridModal,
  handleCloseQuizGridModal,
  handleExitTakingQuiz,
  handleStartOfficialQuiz,
  handleStartPracticeQuiz,
  handleOpenQuizReviewDrawer
} from './modules/member.js?v=20261020_2';

import {
  initAdminView,
  refreshAdminData,
  switchAdminTab,
  setSubmissionStatusFilter,
  handleFilterSubmissions,
  handleFilterMembers,
  handleReviewSubmission,
  handleToggleTaskStatus,
  openCreateTaskModal,
  openCreateTaskForSession,
  closeCreateTaskModal,
  handleCreateTask,
  openAddMemberModal,
  closeAddMemberModal,
  handleAddMember,
  handleResetMemberEmail,
  handleToggleMemberStatus,
  generateRandomPin,
  openCreateAttendanceModal,
  closeCreateAttendanceModal,
  handleCreateAttendanceSession,
  handleToggleAttendanceSession,
  filterAndSwitchToSubmissions,
  openAdminSessionDetail,
  closeAdminSessionDetailModal,
  backToAdminSessionsList,
  switchAdminSessionSubTab,
  openAdminPinModal,
  closeAdminPinModal,
  filterSessionAttendees,
  handleSaveTaskInDetail,
  handleTogglePinFromDetail,
  handleRegeneratePinInDetail,
  handleUpdateSessionInfoInDetail,
  handleOpenProjectorFromDetail,
  openReviewDrawer,
  closeReviewDrawer,
  handleDrawerReviewSubmit,
  openEditAttendanceModal,
  closeEditAttendanceModal,
  handleUpdateAttendanceSession,
  handleDeleteAttendanceSession,
  handleDeleteSessionFromDetail,
  openEditTaskModal,
  closeEditTaskModal,
  handleUpdateTask,
  handleDeleteTask,
  openCreateDocModal,
  openEditDocModal,
  closeEditDocModal,
  handleSaveDocument,
  handleDeleteDocument,
  handleFilterAdminDocs,
  handleFilterAdminAttendance,
  switchToMemberView,
  returnToAdminView,
  handleToggleAdminQuizStatus,
  handleOpenCreateQuizModal,
  handleOpenEditQuizModal,
  handleCloseEditQuizModal,
  handleInsertQuizTemplateSample,
  handleSubmitEditQuizForm,
  handleDeleteAdminQuiz,
  handleResetMemberQuizSubmission,
  handleResetAllQuizSubmissions
} from './modules/admin.js?v=20261020_1';

import {
  openProjectorMode,
  closeProjectorMode,
  refreshProjectorCount
} from './modules/projector.js';

import {
  setPaginationPage,
  prevPaginationPage,
  nextPaginationPage,
  setPaginationPageSize
} from './modules/pagination.js';

// ====================================================================
// BẢN ĐỒ ĐIỀU PHỐI EVENT DELEGATION TẬP TRUNG (CENTRAL ACTIONS DISPATCHER)
// ====================================================================
const CENTRAL_ACTION_MAP = {
  // --- UI CHUNG & THEME ---
  'toggle-theme': () => toggleTheme(),
  'toggle-sidebar': () => toggleSidebar(),
  'hide-toast': () => hideToast(),
  'show-view': (el, ev, ds) => showView(ds.view || ds.id),
  'reload-page': () => location.reload(),
  'logout': () => handleLogout(),

  // --- XÁC THỰC OTP ---
  'back-to-mssv-step': () => backToMssvStep(),
  'resend-otp': () => handleResendOtp(),

  // --- THÀNH VIÊN (MEMBER ACTIONS) ---
  'refresh-member-data': () => refreshMemberData(),
  'switch-member-tab': (el, ev, ds) => switchMemberTab(ds.tab || ds.id),
  'quick-attendance': () => handleQuickAttendance(),
  'open-member-session-detail': (el, ev, ds) => openMemberSessionDetail(ds.id),
  'back-to-member-sessions': () => backToMemberSessionsList(),
  'switch-member-session-subtab': (el, ev, ds) => switchMemberSessionSubTab(ds.tab || ds.id),
  'checkin-from-detail': () => handleCheckInFromDetail(),
  'open-submit-modal': (el, ev, ds) => openSubmitModal(ds.id),
  'close-submit-modal': () => closeSubmitModal(),
  'trigger-file-select': () => {
    const input = document.getElementById('file-upload-input');
    if (input) input.click();
  },
  'filter-sessions-category': (el, ev, ds) => filterSessionsByCategory(ds.category || ds.cat),
  'filter-docs-category': (el, ev, ds) => filterDocsByCategory(ds.category || ds.cat),
  'open-quick-pin-modal': (el, ev, ds) => openQuickPinModal(ds.id),
  'close-quick-pin-modal': () => closeQuickPinModal(),
  'filter-member-audit': (el, ev, ds) => filterMemberAuditTable(ds.filter),
  'scroll-to-member-audit': () => {
    const el = document.getElementById('member-attendance-audit-tbody');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },
  'show-drl-notice': () => {
    showToast('Điểm Rèn Luyện học kỳ sẽ được Ban Học Thuật tổng kết và công bố chính thức vào cuối kỳ.', 'info');
  },
  'start-member-quiz': (el, ev, ds) => handleStartMemberQuiz(ds.sessionId, ds.quizId),
  'start-official-quiz': (el, ev, ds) => handleStartOfficialQuiz(ds.sessionId, ds.quizId),
  'start-practice-quiz': (el, ev, ds) => handleStartPracticeQuiz(ds.sessionId, ds.quizId),
  'open-quiz-review-drawer': () => handleOpenQuizReviewDrawer(),
  'select-quiz-option': (el, ev, ds) => handleSelectQuizOption(ds.questionId, ds.optionIndex),
  'submit-member-quiz': (el, ev, ds) => handleSubmitMemberQuiz(ds.sessionId, ds.quizId),
  'retake-member-quiz': (el, ev, ds) => handleRetakeMemberQuiz(ds.sessionId, ds.quizId),
  'prev-quiz-question': () => handlePrevQuizQuestion(),
  'next-quiz-question': () => handleNextQuizQuestion(),
  'jump-quiz-question': (el, ev, ds) => handleJumpQuizQuestion(ds.index),
  'toggle-quiz-auto-next': (el, ev) => handleToggleQuizAutoNext(ev),
  'toggle-quiz-bookmark': (el, ev, ds) => handleToggleQuizBookmark(ds.questionId),
  'switch-quiz-pool': (el, ev, ds) => handleSwitchQuizPool(ds.pool),
  'open-quiz-grid-modal': () => handleOpenQuizGridModal(),
  'close-quiz-grid-modal': () => handleCloseQuizGridModal(),
  'exit-taking-quiz': () => handleExitTakingQuiz(),

  // --- QUẢN TRỊ VIÊN (ADMIN ACTIONS) ---
  'refresh-admin-data': () => refreshAdminData(),
  'switch-admin-tab': (el, ev, ds) => switchAdminTab(ds.tab || ds.id),
  'filter-submission-status': (el, ev, ds) => setSubmissionStatusFilter(ds.status || ds.id),
  'review-submission': (el, ev, ds) => handleReviewSubmission(ds.id, ds.status),
  'open-review-drawer': (el, ev, ds) => openReviewDrawer(ds.id),
  'close-review-drawer': () => closeReviewDrawer(),
  'drawer-review-submit': (el, ev, ds) => handleDrawerReviewSubmit(ds.status),
  'toggle-task-status': (el, ev, ds) => handleToggleTaskStatus(ds.id, ds.status),
  'reset-member-email': (el, ev, ds) => handleResetMemberEmail(ds.id),
  'toggle-member-status': (el, ev, ds) => handleToggleMemberStatus(ds.id, ds.status),
  'open-create-task-modal': (el, ev, ds) => openCreateTaskModal(ds.id),
  'open-create-task-for-session': (el, ev, ds) => openCreateTaskForSession(ds.id),
  'close-create-task-modal': () => closeCreateTaskModal(),
  'open-add-member-modal': () => openAddMemberModal(),
  'close-add-member-modal': () => closeAddMemberModal(),
  'open-create-attendance-modal': () => openCreateAttendanceModal(),
  'close-create-attendance-modal': () => closeCreateAttendanceModal(),
  'generate-random-pin': () => generateRandomPin(),
  'open-admin-session-detail': (el, ev, ds) => openAdminSessionDetail(ds.id),
  'back-to-admin-sessions': () => backToAdminSessionsList(),
  'switch-admin-session-subtab': (el, ev, ds) => switchAdminSessionSubTab(ds.tab || ds.id),
  'open-admin-pin-modal': (el, ev, ds) => openAdminPinModal(ds.id),
  'close-admin-pin-modal': () => closeAdminPinModal(),
  'toggle-pin-from-detail': () => handleTogglePinFromDetail(),
  'regenerate-pin-in-detail': () => handleRegeneratePinInDetail(),
  'update-session-info-in-detail': () => handleUpdateSessionInfoInDetail(),
  'save-task-in-detail': () => handleSaveTaskInDetail(),
  'open-projector-from-detail': () => handleOpenProjectorFromDetail(),
  'filter-submissions-for-session': (el, ev, ds) => filterAndSwitchToSubmissions(ds.id),

  // --- CHUYỂN ĐỔI CHẾ ĐỘ XEM ADMIN <-> MEMBER (PREVIEW MODE) ---
  'switch-to-member-view': () => switchToMemberView(),
  'return-to-admin-view': () => returnToAdminView(),
  'view-as-member': (el, ev, ds) => switchToMemberView(ds.id),

  // --- QUẢN TRỊ SỬA / XÓA (ADMIN CRUD ACTIONS) ---
  'open-edit-session-modal': (el, ev, ds) => openEditAttendanceModal(ds.id),
  'close-edit-attendance-modal': () => closeEditAttendanceModal(),
  'regen-create-att-pin': () => {
    const pinInput = document.getElementById('att-input-pin');
    if (pinInput) pinInput.value = String(Math.floor(100000 + Math.random() * 900000));
  },
  'regen-edit-att-pin': () => {
    const pinInput = document.getElementById('edit-att-pin');
    if (pinInput) pinInput.value = String(Math.floor(100000 + Math.random() * 900000));
  },
  'delete-session-from-detail': () => handleDeleteSessionFromDetail(),
  'delete-attendance-session': (el, ev, ds) => handleDeleteAttendanceSession(ds.id),

  'open-edit-task-modal': (el, ev, ds) => openEditTaskModal(ds.id),
  'close-edit-task-modal': () => closeEditTaskModal(),
  'delete-task': (el, ev, ds) => handleDeleteTask(ds.id),

  'open-create-doc-modal': () => openCreateDocModal(),
  'open-edit-doc-modal': (el, ev, ds) => openEditDocModal(ds.id),
  'close-edit-doc-modal': () => closeEditDocModal(),
  'delete-doc': (el, ev, ds) => handleDeleteDocument(ds.id),
  'filter-admin-docs': (el, ev, ds) => handleFilterAdminDocs(ds.cat || ds.category),
  'filter-admin-attendance': (el, ev, ds) => handleFilterAdminAttendance(ds.cat || ds.category),

  // --- TRẮC NGHIỆM ADMIN (ADMIN QUIZ ACTIONS) ---
  'toggle-admin-quiz-status': (el, ev, ds) => handleToggleAdminQuizStatus(ds.sessionId, ds.quizId, ds.status),
  'open-create-quiz-modal': (el, ev, ds) => handleOpenCreateQuizModal(ds.sessionId),
  'open-edit-quiz-modal': (el, ev, ds) => handleOpenEditQuizModal(ds.sessionId, ds.quizId),
  'close-edit-quiz-modal': () => handleCloseEditQuizModal(),
  'insert-quiz-template-sample': () => handleInsertQuizTemplateSample(),
  'delete-admin-quiz': (el, ev, ds) => handleDeleteAdminQuiz(ds.sessionId, ds.quizId),
  'reset-member-quiz-submission': (el, ev, ds) => handleResetMemberQuizSubmission(ds.sessionId, ds.quizId, ds.mssv),
  'reset-all-quiz-submissions': (el, ev, ds) => handleResetAllQuizSubmissions(ds.sessionId, ds.quizId),

  // --- MÁY CHIẾU PIN (PROJECTOR MODE) ---
  'open-projector-mode': (el, ev, ds) => openProjectorMode(ds.id),
  'close-projector-mode': () => closeProjectorMode(),
  'refresh-projector-count': () => refreshProjectorCount(),

  // --- DEV HELPER ACTIONS ---
  'toggle-dev-mock': () => {
    const next = toggleMockMode();
    showToast(`Đã chuyển sang chế độ: ${next ? 'Mock Data (Local)' : 'Live Google Apps Script'}`, 'info');
    setTimeout(() => location.reload(), 400);
  },
  'quick-switch-role': () => {
    const user = store.getState('user');
    const isAdmin = (user && user.role === 'ADMIN');
    const targetMssv = isAdmin ? '2351120015' : '2251120001';
    localStorage.setItem('bht_mssv', targetMssv);
    clearToken();
    sessionStorage.clear();
    showToast(`Đang chuyển tài khoản sang ${targetMssv}...`, 'info');
    setTimeout(() => location.reload(), 300);
  },
  'toggle-dev-banner-collapse': () => {
    const isCollapsed = localStorage.getItem('bht_dev_collapsed') === 'true';
    localStorage.setItem('bht_dev_collapsed', (!isCollapsed).toString());
    renderDevHelperBanner();
  },
  'copy-mock-data': async () => {
    try {
      const mockStr = localStorage.getItem('bht_mock_store') || '';
      await navigator.clipboard.writeText(mockStr);
      showToast('Đã copy dữ liệu Mock vào Clipboard!', 'success');
    } catch (err) {
      showToast('Không thể copy: ' + err.toString(), 'error');
    }
  },
  'paste-mock-data': async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.startsWith('{')) {
        showToast('Nội dung clipboard không phải JSON hợp lệ!', 'warning');
        return;
      }
      JSON.parse(text);
      localStorage.setItem('bht_mock_store', text);
      showToast('Đã dán dữ liệu Mock thành công! Đang tải lại...', 'success');
      setTimeout(() => location.reload(), 500);
    } catch (err) {
      showToast('Lỗi đọc clipboard: ' + err.toString(), 'error');
    }
  },

  // --- PHÂN TRANG DANH SÁCH (PAGINATION ACTIONS) ---
  'change-page': (el, ev, ds) => {
    const pid = ds.paginationId || el.getAttribute('data-pagination-id');
    const page = parseInt(ds.page || el.getAttribute('data-page'), 10);
    if (pid && !isNaN(page)) setPaginationPage(pid, page);
  },
  'prev-page': (el, ev, ds) => {
    const pid = ds.paginationId || el.getAttribute('data-pagination-id');
    if (pid) prevPaginationPage(pid);
  },
  'next-page': (el, ev, ds) => {
    const pid = ds.paginationId || el.getAttribute('data-pagination-id');
    if (pid) nextPaginationPage(pid);
  }
};

// ====================================================================
// BẢN ĐỒ SỰ KIỆN CHANGE DELEGATION TẬP TRUNG (SELECT / INPUT CHANGES)
// ====================================================================
const CENTRAL_CHANGE_MAP = {
  'change-page-size': (el, ev, ds) => {
    const pid = ds.paginationId || el.getAttribute('data-pagination-id');
    const size = parseInt(el.value, 10);
    if (pid && !isNaN(size)) {
      setPaginationPageSize(pid, size);
    }
  },
  'change-page-select': (el, ev, ds) => {
    const pid = ds.paginationId || el.getAttribute('data-pagination-id');
    const page = parseInt(el.value, 10);
    if (pid && !isNaN(page)) {
      setPaginationPage(pid, page);
    }
  }
};

// ====================================================================
// BẢN ĐỒ FORM SUBMIT DELEGATION
// ====================================================================
const CENTRAL_FORM_MAP = {
  'request-otp': (form, ev) => handleRequestOtp(ev),
  'verify-otp': (form, ev) => handleVerifyOtp(ev),
  'create-attendance-session': (form, ev) => handleCreateAttendanceSession(ev),
  'update-attendance-session': (form, ev) => handleUpdateAttendanceSession(ev),
  'create-task': (form, ev) => handleCreateTask(ev),
  'update-task': (form, ev) => handleUpdateTask(ev),
  'add-member': (form, ev) => handleAddMember(ev),
  'submit-assignment': (form, ev) => handleUploadSubmission(ev),
  'save-document': (form, ev) => handleSaveDocument(ev),
  'quick-attendance': (form, ev) => handleQuickAttendance(ev),
  'checkin-from-detail': (form, ev) => handleCheckInFromDetail(ev),
  'submit-quick-pin-modal': (form, ev) => handleSubmitQuickPinModal(ev),
  'submit-edit-quiz': (form, ev) => handleSubmitEditQuizForm(ev)
};

// ====================================================================
// KHỞI ĐỘNG ỨNG DỤNG BẤT ĐỒNG BỘ (APP INITIALIZATION)
// ====================================================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('%c[Ban Học Thuật - CLB Tin Học VNUF2] Khởi động ứng dụng (Anti-Spaghetti Architecture)...', 'color: #0F6256; font-weight: bold; font-size: 14px;');

  // 1. Khởi tạo theme Dark / Light
  initTheme();

  // 2. Gắn kết hệ thống Event Delegation tập trung trên toàn trang (document.body)
  attachEventDelegation(document.body, CENTRAL_ACTION_MAP, 'click');
  attachEventDelegation(document.body, CENTRAL_CHANGE_MAP, 'change');
  attachFormDelegation(document.body, CENTRAL_FORM_MAP);

  // 3. Lắng nghe sự kiện token hết hạn từ api.js để tự động điều hướng về login
  window.addEventListener('bht_auth_expired', () => {
    showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!', 'warning');
    showView('view-bind-account');
  });

  // 4. Lắng nghe sự kiện nạp file cho input file upload
  document.body.addEventListener('change', (ev) => {
    if (ev.target && ev.target.id === 'file-upload-input') {
      handleFileSelected(ev);
    }
  });

  // 4b. Lắng nghe sự kiện input để tự động lọc chỉ số cho toàn bộ các ô nhập số (PIN, MSSV, OTP...)
  document.body.addEventListener('input', (ev) => {
    const target = ev.target;
    if (!target) return;
    if (target.matches('input[inputmode="numeric"]')) {
      const cleaned = target.value.replace(/\D/g, '');
      if (target.value !== cleaned) {
        target.value = cleaned;
      }
    }
  });

  // 5. Nạp động các phân hệ View HTML từ views/ (auth.html, member.html, admin.html)
  await loadAllViews();
  initSidebar();
  initHorizontalDragScroll();

  // 6. Hiển thị thanh Dev Helper ở góc phải màn hình phục vụ kiểm thử
  renderDevHelperBanner();

  // 7. Kiểm tra phiên đăng nhập an toàn
  checkAuthSession();

  // 8. Lắng nghe thay đổi URL Hash cho điều hướng SPA mượt mà
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    const user = store.getState('user');
    if (!hash || !user) return;

    const isViewingAsMember = sessionStorage.getItem('bht_viewing_as_member');

    if (user.role === 'ADMIN' && !isViewingAsMember) {
      const adminTabs = ['submissions', 'attendance', 'members'];
      if (hash.startsWith('attendance/')) {
        const sid = hash.replace('attendance/', '').trim();
        if (sid) openAdminSessionDetail(sid, false);
      } else if (hash === 'tasks') {
        switchAdminTab('attendance', false);
      } else if (adminTabs.includes(hash)) {
        switchAdminTab(hash, false);
      }
    } else {
      const memberTabs = ['dashboard', 'sessions', 'docs'];
      if (hash.startsWith('sessions/') || hash.startsWith('session/')) {
        const sid = hash.split('/')[1];
        if (sid) openMemberSessionDetail(sid, false);
      } else if (hash === 'tasks') {
        switchMemberTab('sessions', false);
      } else if (memberTabs.includes(hash)) {
        switchMemberTab(hash, false);
      }
    }
  });
});

/**
 * Hiển thị thanh Dev Helper nhỏ dưới góc phải màn hình (không che Sidebar và Logout)
 * CHỈ HIỂN THỊ KHI CHẠY Ở MÔI TRƯỜNG LOCAL (localhost, 127.0.0.1, file://)
 */
export function renderDevHelperBanner() {
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:' ||
    new URLSearchParams(window.location.search).has('dev')
  );

  // Gỡ bỏ và không hiển thị nếu không phải môi trường local
  if (!isLocal) {
    const existing = document.getElementById('dev-mode-indicator');
    if (existing) existing.remove();
    return;
  }

  const isMock = isMockMode();
  const user = store.getState('user');
  const currentMssv = localStorage.getItem('bht_mssv') || (user ? user.mssv : '');
  const isAdmin = currentMssv === '2251120001' || currentMssv === '2251120002' || (user && user.role === 'ADMIN');
  const isCollapsed = localStorage.getItem('bht_dev_collapsed') === 'true';

  const existingBanner = document.getElementById('dev-mode-indicator');
  if (existingBanner) existingBanner.remove();

  const banner = document.createElement('div');
  banner.id = 'dev-mode-indicator';
  
  // ĐẶT Ở GÓC DƯỚI BÊN PHẢI (RIGHT-3): Tuyệt đối không che Sidebar và nút Đăng xuất bên trái
  banner.className = 'fixed bottom-20 md:bottom-3 right-3 z-30 text-[11px] bg-surface/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-hairline shadow-[var(--shadow-float)] flex items-center gap-2 select-none';

  if (isCollapsed) {
    // Chế độ thu gọn mini cực kỳ gọn gàng
    banner.innerHTML = `
      <div class="flex items-center gap-1.5 cursor-pointer" data-action="toggle-dev-banner-collapse" title="Mở rộng công cụ kiểm thử Dev">
        <span class="w-2 h-2 rounded-full ${isMock ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse"></span>
        <span class="font-mono text-ink font-semibold">${isMock ? 'Mock' : 'API'}</span>
        <i class="fa-solid fa-up-right-and-down-left-from-center text-[9px] text-ink-muted ml-0.5"></i>
      </div>
    `;
  } else {
    // Chế độ đầy đủ các công cụ kiểm thử
    const roleSwitchBtnHtml = `
      <span class="text-hairline">|</span>
      <button data-action="quick-switch-role" class="text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer" title="Chuyển đổi vai trò kiểm thử tức thì trên cùng cửa sổ này">
        <i class="fa-solid fa-repeat text-[10px]"></i>
        <span>${isAdmin ? 'Xem Member' : 'Xem Admin'}</span>
      </button>
    `;

    const syncClipboardBtnHtml = isMock ? `
      <span class="text-hairline">|</span>
      <button data-action="copy-mock-data" class="text-ink-muted hover:text-ink font-medium text-[10px] flex items-center gap-1" title="Sao chép dữ liệu Mock để dán sang Cửa sổ Ẩn danh">
        <i class="fa-regular fa-copy"></i>
        <span>Copy</span>
      </button>
      <button data-action="paste-mock-data" class="text-ink-muted hover:text-ink font-medium text-[10px] flex items-center gap-1" title="Dán dữ liệu Mock từ Clipboard vào trình duyệt này">
        <i class="fa-solid fa-paste"></i>
        <span>Dán</span>
      </button>
    ` : '';

    banner.innerHTML = `
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full ${isMock ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse"></span>
        <span class="font-mono text-ink font-semibold">${isMock ? 'Mock' : 'GAS'}</span>
        <button data-action="toggle-dev-mock" class="text-ink-muted hover:text-accent underline text-[10px] ml-0.5 cursor-pointer">
          [${isMock ? 'API' : 'Mock'}]
        </button>
      </div>
      ${roleSwitchBtnHtml}
      ${syncClipboardBtnHtml}
      <span class="text-hairline">|</span>
      <button data-action="toggle-dev-banner-collapse" class="text-ink-muted hover:text-ink text-[10px] p-0.5" title="Thu nhỏ thanh công cụ">
        <i class="fa-solid fa-minus text-[9px]"></i>
      </button>
    `;
  }

  document.body.appendChild(banner);
}
