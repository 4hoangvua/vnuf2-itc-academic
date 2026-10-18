// ====================================================================
// MODULE CỔNG QUẢN TRỊ VIÊN (ADMIN PORTAL CONTROLLER)
// ====================================================================
// Áp dụng cơ chế Targeted Partial Re-rendering & Optimistic State Update:
// Thao tác ở đâu chỉ cập nhật lại đúng bảng/khối đó, không chớp giật màn hình.
// ====================================================================

import { callApi } from '../services/api.js';
import { appState, uiActionLocks, showToast, showView, showGlobalLoading, hideGlobalLoading, escapeHtml, setFormControlsDisabled, setButtonLoading, showFormError, clearFormError } from './ui.js';
import { 
  adminSessionCardTemplate, 
  adminSubmissionRowTemplate, 
  adminMemberRowTemplate, 
  emptyStateTemplate,
  renderSubmissionRow,
  renderAttendeeRow,
  renderSessionCard,
  renderMemberRow,
  renderAdminTaskItem,
  renderDocCard,
  uiTopicTagBadge,
  formatSessionDateVN,
  uiEmptyState,
  renderTopicFilterBarHtml,
  matchesTopicCategory,
  extractDynamicTopics,
  renderTableSkeleton,
  renderCardSkeleton,
  renderStatSkeleton
} from './templates.js';
import { openProjectorMode, closeProjectorMode, refreshProjectorCount } from './projector.js';
import { 
  paginate, 
  renderPagination, 
  resetPagination, 
  setPaginationPage, 
  setPaginationPageSize 
} from './pagination.js';

/**
 * Hiển thị các khối Skeleton nhấp nháy êm dịu trên các bảng và card của Admin
 */
export function renderAdminSkeletons() {
  const subTbody = document.getElementById('admin-submissions-tbody');
  if (subTbody && (!appState.submissions || appState.submissions.length === 0)) {
    subTbody.innerHTML = renderTableSkeleton(5, 6);
  }

  const sessionsList = document.getElementById('admin-sessions-list');
  if (sessionsList && (!appState.attendance || appState.attendance.length === 0)) {
    sessionsList.innerHTML = renderCardSkeleton(3);
  }

  const membersTbody = document.getElementById('admin-members-tbody');
  if (membersTbody && (!appState.members || appState.members.length === 0)) {
    membersTbody.innerHTML = renderTableSkeleton(5, 5);
  }

  const docsGrid = document.getElementById('admin-docs-grid');
  if (docsGrid && (!appState.docs || appState.docs.length === 0)) {
    docsGrid.innerHTML = renderCardSkeleton(3);
  }

  ['admin-stat-members', 'admin-stat-sessions', 'admin-stat-submissions', 'admin-stat-pending'].forEach(id => {
    const el = document.getElementById(id);
    if (el && (!el.textContent.trim() || el.textContent.trim() === '0')) {
      el.innerHTML = renderStatSkeleton();
    }
  });
}

/**
 * Khởi tạo giao diện Quản Trị Viên (chỉ chạy 1 lần khi đăng nhập hoặc F5)
 * @param {boolean} silent Nếu true thì tải ngầm không hiện overlay loading toàn màn hình
 */
export function initAdminView(silent = true) {
  showView('view-admin');
  const user = appState.user || JSON.parse(sessionStorage.getItem('bht_user') || 'null') || { hoTen: 'Ban Điều Hành', mssv: localStorage.getItem('bht_mssv') || 'Admin' };

  const nameEl = document.getElementById('admin-display-name');
  const emailEl = document.getElementById('admin-display-email');
  if (nameEl && user) nameEl.textContent = user.hoTen;
  if (emailEl && user) emailEl.textContent = user.email || user.mssv;

  // Lắng nghe các ô tìm kiếm và dropdown bộ lọc
  if (!window._adminInputsBound) {
    window._adminInputsBound = true;
    const subSearch = document.getElementById('admin-search-submission');
    const taskFilter = document.getElementById('admin-filter-task');
    const memSearch = document.getElementById('admin-search-members');
    const attSearch = document.getElementById('admin-detail-search-attendees');

    if (subSearch) subSearch.addEventListener('input', () => handleFilterSubmissions());
    if (taskFilter) taskFilter.addEventListener('change', () => handleFilterSubmissions());
    if (memSearch) memSearch.addEventListener('input', (e) => handleFilterMembers(e.target.value));
    if (attSearch) attSearch.addEventListener('input', (e) => filterSessionAttendees(e.target.value));

    // Lắng nghe tìm kiếm kho tài liệu học thuật
    const docSearch = document.getElementById('admin-search-docs');
    if (docSearch) docSearch.addEventListener('input', (e) => handleSearchAdminDocs(e.target.value));

    // Lắng nghe tìm kiếm buổi sinh hoạt & chuyên đề
    const attGridSearch = document.getElementById('admin-search-attendance');
    if (attGridSearch) attGridSearch.addEventListener('input', (e) => handleSearchAdminAttendance(e.target.value));

    // Lắng nghe chọn Tag Chuyên Đề Tùy Biến
    const attTagSelect = document.getElementById('att-input-tag');
    if (attTagSelect) {
      attTagSelect.addEventListener('change', (e) => {
        const customContainer = document.getElementById('att-custom-tag-container');
        const customInput = document.getElementById('att-input-custom-tag');
        if (customContainer) {
          if (e.target.value === 'CUSTOM') {
            customContainer.classList.remove('hidden');
            if (customInput) customInput.focus();
          } else {
            customContainer.classList.add('hidden');
          }
        }
      });
    }

    const editAttTagSelect = document.getElementById('edit-att-tag');
    if (editAttTagSelect) {
      editAttTagSelect.addEventListener('change', (e) => {
        const customContainer = document.getElementById('edit-att-custom-tag-container');
        const customInput = document.getElementById('edit-att-input-custom-tag');
        if (customContainer) {
          if (e.target.value === 'CUSTOM') {
            customContainer.classList.remove('hidden');
            if (customInput) customInput.focus();
          } else {
            customContainer.classList.add('hidden');
          }
        }
      });
    }

    // Lắng nghe chọn Phân loại Học liệu Tùy Biến
    const editDocCatSelect = document.getElementById('edit-doc-category');
    if (editDocCatSelect) {
      editDocCatSelect.addEventListener('change', (e) => {
        const customContainer = document.getElementById('edit-doc-custom-category-container');
        const customInput = document.getElementById('edit-doc-input-custom-category');
        if (customContainer) {
          if (e.target.value === 'CUSTOM') {
            customContainer.classList.remove('hidden');
            if (customInput) customInput.focus();
          } else {
            customContainer.classList.add('hidden');
          }
        }
      });
    }
  }

  // Tự động mở đúng tab theo URL Hash nếu có
  const currentHash = window.location.hash.replace('#', '');
  const validTabs = ['submissions', 'tasks', 'members', 'attendance', 'docs'];
  const initialTab = validTabs.includes(currentHash) ? currentHash : 'submissions';
  switchAdminTab(initialTab, false);

  // Hiển thị khung Skeleton trước khi dữ liệu từ máy chủ về
  renderAdminSkeletons();
  loadAdminData(silent);
}

/**
 * Tải toàn bộ dữ liệu quản trị lần đầu khi mở app hoặc refresh
 * @param {boolean} silent Nếu true thì tải ngầm không hiện overlay loading toàn màn hình
 */
export async function loadAdminData(silent = true, skipCache = false) {
  if (!silent) showGlobalLoading('Đang tải dữ liệu ban điều hành...');

  try {
    const [membersRes, tasksRes, subsRes, attRes, docsRes] = await Promise.all([
      callApi('getAllMembers', {}, { skipCache }),
      callApi('getAllTasks', {}, { skipCache }),
      callApi('getAllSubmissions', {}, { skipCache }),
      callApi('getAttendanceSessions', {}, { skipCache }),
      callApi('getAllDocuments', {}, { skipCache })
    ]);

    hideGlobalLoading();

    if (membersRes && membersRes.success) appState.members = membersRes.data || [];
    if (tasksRes && tasksRes.success) appState.tasks = tasksRes.data || [];
    if (subsRes && subsRes.success) appState.submissions = subsRes.data || [];
    if (attRes && attRes.success) appState.attendance = attRes.data || [];
    if (docsRes && docsRes.success) {
      appState.docs = docsRes.data || [];
      appState.documents = appState.docs;
    }

    renderAdminDashboard();

    // Hỗ trợ khôi phục view chi tiết hoặc mở Deep Link URL (#attendance/MEET_...)
    if (currentAdminActiveSessionId) {
      const activeSession = (appState.attendance || []).find(s => 
        String(s.SessionID || '').trim().toUpperCase() === String(currentAdminActiveSessionId).trim().toUpperCase()
      );
      if (activeSession) {
        openAdminSessionDetail(activeSession.SessionID, false);
      }
    } else {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('attendance/')) {
        const sid = hash.replace('attendance/', '').trim();
        if (sid) {
          const match = (appState.attendance || []).find(s => 
            String(s.SessionID || '').trim().toUpperCase() === String(sid).trim().toUpperCase()
          );
          if (match) {
            openAdminSessionDetail(match.SessionID, false);
          }
        }
      }
    }
  } catch (err) {
    hideGlobalLoading();
    console.error('Lỗi tải dữ liệu quản trị:', err);
    showToast('Lỗi tải dữ liệu Admin: ' + (err.message || err.toString()), 'error');
  }
}

/**
 * Nút làm mới dữ liệu thủ công (bỏ qua cache để luôn lấy dữ liệu mới nhất từ máy chủ)
 */
export function refreshAdminData() {
  loadAdminData(false, true);
}

/**
 * Cập nhật các con số thống kê trên thanh Dashboard (không làm giật layout)
 */
export function updateAdminStats() {
  const members = appState.members || [];
  const tasks = appState.tasks || [];
  const subs = appState.submissions || [];

  const openTasks = tasks.filter(t => String(t.TrangThai || '').toLowerCase() === 'open');
  const pendingSubs = subs.filter(s => (s.TrangThaiDuyet || 'Pending') === 'Pending');
  const approvedSubs = subs.filter(s => s.TrangThaiDuyet === 'Approved');

  const mEl = document.getElementById('admin-stat-members');
  const tEl = document.getElementById('admin-stat-tasks');
  const pEl = document.getElementById('admin-stat-pending');
  const bEl = document.getElementById('admin-badge-pending-count');
  const aEl = document.getElementById('admin-stat-approved');

  if (mEl) mEl.textContent = members.length;
  if (tEl) tEl.textContent = openTasks.length;
  if (pEl) pEl.textContent = pendingSubs.length;
  if (bEl) bEl.textContent = pendingSubs.length;
  if (aEl) aEl.textContent = approvedSubs.length;
}

/**
 * Chuyển tab trong giao diện Quản trị kèm đồng bộ URL Hash
 * @param {'submissions'|'attendance'|'members'} tab
 */
export function switchAdminTab(tab, updateHash = true) {
  const tabs = ['submissions', 'attendance', 'members', 'docs'];
  // Nếu truyền 'tasks' từ URL hash cũ hoặc bookmark, tự động chuyển sang 'attendance'
  const targetTab = (tab === 'tasks') ? 'attendance' : (tabs.includes(tab) ? tab : 'submissions');

  // 1. Luôn ẩn Sub-view Chi tiết Buổi học khi chuyển tab menu sidebar
  const detailSection = document.getElementById('admin-tab-session-detail');
  if (detailSection) detailSection.classList.add('hidden');
  closeAdminPinModal();
  currentAdminActiveSessionId = null;

  // 2. Ẩn tất cả các tab chính và bỏ active button
  tabs.forEach(t => {
    const section = document.getElementById('admin-tab-' + t);
    if (section) section.classList.add('hidden');
    const btn = document.getElementById('admin-tab-btn-' + t);
    if (btn) btn.classList.remove('active');
  });

  const activeSec = document.getElementById('admin-tab-' + targetTab);
  if (activeSec) activeSec.classList.remove('hidden');
  const activeBtn = document.getElementById('admin-tab-btn-' + targetTab);
  if (activeBtn) activeBtn.classList.add('active');

  // Đồng bộ URL Hash lên trình duyệt
  if (updateHash && window.location.hash !== '#' + targetTab) {
    history.replaceState(null, '', '#' + targetTab);
  }

  // Cập nhật tab mobile bottom bar
  document.querySelectorAll('[data-mobile-admin-tab]').forEach(btn => {
    const isTarget = btn.getAttribute('data-mobile-admin-tab') === targetTab;
    btn.className = isTarget 
      ? 'flex flex-col items-center justify-center gap-1 py-1 text-xs text-accent font-semibold transition-colors'
      : 'flex flex-col items-center justify-center gap-1 py-1 text-xs text-ink-muted hover:text-ink font-medium transition-colors';
  });
}

/**
 * Chuyển nhanh sang tab Duyệt bài nộp và lọc đúng bài của buổi học
 */
export function filterAndSwitchToSubmissions(taskId) {
  switchAdminTab('submissions');
  const taskSelect = document.getElementById('admin-filter-task');
  if (taskSelect && taskId) {
    taskSelect.value = taskId;
    handleFilterSubmissions();
  }
}

/**
 * Render toàn bộ Dashboard Quản trị lần đầu
 */
export function renderAdminDashboard() {
  updateAdminStats();

  // Điền dropdown lọc theo Task
  const taskSelect = document.getElementById('admin-filter-task');
  if (taskSelect) {
    const tasks = appState.tasks || [];
    taskSelect.innerHTML = '<option value="ALL">Tất cả bài tập / buổi học</option>' + 
      tasks.map(t => `<option value="${t.TaskID}">[${t.TaskID}] ${escapeHtml(t.TieuDe)}</option>`).join('');
  }

  renderAdminSubmissionsTable();
  renderAdminAttendanceGrid();
  renderAdminMembersTable();
  renderAdminDocsGrid();
}

// ====================================================================
// 1. PHÂN HỆ DUYỆT BÀI NỘP
// ====================================================================

export function setSubmissionStatusFilter(status) {
  appState.subFilterStatus = status;
  ['all', 'pending', 'approved', 'rejected'].forEach(s => {
    const btn = document.getElementById('btn-sub-filter-' + s);
    if (btn) {
      if (s === status.toLowerCase()) {
        btn.className = 'bht-btn bht-btn-xs bht-btn-primary';
      } else {
        btn.className = 'bht-btn bht-btn-xs bht-btn-ghost text-ink-muted';
      }
    }
  });
  resetPagination('admin-submissions');
  renderAdminSubmissionsTable();
}

export function handleFilterSubmissions() {
  const searchInput = document.getElementById('admin-search-submission');
  const taskSelect = document.getElementById('admin-filter-task');
  appState.subSearchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  appState.subFilterTask = taskSelect ? taskSelect.value : 'ALL';
  resetPagination('admin-submissions');
  renderAdminSubmissionsTable();
}

export function renderAdminSubmissionsTable() {
  const tbody = document.getElementById('admin-submissions-table-body');
  const pagEl = document.getElementById('admin-submissions-pagination');
  if (!tbody) return;

  const subs = appState.submissions || [];
  const statusFilter = appState.subFilterStatus || 'ALL';
  const taskFilter = appState.subFilterTask || 'ALL';
  const search = appState.subSearchQuery || '';

  const filtered = subs.filter(s => {
    const matchStatus = (statusFilter === 'ALL') || (String(s.TrangThaiDuyet || 'Pending').toLowerCase() === statusFilter.toLowerCase());
    const matchTask = (taskFilter === 'ALL') || (String(s.TaskID) === taskFilter);
    const matchSearch = !search || 
      String(s.MSSV || '').toLowerCase().includes(search) || 
      String(s.HoTen || '').toLowerCase().includes(search) || 
      String(s.TenFile || '').toLowerCase().includes(search);
    return matchStatus && matchTask && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = uiEmptyState({
      isTableRow: true,
      colspan: 5,
      title: 'Không tìm thấy bài nộp nào phù hợp!'
    });
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const { pagedItems } = paginate('admin-submissions', filtered, {
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    onPageChange: () => renderAdminSubmissionsTable()
  });

  tbody.innerHTML = pagedItems.map(s => {
    const isProcessing = uiActionLocks.activeReviewSubIds.has(s.SubID || s.SubmissionID);
    return renderSubmissionRow(s, { showTaskColumn: true, isProcessing });
  }).join('');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('admin-submissions');
  }
}

export async function handleReviewSubmission(subId, status) {
  if (uiActionLocks.activeReviewSubIds.has(subId)) return;

  const feedbackInput = document.getElementById(`feedback-${subId}`);
  const feedback = feedbackInput ? feedbackInput.value.trim() : '';

  uiActionLocks.activeReviewSubIds.add(subId);
  renderAdminSubmissionsTable();

  try {
    const res = await callApi('reviewSubmission', {
      subId: subId,
      trangThaiDuyet: status,
      feedback: feedback
    });

    uiActionLocks.activeReviewSubIds.delete(subId);

    if (res && res.success) {
      showToast(res.message, 'success');
      // Cập nhật State cục bộ
      const target = (appState.submissions || []).find(s => s.SubID === subId);
      if (target) {
        target.TrangThaiDuyet = status;
        target.Feedback = feedback;
      }
      // CHỈ VẼ LẠI BẢNG BÀI NỘP VÀ SỐ LIỆU (KHÔNG TẢI LẠI TRANG)
      renderAdminSubmissionsTable();
      updateAdminStats();
    } else {
      showToast((res && res.message) ? res.message : 'Không thể cập nhật đánh giá!', 'error');
      renderAdminSubmissionsTable();
    }
  } catch (err) {
    uiActionLocks.activeReviewSubIds.delete(subId);
    showToast('Lỗi: ' + (err.message || err.toString()), 'error');
    renderAdminSubmissionsTable();
  }
}

/**
 * Mở Drawer thẩm định bài nộp chi tiết
 * @param {string} subId ID bài nộp
 */
export function openReviewDrawer(subId) {
  const subs = appState.submissions || [];
  const target = subs.find(s => (s.SubID || s.SubmissionID) === subId);
  if (!target) return;

  const drawer = document.getElementById('drawer-review');
  const backdrop = document.getElementById('drawer-review-backdrop');
  if (!drawer || !backdrop) return;

  const idInput = document.getElementById('drawer-sub-id');
  const nameEl = document.getElementById('drawer-member-name');
  const mssvEl = document.getElementById('drawer-member-mssv');
  const avatarEl = document.getElementById('drawer-member-avatar');
  const statusEl = document.getElementById('drawer-sub-status');
  const taskIdEl = document.getElementById('drawer-task-id');
  const fileNameEl = document.getElementById('drawer-file-name');
  const submitTimeEl = document.getElementById('drawer-submit-time');
  const driveLinkEl = document.getElementById('drawer-drive-link');
  const feedbackInput = document.getElementById('drawer-feedback-input');

  const hoTen = target.HoTen || `Sinh viên ${target.MSSV}`;
  if (idInput) idInput.value = target.SubID || target.SubmissionID || '';
  if (nameEl) nameEl.textContent = hoTen;
  if (mssvEl) mssvEl.textContent = target.MSSV || '';
  if (avatarEl) avatarEl.textContent = (hoTen.split(' ').pop() || 'SV').slice(0, 2).toUpperCase();
  if (statusEl) {
    statusEl.textContent = target.TrangThaiDuyet === 'Approved' ? 'Đã duyệt đạt' : (target.TrangThaiDuyet === 'Rejected' ? 'Cần sửa lại' : 'Chờ duyệt');
    statusEl.className = `bht-badge ${target.TrangThaiDuyet === 'Approved' ? 'bht-badge-ok' : (target.TrangThaiDuyet === 'Rejected' ? 'bht-badge-err' : 'bht-badge-warn')} text-[10px]`;
  }
  if (taskIdEl) taskIdEl.textContent = target.TaskID || '';
  if (fileNameEl) fileNameEl.textContent = target.TenFile || 'Tệp nộp';
  if (submitTimeEl) submitTimeEl.textContent = target.ThoiGianNop ? target.ThoiGianNop.replace('T', ' ') : 'Vừa xong';
  if (driveLinkEl) driveLinkEl.href = target.DriveLink || '#';
  if (feedbackInput) feedbackInput.value = target.Feedback || '';

  backdrop.classList.add('active');
  drawer.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Đóng Drawer thẩm định bài nộp
 */
export function closeReviewDrawer() {
  const drawer = document.getElementById('drawer-review');
  const backdrop = document.getElementById('drawer-review-backdrop');
  if (drawer) drawer.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Gửi đánh giá từ Review Drawer
 * @param {string} status 'Approved' | 'Rejected'
 */
export async function handleDrawerReviewSubmit(status) {
  const idInput = document.getElementById('drawer-sub-id');
  const feedbackInput = document.getElementById('drawer-feedback-input');
  if (!idInput || !idInput.value) return;

  const subId = idInput.value;
  const feedback = feedbackInput ? feedbackInput.value.trim() : '';

  const approveBtn = document.getElementById('drawer-btn-approve');
  const rejectBtn = document.getElementById('drawer-btn-reject');
  const activeBtn = (status === 'DAT') ? approveBtn : rejectBtn;
  if (activeBtn) setButtonLoading(activeBtn, true);
  if (approveBtn && activeBtn !== approveBtn) approveBtn.disabled = true;
  if (rejectBtn && activeBtn !== rejectBtn) rejectBtn.disabled = true;

  try {
    const res = await callApi('reviewSubmission', {
      subId: subId,
      trangThaiDuyet: status,
      feedback: feedback
    });

    if (activeBtn) setButtonLoading(activeBtn, false);
    if (approveBtn) approveBtn.disabled = false;
    if (rejectBtn) rejectBtn.disabled = false;

    if (res && res.success) {
      showToast(res.message || 'Đã lưu đánh giá bài nộp!', 'success');
      const target = (appState.submissions || []).find(s => (s.SubID || s.SubmissionID) === subId);
      if (target) {
        target.TrangThaiDuyet = status;
        target.Feedback = feedback;
      }
      closeReviewDrawer();
      renderAdminSubmissionsTable();
      updateAdminStats();
    } else {
      showToast((res && res.message) ? res.message : 'Không thể lưu đánh giá!', 'error');
    }
  } catch (err) {
    if (activeBtn) setButtonLoading(activeBtn, false);
    if (approveBtn) approveBtn.disabled = false;
    if (rejectBtn) rejectBtn.disabled = false;
    showToast('Lỗi: ' + (err.message || err.toString()), 'error');
  }
}

// ====================================================================
// 2. PHÂN HỆ QUẢN LÝ NHIỆM VỤ
// ====================================================================

export function renderAdminTasksGrid() {
  const container = document.getElementById('admin-tasks-grid');
  if (!container) return;

  const tasks = appState.tasks || [];

  if (tasks.length === 0) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-ink-muted">Chưa có nhiệm vụ nào được tạo!</div>`;
    return;
  }

  container.innerHTML = tasks.map(t => {
    const isOpen = String(t.TrangThai || '').toLowerCase() === 'open';
    const isProcessing = uiActionLocks.activeTaskToggleIds.has(t.TaskID);

    return `
      <div class="bht-card p-5 flex flex-col justify-between hover:border-strong transition-colors">
        <div>
          <div class="flex items-start justify-between">
            <span class="bht-badge-mono text-accent font-bold">${t.TaskID}</span>
            <span class="bht-badge ${isOpen ? 'bht-badge-ok' : 'bg-subtle text-ink-faint'}">
              ${isOpen ? 'Đang mở' : 'Đã đóng'}
            </span>
          </div>
          <h4 class="bht-heading-serif text-sm sm:text-base font-semibold text-ink mt-2">${escapeHtml(t.TieuDe)}</h4>
          <p class="text-xs text-ink-muted mt-1 line-clamp-2 leading-relaxed">${escapeHtml(t.MoTa || '')}</p>
        </div>
        <div class="mt-4 pt-3 border-hairline flex items-center justify-between text-xs border-t">
          <span class="text-ink-faint font-mono text-[11px]">Hạn: ${t.Deadline ? t.Deadline.replace('T', ' ') : 'N/A'}</span>
          <button 
            data-action="toggle-task-status"
            data-id="${t.TaskID}"
            data-status="${isOpen ? 'Closed' : 'Open'}"
            ${isProcessing ? 'disabled' : ''}
            class="bht-btn bht-btn-secondary bht-btn-xs ${isProcessing ? 'opacity-60 pointer-events-none' : ''}"
          >
            <i class="fa-solid ${isProcessing ? 'fa-circle-notch fa-spin' : (isOpen ? 'fa-lock' : 'fa-lock-open')} text-xs mr-1"></i>
            <span>${isOpen ? 'Đóng nhiệm vụ' : 'Mở lại'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export async function handleToggleTaskStatus(taskId, targetStatus) {
  if (uiActionLocks.activeTaskToggleIds.has(taskId)) return;

  uiActionLocks.activeTaskToggleIds.add(taskId);
  renderAdminTasksGrid();

  try {
    const res = await callApi('toggleTaskStatus', {
      taskId: taskId,
      targetStatus: targetStatus
    });

    uiActionLocks.activeTaskToggleIds.delete(taskId);

    if (res && res.success) {
      showToast(res.message, 'success');
      // Cập nhật State cục bộ
      const target = (appState.tasks || []).find(t => t.TaskID === taskId);
      if (target) target.TrangThai = targetStatus;
      // CHỈ VẼ LẠI GRID NHIỆM VỤ (KHÔNG TẢI LẠI TRANG)
      renderAdminTasksGrid();
      updateAdminStats();
    } else {
      showToast((res && res.message) ? res.message : 'Không thể cập nhật nhiệm vụ!', 'error');
      renderAdminTasksGrid();
    }
  } catch (err) {
    uiActionLocks.activeTaskToggleIds.delete(taskId);
    showToast('Lỗi: ' + (err.message || err.toString()), 'error');
    renderAdminTasksGrid();
  }
}

export function openCreateTaskModal(defaultSessionId = 'GENERAL') {
  const form = document.getElementById('form-create-task');
  if (form) form.reset();
  setFormControlsDisabled(form, false);

  const assigneeInput = document.getElementById('task-input-assignee');
  if (assigneeInput) assigneeInput.value = 'ALL';

  const sessionSelect = document.getElementById('task-input-session');
  if (sessionSelect) {
    const sessions = appState.attendance || [];
    sessionSelect.innerHTML = `
      <option value="GENERAL">Nhiệm vụ chung (Không thuộc buổi sinh hoạt nào)</option>
      ${sessions.map(s => `
        <option value="${s.SessionID}" ${s.SessionID === defaultSessionId ? 'selected' : ''}>
          ${s.SessionID} - ${escapeHtml(s.TenBuoiHop)}
        </option>
      `).join('')}
    `;
  }

  const modal = document.getElementById('modal-create-task');
  if (modal) modal.classList.remove('hidden');
}

export function openCreateTaskForSession(sessionId) {
  openCreateTaskModal(sessionId);
}

export function closeCreateTaskModal() {
  const modal = document.getElementById('modal-create-task');
  if (modal) modal.classList.add('hidden');
}

export async function handleCreateTask(e) {
  if (e && e.preventDefault) e.preventDefault();

  const form = document.getElementById('form-create-task');
  const btn = document.getElementById('btn-submit-create-task');
  const cancelBtn = document.getElementById('btn-cancel-create-task');

  const titleInput = document.getElementById('task-input-title');
  const deadlineInput = document.getElementById('task-input-deadline');
  const descInput = document.getElementById('task-input-desc');
  const assigneeInput = document.getElementById('task-input-assignee');
  const sessionSelect = document.getElementById('task-input-session');

  const tieuDe = titleInput ? titleInput.value.trim() : '';
  const deadline = deadlineInput ? deadlineInput.value : '';
  const moTa = descInput ? descInput.value.trim() : '';
  const nguoiNhan = assigneeInput ? assigneeInput.value.trim() || 'ALL' : 'ALL';
  const sessionId = sessionSelect ? sessionSelect.value : 'GENERAL';

  clearFormError(form);

  if (!tieuDe) {
    showFormError(form, 'Vui lòng nhập tiêu đề bài tập / nhiệm vụ!', titleInput);
    return;
  }

  if (!deadline) {
    showFormError(form, 'Vui lòng chọn hạn nộp (Deadline) cho bài tập!', deadlineInput);
    return;
  }

  setFormControlsDisabled(form, true);
  if (cancelBtn) cancelBtn.disabled = true;
  if (btn) setButtonLoading(btn, true);

  const payload = {
    tieuDe,
    moTa,
    nguoiNhan,
    deadline,
    sessionId
  };

  try {
    const res = await callApi('createTask', payload);

    setFormControlsDisabled(form, false);
    if (cancelBtn) cancelBtn.disabled = false;
    if (btn) setButtonLoading(btn, false);

    if (res && res.success) {
      showToast(res.message, 'success');
      closeCreateTaskModal();

      // Thêm ngay nhiệm vụ mới vào State
      const newTask = {
        TaskID: res.taskId || ('TASK_' + Date.now()),
        TieuDe: payload.tieuDe,
        MoTa: payload.moTa,
        NguoiNhan: payload.nguoiNhan,
        Deadline: payload.deadline,
        FolderID: res.folderId || '',
        TrangThai: 'Open',
        SessionID: payload.sessionId
      };
      appState.tasks.unshift(newTask);

      // CẬP NHẬT CỤC BỘ TẠI CHỖ
      renderAdminTasksGrid();
      updateAdminStats();
    } else {
      showFormError(form, (res && res.message) ? res.message : 'Không thể tạo nhiệm vụ!');
    }
  } catch (err) {
    setFormControlsDisabled(form, false);
    if (cancelBtn) cancelBtn.disabled = false;
    if (btn) setButtonLoading(btn, false);
    showFormError(form, 'Lỗi: ' + (err.message || err.toString()));
  }
}

// ====================================================================
// 3. PHÂN HỆ QUẢN LÝ NHÂN SỰ
// ====================================================================

export function renderAdminMembersTable() {
  const tbody = document.getElementById('admin-members-table-body');
  const pagEl = document.getElementById('admin-members-pagination');
  if (!tbody) return;

  const members = appState.members || [];
  const query = (appState.memberSearchQuery || '').toLowerCase().trim();

  const filtered = query ? members.filter(m => {
    const mssv = String(m.MSSV || '').toLowerCase();
    const name = String(m.HoTen || '').toLowerCase();
    const email = String(m.Email || '').toLowerCase();
    return mssv.includes(query) || name.includes(query) || email.includes(query);
  }) : members;

  if (filtered.length === 0) {
    tbody.innerHTML = uiEmptyState({
      isTableRow: true,
      colspan: 6,
      title: query ? `Không tìm thấy thành viên nào khớp với "${escapeHtml(query)}"` : 'Chưa có thành viên nào!'
    });
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const { pagedItems } = paginate('admin-members', filtered, {
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    onPageChange: () => renderAdminMembersTable()
  });

  tbody.innerHTML = pagedItems.map(m => {
    const isStatusBusy = uiActionLocks.activeMemberToggleIds.has(m.MSSV);
    const isResetBusy = uiActionLocks.activeResetEmailMssvs.has(m.MSSV);
    return renderMemberRow(m, { isStatusBusy, isResetBusy });
  }).join('');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('admin-members');
  }
}

export function handleFilterMembers(query) {
  appState.memberSearchQuery = query || '';
  resetPagination('admin-members');
  renderAdminMembersTable();
}

export function openAddMemberModal() {
  const form = document.getElementById('form-add-member');
  if (form) form.reset();
  setFormControlsDisabled(form, false);
  const modal = document.getElementById('modal-add-member');
  if (modal) modal.classList.remove('hidden');
}

export function closeAddMemberModal() {
  const modal = document.getElementById('modal-add-member');
  if (modal) modal.classList.add('hidden');
}

export async function handleAddMember(e) {
  if (e && e.preventDefault) e.preventDefault();

  const form = document.getElementById('form-add-member');
  const btn = document.getElementById('btn-submit-add-member');
  const cancelBtn = document.getElementById('btn-cancel-add-member');

  const mssvInput = document.getElementById('member-input-mssv');
  const hoTenInput = document.getElementById('member-input-hoten');
  const mssv = mssvInput ? mssvInput.value.trim() : '';
  const hoTen = hoTenInput ? hoTenInput.value.trim() : '';
  const role = document.getElementById('member-input-role')?.value || 'MEMBER';

  clearFormError(form);

  if (!mssv) {
    showFormError(form, 'Vui lòng nhập Mã số sinh viên (MSSV)!', mssvInput);
    return;
  }

  if (!/^\d{8,20}$/.test(mssv)) {
    showFormError(form, 'Mã số sinh viên (MSSV) phải gồm từ 8 đến 20 chữ số!', mssvInput);
    return;
  }

  if (!hoTen) {
    showFormError(form, 'Vui lòng nhập Họ và Tên thành viên!', hoTenInput);
    return;
  }

  const isDuplicate = (appState.members || []).some(m => String(m.MSSV).trim() === mssv);
  if (isDuplicate) {
    showFormError(form, `MSSV ${mssv} đã tồn tại trong danh sách thành viên!`, mssvInput);
    return;
  }

  setFormControlsDisabled(form, true);
  if (cancelBtn) cancelBtn.disabled = true;
  if (btn) setButtonLoading(btn, true);

  try {
    const res = await callApi('addMember', { mssv, hoTen, role });

    setFormControlsDisabled(form, false);
    if (cancelBtn) cancelBtn.disabled = false;
    if (btn) setButtonLoading(btn, false);

    if (res && res.success) {
      showToast(res.message, 'success');
      closeAddMemberModal();

      // CẬP NHẬT TRỰC TIẾP STATE NHÂN SỰ
      const newMem = {
        MSSV: mssv,
        HoTen: hoTen,
        Email: '',
        Role: role,
        TrangThai: 'Active',
        NgayThamGia: new Date().toLocaleDateString('vi-VN')
      };
      appState.members.unshift(newMem);

      // CHỈ VẼ LẠI BẢNG NHÂN SỰ (SIÊU NHẸ)
      renderAdminMembersTable();
      updateAdminStats();
    } else {
      showFormError(form, (res && res.message) ? res.message : 'Không thể thêm thành viên!', mssvInput);
    }
  } catch (err) {
    setFormControlsDisabled(form, false);
    if (cancelBtn) cancelBtn.disabled = false;
    if (btn) setButtonLoading(btn, false);
    showFormError(form, 'Lỗi: ' + (err.message || err.toString()));
  }
}

export async function handleResetMemberEmail(mssv) {
  if (uiActionLocks.activeResetEmailMssvs.has(mssv)) return;
  if (!confirm(`Bạn có chắc muốn xóa liên kết Gmail của sinh viên MSSV ${mssv}?`)) return;

  uiActionLocks.activeResetEmailMssvs.add(mssv);
  renderAdminMembersTable();

  try {
    const res = await callApi('resetMemberEmail', { mssv });
    uiActionLocks.activeResetEmailMssvs.delete(mssv);

    if (res && res.success) {
      showToast(res.message, 'success');
      // CẬP NHẬT STATE CỤC BỘ
      const m = (appState.members || []).find(x => x.MSSV === mssv);
      if (m) m.Email = '';
      renderAdminMembersTable();
    } else {
      showToast((res && res.message) ? res.message : 'Không thể đặt lại email!', 'error');
      renderAdminMembersTable();
    }
  } catch (err) {
    uiActionLocks.activeResetEmailMssvs.delete(mssv);
    showToast('Lỗi: ' + (err.message || err.toString()), 'error');
    renderAdminMembersTable();
  }
}

/**
 * Đổi trạng thái thành viên (Active <-> Inactive) với Partial In-Place Update
 */
export async function handleToggleMemberStatus(mssv, status) {
  if (uiActionLocks.activeMemberToggleIds.has(mssv)) return;

  // Khóa nút tại chỗ hiển thị spinner
  uiActionLocks.activeMemberToggleIds.add(mssv);
  renderAdminMembersTable();

  try {
    const res = await callApi('toggleMemberStatus', { mssv, status });
    uiActionLocks.activeMemberToggleIds.delete(mssv);

    if (res && res.success) {
      showToast(res.message, 'success');
      // CẬP NHẬT TRỰC TIẾP TRONG BỘ NHỚ LOCAL
      const m = (appState.members || []).find(x => x.MSSV === mssv);
      if (m) m.TrangThai = status;

      // CHỈ RENDER LẠI BẢNG NHÂN SỰ (KHÔNG LOAD LẠI TOÀN TRANG!)
      renderAdminMembersTable();
      updateAdminStats();
    } else {
      showToast((res && res.message) ? res.message : 'Không thể cập nhật trạng thái!', 'error');
      renderAdminMembersTable();
    }
  } catch (err) {
    uiActionLocks.activeMemberToggleIds.delete(mssv);
    showToast('Lỗi: ' + (err.message || err.toString()), 'error');
    renderAdminMembersTable();
  }
}

// ====================================================================
// 4. PHÂN HỆ BUỔI SINH HOẠT & ĐIỂM DANH PIN
// ====================================================================

export function handleFilterAdminAttendance(cat) {
  appState.adminAttendanceCategory = cat || 'ALL';
  resetPagination('admin-attendance');
  renderAdminAttendanceGrid();
}

export function handleSearchAdminAttendance(query) {
  appState.adminAttendanceSearchQuery = String(query || '').trim();
  resetPagination('admin-attendance');
  renderAdminAttendanceGrid();
}

export function renderAdminAttendanceGrid() {
  const container = document.getElementById('admin-attendance-grid');
  const pagEl = document.getElementById('admin-attendance-pagination');
  if (!container) return;

  const sessions = appState.attendance || [];
  const cat = appState.adminAttendanceCategory || 'ALL';
  const search = (appState.adminAttendanceSearchQuery || '').toLowerCase().trim();

  // 1. Đồng bộ dải nút Filter Pills động tái sử dụng
  const filterContainer = document.getElementById('admin-attendance-category-filters');
  if (filterContainer) {
    filterContainer.innerHTML = renderTopicFilterBarHtml({
      activeCat: cat,
      items: sessions,
      tagField: 'TagChuyenDe',
      actionName: 'filter-admin-attendance'
    });
  }

  const filtered = sessions.filter(s => {
    // 1. Lọc theo danh mục / tag
    if (cat !== 'ALL' && !matchesTopicCategory(s.TagChuyenDe, cat)) {
      return false;
    }

    // 2. Lọc theo từ khóa tìm kiếm
    if (search) {
      const matchText = (
        (s.TenBuoiHop || '') + ' ' +
        (s.PhongHoc || '') + ' ' +
        (s.NoiDungChuyenDe || '') + ' ' +
        (s.TagChuyenDe || '') + ' ' +
        (s.SessionID || '')
      ).toLowerCase();
      if (!matchText.includes(search)) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    const isFiltered = (cat !== 'ALL' || Boolean(search));
    const msg = isFiltered 
      ? 'Không tìm thấy buổi sinh hoạt nào phù hợp với bộ lọc hoặc từ khóa!' 
      : 'Chưa có buổi sinh hoạt nào được tạo! Bấm "Tạo buổi sinh hoạt mới" để bắt đầu.';
    container.innerHTML = emptyStateTemplate(msg, 'fa-calendar-xmark');
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const allTasks = appState.tasks || [];

  const { pagedItems } = paginate('admin-attendance', filtered, {
    pageSize: 6,
    pageSizeOptions: [4, 6, 10, 20],
    onPageChange: () => renderAdminAttendanceGrid()
  });

  container.innerHTML = pagedItems.map(s => {
    const isOpen = String(s.TrangThai || '').toLowerCase() === 'open';
    let attendeeCount = 0;
    try { attendeeCount = JSON.parse(s.DS_CoMat || '[]').length; } catch (e) {
      attendeeCount = s.DS_CoMat ? s.DS_CoMat.split(',').length : 0;
    }

    const task = s.BaiTap || allTasks.find(t => t.SessionID === s.SessionID);
    return adminSessionCardTemplate(s, { attendeeCount, isOpen, taskTitle: task ? task.TieuDe : '' });
  }).join('');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('admin-attendance');
  }
}

export function generateRandomPin() {
  const pin = String(Math.floor(100000 + Math.random() * 900000));
  const pinInput = document.getElementById('att-input-pin');
  if (pinInput) pinInput.value = pin;
  return pin;
}

export function populateAttendanceTagSelect(selectId, selectedValue = 'GENERAL') {
  const select = document.getElementById(selectId);
  if (!select) return;

  const sessions = appState.attendance || [];
  const baseOptions = [
    { value: 'GENERAL', label: 'Sinh hoạt & Học vụ chung' },
    { value: 'CHUAN_DAU_RA', label: 'Chuẩn đầu ra MOS / IC3' },
    { value: 'WORD_DO_AN', label: 'Đồ án & Luận văn Word' },
    { value: 'EXCEL_DATA', label: 'Excel & Xử lý số liệu' },
    { value: 'AI_TOOLS', label: 'Kỹ năng AI thực chiến' },
    { value: 'OLYMPIC', label: 'Olympic & Thuật toán' }
  ];

  const dynamicTopics = extractDynamicTopics(sessions, 'TagChuyenDe');
  const customTopics = dynamicTopics.filter(t => t.isCustom);

  let html = baseOptions.map(opt => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join('\n');
  if (customTopics.length > 0) {
    html += '\n<optgroup label="── Chủ đề đã tạo trước đó ──">';
    customTopics.forEach(t => {
      html += `\n<option value="${escapeHtml(t.id)}">${escapeHtml(t.label)}</option>`;
    });
    html += '\n</optgroup>';
  }
  html += '\n<option value="CUSTOM">+ Thêm chủ đề mới (Tự nhập)...</option>';
  select.innerHTML = html;
  select.value = selectedValue;
}

export function openCreateAttendanceModal() {
  const form = document.getElementById('form-create-attendance');
  if (form) form.reset();
  setFormControlsDisabled(form, false);
  generateRandomPin();
  populateAttendanceTagSelect('att-input-tag', 'GENERAL');

  const customContainer = document.getElementById('att-custom-tag-container');
  const customInput = document.getElementById('att-input-custom-tag');
  if (customContainer) customContainer.classList.add('hidden');
  if (customInput) customInput.value = '';

  const modal = document.getElementById('modal-create-attendance');
  if (modal) modal.classList.remove('hidden');
}

export function closeCreateAttendanceModal() {
  const modal = document.getElementById('modal-create-attendance');
  if (modal) modal.classList.add('hidden');
}

export async function handleCreateAttendanceSession(e) {
  if (e && e.preventDefault) e.preventDefault();

  const form = document.getElementById('form-create-attendance');
  const btn = document.getElementById('btn-submit-attendance');
  const cancelBtn = document.getElementById('btn-cancel-create-attendance');

  const titleInput = document.getElementById('att-input-title');
  const pinInput = document.getElementById('att-input-pin');

  const title = titleInput ? titleInput.value.trim() : '';
  const tagSelect = document.getElementById('att-input-tag');
  let tag = tagSelect ? tagSelect.value : 'GENERAL';
  if (tag === 'CUSTOM') {
    const customInput = document.getElementById('att-input-custom-tag');
    const customVal = customInput ? customInput.value.trim() : '';
    if (!customVal) {
      showFormError(form, 'Vui lòng nhập tên chủ đề tùy chỉnh!', customInput);
      return;
    }
    tag = customVal;
  }
  const room = document.getElementById('att-input-room') ? document.getElementById('att-input-room').value.trim() : 'Phòng Lab 02 - Tầng 3 Nhà A3';
  const date = document.getElementById('att-input-date') ? document.getElementById('att-input-date').value : '';
  const desc = document.getElementById('att-input-desc') ? document.getElementById('att-input-desc').value.trim() : '';
  const linkInput = document.getElementById('att-input-link');
  const link = linkInput ? linkInput.value.trim() : '';
  const pin = pinInput ? pinInput.value.trim() : '';

  clearFormError(form);

  if (!title) {
    showFormError(form, 'Vui lòng nhập tên buổi sinh hoạt / chuyên đề!', titleInput);
    return;
  }

  if (!/^\d{6}$/.test(pin)) {
    showFormError(form, 'Mã PIN điểm danh phải gồm đúng 6 chữ số!', pinInput);
    return;
  }

  if (link && !/^https?:\/\//i.test(link)) {
    showFormError(form, 'Link tài liệu phải là một đường dẫn URL hợp lệ (bắt đầu bằng http:// hoặc https://)!', linkInput);
    return;
  }

  setFormControlsDisabled(form, true);
  if (cancelBtn) cancelBtn.disabled = true;
  if (btn) setButtonLoading(btn, true);

  try {
    const res = await callApi('createAttendanceSession', {
      tenBuoiHop: title,
      maPin: pin,
      ngayDienRa: date,
      tagChuyenDe: tag,
      phongHoc: room,
      noiDungChuyenDe: desc,
      linkTaiLieu: link
    });

    setFormControlsDisabled(form, false);
    if (cancelBtn) cancelBtn.disabled = false;
    if (btn) setButtonLoading(btn, false);

    if (res && res.success) {
      closeCreateAttendanceModal();

      const newSession = {
        SessionID: res.sessionId || ('MEET_' + Date.now()),
        TenBuoiHop: title,
        MaPin: pin,
        TrangThai: 'Open',
        DS_CoMat: '[]',
        NgayDienRa: date,
        TagChuyenDe: tag,
        PhongHoc: room,
        NoiDungChuyenDe: desc,
        LinkTaiLieu: link,
        BaiTap: null
      };
      appState.attendance.unshift(newSession);
      appState.adminAttendanceCategory = 'ALL';
      appState.adminAttendanceSearchQuery = '';
      resetPagination('admin-attendance');
      renderAdminAttendanceGrid();
      showToast('Đã tạo buổi học! Bạn có thể thiết lập mã PIN và bài tập ngay.', 'success');

      // Tự động mở modal chi tiết buổi học vừa tạo
      openAdminSessionDetailModal(newSession.SessionID);
    } else {
      showToast((res && res.message) ? res.message : 'Không thể tạo buổi sinh hoạt!', 'error');
    }
  } catch (err) {
    setFormControlsDisabled(form, false);
    if (cancelBtn) cancelBtn.disabled = false;
    if (btn) setButtonLoading(btn, false);
    showToast('Lỗi: ' + (err.message || err.toString()), 'error');
  }
}

// ====================================================================
// 5. TRANG CHI TIẾT BUỔI HỌC CỦA ADMIN (FULL-PAGE MASTER-DETAIL HUB)
// ====================================================================

let currentAdminActiveSessionId = null;
let currentAdminSessionSubTab = 'info';

/**
 * Mở màn hình Sub-view Chi tiết Buổi học (Full Page, không gian rộng rãi)
 * @param {string} sessionId
 */
export function openAdminSessionDetail(sessionId, updateHash = true) {
  const session = (appState.attendance || []).find(s => s.SessionID === sessionId);
  if (!session) {
    showToast('Không tìm thấy thông tin buổi học!', 'error');
    return;
  }

  currentAdminActiveSessionId = sessionId;
  resetPagination('admin-detail-attendees');
  resetPagination('admin-detail-submissions');

  // Chuyển view: Ẩn danh sách cards, hiện trang chi tiết
  const gridSection = document.getElementById('admin-tab-attendance');
  const detailSection = document.getElementById('admin-tab-session-detail');

  if (gridSection) gridSection.classList.add('hidden');
  if (detailSection) detailSection.classList.remove('hidden');

  // Cập nhật URL Hash trên thanh địa chỉ
  if (updateHash && window.location.hash !== '#attendance/' + sessionId) {
    history.pushState(null, '', '#attendance/' + sessionId);
  }

  // Điền thông tin Header
  const idEl = document.getElementById('admin-detail-session-id');
  const tagEl = document.getElementById('admin-detail-session-tag');
  const roomEl = document.getElementById('admin-detail-session-room');
  const titleEl = document.getElementById('admin-detail-session-title');
  const dateEl = document.getElementById('admin-detail-session-date');
  const statusEl = document.getElementById('admin-detail-session-status');

  if (idEl) idEl.textContent = session.SessionID;
  if (tagEl) tagEl.innerHTML = uiTopicTagBadge(session.TagChuyenDe || 'GENERAL');
  if (roomEl) roomEl.textContent = session.PhongHoc || 'Phòng Lab 02 - Nhà A3';
  if (titleEl) titleEl.textContent = session.TenBuoiHop;
  if (dateEl) dateEl.textContent = formatSessionDateVN(session.NgayDienRa);

  const isOpen = String(session.TrangThai || '').toLowerCase() === 'open';
  if (statusEl) {
    statusEl.className = isOpen ? 'bht-badge bht-badge-ok text-xs' : 'bht-badge bg-subtle text-ink-faint text-xs';
    statusEl.textContent = isOpen ? 'Đang mở điểm danh' : 'Đã khóa PIN';
  }

  // Cập nhật nút khóa/mở PIN trên Header
  const togglePinBtn = document.getElementById('btn-detail-toggle-pin');
  const pinBtnText = document.getElementById('admin-detail-pin-btn-text');
  if (pinBtnText) pinBtnText.textContent = isOpen ? 'Khóa điểm danh' : 'Mở lại điểm danh';
  if (togglePinBtn) {
    togglePinBtn.className = isOpen ? 'bht-btn bht-btn-secondary bht-btn-sm' : 'bht-btn bht-btn-primary bht-btn-sm';
  }

  // 1. Tab Bài giảng & Slide
  const linkInput = document.getElementById('detail-info-link');
  const descInput = document.getElementById('detail-info-desc');
  const slideExtBtn = document.getElementById('btn-open-slide-external');

  if (linkInput) linkInput.value = session.LinkTaiLieu || '';
  if (descInput) descInput.value = session.NoiDungChuyenDe || '';
  if (slideExtBtn) {
    if (session.LinkTaiLieu) {
      slideExtBtn.href = session.LinkTaiLieu;
      slideExtBtn.classList.remove('hidden');
    } else {
      slideExtBtn.classList.add('hidden');
    }
  }

  // 2. Tab Điểm danh & PIN
  const pinDisplay = document.getElementById('admin-detail-pin-display');
  if (pinDisplay) pinDisplay.textContent = session.MaPin || '------';
  renderDetailAttendanceList(session);

  // 3. Tab Bài tập & Chấm bài
  renderDetailTaskPanel(session);

  // Mở tab hiện tại (hoặc mặc định 'info')
  switchAdminSessionSubTab(currentAdminSessionSubTab || 'info');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Alias tương thích ngược
export const openAdminSessionDetailModal = openAdminSessionDetail;
export const closeAdminSessionDetailModal = backToAdminSessionsList;

/**
 * Quay lại danh sách buổi học
 */
export function backToAdminSessionsList() {
  const gridSection = document.getElementById('admin-tab-attendance');
  const detailSection = document.getElementById('admin-tab-session-detail');

  if (detailSection) detailSection.classList.add('hidden');
  if (gridSection) gridSection.classList.remove('hidden');

  closeAdminPinModal();
  currentAdminActiveSessionId = null;

  if (window.location.hash !== '#attendance') {
    history.replaceState(null, '', '#attendance');
  }
}

/**
 * Chuyển đổi giữa các sub-tabs trong màn hình Chi tiết Buổi học
 * @param {'info'|'pin'|'task'|'quiz'} tab
 */
export function switchAdminSessionSubTab(tab) {
  const tabs = ['info', 'pin', 'task', 'quiz'];
  currentAdminSessionSubTab = tab;

  tabs.forEach(t => {
    const content = document.getElementById('admin-subtab-' + t + '-content');
    const btn = document.getElementById('btn-admin-subtab-' + t);
    if (content) content.classList.toggle('hidden', t !== tab);
    if (btn) {
      if (t === tab) {
        btn.className = 'px-3.5 py-2 rounded-lg font-semibold text-accent bg-accent-soft border border-hairline flex items-center gap-2 shrink-0 transition-colors';
      } else {
        btn.className = 'px-3.5 py-2 rounded-lg font-medium text-ink-muted hover:text-ink flex items-center gap-2 shrink-0 transition-colors';
      }
    }
  });
}

/**
 * Mở Modal Popup PIN chuyên dụng & gọn gàng cho Admin
 */
export function openAdminPinModal() {
  if (!currentAdminActiveSessionId) return;
  const session = (appState.attendance || []).find(s => s.SessionID === currentAdminActiveSessionId);
  if (!session) return;

  const modal = document.getElementById('modal-admin-pin-quickview');
  const pinEl = document.getElementById('admin-modal-pin-display');
  const idEl = document.getElementById('admin-pin-modal-session-id');
  const badgeEl = document.getElementById('admin-modal-pin-status-badge');
  const btnToggleText = document.getElementById('admin-modal-pin-toggle-text');

  if (idEl) idEl.textContent = session.SessionID;
  if (pinEl) pinEl.textContent = session.MaPin || '------';

  const isOpen = String(session.TrangThai || '').toLowerCase() === 'open';
  if (badgeEl) {
    badgeEl.className = isOpen ? 'bht-badge bht-badge-ok text-[10px]' : 'bht-badge bg-subtle text-ink-faint text-[10px]';
    badgeEl.textContent = isOpen ? 'Đang mở điểm danh' : 'Đã khóa PIN';
  }
  if (btnToggleText) {
    btnToggleText.textContent = isOpen ? 'Khóa điểm danh' : 'Mở lại điểm danh';
  }

  if (modal) modal.classList.remove('hidden');
}

/**
 * Đóng Modal Popup PIN
 */
export function closeAdminPinModal() {
  const modal = document.getElementById('modal-admin-pin-quickview');
  if (modal) modal.classList.add('hidden');
}

/**
 * Lọc danh sách sinh viên có mặt trong buổi học theo ô tìm kiếm
 * @param {string} query
 */
export function filterSessionAttendees(query) {
  if (!currentAdminActiveSessionId) return;
  const session = (appState.attendance || []).find(s => s.SessionID === currentAdminActiveSessionId);
  resetPagination('admin-detail-attendees');
  if (session) renderDetailAttendanceList(session, (query || '').trim().toLowerCase());
}

/**
 * Render bảng danh sách sinh viên đã điểm danh (Rộng rãi & Thoáng đãng)
 */
function renderDetailAttendanceList(session, filterQuery = '') {
  const tbody = document.getElementById('admin-detail-attendance-tbody');
  const countEl = document.getElementById('admin-detail-attended-count');
  const pagEl = document.getElementById('admin-detail-attendance-pagination');
  if (!tbody) return;

  let list = [];
  try { list = JSON.parse(session.DS_CoMat || '[]'); } catch (e) {
    list = session.DS_CoMat ? session.DS_CoMat.split(',').map(x => x.trim()) : [];
  }

  if (countEl) countEl.textContent = list.length;

  if (list.length === 0) {
    tbody.innerHTML = uiEmptyState({
      isTableRow: true,
      colspan: 4,
      title: 'Chưa có sinh viên nào điểm danh trong buổi học này.'
    });
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const allMembers = appState.members || [];
  let filtered = list;

  if (filterQuery) {
    filtered = list.filter(mssv => {
      const mem = allMembers.find(m => m.MSSV === mssv);
      const name = mem ? mem.HoTen.toLowerCase() : '';
      return mssv.toLowerCase().includes(filterQuery) || name.includes(filterQuery);
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = uiEmptyState({
      isTableRow: true,
      colspan: 4,
      title: `Không tìm thấy sinh viên nào khớp với "${escapeHtml(filterQuery)}".`
    });
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const { pagedItems } = paginate('admin-detail-attendees', filtered, {
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    onPageChange: () => renderDetailAttendanceList(session, filterQuery)
  });

  tbody.innerHTML = pagedItems.map(mssv => {
    const mem = allMembers.find(m => m.MSSV === mssv) || { MSSV: mssv, HoTen: 'Sinh viên ' + mssv, Email: '' };
    return renderAttendeeRow(mem, session.NgayDienRa);
  }).join('');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('admin-detail-attendees');
  }
}

/**
 * Render khu vực Quản lý Bài tập và Danh sách bài nộp của sinh viên
 */
function renderDetailTaskPanel(session) {
  const allTasks = appState.tasks || [];
  const task = session.BaiTap || allTasks.find(t => t.SessionID === session.SessionID);

  const existPanel = document.getElementById('admin-detail-task-exist-panel');
  const createPanel = document.getElementById('admin-detail-task-create-panel');
  const subsPanel = document.getElementById('admin-detail-submissions-panel');

  if (task) {
    if (createPanel) createPanel.classList.add('hidden');
    if (existPanel) {
      existPanel.classList.remove('hidden');
      const allSubs = appState.submissions || [];
      const subsForTask = allSubs.filter(sub => sub.TaskID === task.TaskID);
      const approvedCount = subsForTask.filter(sub => sub.TrangThaiDuyet === 'Approved').length;
      const pendingCount = subsForTask.filter(sub => sub.TrangThaiDuyet === 'Pending').length;
      const isOpen = String(task.TrangThai || '').toLowerCase() === 'open';

      existPanel.innerHTML = `
        <div class="bht-card p-5 bg-surface border border-hairline space-y-3.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="bht-badge-mono text-accent text-xs font-bold">${task.TaskID}</span>
                <span class="bht-badge ${isOpen ? 'bht-badge-ok' : 'bg-subtle text-ink-faint'} text-[10px]">
                  ${isOpen ? 'Đang nhận bài nộp' : 'Đã khóa bài nộp'}
                </span>
              </div>
              <h4 class="text-base font-bold text-ink mt-1">${escapeHtml(task.TieuDe)}</h4>
              <p class="text-xs text-ink-muted font-mono mt-0.5"><i class="fa-regular fa-clock mr-1"></i>Hạn nộp: <strong class="text-ink">${task.Deadline ? task.Deadline.replace('T', ' ') : 'Không giới hạn'}</strong></p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button 
                data-action="toggle-task-status"
                data-id="${task.TaskID}"
                data-status="${isOpen ? 'Closed' : 'Open'}"
                class="bht-btn bht-btn-secondary bht-btn-xs"
              >
                <i class="fa-solid ${isOpen ? 'fa-lock' : 'fa-lock-open'} mr-1"></i>
                <span>${isOpen ? 'Khóa nhận bài' : 'Mở lại nhận bài'}</span>
              </button>
            </div>
          </div>

          ${task.MoTa ? `
            <div class="p-3.5 rounded-xl bg-subtle/50 text-xs text-ink-muted leading-relaxed whitespace-pre-line border border-hairline">
              <strong class="text-ink block mb-1">Mô tả & Định dạng nộp:</strong>
              ${escapeHtml(task.MoTa)}
            </div>
          ` : ''}

          <div class="pt-2 flex items-center gap-3 text-xs font-mono text-ink-muted">
            <span>Tổng bài nộp: <strong class="text-accent">${subsForTask.length}</strong></span>
            <span>·</span>
            <span class="text-ok font-semibold">${approvedCount} Đạt</span>
            <span>·</span>
            <span class="text-warn font-semibold">${pendingCount} Chờ duyệt</span>
          </div>
        </div>
      `;

      // Render bảng nộp bài của sinh viên cho task này
      renderDetailSubmissionsList(task);
      if (subsPanel) subsPanel.classList.remove('hidden');
    }
  } else {
    if (existPanel) existPanel.classList.add('hidden');
    if (subsPanel) subsPanel.classList.add('hidden');
    if (createPanel) {
      createPanel.classList.remove('hidden');
      const titleInput = document.getElementById('detail-task-input-title');
      const deadlineInput = document.getElementById('detail-task-input-deadline');
      if (titleInput) titleInput.value = 'Bài tập thực hành: ' + session.TenBuoiHop;
      if (deadlineInput && session.NgayDienRa) deadlineInput.value = session.NgayDienRa;
    }
  }
}

/**
 * Render bảng bài nộp sinh viên ngay trong tab Bài tập của Buổi học
 */
function renderDetailSubmissionsList(task) {
  const tbody = document.getElementById('admin-detail-submissions-tbody');
  const pagEl = document.getElementById('admin-detail-submissions-pagination');
  if (!tbody) return;

  const allSubs = appState.submissions || [];
  const allMembers = appState.members || [];
  const subsForTask = allSubs.filter(sub => sub.TaskID === task.TaskID);

  if (subsForTask.length === 0) {
    tbody.innerHTML = uiEmptyState({
      isTableRow: true,
      colspan: 5,
      title: 'Chưa có sinh viên nào nộp bài cho chuyên đề này.'
    });
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const { pagedItems } = paginate('admin-detail-submissions', subsForTask, {
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    onPageChange: () => renderDetailSubmissionsList(task)
  });

  tbody.innerHTML = pagedItems.map(sub => {
    const mem = allMembers.find(m => m.MSSV === sub.MSSV) || { HoTen: sub.HoTen || 'Sinh viên ' + sub.MSSV };
    const isProcessing = uiActionLocks.activeReviewSubIds.has(sub.SubID || sub.SubmissionID);
    return renderSubmissionRow(sub, {
      showTaskColumn: false,
      memberName: mem.HoTen,
      isProcessing
    });
  }).join('');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('admin-detail-submissions');
  }
}

export async function handleSaveTaskInDetail() {
  if (!currentAdminActiveSessionId) return;

  const titleInput = document.getElementById('detail-task-input-title');
  const deadlineInput = document.getElementById('detail-task-input-deadline');
  const assigneeInput = document.getElementById('detail-task-input-assignee');
  const descInput = document.getElementById('detail-task-input-desc');
  const btn = document.getElementById('btn-save-task-in-detail');

  const title = titleInput ? titleInput.value.trim() : '';
  const deadline = deadlineInput ? deadlineInput.value : '';
  const assignee = assigneeInput ? assigneeInput.value.trim() || 'ALL' : 'ALL';
  const desc = descInput ? descInput.value.trim() : '';

  if (!title) {
    showToast('Vui lòng nhập tiêu đề bài tập!', 'warning');
    if (titleInput) titleInput.focus();
    return;
  }

  if (!deadline) {
    showToast('Vui lòng chọn hạn nộp (Deadline) cho bài tập!', 'warning');
    if (deadlineInput) deadlineInput.focus();
    return;
  }

  if (btn) setButtonLoading(btn, true);

  try {
    const res = await callApi('createTask', {
      tieuDe: title,
      moTa: desc,
      nguoiNhan: assignee,
      deadline: deadline,
      sessionId: currentAdminActiveSessionId
    });

    if (btn) setButtonLoading(btn, false);

    if (res && res.success) {
      const newTask = {
        TaskID: res.taskId || ('TASK_' + Date.now()),
        TieuDe: title,
        MoTa: desc,
        NguoiNhan: assignee,
        Deadline: deadline,
        FolderID: res.folderId || '',
        TrangThai: 'Open',
        SessionID: currentAdminActiveSessionId
      };
      appState.tasks.unshift(newTask);

      // Cập nhật vào session hiện tại
      const session = (appState.attendance || []).find(s => s.SessionID === currentAdminActiveSessionId);
      if (session) session.BaiTap = newTask;

      renderAdminAttendanceGrid();
      renderDetailTaskPanel(session);
      updateAdminStats();
      showToast('Đã giao bài tập thành công!', 'success');
    } else {
      showToast(res.message || 'Lỗi khi giao bài tập!', 'error');
    }
  } catch (err) {
    if (btn) setButtonLoading(btn, false);
    showToast('Lỗi: ' + (err.message || err.toString()), 'error');
  }
}

export async function handleTogglePinFromDetail() {
  if (!currentAdminActiveSessionId) return;
  const session = (appState.attendance || []).find(s => s.SessionID === currentAdminActiveSessionId);
  if (!session) return;

  const currentOpen = String(session.TrangThai || '').toLowerCase() === 'open';
  const target = currentOpen ? 'Closed' : 'Open';

  await handleToggleAttendanceSession(currentAdminActiveSessionId, target);
  openAdminSessionDetail(currentAdminActiveSessionId);
  openAdminPinModal(); // Cập nhật lại trạng thái trong popup PIN nếu đang mở
}

export function handleOpenProjectorFromDetail() {
  if (!currentAdminActiveSessionId) return;
  closeAdminPinModal();
  openProjectorMode(currentAdminActiveSessionId);
}

export async function handleRegeneratePinInDetail() {
  if (!currentAdminActiveSessionId) return;
  const session = (appState.attendance || []).find(s => s.SessionID === currentAdminActiveSessionId);
  if (!session) return;

  const newPin = String(Math.floor(100000 + Math.random() * 900000));
  session.MaPin = newPin;

  const pinDisplay = document.getElementById('admin-detail-pin-display');
  const modalPinDisplay = document.getElementById('admin-modal-pin-display');
  if (pinDisplay) pinDisplay.textContent = newPin;
  if (modalPinDisplay) modalPinDisplay.textContent = newPin;

  try {
    await callApi('updateAttendanceTopic', {
      sessionId: currentAdminActiveSessionId,
      tenBuoiHop: session.TenBuoiHop,
      maPin: newPin,
      ngayDienRa: session.NgayDienRa,
      noiDungChuyenDe: session.NoiDungChuyenDe,
      linkTaiLieu: session.LinkTaiLieu
    });
  } catch (e) {
    console.warn('Lỗi khi đồng bộ PIN lên máy chủ:', e);
  }

  renderAdminAttendanceGrid();
  showToast('Đã đổi mã PIN mới: ' + newPin, 'success');
}

export async function handleUpdateSessionInfoInDetail() {
  if (!currentAdminActiveSessionId) return;
  const session = (appState.attendance || []).find(s => s.SessionID === currentAdminActiveSessionId);
  if (!session) return;

  const link = document.getElementById('detail-info-link').value.trim();
  const desc = document.getElementById('detail-info-desc').value.trim();

  session.LinkTaiLieu = link;
  session.NoiDungChuyenDe = desc;

  try {
    const res = await callApi('updateAttendanceTopic', {
      sessionId: currentAdminActiveSessionId,
      tenBuoiHop: session.TenBuoiHop,
      maPin: session.MaPin,
      ngayDienRa: session.NgayDienRa,
      noiDungChuyenDe: desc,
      linkTaiLieu: link
    });
    if (res && res.success) {
      showToast(res.message || 'Đã cập nhật bài giảng & slide thành công!', 'success');
    } else {
      showToast('Đã lưu dữ liệu bài giảng & slide!', 'success');
    }
  } catch (e) {
    showToast('Lỗi cập nhật bài giảng: ' + (e.message || e.toString()), 'error');
  }

  renderAdminAttendanceGrid();
}



export async function handleToggleAttendanceSession(sessionId, targetStatus) {
  if (uiActionLocks.activeSessionToggleIds.has(sessionId)) return;

  uiActionLocks.activeSessionToggleIds.add(sessionId);
  renderAdminAttendanceGrid();

  try {
    const res = await callApi('toggleAttendanceSession', { sessionId, targetStatus });
    uiActionLocks.activeSessionToggleIds.delete(sessionId);

    if (res && res.success) {
      showToast(res.message, 'success');
      // CẬP NHẬT STATE CỤC BỘ
      const target = (appState.attendance || []).find(s => s.SessionID === sessionId);
      if (target) target.TrangThai = targetStatus;

      // CHỈ RENDER LẠI GRID BUỔI SINH HOẠT
      renderAdminAttendanceGrid();
    } else {
      showToast((res && res.message) ? res.message : 'Không thể cập nhật!', 'error');
      renderAdminAttendanceGrid();
    }
  } catch (err) {
    uiActionLocks.activeSessionToggleIds.delete(sessionId);
    showToast('Lỗi: ' + (err.message || err.toString()), 'error');
    renderAdminAttendanceGrid();
  }
}

// ====================================================================
// 6. CÁC THAO TÁC QUẢN TRỊ SỬA & XÓA (ADMIN CRUD OPERATIONS)
// ====================================================================

/**
 * Mở modal chỉnh sửa buổi sinh hoạt
 */
export function openEditAttendanceModal(sessionId) {
  const targetId = sessionId || currentAdminActiveSessionId;
  const session = (appState.attendance || []).find(s => s.SessionID === targetId);
  if (!session) {
    showToast('Không tìm thấy buổi sinh hoạt!', 'error');
    return;
  }

  const modal = document.getElementById('modal-edit-attendance');
  if (!modal) return;

  const idInput = document.getElementById('edit-att-id');
  const titleInput = document.getElementById('edit-att-title');
  const tagSelect = document.getElementById('edit-att-tag');
  const roomInput = document.getElementById('edit-att-room');
  const dateInput = document.getElementById('edit-att-date');
  const pinInput = document.getElementById('edit-att-pin');
  const linkInput = document.getElementById('edit-att-link');
  const descInput = document.getElementById('edit-att-desc');
  const statusSelect = document.getElementById('edit-att-status');

  if (idInput) idInput.value = session.SessionID;
  if (titleInput) titleInput.value = session.TenBuoiHop || '';

  const knownTags = ['GENERAL', 'CHUAN_DAU_RA', 'WORD_DO_AN', 'EXCEL_DATA', 'AI_TOOLS', 'OLYMPIC'];
  const sessionTag = session.TagChuyenDe || 'GENERAL';
  const customTagContainer = document.getElementById('edit-att-custom-tag-container');
  const customTagInput = document.getElementById('edit-att-input-custom-tag');

  if (tagSelect) {
    if (knownTags.includes(sessionTag)) {
      tagSelect.value = sessionTag;
      if (customTagContainer) customTagContainer.classList.add('hidden');
      if (customTagInput) customTagInput.value = '';
    } else {
      tagSelect.value = 'CUSTOM';
      if (customTagContainer) customTagContainer.classList.remove('hidden');
      if (customTagInput) customTagInput.value = sessionTag;
    }
  }

  if (roomInput) roomInput.value = session.PhongHoc || '';
  if (dateInput) dateInput.value = session.NgayDienRa || '';
  if (pinInput) pinInput.value = session.MaPin || '';
  if (linkInput) linkInput.value = session.LinkTaiLieu || '';
  if (descInput) descInput.value = session.NoiDungChuyenDe || '';
  if (statusSelect) statusSelect.value = session.TrangThai || 'Open';

  modal.classList.remove('hidden');
}

export function closeEditAttendanceModal() {
  const modal = document.getElementById('modal-edit-attendance');
  if (modal) modal.classList.add('hidden');
}

/**
 * Xử lý cập nhật thông tin buổi sinh hoạt
 */
export async function handleUpdateAttendanceSession(e) {
  if (e && e.preventDefault) e.preventDefault();

  const form = document.getElementById('form-edit-attendance');
  const btn = document.getElementById('btn-submit-edit-attendance');
  const sessionId = document.getElementById('edit-att-id')?.value;
  const titleInput = document.getElementById('edit-att-title');
  const pinInput = document.getElementById('edit-att-pin');
  const linkInput = document.getElementById('edit-att-link');

  const title = titleInput?.value.trim();
  const tagSelect = document.getElementById('edit-att-tag');
  let tag = tagSelect?.value || 'GENERAL';
  if (tag === 'CUSTOM') {
    const customInput = document.getElementById('edit-att-input-custom-tag');
    const customVal = customInput ? customInput.value.trim() : '';
    if (!customVal) {
      showFormError(form, 'Vui lòng nhập tên chủ đề tùy chỉnh!', customInput);
      return;
    }
    tag = customVal;
  }
  const room = document.getElementById('edit-att-room')?.value.trim() || '';
  const date = document.getElementById('edit-att-date')?.value || '';
  const pin = pinInput?.value.trim() || '';
  const link = linkInput?.value.trim() || '';
  const desc = document.getElementById('edit-att-desc')?.value.trim() || '';
  const status = document.getElementById('edit-att-status')?.value || 'Open';

  clearFormError(form);

  if (!sessionId || !title) {
    showFormError(form, 'Vui lòng nhập đầy đủ tên buổi học!', titleInput);
    return;
  }

  if (!/^\d{6}$/.test(pin)) {
    showFormError(form, 'Mã PIN điểm danh phải gồm đúng 6 chữ số!', pinInput);
    return;
  }

  if (link && !/^https?:\/\//i.test(link)) {
    showFormError(form, 'Link tài liệu phải là một đường dẫn URL hợp lệ (bắt đầu bằng http:// hoặc https://)!', linkInput);
    return;
  }

  setFormControlsDisabled(form, true);
  if (btn) setButtonLoading(btn, true);

  try {
    const payload = {
      sessionId,
      tenBuoiHop: title,
      tagChuyenDe: tag,
      phongHoc: room,
      ngayDienRa: date,
      maPin: pin,
      linkTaiLieu: link,
      noiDungChuyenDe: desc,
      trangThai: status
    };

    const res = await callApi('updateAttendanceSession', payload);
    setFormControlsDisabled(form, false);
    if (btn) setButtonLoading(btn, false);

    if (res && res.success) {
      showToast(res.message || 'Cập nhật buổi học thành công!', 'success');
      closeEditAttendanceModal();

      // Cập nhật State cục bộ
      const s = (appState.attendance || []).find(x => x.SessionID === sessionId);
      if (s) {
        s.TenBuoiHop = title;
        s.TagChuyenDe = tag;
        s.PhongHoc = room;
        s.NgayDienRa = date;
        s.MaPin = pin;
        s.LinkTaiLieu = link;
        s.NoiDungChuyenDe = desc;
        s.TrangThai = status;
      }

      renderAdminAttendanceGrid();
      if (currentAdminActiveSessionId === sessionId) {
        openAdminSessionDetail(sessionId);
      }
    } else {
      showFormError(form, (res && res.message) ? res.message : 'Lỗi khi cập nhật buổi học!');
    }
  } catch (err) {
    setFormControlsDisabled(form, false);
    if (btn) setButtonLoading(btn, false);
    showFormError(form, 'Lỗi: ' + (err.message || err.toString()));
  }
}

/**
 * Xóa buổi sinh hoạt (kèm hộp thoại xác nhận)
 */
export async function handleDeleteAttendanceSession(sessionId) {
  const targetId = sessionId || currentAdminActiveSessionId;
  if (!targetId) return;

  const session = (appState.attendance || []).find(s => s.SessionID === targetId);
  const sessionName = session ? session.TenBuoiHop : targetId;

  const confirmed = window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN buổi học "${sessionName}" cùng toàn bộ bài tập liên kết không? Thao tác này không thể hoàn tác!`);
  if (!confirmed) return;

  try {
    const res = await callApi('deleteAttendanceSession', { sessionId: targetId });
    if (res && res.success) {
      showToast(res.message || 'Đã xóa buổi học thành công!', 'success');

      // Cập nhật State
      appState.attendance = (appState.attendance || []).filter(s => s.SessionID !== targetId);
      appState.tasks = (appState.tasks || []).filter(t => t.SessionID !== targetId);

      renderAdminAttendanceGrid();
      backToAdminSessionsList();
      updateAdminStats();
    } else {
      showToast((res && res.message) ? res.message : 'Không thể xóa buổi học!', 'error');
    }
  } catch (err) {
    showToast('Lỗi khi xóa: ' + (err.message || err.toString()), 'error');
  }
}

export function handleDeleteSessionFromDetail() {
  handleDeleteAttendanceSession(currentAdminActiveSessionId);
}

/**
 * Mở modal sửa bài tập
 */
export function openEditTaskModal(taskId) {
  const task = (appState.tasks || []).find(t => t.TaskID === taskId);
  if (!task) {
    showToast('Không tìm thấy thông tin bài tập!', 'error');
    return;
  }

  const modal = document.getElementById('modal-edit-task');
  if (!modal) return;

  const idInput = document.getElementById('edit-task-id');
  const titleInput = document.getElementById('edit-task-title');
  const assigneeInput = document.getElementById('edit-task-assignee');
  const deadlineInput = document.getElementById('edit-task-deadline');
  const descInput = document.getElementById('edit-task-desc');
  const statusSelect = document.getElementById('edit-task-status');

  if (idInput) idInput.value = task.TaskID;
  if (titleInput) titleInput.value = task.TieuDe || '';
  if (assigneeInput) assigneeInput.value = task.NguoiNhan || 'ALL';
  if (deadlineInput) deadlineInput.value = task.Deadline || '';
  if (descInput) descInput.value = task.MoTa || '';
  if (statusSelect) statusSelect.value = task.TrangThai || 'Open';

  modal.classList.remove('hidden');
}

export function closeEditTaskModal() {
  const modal = document.getElementById('modal-edit-task');
  if (modal) modal.classList.add('hidden');
}

/**
 * Xử lý cập nhật bài tập
 */
export async function handleUpdateTask(e) {
  if (e && e.preventDefault) e.preventDefault();

  const form = document.getElementById('form-edit-task');
  const btn = document.getElementById('btn-submit-edit-task');
  const taskId = document.getElementById('edit-task-id')?.value;
  const titleInput = document.getElementById('edit-task-title');
  const deadlineInput = document.getElementById('edit-task-deadline');

  const title = titleInput?.value.trim();
  const assignee = document.getElementById('edit-task-assignee')?.value.trim() || 'ALL';
  const deadline = deadlineInput?.value || '';
  const desc = document.getElementById('edit-task-desc')?.value.trim() || '';
  const status = document.getElementById('edit-task-status')?.value || 'Open';

  clearFormError(form);

  if (!taskId || !title) {
    showFormError(form, 'Vui lòng nhập tiêu đề bài tập!', titleInput);
    return;
  }

  if (!deadline) {
    showFormError(form, 'Vui lòng chọn hạn nộp (Deadline) cho bài tập!', deadlineInput);
    return;
  }

  setFormControlsDisabled(form, true);
  if (btn) setButtonLoading(btn, true);

  try {
    const payload = {
      taskId,
      tieuDe: title,
      nguoiNhan: assignee,
      deadline,
      moTa: desc,
      trangThai: status
    };

    const res = await callApi('updateTask', payload);
    setFormControlsDisabled(form, false);
    if (btn) setButtonLoading(btn, false);

    if (res && res.success) {
      showToast(res.message || 'Cập nhật bài tập thành công!', 'success');
      closeEditTaskModal();

      // Cập nhật State
      const t = (appState.tasks || []).find(x => x.TaskID === taskId);
      if (t) {
        t.TieuDe = title;
        t.NguoiNhan = assignee;
        t.Deadline = deadline;
        t.MoTa = desc;
        t.TrangThai = status;
      }

      // Cập nhật session.BaiTap nếu có
      (appState.attendance || []).forEach(s => {
        if (s.BaiTap && s.BaiTap.TaskID === taskId) {
          s.BaiTap = { ...t };
        }
      });

      renderAdminAttendanceGrid();
      if (currentAdminActiveSessionId) {
        const currentSession = (appState.attendance || []).find(s => s.SessionID === currentAdminActiveSessionId);
        if (currentSession) renderDetailTaskPanel(currentSession);
      }
    } else {
      showFormError(form, (res && res.message) ? res.message : 'Lỗi khi cập nhật bài tập!');
    }
  } catch (err) {
    setFormControlsDisabled(form, false);
    if (btn) setButtonLoading(btn, false);
    showFormError(form, 'Lỗi: ' + (err.message || err.toString()));
  }
}

/**
 * Xóa bài tập
 */
export async function handleDeleteTask(taskId) {
  if (!taskId) return;
  const task = (appState.tasks || []).find(t => t.TaskID === taskId);
  const taskTitle = task ? task.TieuDe : taskId;

  const confirmed = window.confirm(`Bạn có chắc muốn XÓA bài tập "${taskTitle}" không?`);
  if (!confirmed) return;

  try {
    const res = await callApi('deleteTask', { taskId });
    if (res && res.success) {
      showToast(res.message || 'Đã xóa bài tập!', 'success');

      appState.tasks = (appState.tasks || []).filter(t => t.TaskID !== taskId);

      // Xóa liên kết bài tập trong session
      (appState.attendance || []).forEach(s => {
        if (s.BaiTap && s.BaiTap.TaskID === taskId) {
          delete s.BaiTap;
        }
      });

      renderAdminAttendanceGrid();
      if (currentAdminActiveSessionId) {
        const currentSession = (appState.attendance || []).find(s => s.SessionID === currentAdminActiveSessionId);
        if (currentSession) renderDetailTaskPanel(currentSession);
      }
      updateAdminStats();
    } else {
      showToast((res && res.message) ? res.message : 'Không thể xóa bài tập!', 'error');
    }
  } catch (err) {
    showToast('Lỗi khi xóa bài tập: ' + (err.message || err.toString()), 'error');
  }
}

// ====================================================================
// 4. PHÂN HỆ QUẢN LÝ KHO HỌC LIỆU & SLIDE ĐA PHƯƠNG TIỆN
// ====================================================================

/**
 * Lọc tài liệu theo danh mục (Pills)
 * @param {string} category Mã phân loại hoặc 'ALL'
 */
export function handleFilterAdminDocs(category = 'ALL') {
  appState.adminDocCategory = category;
  resetPagination('admin-docs');
  renderAdminDocsGrid();
}

/**
 * Tìm kiếm tài liệu theo từ khóa
 * @param {string} query Từ khóa tìm kiếm
 */
export function handleSearchAdminDocs(query = '') {
  appState.adminDocSearchQuery = String(query).toLowerCase().trim();
  resetPagination('admin-docs');
  renderAdminDocsGrid();
}

/**
 * Render Lưới Tài Liệu Học Thuật trong Quản Trị
 */
export function renderAdminDocsGrid() {
  const grid = document.getElementById('admin-docs-grid');
  const pagEl = document.getElementById('admin-docs-pagination');
  if (!grid) return;

  const docs = appState.documents || appState.docs || [];
  const cat = appState.adminDocCategory || 'ALL';
  const search = appState.adminDocSearchQuery || '';

  // 1. Đồng bộ dải nút Filter Pills động tái sử dụng (Tự động phát hiện tag mới)
  const filterContainer = document.getElementById('admin-doc-category-filters');
  if (filterContainer) {
    filterContainer.innerHTML = renderTopicFilterBarHtml({
      activeCat: cat,
      items: docs,
      tagField: 'PhanLoai',
      actionName: 'filter-admin-docs'
    });
  }

  const filtered = docs.filter(d => {
    // 1. Lọc theo danh mục dùng hàm so sánh taxonomy chuẩn
    let matchCat = true;
    if (cat !== 'ALL') {
      matchCat = matchesTopicCategory(d.PhanLoai, cat);
    }

    // 2. Lọc theo từ khóa tìm kiếm
    let matchSearch = true;
    if (search) {
      matchSearch = String(d.TenTaiLieu || '').toLowerCase().includes(search) ||
                    String(d.PhanLoai || '').toLowerCase().includes(search) ||
                    String(d.MoTa || '').toLowerCase().includes(search) ||
                    String(d.DocID || '').toLowerCase().includes(search);
    }

    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full bht-card p-8 text-center text-ink-muted">
        <i class="fa-solid fa-box-open text-3xl mb-2 text-ink-faint"></i>
        <p class="text-sm">Không tìm thấy tài liệu học thuật nào phù hợp!</p>
      </div>
    `;
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const { pagedItems } = paginate('admin-docs', filtered, {
    pageSize: 6,
    pageSizeOptions: [6, 12, 24, 48],
    onPageChange: () => renderAdminDocsGrid()
  });

  grid.innerHTML = pagedItems.map(d => renderDocCard(d, { isAdmin: true })).join('');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('admin-docs');
  }
}

export function populateDocCategorySelect(selectedValue = 'Slide') {
  const catSelect = document.getElementById('edit-doc-category');
  if (!catSelect) return;

  const docs = appState.documents || appState.docs || [];
  const baseOptions = [
    { value: 'Slide', label: 'Slide bài giảng' },
    { value: 'Chuẩn đầu ra MOS/IC3', label: 'Chuẩn đầu ra MOS/IC3' },
    { value: 'Word & Đồ án', label: 'Word & Đồ án' },
    { value: 'Excel & Số liệu', label: 'Excel & Số liệu' },
    { value: 'Prompt AI & Tools', label: 'Prompt AI & Tools' },
    { value: 'Olympic & Thuật toán', label: 'Olympic & Thuật toán' },
    { value: 'Ebook & Sách', label: 'Ebook & Sách' }
  ];

  const dynamicTopics = extractDynamicTopics(docs, 'PhanLoai');
  const customTopics = dynamicTopics.filter(t => t.isCustom);

  let html = baseOptions.map(opt => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join('\n');
  if (customTopics.length > 0) {
    html += '\n<optgroup label="── Phân loại đã tạo trước đó ──">';
    customTopics.forEach(t => {
      html += `\n<option value="${escapeHtml(t.id)}">${escapeHtml(t.label)}</option>`;
    });
    html += '\n</optgroup>';
  }
  html += '\n<option value="CUSTOM">+ Thêm phân loại mới (Tự nhập)...</option>';
  catSelect.innerHTML = html;
  catSelect.value = selectedValue;
}

/**
 * Quản lý Kho học liệu / Tài liệu: Thêm, Sửa, Xóa
 */
export function openCreateDocModal() {
  const modal = document.getElementById('modal-edit-doc');
  const heading = document.getElementById('modal-doc-heading');
  const form = document.getElementById('form-edit-doc');
  if (form) form.reset();
  const idInput = document.getElementById('edit-doc-id');
  if (idInput) idInput.value = '';
  const customContainer = document.getElementById('edit-doc-custom-category-container');
  if (customContainer) customContainer.classList.add('hidden');
  const customInput = document.getElementById('edit-doc-input-custom-category');
  if (customInput) customInput.value = '';
  populateDocCategorySelect('Slide');
  if (heading) heading.textContent = 'Thêm Tài Liệu Mới Vào Kho';
  if (modal) modal.classList.remove('hidden');
}

export function openEditDocModal(docId) {
  const docs = appState.documents || appState.docs || [];
  const doc = docs.find(d => d.DocID === docId);
  if (!doc) {
    showToast('Không tìm thấy tài liệu!', 'error');
    return;
  }

  const modal = document.getElementById('modal-edit-doc');
  const heading = document.getElementById('modal-doc-heading');
  if (heading) heading.textContent = 'Cập Nhật Tài Liệu Học Thuật';

  const idInput = document.getElementById('edit-doc-id');
  const titleInput = document.getElementById('edit-doc-title');
  const catSelect = document.getElementById('edit-doc-category');
  const linkInput = document.getElementById('edit-doc-link');
  const descInput = document.getElementById('edit-doc-desc');
  const customContainer = document.getElementById('edit-doc-custom-category-container');
  const customInput = document.getElementById('edit-doc-input-custom-category');

  if (idInput) idInput.value = doc.DocID;
  if (titleInput) titleInput.value = doc.TenTaiLieu || '';
  if (linkInput) linkInput.value = doc.LinkDrive || '';
  if (descInput) descInput.value = doc.MoTa || '';

  const defaultCategories = ['Slide', 'Chuẩn đầu ra MOS/IC3', 'Word & Đồ án', 'Excel & Số liệu', 'Prompt AI & Tools', 'Olympic & Thuật toán', 'Ebook & Sách'];
  const docCategory = doc.PhanLoai || 'Slide';

  populateDocCategorySelect(docCategory);

  if (defaultCategories.includes(docCategory) || catSelect?.value === docCategory) {
    if (customContainer) customContainer.classList.add('hidden');
    if (customInput) customInput.value = '';
  } else {
    if (catSelect) catSelect.value = 'CUSTOM';
    if (customContainer) customContainer.classList.remove('hidden');
    if (customInput) customInput.value = docCategory;
  }

  if (modal) modal.classList.remove('hidden');
}

export function closeEditDocModal() {
  const modal = document.getElementById('modal-edit-doc');
  if (modal) modal.classList.add('hidden');
}

export async function handleSaveDocument(e) {
  if (e && e.preventDefault) e.preventDefault();

  const form = document.getElementById('form-edit-doc');
  const btn = document.getElementById('btn-submit-edit-doc');
  const docId = document.getElementById('edit-doc-id')?.value;
  const titleInput = document.getElementById('edit-doc-title');
  const linkInput = document.getElementById('edit-doc-link');

  const title = titleInput?.value.trim();
  let category = document.getElementById('edit-doc-category')?.value || 'Slide';
  if (category === 'CUSTOM') {
    const customInput = document.getElementById('edit-doc-input-custom-category');
    const customVal = customInput?.value.trim();
    if (!customVal) {
      showFormError(form, 'Vui lòng nhập tên phân loại học liệu mới!', customInput);
      return;
    }
    category = customVal;
  }
  const link = linkInput?.value.trim();
  const desc = document.getElementById('edit-doc-desc')?.value.trim() || '';

  clearFormError(form);

  if (!title) {
    showFormError(form, 'Vui lòng nhập tên tài liệu / slide / giáo trình!', titleInput);
    return;
  }

  if (!link) {
    showFormError(form, 'Vui lòng nhập đường link Google Drive / tải về!', linkInput);
    return;
  }

  if (!/^https?:\/\//i.test(link)) {
    showFormError(form, 'Link tài liệu phải là một đường dẫn URL hợp lệ (bắt đầu bằng http:// hoặc https://)!', linkInput);
    return;
  }

  setFormControlsDisabled(form, true);
  if (btn) setButtonLoading(btn, true);

  try {
    const isEdit = Boolean(docId);
    const action = isEdit ? 'updateDocument' : 'addDocument';
    const payload = isEdit ? { docId, tenTaiLieu: title, phanLoai: category, linkDrive: link, moTa: desc }
                           : { tenTaiLieu: title, phanLoai: category, linkDrive: link, moTa: desc };

    const res = await callApi(action, payload);
    setFormControlsDisabled(form, false);
    if (btn) setButtonLoading(btn, false);

    if (res && res.success) {
      showToast(res.message || 'Lưu tài liệu thành công!', 'success');
      closeEditDocModal();

      const docs = appState.documents || appState.docs || [];
      if (isEdit) {
        const d = docs.find(x => x.DocID === docId);
        if (d) {
          d.TenTaiLieu = title;
          d.PhanLoai = category;
          d.LinkDrive = link;
          d.MoTa = desc;
        }
      } else {
        const newDoc = {
          DocID: res.docId || ('DOC_' + Date.now()),
          TenTaiLieu: title,
          PhanLoai: category,
          LinkDrive: link,
          MoTa: desc
        };
        docs.unshift(newDoc);
      }
      appState.documents = docs;
      appState.docs = docs;
      appState.adminDocCategory = 'ALL';
      appState.adminDocSearchQuery = '';
      resetPagination('admin-docs');
      renderAdminDocsGrid();
      populateDocCategorySelect(category);
    } else {
      showFormError(form, (res && res.message) ? res.message : 'Không thể lưu tài liệu!');
    }
  } catch (err) {
    setFormControlsDisabled(form, false);
    if (btn) setButtonLoading(btn, false);
    showFormError(form, 'Lỗi: ' + (err.message || err.toString()));
  }
}

export async function handleDeleteDocument(docId) {
  if (!docId) return;
  const docs = appState.documents || appState.docs || [];
  const doc = docs.find(d => d.DocID === docId);
  const docTitle = doc ? doc.TenTaiLieu : docId;

  const confirmed = window.confirm(`Bạn có chắc muốn XÓA tài liệu "${docTitle}" khỏi kho học liệu?`);
  if (!confirmed) return;

  try {
    const res = await callApi('deleteDocument', { docId });
    if (res && res.success) {
      showToast(res.message || 'Đã xóa tài liệu!', 'success');
      const updatedDocs = docs.filter(d => d.DocID !== docId);
      appState.documents = updatedDocs;
      appState.docs = updatedDocs;
      renderAdminDocsGrid();
    } else {
      showToast((res && res.message) ? res.message : 'Không thể xóa tài liệu!', 'error');
    }
  } catch (err) {
    showToast('Lỗi khi xóa tài liệu: ' + (err.message || err.toString()), 'error');
  }
}

/**
 * Chuyển đổi sang Chế độ xem trước giao diện Thành viên cho Quản trị viên
 * @param {string} [targetMssv=null] MSSV của thành viên cụ thể muốn xem thử (tùy chọn)
 */
export async function switchToMemberView(targetMssv = null) {
  let targetUser = null;
  if (targetMssv) {
    const members = appState.members || [];
    const found = members.find(m => String(m.MSSV).trim().toUpperCase() === String(targetMssv).trim().toUpperCase());
    if (found) {
      targetUser = {
        mssv: found.MSSV,
        hoTen: found.HoTen,
        email: found.Email || '',
        role: 'MEMBER'
      };
    }
  }

  if (targetUser) {
    sessionStorage.setItem('bht_viewing_as_member', JSON.stringify(targetUser));
    showToast(`Đang xem trước giao diện của: ${targetUser.hoTen} (${targetUser.mssv})`, 'info');
  } else {
    sessionStorage.setItem('bht_viewing_as_member', 'true');
    showToast('Đã chuyển sang chế độ xem vai trò Thành viên!', 'info');
  }

  showView('view-member');
  const { initMemberView } = await import('./member.js');
  initMemberView(true);
}

/**
 * Thoát chế độ xem thử nghiệm và quay trở lại Cổng Quản Trị Viên
 */
export async function returnToAdminView() {
  sessionStorage.removeItem('bht_viewing_as_member');

  // Ẩn thanh banner và các nút quay lại
  const banner = document.getElementById('admin-preview-mode-banner');
  const sideBtn = document.getElementById('sidebar-return-admin-container');
  const mobBtn = document.getElementById('mobile-return-admin-btn');
  if (banner) banner.classList.add('hidden');
  if (sideBtn) sideBtn.classList.add('hidden');
  if (mobBtn) mobBtn.classList.add('hidden');

  showView('view-admin');
  initAdminView(true);
  showToast('Đã quay lại Cổng Quản Trị Viên', 'success');
}
