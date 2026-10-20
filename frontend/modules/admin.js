// ====================================================================
// MODULE CỔNG QUẢN TRỊ VIÊN (ADMIN PORTAL CONTROLLER)
// ====================================================================
// Áp dụng cơ chế Targeted Partial Re-rendering & Optimistic State Update:
// Thao tác ở đâu chỉ cập nhật lại đúng bảng/khối đó, không chớp giật màn hình.
// ====================================================================

import { callApi } from '../services/api.js';
import { appState, uiActionLocks, showToast, showView, showGlobalLoading, hideGlobalLoading, escapeHtml, setFormControlsDisabled, setButtonLoading, showFormError, clearFormError, diffRenderList } from './ui.js';
import { 
  renderTableSkeleton, 
  renderCardSkeleton, 
  renderStatSkeleton 
} from './templates.js';
import { handleFilterSubmissions, renderAdminSubmissionsTable } from './admin/adminSubmissions.js';
import { handleFilterMembers, renderAdminMembersTable } from './admin/adminMembers.js';
import { handleSearchAdminDocs, renderAdminDocsGrid } from './admin/adminDocs.js';
import { 
  currentAdminActiveSessionId, 
  setCurrentAdminActiveSessionId, 
  openAdminSessionDetail, 
  closeAdminPinModal, 
  filterSessionAttendees, 
  handleSearchAdminAttendance, 
  renderAdminAttendanceGrid 
} from './admin/adminSessions.js';
import { INITIAL_MOCK_DATA } from '../services/mockData.js';

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
  const validTabs = ['submissions', 'tasks', 'members', 'attendance', 'docs', 'campaigns'];
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
  const tabs = ['submissions', 'attendance', 'members', 'docs', 'campaigns'];
  // Nếu truyền 'tasks' từ URL hash cũ hoặc bookmark, tự động chuyển sang 'attendance'
  const targetTab = (tab === 'tasks') ? 'attendance' : (tabs.includes(tab) ? tab : 'submissions');

  // 1. Luôn ẩn Sub-view Chi tiết Buổi học khi chuyển tab menu sidebar
  const detailSection = document.getElementById('admin-tab-session-detail');
  if (detailSection) detailSection.classList.add('hidden');
  closeAdminPinModal();
  setCurrentAdminActiveSessionId(null);

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

  // Tải dữ liệu Tab Campaigns nếu được chọn
  if (targetTab === 'campaigns') {
    import('./admin/adminCampaigns.js').then(m => m.loadAdminCampaigns()).catch(console.error);
  }

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
      tasks.map(t => `<option value="${escapeHtml(t.TaskID)}">[${escapeHtml(t.TaskID)}] ${escapeHtml(t.TieuDe)}</option>`).join('');
  }

  renderAdminSubmissionsTable();
  renderAdminAttendanceGrid();
  renderAdminMembersTable();
  renderAdminDocsGrid();
}

// ====================================================================
// 1. PHÂN HỆ DUYỆT BÀI NỘP
// Re-export từ ./admin/adminSubmissions.js để tinh giản kích thước module
// ====================================================================
export * from './admin/adminSubmissions.js';


// ====================================================================
// 2. PHÂN HỆ BUỔI SINH HOẠT, ĐIỂM DANH & NHIỆM VỤ
// Re-export từ ./admin/adminSessions.js để tinh giản kích thước module
// ====================================================================
export * from './admin/adminSessions.js';

// ====================================================================
// 3. PHÂN HỆ QUẢN LÝ NHÂN SỰ
// Re-export từ ./admin/adminMembers.js để tinh giản kích thước module
// ====================================================================
export * from './admin/adminMembers.js';

// ====================================================================
// 4. PHÂN HỆ QUẢN LÝ KHO HỌC LIỆU & SLIDE ĐA PHƯƠNG TIỆN
// Re-export từ ./admin/adminDocs.js để tinh giản kích thước module
// ====================================================================
export * from './admin/adminDocs.js';

// ====================================================================
// 5. PHÂN HỆ QUẢN LÝ TRẮC NGHIỆM ADMIN
// Re-export từ ./admin/adminQuiz.js để tinh giản kích thước module
// ====================================================================
export * from './admin/adminQuiz.js';



/**
 * Chuyển đổi sang Chế độ xem trước giao diện Thành viên cho Quản trị viên
 * @param {string} [targetMssv=null] MSSV của thành viên cụ thể muốn xem thử (tùy chọn)
 */
export async function switchToMemberView(targetMssv = null) {
  let targetUser = null;
  const memList = (appState.members && appState.members.length > 0) ? appState.members : (INITIAL_MOCK_DATA ? INITIAL_MOCK_DATA.members : []);

  if (targetMssv) {
    const found = memList.find(m => String(m.MSSV).trim().toUpperCase() === String(targetMssv).trim().toUpperCase());
    if (found) {
      const initM = INITIAL_MOCK_DATA.members.find(x => x.MSSV === found.MSSV);
      const exactSex = found.Sex || (initM ? initM.Sex : 'male');
      targetUser = {
        mssv: found.MSSV,
        hoTen: found.HoTen,
        email: found.Email || '',
        role: 'MEMBER',
        sex: exactSex,
        Sex: exactSex,
        gift2010: found.gift2010 || (initM ? initM.gift2010 : null) || null
      };
    }
  } else if (appState.user) {
    // Nếu Admin bấm "Xem giao diện thành viên" cho chính mình
    const currentAdminMssv = appState.user.mssv;
    const found = memList.find(m => String(m.MSSV).trim().toUpperCase() === String(currentAdminMssv).trim().toUpperCase());
    const exactSex = (found && found.Sex) ? found.Sex : (appState.user.Sex || appState.user.sex || 'male');
    targetUser = {
      ...appState.user,
      role: 'MEMBER',
      sex: exactSex,
      Sex: exactSex,
      gift2010: (found && found.gift2010) ? found.gift2010 : (appState.user.gift2010 || null)
    };
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

export { handleSwitchAdminCampaign } from './admin/adminMembers.js';
export * from './admin/adminCampaigns.js';

