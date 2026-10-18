// ====================================================================
// MODULE CỔNG THÀNH VIÊN (MEMBER PORTAL CONTROLLER)
// ====================================================================

import { callApi } from '../services/api.js';
import { appState, showToast, showView, showGlobalLoading, hideGlobalLoading, escapeHtml, setFormControlsDisabled, setButtonLoading, showFormError, clearFormError } from './ui.js';
import { 
  memberSessionCardTemplate, 
  memberDocCardTemplate, 
  emptyStateTemplate, 
  renderMemberDrlWidget,
  renderMemberSpotlightCard,
  renderMemberAttendanceAuditTable,
  uiTopicTagBadge,
  formatSessionDateVN,
  renderTopicFilterBarHtml,
  matchesTopicCategory,
  renderTableSkeleton,
  renderCardSkeleton,
  renderStatSkeleton,
  renderSpotlightSkeleton,
  renderDrlWidgetSkeleton,
  renderAuditTableSkeleton
} from './templates.js';
import { 
  paginate, 
  renderPagination, 
  resetPagination, 
  setPaginationPage, 
  setPaginationPageSize 
} from './pagination.js';

/**
 * Hiển thị các khối Skeleton nhấp nháy êm dịu trên danh sách buổi học, bài tập, học liệu của Thành viên
 */
export function renderMemberSkeletons(force = false) {
  // 1. Khung Bento Trái 7/12: Thẻ Tâm Điểm Buổi Học & Chuyên Đề Mới Nhất
  const spotlightEl = document.getElementById('member-spotlight-container');
  if (spotlightEl && (force || !appState.attendance || appState.attendance.length === 0)) {
    spotlightEl.innerHTML = renderSpotlightSkeleton();
  }

  // 2. Khung Bento Phải 5/12: Cụm 3 Thẻ KPI Học Vụ & Tiến Độ ĐRL
  const drlWidgetEl = document.getElementById('member-drl-widget-container');
  if (drlWidgetEl && (force || !appState.attendance || appState.attendance.length === 0)) {
    drlWidgetEl.innerHTML = renderDrlWidgetSkeleton();
  }

  // 3. Bảng Nhật Ký Điểm Danh Học Vụ
  const auditTbody = document.getElementById('member-attendance-audit-tbody');
  if (auditTbody && (force || !appState.attendance || appState.attendance.length === 0)) {
    auditTbody.innerHTML = renderAuditTableSkeleton(4);
  }

  // 4. Danh sách lộ trình chuyên đề (Tab 2)
  const sessionFeed = document.getElementById('member-session-feed') || document.getElementById('member-sessions-grid');
  if (sessionFeed && (force || !appState.attendance || appState.attendance.length === 0)) {
    sessionFeed.innerHTML = renderCardSkeleton(3);
  }

  // 5. Kho học liệu & tài liệu (Tab 3)
  const docsGrid = document.getElementById('member-docs-grid');
  if (docsGrid && (force || !appState.docs || appState.docs.length === 0)) {
    docsGrid.innerHTML = renderCardSkeleton(3);
  }

  // 6. Các chỉ số Counter
  ['member-stat-attended', 'member-stat-submissions', 'member-stat-approved'].forEach(id => {
    const el = document.getElementById(id);
    if (el && (force || !el.textContent.trim() || el.textContent.trim() === '0')) {
      el.innerHTML = renderStatSkeleton();
    }
  });
}

/**
 * Lấy thông tin người dùng hiện tại của phân hệ Thành viên
 * (Hỗ trợ Admin khi xem thử nghiệm hoặc xem dưới danh nghĩa 1 sinh viên cụ thể)
 */
export function getCurrentMemberUser() {
  const viewingAs = sessionStorage.getItem('bht_viewing_as_member');
  if (viewingAs && viewingAs !== 'true') {
    try {
      const parsed = JSON.parse(viewingAs);
      if (parsed && parsed.mssv) return parsed;
    } catch (e) {}
  }
  return appState.user || JSON.parse(sessionStorage.getItem('bht_user') || 'null') || { hoTen: 'Thành Viên', mssv: localStorage.getItem('bht_mssv') || '' };
}

/**
 * Khởi tạo giao diện Cổng Thành Viên (chỉ chạy 1 lần khi đăng nhập hoặc F5)
 * @param {boolean} silent Nếu true thì tải ngầm không hiện overlay loading toàn màn hình
 */
export function initMemberView(silent = true) {
  showView('view-member');
  const user = getCurrentMemberUser();
  const viewingAs = sessionStorage.getItem('bht_viewing_as_member');

  // Điều khiển hiển thị banner và nút quay lại Quản trị
  const banner = document.getElementById('admin-preview-mode-banner');
  const sideBtn = document.getElementById('sidebar-return-admin-container');
  const mobBtn = document.getElementById('mobile-return-admin-btn');
  const bannerTitle = document.getElementById('admin-preview-banner-title');
  const bannerDesc = document.getElementById('admin-preview-banner-desc');

  if (viewingAs) {
    if (banner) banner.classList.remove('hidden');
    if (sideBtn) sideBtn.classList.remove('hidden');
    if (mobBtn) mobBtn.classList.remove('hidden');

    if (bannerTitle && bannerDesc) {
      if (viewingAs !== 'true' && user && user.hoTen) {
        bannerTitle.textContent = `Xem trước: Sinh viên ${user.hoTen} (${user.mssv})`;
        bannerDesc.textContent = `Bạn đang xem toàn bộ kết quả chuyên đề, điểm danh và bài tập của sinh viên này.`;
      } else {
        bannerTitle.textContent = 'Chế độ xem trước: Giao diện Thành viên';
        bannerDesc.textContent = 'Bạn đang trải nghiệm giao diện với tư cách Thành viên. Phiên quản trị vẫn được bảo toàn.';
      }
    }
  } else {
    if (banner) banner.classList.add('hidden');
    if (sideBtn) sideBtn.classList.add('hidden');
    if (mobBtn) mobBtn.classList.add('hidden');
  }

  const nameEl = document.getElementById('member-display-name');
  const mssvEl = document.getElementById('member-display-mssv');
  const welcomeEl = document.getElementById('member-welcome-name');

  if (nameEl) nameEl.textContent = user.hoTen;
  if (mssvEl) mssvEl.textContent = user.mssv;
  if (welcomeEl) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Chào buổi sáng' : (hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối');
    welcomeEl.textContent = `${user.hoTen} (${timeGreeting})`;
  }

  // Cập nhật MSSV Badge trên Hero Dashboard Bento
  const welcomeMssvEl = document.getElementById('member-welcome-mssv');
  if (welcomeMssvEl) welcomeMssvEl.textContent = user.mssv;

  // Lắng nghe tìm kiếm tài liệu và chọn file upload
  if (!window._memberInputsBound) {
    window._memberInputsBound = true;
    const docSearch = document.getElementById('input-search-docs');
    const sessionSearch = document.getElementById('input-search-sessions');
    const fileInput = document.getElementById('file-upload-input');
    const pinInput = document.getElementById('input-attendance-pin');
    const detailPinInput = document.getElementById('member-detail-pin-input');

    if (sessionSearch) sessionSearch.addEventListener('input', () => applySessionsFilter());
    if (docSearch) docSearch.addEventListener('input', (e) => handleSearchDocs(e.target.value));
    if (fileInput) fileInput.addEventListener('change', (e) => handleFileSelected(e.target));
    if (pinInput) pinInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    });
    if (detailPinInput) detailPinInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    });
  }

  // Tự động mở đúng tab theo URL Hash nếu có
  const currentHash = window.location.hash.replace('#', '');
  const validTabs = ['dashboard', 'sessions', 'docs'];
  const initialTab = validTabs.includes(currentHash) ? currentHash : 'dashboard';
  switchMemberTab(initialTab, false);

  // Hiển thị khung Skeleton trước khi dữ liệu từ máy chủ về
  renderMemberSkeletons();
  loadMemberData(silent, false);

  // ĐỒNG BỘ REALTIME & CROSS-TAB TỰ ĐỘNG (Khi Admin tạo Chuyên đề / Giao task / Mở khóa điểm danh)
  if (!window._memberStorageListenerAttached) {
    window._memberStorageListenerAttached = true;
    
    const triggerSync = (src) => {
      const isViewingAs = sessionStorage.getItem('bht_viewing_as_member');
      if (isViewingAs || (appState.user && appState.user.role === 'MEMBER')) {
        console.log(`[Sync] Nhận tín hiệu cập nhật (${src}), tự động đồng bộ dữ liệu chuyên đề mới...`);
        loadMemberData(true, true); // Silent reload, bỏ qua cache
      }
    };

    // 1. Lắng nghe storage event giữa các Tab
    window.addEventListener('storage', (e) => {
      if (e.key === 'bht_mock_store' || e.key === 'bht_sync_event') {
        triggerSync('storage:' + e.key);
      }
    });

    // 2. Lắng nghe custom event trên cùng Tab
    window.addEventListener('bht_sync_event', () => {
      triggerSync('local_event');
    });

    // 3. Tự động đồng bộ khi chuyển quay lại Tab (Visibility change)
    document.addEventListener('visibilitychange', () => {
      const isViewingAs = sessionStorage.getItem('bht_viewing_as_member');
      if (!document.hidden && (isViewingAs || (appState.user && appState.user.role === 'MEMBER'))) {
        loadMemberData(true, true);
      }
    });
  }
}

/**
 * Tải toàn bộ dữ liệu học thuật của thành viên
 * @param {boolean} silent Nếu true thì không bật overlay loading
 * @param {boolean} skipCache Nếu true thì yêu cầu máy chủ lấy dữ liệu mới nhất, bỏ qua cache
 */
export async function loadMemberData(silent = true, skipCache = false) {
  const user = getCurrentMemberUser();
  if (!user || !user.mssv) return;

  if (!silent) showGlobalLoading('Đang tải dữ liệu học thuật...');

  try {
    const [tasksRes, subsRes, attRes, docsRes] = await Promise.all([
      callApi('getAllTasks', {}, { skipCache }),
      callApi('getMemberSubmissions', { mssv: user.mssv }, { skipCache }),
      callApi('getAttendanceSessions', {}, { skipCache }),
      callApi('getAllDocuments', {}, { skipCache })
    ]);

    hideGlobalLoading();

    if (tasksRes && tasksRes.success) appState.tasks = tasksRes.data || [];
    if (subsRes && subsRes.success) appState.submissions = subsRes.data || [];
    if (attRes && attRes.success) appState.attendance = attRes.data || [];
    if (docsRes && docsRes.success) appState.docs = docsRes.data || [];

    renderMemberDashboard();

    // Nếu đang mở xem chi tiết một buổi học, tự động cập nhật lại nội dung chi tiết
    if (currentMemberDetailSessionId) {
      const activeSession = (appState.attendance || []).find(s => 
        String(s.SessionID || '').trim().toUpperCase() === String(currentMemberDetailSessionId).trim().toUpperCase()
      );
      if (activeSession) {
        openMemberSessionDetail(activeSession.SessionID, false);
      }
    } else {
      // Hỗ trợ truy cập trực tiếp bằng Deep Link URL (VD: #sessions/MEET_20261015_190000)
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('sessions/') || hash.startsWith('session/')) {
        const sid = hash.split('/')[1];
        if (sid) {
          const matchSession = (appState.attendance || []).find(s => 
            String(s.SessionID || '').trim().toUpperCase() === String(sid).trim().toUpperCase()
          );
          if (matchSession) {
            openMemberSessionDetail(matchSession.SessionID, false);
          }
        }
      }
    }
  } catch (err) {
    hideGlobalLoading();
    console.error('Lỗi tải dữ liệu thành viên:', err);
    showToast('Lỗi tải dữ liệu: ' + (err.message || err.toString()), 'error');
  }
}

export function refreshMemberData() {
  renderMemberSkeletons(true);
  loadMemberData(false, true); // Bỏ qua cache để luôn lấy dữ liệu mới nhất
}

/**
 * Chuyển tab trong giao diện Thành viên kèm đồng bộ URL Hash
 * @param {'dashboard'|'sessions'|'docs'} tab
 */
export function switchMemberTab(tab, updateHash = true) {
  const tabs = ['dashboard', 'sessions', 'docs'];
  const targetTab = tabs.includes(tab) ? tab : 'dashboard';

  // 1. Luôn ẩn Sub-view Chi tiết Chuyên đề khi chuyển tab menu sidebar
  const detailSection = document.getElementById('member-tab-session-detail');
  if (detailSection) detailSection.classList.add('hidden');
  currentMemberDetailSessionId = null;

  // 2. Ẩn tất cả các tab chính và cập nhật active state cho desktop nav
  tabs.forEach(t => {
    const section = document.getElementById('member-tab-' + t);
    const navItem = document.getElementById('tab-btn-' + t);

    if (section) {
      if (t === targetTab) {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    }

    if (navItem) {
      if (t === targetTab) {
        navItem.classList.add('active');
      } else {
        navItem.classList.remove('active');
      }
    }
  });

  // Đồng bộ URL Hash lên trình duyệt
  if (updateHash && window.location.hash !== '#' + targetTab) {
    history.replaceState(null, '', '#' + targetTab);
  }

  // Cập nhật Mobile Bottom Tabs
  document.querySelectorAll('[data-mobile-tab]').forEach(btn => {
    const isTarget = btn.getAttribute('data-mobile-tab') === targetTab;
    btn.className = isTarget
      ? 'flex flex-col items-center justify-center gap-1 py-1 text-xs text-accent font-semibold transition-colors'
      : 'flex flex-col items-center justify-center gap-1 py-1 text-xs text-ink-muted hover:text-ink font-medium transition-colors';
  });
}

let currentMemberAuditFilter = 'ALL';

/**
 * Lọc bảng nhật ký điểm danh học vụ (Tất cả / Đang mở / Đã kết thúc)
 * @param {'ALL'|'OPEN'|'CLOSED'} filter
 */
export function filterMemberAuditTable(filter = 'ALL') {
  currentMemberAuditFilter = filter;

  // Cập nhật trạng thái active của tab buttons
  const filterTabsContainer = document.getElementById('member-audit-filter-tabs');
  if (filterTabsContainer) {
    filterTabsContainer.querySelectorAll('button').forEach(btn => {
      const f = btn.getAttribute('data-filter');
      if (f === filter) {
        btn.className = 'px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all shadow-sm';
      } else {
        btn.className = 'px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 transition-all';
      }
    });
  }

  // Reset về trang 1 và re-render bảng dữ liệu
  resetPagination('member-audit');
  renderMemberAuditTable();
}

/**
 * Render Bảng Nhật Ký Điểm Danh Chi Tiết với phân trang
 */
export function renderMemberAuditTable() {
  const auditTbody = document.getElementById('member-attendance-audit-tbody');
  const pagEl = document.getElementById('member-attendance-audit-pagination');
  if (!auditTbody) return;

  const user = getCurrentMemberUser();
  const sessions = appState.attendance || [];

  if (sessions.length === 0) {
    auditTbody.innerHTML = renderMemberAttendanceAuditTable([], user.mssv, 'ALL');
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  // Áp dụng filter tab nếu có
  const filtered = sessions.filter(s => {
    if (currentMemberAuditFilter === 'OPEN') return String(s.TrangThai || '').toLowerCase() === 'open';
    if (currentMemberAuditFilter === 'CLOSED') return String(s.TrangThai || '').toLowerCase() === 'closed';
    return true;
  });

  if (filtered.length === 0) {
    auditTbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-ink-muted italic font-mono text-xs">
          Không có buổi sinh hoạt nào phù hợp với bộ lọc "${currentMemberAuditFilter}".
        </td>
      </tr>
    `;
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const { pagedItems } = paginate('member-audit', filtered, {
    pageSize: 6,
    pageSizeOptions: [4, 6, 10, 20],
    onPageChange: () => renderMemberAuditTable()
  });

  auditTbody.innerHTML = renderMemberAttendanceAuditTable(pagedItems, user.mssv, 'ALL');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('member-audit', { showPageSize: false });
  }
}

/**
 * Render toàn bộ Dashboard thành viên (Spotlight, DRL Widget, Audit Table, Roadmap, Docs)
 */
export function renderMemberDashboard() {
  const user = getCurrentMemberUser();
  const sessions = appState.attendance || [];

  // Cập nhật số lượng hoạt động
  const auditCountEl = document.getElementById('member-audit-count');
  if (auditCountEl) {
    auditCountEl.textContent = `${sessions.length} hoạt động`;
  }

  // 1. Render Spotlight Buổi Học Mới Nhất / Đang Diễn Ra
  const spotlightContainer = document.getElementById('member-spotlight-container');
  if (spotlightContainer) {
    // Ưu tiên buổi đang mở PIN, nếu không lấy buổi mới nhất ở vị trí đầu
    const openSession = sessions.find(s => String(s.TrangThai || '').toLowerCase() === 'open');
    const targetSession = openSession || sessions[0] || null;

    let userAttended = false;
    if (targetSession) {
      try {
        const ds = JSON.parse(targetSession.DS_CoMat || '[]');
        userAttended = Array.isArray(ds) && ds.includes(user.mssv);
      } catch (_) {
        userAttended = false;
      }
    }

    spotlightContainer.innerHTML = renderMemberSpotlightCard(targetSession, userAttended);
  }

  // 2. Render Widget Tiến Độ ĐRL & Thống kê
  renderMemberStats();

  // 3. Render Bảng Nhật Ký Điểm Danh Chi Tiết (Audit Log Table) có phân trang
  renderMemberAuditTable();

  // 4. Render danh sách lộ trình chuyên đề & kho học liệu
  renderMemberSessions();
  renderMemberDocs();
}

/**
 * Tính toán tiến độ Điểm Rèn Luyện (ĐRL) & Chuyên cần của thành viên
 * @param {number} attendedCount Số buổi đã tham gia
 * @param {number} totalSessions Tổng số buổi sinh hoạt
 * @param {number} approvedTasks Số bài tập đã đạt
 * @param {number} totalTasks Tổng số bài tập được giao
 * @returns {Object} Thông số tiến độ và khuyến nghị
 */
export function calculateDrlProgress(attendedCount = 0, totalSessions = 0, approvedTasks = 0, totalTasks = 0) {
  const rate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : (attendedCount > 0 ? 100 : 0);

  let drlTier = 'GOOD';
  let drlTierLabel = 'Đạt chuẩn';
  let drlPointsText = '+10 ĐRL';
  let drlBadgeClass = 'bht-badge-ok';
  let nextMilestoneTip = '';

  if (rate >= 80) {
    drlTier = 'EXCELLENT';
    drlTierLabel = 'Xuất sắc';
    drlPointsText = '+15 ĐRL';
    drlBadgeClass = 'bht-badge-ok';
    nextMilestoneTip = 'Tuyệt vời! Bạn đạt mức chuyên cần xuất sắc (≥80%), đủ điều kiện nhận trọn vẹn +15 Điểm Rèn Luyện và xét khen thưởng cuối kỳ.';
  } else if (rate >= 50) {
    drlTier = 'GOOD';
    drlTierLabel = 'Đạt chuẩn';
    drlPointsText = '+10 ĐRL';
    drlBadgeClass = 'bht-badge-ok';
    const target80 = Math.ceil(0.8 * totalSessions);
    const needed = Math.max(1, target80 - attendedCount);
    nextMilestoneTip = `Đạt tiêu chuẩn cộng +10 ĐRL học kỳ. Bạn chỉ cần tham gia thêm ${needed} buổi sinh hoạt để nâng mức lên Xuất sắc (+15 ĐRL).`;
  } else {
    drlTier = 'NEEDS_WORK';
    drlTierLabel = 'Cần cố gắng';
    drlPointsText = '+0 ĐRL';
    drlBadgeClass = 'bht-badge-warn';
    const target50 = Math.ceil(0.5 * totalSessions);
    const needed = Math.max(1, target50 - attendedCount);
    nextMilestoneTip = `Hiện chưa đủ điều kiện xét ĐRL học kỳ (<50%). Hãy tham gia thêm ít nhất ${needed} buổi sinh hoạt nữa để đạt chuẩn.`;
  }

  return {
    attendedCount,
    totalSessions,
    attendanceRate: rate,
    approvedTasks,
    totalTasks,
    drlTier,
    drlTierLabel,
    drlPointsText,
    drlBadgeClass,
    nextMilestoneTip
  };
}

/**
 * Render các thẻ thống kê tổng quan và Widget Tiến độ Điểm rèn luyện
 */
function renderMemberStats() {
  const tasks = appState.tasks || [];
  const subs = appState.submissions || [];
  const atts = appState.attendance || [];
  const user = getCurrentMemberUser();

  const tEl = document.getElementById('stat-member-tasks') || document.getElementById('stat-open-tasks');
  const sEl = document.getElementById('stat-member-submits') || document.getElementById('stat-my-submissions');
  const aEl = document.getElementById('stat-member-attendance') || document.getElementById('stat-my-attendance');

  // Đếm số bài tập của thành viên
  const myTasks = tasks.filter(t => {
    const target = String(t.NguoiNhan || 'ALL').trim().toUpperCase();
    return target === 'ALL' || target === user.mssv;
  });
  const pendingTasks = myTasks.filter(t => {
    const sub = subs.find(s => s.TaskID === t.TaskID);
    return !sub || sub.TrangThaiDuyet === 'Rejected';
  });
  const approvedTasks = subs.filter(s => s.TrangThaiDuyet === 'Approved').length;

  if (tEl) tEl.textContent = pendingTasks.length;
  if (sEl) sEl.textContent = subs.length;

  // Lọc danh sách buổi sinh hoạt học thuật thực tế
  const realSessions = atts.filter(s => s.SessionID !== 'SESSION_GENERAL');
  const totalSessionsCount = realSessions.length > 0 ? realSessions.length : atts.length;

  let attendedCount = 0;
  let openSession = null;
  let hasAttendedOpenSession = false;

  atts.forEach(s => {
    let ds = [];
    try { ds = JSON.parse(s.DS_CoMat || '[]'); } catch (e) {
      ds = s.DS_CoMat ? s.DS_CoMat.split(',').map(x => x.trim()) : [];
    }
    const isAttended = ds.includes(user.mssv);
    if (isAttended) attendedCount++;

    const status = String(s.TrangThai || '').trim().toLowerCase();
    if (status === 'open' || status === 'dang_mo') {
      if (!openSession || s.SessionID !== 'SESSION_GENERAL') {
        openSession = s;
        hasAttendedOpenSession = isAttended;
      }
    }
  });

  if (aEl) aEl.textContent = attendedCount;

  // 1. Render Widget Tiến Độ Điểm Rèn Luyện (DRL Tracker)
  const drlContainer = document.getElementById('member-drl-widget-container');
  if (drlContainer) {
    const drlData = calculateDrlProgress(attendedCount, totalSessionsCount, approvedTasks, myTasks.length);
    drlContainer.innerHTML = renderMemberDrlWidget(drlData);
  }

  // 2. Cập nhật Smart Attendance Banner thông minh
  const chipEl = document.getElementById('member-session-status-chip');
  const bannerDescEl = document.getElementById('member-attendance-banner-desc');
  const formQuickEl = document.getElementById('form-quick-attendance');
  const bannerAttendedEl = document.getElementById('member-attendance-banner-attended');
  const bannerNextEl = document.getElementById('member-attendance-banner-next');
  const btnBannerViewOpen = document.getElementById('btn-banner-view-open-session');
  const nextBriefEl = document.getElementById('member-next-session-brief');

  if (openSession) {
    if (hasAttendedOpenSession) {
      // Đã điểm danh thành công
      if (formQuickEl) formQuickEl.classList.add('hidden');
      if (bannerNextEl) bannerNextEl.classList.add('hidden');
      if (bannerAttendedEl) bannerAttendedEl.classList.remove('hidden');
      if (btnBannerViewOpen) btnBannerViewOpen.setAttribute('data-id', openSession.SessionID);

      if (chipEl) {
        chipEl.className = 'bht-badge bht-badge-ok text-[10px] font-bold';
        chipEl.innerHTML = '<i class="fa-solid fa-check mr-1 text-[9px]"></i>Đã có mặt';
      }
      if (bannerDescEl) {
        bannerDescEl.textContent = `Bạn đã xác nhận có mặt trong buổi "${openSession.TenBuoiHop}". Hãy mở tài liệu hoặc xem bài tập để theo dõi.`;
      }
    } else {
      // Đang mở và chưa điểm danh
      if (bannerAttendedEl) bannerAttendedEl.classList.add('hidden');
      if (bannerNextEl) bannerNextEl.classList.add('hidden');
      if (formQuickEl) formQuickEl.classList.remove('hidden');

      if (chipEl) {
        chipEl.className = 'bht-badge bht-badge-ok text-[10px] font-bold';
        chipEl.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-badge-dot mr-1"></span> Đang mở PIN';
      }
      if (bannerDescEl) {
        bannerDescEl.textContent = `Buổi học "${openSession.TenBuoiHop}" đang diễn ra. Nhập mã PIN 6 số trên màn hình chiếu:`;
      }
    }
  } else {
    // Không có buổi nào mở điểm danh
    if (formQuickEl) formQuickEl.classList.add('hidden');
    if (bannerAttendedEl) bannerAttendedEl.classList.add('hidden');
    if (bannerNextEl) bannerNextEl.classList.remove('hidden');

    if (chipEl) {
      chipEl.className = 'bht-badge bg-subtle text-ink-muted text-[10px]';
      chipEl.textContent = 'Lịch sắp tới';
    }

    const nextSession = realSessions.find(s => String(s.TrangThai || '').toLowerCase() !== 'closed') || realSessions[0];
    if (nextBriefEl && nextSession) {
      nextBriefEl.textContent = `${nextSession.NgayDienRa || 'Thứ Năm 19:30'} · ${nextSession.TenBuoiHop.slice(0, 30)}...`;
    }
    if (bannerDescEl) {
      bannerDescEl.textContent = nextSession
        ? `Buổi học tiếp theo: ${nextSession.TenBuoiHop} (${nextSession.NgayDienRa || 'Chưa xếp lịch'}).`
        : 'Hiện chưa có buổi sinh hoạt nào mở điểm danh.';
    }
  }
}

let currentMemberDetailSessionId = null;
let currentMemberSessionSubTab = 'info';

let currentSessionCategory = 'ALL';
let lastMemberFilteredSessions = null;

/**
 * Lọc danh sách chuyên đề theo danh mục (Pill Buttons)
 */
export function filterSessionsByCategory(category) {
  currentSessionCategory = category || 'ALL';
  applySessionsFilter();
}

/**
 * Áp dụng kết hợp cả Danh mục và Từ khóa tìm kiếm cho Chuyên đề
 */
export function applySessionsFilter() {
  const searchInput = document.getElementById('input-search-sessions');
  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const allSessions = appState.attendance || [];

  // Đồng bộ thanh filter pills động
  const container = document.getElementById('member-sessions-categories');
  if (container) {
    container.innerHTML = renderTopicFilterBarHtml({
      activeCat: currentSessionCategory,
      items: allSessions,
      tagField: 'TagChuyenDe',
      actionName: 'filter-sessions-category'
    });
  }

  const filtered = allSessions.filter(s => {
    // 1. Lọc theo Danh mục
    if (currentSessionCategory && currentSessionCategory !== 'ALL') {
      if (!matchesTopicCategory(s.TagChuyenDe, currentSessionCategory)) return false;
    }

    // 2. Lọc theo Từ khóa tìm kiếm
    if (query) {
      const matchText = (
        (s.TenBuoiHop || '') + ' ' +
        (s.PhongHoc || '') + ' ' +
        (s.NoiDungChuyenDe || '') + ' ' +
        (s.TagChuyenDe || '') + ' ' +
        (s.SessionID || '')
      ).toLowerCase();
      if (!matchText.includes(query)) return false;
    }

    return true;
  });

  lastMemberFilteredSessions = filtered;
  resetPagination('member-sessions');
  renderMemberSessions(filtered);
}

/**
 * Render dòng thời gian các buổi sinh hoạt chuyên đề (Giao diện thẻ gọn gàng - Compact Clean Cards)
 */
export function renderMemberSessions(filteredSessions) {
  const container = document.getElementById('member-session-feed') || document.getElementById('member-sessions-grid');
  const pagEl = document.getElementById('member-sessions-pagination');
  if (!container) return;

  const allSessions = appState.attendance || [];

  // Luôn cập nhật thanh filter pills động nếu container tồn tại
  const filterContainer = document.getElementById('member-sessions-categories');
  if (filterContainer) {
    filterContainer.innerHTML = renderTopicFilterBarHtml({
      activeCat: currentSessionCategory,
      items: allSessions,
      tagField: 'TagChuyenDe',
      actionName: 'filter-sessions-category'
    });
  }

  const sessions = filteredSessions !== undefined ? filteredSessions : (lastMemberFilteredSessions || appState.attendance || []);
  lastMemberFilteredSessions = sessions;
  const user = getCurrentMemberUser();

  if (sessions.length === 0) {
    const isFiltered = (currentSessionCategory !== 'ALL' || (document.getElementById('input-search-sessions')?.value.trim()));
    const msg = isFiltered 
      ? 'Không tìm thấy buổi sinh hoạt nào phù hợp với từ khóa hoặc bộ lọc đã chọn!' 
      : 'Chưa có buổi sinh hoạt nào được lên lịch!';
    container.innerHTML = emptyStateTemplate(msg, 'fa-calendar-xmark');
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const { pagedItems } = paginate('member-sessions', sessions, {
    pageSize: 6,
    pageSizeOptions: [4, 6, 10, 20],
    onPageChange: () => renderMemberSessions()
  });

  const allTasks = appState.tasks || [];
  const subs = appState.submissions || [];

  container.innerHTML = pagedItems.map(s => {
    let ds = [];
    try { ds = JSON.parse(s.DS_CoMat || '[]'); } catch (e) {
      ds = s.DS_CoMat ? s.DS_CoMat.split(',').map(x => x.trim()) : [];
    }
    const hasAttended = ds.includes(user.mssv);
    const isOpen = String(s.TrangThai || '').toLowerCase() === 'open';

    // Tìm bài tập gắn với buổi học này (chuẩn hóa SessionID tránh lệch hoa/thường)
    const sid = String(s.SessionID || '').trim().toUpperCase();
    const task = allTasks.find(t => String(t.SessionID || '').trim().toUpperCase() === sid) || (s.BaiTap ? { ...s.BaiTap, SessionID: s.SessionID } : null);
    let taskStatusLabel = 'Không có bài tập';
    let taskBadgeClass = 'bg-subtle text-ink-faint';

    if (task) {
      const sub = subs.find(item => item.TaskID === task.TaskID);
      if (sub) {
        if (sub.TrangThaiDuyet === 'Approved') {
          taskStatusLabel = 'Đạt bài tập';
          taskBadgeClass = 'bht-badge-ok';
        } else if (sub.TrangThaiDuyet === 'Rejected') {
          taskStatusLabel = 'Cần sửa bài';
          taskBadgeClass = 'bht-badge-err';
        } else {
          taskStatusLabel = 'Đã nộp bài';
          taskBadgeClass = 'bht-badge-warn';
        }
      } else {
        taskStatusLabel = 'Chưa nộp bài';
        taskBadgeClass = 'bht-badge-warn';
      }
    }

    return memberSessionCardTemplate(s, { hasAttended, taskStatusLabel, taskBadgeClass, isOpen });
  }).join('');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('member-sessions');
  }
}

// Lưu lại tab trước đó để khi bấm "Quay lại" sẽ trả về chính xác
let previousMemberTab = 'dashboard';

/**
 * Mở màn hình Sub-view Chi tiết Chuyên đề cho Thành viên (Full Master-Detail View)
 * @param {string} sessionId
 */
export function openMemberSessionDetail(sessionId, updateHash = true) {
  const sessions = appState.attendance || [];
  const s = sessions.find(item => item.SessionID === sessionId);
  if (!s) {
    showToast('Không tìm thấy thông tin buổi học!', 'error');
    return;
  }

  currentMemberDetailSessionId = sessionId;
  const user = getCurrentMemberUser();
  const allTasks = appState.tasks || [];
  const subs = appState.submissions || [];

  // Xác định tab đang đứng để quay lại chính xác
  const visibleTab = ['dashboard', 'sessions', 'docs'].find(t => {
    const sec = document.getElementById('member-tab-' + t);
    return sec && !sec.classList.contains('hidden');
  });
  if (visibleTab) previousMemberTab = visibleTab;

  // Chuyển view: Ẩn TẤT CẢ các tab chính, hiện trang sub-view chi tiết
  ['dashboard', 'sessions', 'docs'].forEach(t => {
    const sec = document.getElementById('member-tab-' + t);
    if (sec) sec.classList.add('hidden');
  });
  const detailSection = document.getElementById('member-tab-session-detail');
  if (detailSection) detailSection.classList.remove('hidden');

  // Cập nhật nhãn nút quay lại trên breadcrumb
  const backBtnText = document.querySelector('[data-action="back-to-member-sessions"] span');
  if (backBtnText) {
    backBtnText.textContent = previousMemberTab === 'dashboard' ? 'Quay lại Tổng quan' : 'Quay lại danh sách buổi học';
  }

  // Cập nhật URL Hash trên thanh địa chỉ trình duyệt
  if (updateHash && window.location.hash !== '#sessions/' + sessionId) {
    history.pushState(null, '', '#sessions/' + sessionId);
  }

  // Cuộn trang lên đầu mượt mà
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 1. Thông tin header
  const idEl = document.getElementById('member-detail-session-id');
  const tagEl = document.getElementById('member-detail-session-tag');
  const roomEl = document.getElementById('member-detail-session-room');
  const badgeEl = document.getElementById('member-detail-attendance-badge');
  const ctaBtn = document.getElementById('member-detail-pin-cta-btn');
  const bannerPinBtn = document.getElementById('member-detail-banner-pin-btn');
  const titleEl = document.getElementById('member-detail-session-title');
  const dateEl = document.getElementById('member-detail-session-date');
  const slideLink = document.getElementById('member-detail-slide-link');
  const descEl = document.getElementById('member-detail-desc');

  if (idEl) idEl.textContent = s.SessionID;
  if (tagEl) tagEl.innerHTML = uiTopicTagBadge(s.TagChuyenDe || 'GENERAL');
  if (roomEl) roomEl.textContent = s.PhongHoc || 'Phòng Lab 02 - Tầng 3 Nhà A3';
  if (titleEl) titleEl.textContent = s.TenBuoiHop || 'Chuyên đề học thuật';
  if (dateEl) dateEl.textContent = formatSessionDateVN(s.NgayDienRa);

  // Điểm danh & Trạng thái nút PIN
  let ds = [];
  try { ds = JSON.parse(s.DS_CoMat || '[]'); } catch (e) {
    ds = s.DS_CoMat ? s.DS_CoMat.split(',').map(x => x.trim()) : [];
  }
  const hasAttended = Array.isArray(ds) && ds.includes(user.mssv);
  const isOpen = String(s.TrangThai || '').toLowerCase() === 'open';

  if (hasAttended) {
    if (badgeEl) {
      badgeEl.className = 'bht-badge bht-badge-ok text-xs';
      badgeEl.innerHTML = '<i class="fa-solid fa-circle-check mr-1 text-[11px]"></i>Đã có mặt';
      badgeEl.classList.remove('hidden');
    }
    if (ctaBtn) ctaBtn.classList.add('hidden');
    if (bannerPinBtn) bannerPinBtn.classList.add('hidden');
  } else if (isOpen) {
    // Thay vì ghi text tĩnh "Đang mở điểm danh", thay bằng nút CTA để nhập mã PIN điểm danh luôn
    if (badgeEl) badgeEl.classList.add('hidden');
    if (ctaBtn) {
      ctaBtn.setAttribute('data-id', sessionId);
      ctaBtn.classList.remove('hidden');
    }
    if (bannerPinBtn) {
      bannerPinBtn.setAttribute('data-id', sessionId);
      bannerPinBtn.classList.remove('hidden');
    }
  } else {
    if (badgeEl) {
      badgeEl.className = 'bht-badge bg-subtle text-ink-faint text-xs';
      badgeEl.innerHTML = '<i class="fa-solid fa-clock mr-1 text-[11px]"></i>Đã kết thúc';
      badgeEl.classList.remove('hidden');
    }
    if (ctaBtn) ctaBtn.classList.add('hidden');
    if (bannerPinBtn) bannerPinBtn.classList.add('hidden');
  }

  // Slide link
  if (slideLink) {
    if (s.LinkTaiLieu && s.LinkTaiLieu.trim()) {
      slideLink.href = s.LinkTaiLieu.trim();
      slideLink.classList.remove('hidden');
    } else {
      slideLink.classList.add('hidden');
    }
  }

  // Nội dung chuyên đề
  if (descEl) {
    descEl.textContent = s.NoiDungChuyenDe || 'Chưa có tóm tắt nội dung chi tiết cho chuyên đề này.';
  }

  // 2. Điểm danh tab cũ (nếu còn tồn tại phần tử)
  const checkinStatusEl = document.getElementById('member-detail-checkin-status');
  const pinBoxEl = document.getElementById('member-detail-pin-box');
  const pinInput = document.getElementById('member-detail-pin-input');

  if (hasAttended) {
    if (checkinStatusEl) {
      checkinStatusEl.innerHTML = '<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ok-soft text-ok font-semibold text-xs"><i class="fa-solid fa-check"></i> Bạn đã hoàn tất điểm danh có mặt cho buổi này</span>';
    }
    if (pinBoxEl) pinBoxEl.classList.add('hidden');
  } else if (isOpen) {
    if (checkinStatusEl) {
      checkinStatusEl.innerHTML = '<span class="text-ink-muted">Buổi học đang mở điểm danh. Vui lòng nhập mã PIN gồm 6 số hiển thị trên máy chiếu:</span>';
    }
    if (pinBoxEl) {
      pinBoxEl.classList.remove('hidden');
      if (pinInput) {
        pinInput.value = '';
        pinInput.disabled = false;
      }
    }
  } else {
    if (checkinStatusEl) {
      checkinStatusEl.innerHTML = '<span class="text-ink-muted italic">Buổi sinh hoạt này đã kết thúc hoặc đóng cổng điểm danh.</span>';
    }
    if (pinBoxEl) pinBoxEl.classList.add('hidden');
  }

  // 3. Khối Bài tập thực hành
  const taskBadgeEl = document.getElementById('member-detail-task-badge');
  const taskContentEl = document.getElementById('member-detail-task-content');

  const curSid = String(sessionId || '').trim().toUpperCase();
  const task = allTasks.find(t => String(t.SessionID || '').trim().toUpperCase() === curSid) || (s.BaiTap ? { ...s.BaiTap, SessionID: sessionId } : null);

  if (!task) {
    if (taskBadgeEl) {
      taskBadgeEl.className = 'bht-badge bg-subtle text-ink-faint text-[10px]';
      taskBadgeEl.textContent = 'Không có bài tập';
    }
    if (taskContentEl) {
      taskContentEl.innerHTML = `
        <div class="py-8 text-center text-ink-muted italic">
          <i class="fa-solid fa-clipboard-check text-2xl text-ink-faint mb-2 block"></i>
          Buổi học này không có bài tập hoặc nhiệm vụ thực hành bắt buộc.
        </div>
      `;
    }
  } else {
    const isTaskOpen = String(task.TrangThai || '').toLowerCase() === 'open';
    const sub = subs.find(item => item.TaskID === task.TaskID);
    const isSubmitted = !!sub;

    if (taskBadgeEl) {
      if (isSubmitted) {
        if (sub.TrangThaiDuyet === 'Approved') {
          taskBadgeEl.className = 'bht-badge bht-badge-ok text-[10px]';
          taskBadgeEl.textContent = 'Đã đạt';
        } else if (sub.TrangThaiDuyet === 'Rejected') {
          taskBadgeEl.className = 'bht-badge bht-badge-err text-[10px]';
          taskBadgeEl.textContent = 'Cần sửa lại';
        } else {
          taskBadgeEl.className = 'bht-badge bht-badge-warn text-[10px]';
          taskBadgeEl.textContent = 'Chờ duyệt';
        }
      } else {
        taskBadgeEl.className = `bht-badge ${isTaskOpen ? 'bht-badge-warn' : 'bg-subtle text-ink-faint'} text-[10px]`;
        taskBadgeEl.textContent = isTaskOpen ? 'Chưa nộp bài' : 'Hết hạn';
      }
    }

    if (taskContentEl) {
      taskContentEl.innerHTML = `
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-hairline">
            <div>
              <div class="flex items-center gap-2">
                <span class="bht-badge-mono text-xs text-accent font-bold">${task.TaskID}</span>
                <h5 class="text-base font-bold text-ink">${escapeHtml(task.TieuDe)}</h5>
              </div>
              <p class="text-xs text-ink-muted mt-1 font-mono">
                <i class="fa-regular fa-clock mr-1"></i>Hạn nộp: <strong class="text-ink">${task.Deadline ? task.Deadline.replace('T', ' ') : 'Không giới hạn'}</strong>
              </p>
            </div>

            <div class="shrink-0">
              ${isTaskOpen ? `
                <button 
                  data-action="open-submit-modal"
                  data-id="${task.TaskID}"
                  class="bht-btn ${sub && sub.TrangThaiDuyet === 'Rejected' ? 'bht-btn-danger' : 'bht-btn-primary'} bht-btn-sm"
                >
                  <i class="fa-solid ${sub && sub.TrangThaiDuyet === 'Rejected' ? 'fa-rotate-left' : 'fa-cloud-arrow-up'} text-xs"></i>
                  <span>${isSubmitted ? (sub && sub.TrangThaiDuyet === 'Rejected' ? 'Nộp lại bài chỉnh sửa' : 'Nộp lại bài tập') : 'Nộp bài ngay'}</span>
                </button>
              ` : `
                <span class="bht-badge bg-subtle text-ink-faint text-xs">Đã hết hạn nộp</span>
              `}
            </div>
          </div>

          ${task.MoTa ? `
            <div class="p-4 rounded-xl bg-subtle/50 border border-hairline text-xs text-ink-muted leading-relaxed whitespace-pre-line">
              <strong class="text-ink block mb-1">Mục tiêu & Hướng dẫn làm bài:</strong>
              ${escapeHtml(task.MoTa)}
            </div>
          ` : ''}

          ${isSubmitted ? `
            <div class="p-4 rounded-xl border border-hairline bg-surface/90 space-y-2.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-bold text-ink flex items-center gap-2">
                  <i class="fa-solid fa-file-arrow-up text-accent"></i>
                  <span>Tập tin bài làm đã nộp:</span>
                </span>
                <span class="bht-badge ${sub.TrangThaiDuyet === 'Approved' ? 'bht-badge-ok' : (sub.TrangThaiDuyet === 'Rejected' ? 'bht-badge-err' : 'bht-badge-warn')} text-xs">
                  ${sub.TrangThaiDuyet === 'Approved' ? 'Đã duyệt đạt' : (sub.TrangThaiDuyet === 'Rejected' ? 'Cần chỉnh sửa' : 'Đang chờ Admin duyệt')}
                </span>
              </div>
              <div class="font-mono text-accent text-xs bg-subtle px-3 py-2 rounded-lg truncate">
                <i class="fa-solid fa-file-code mr-1.5"></i>${escapeHtml(sub.TenFile || 'Tập tin')}
              </div>
              ${sub.Feedback ? `
                <div class="mt-2.5 bht-mentor-feedback text-xs">
                  <div class="flex items-center gap-1.5 text-accent font-bold mb-1">
                    <i class="fa-solid fa-graduation-cap"></i>
                    <span>Nhận xét & Góp ý từ Ban Chuyên Môn / Mentor:</span>
                  </div>
                  <p class="text-ink leading-relaxed whitespace-pre-line">${escapeHtml(sub.Feedback)}</p>
                </div>
              ` : `
                <div class="mt-2 p-2.5 rounded-lg bg-subtle/50 border border-hairline text-[11px] text-ink-faint flex items-center gap-1.5">
                  <i class="fa-solid fa-clock-rotate-left"></i>
                  <span>Bài nộp đang chờ Mentor/Admin xem xét và đánh giá.</span>
                </div>
              `}
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  // Mở tab hiện tại
  switchMemberSessionSubTab(currentMemberSessionSubTab || 'info');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Alias tương thích ngược
export const openMemberSessionDetailModal = openMemberSessionDetail;
export const closeMemberSessionDetailModal = backToMemberSessionsList;

/**
 * Quay lại danh sách tất cả buổi học của Thành viên
 */
export function backToMemberSessionsList() {
  const detailSection = document.getElementById('member-tab-session-detail');
  if (detailSection) detailSection.classList.add('hidden');

  switchMemberTab(previousMemberTab || 'dashboard');
  currentMemberDetailSessionId = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Chuyển sub-tab trong màn hình Chi tiết Buổi học của Thành viên
 * @param {'info'|'task'|'quiz'} tab
 */
export function switchMemberSessionSubTab(tab) {
  const tabs = ['info', 'task', 'quiz'];
  const targetTab = tabs.includes(tab) ? tab : 'info';
  currentMemberSessionSubTab = targetTab;

  tabs.forEach(t => {
    const content = document.getElementById('member-subtab-' + t + '-content');
    const btn = document.getElementById('btn-member-subtab-' + t);
    if (content) content.classList.toggle('hidden', t !== targetTab);
    if (btn) {
      if (t === targetTab) {
        btn.className = 'px-3.5 py-2 rounded-lg font-semibold text-accent bg-accent-soft border border-hairline flex items-center gap-2 shrink-0 transition-colors';
      } else {
        btn.className = 'px-3.5 py-2 rounded-lg font-medium text-ink-muted hover:text-ink flex items-center gap-2 shrink-0 transition-colors';
      }
    }
  });
}

/**
 * Xử lý Điểm danh trực tiếp từ Sub-view Chi tiết
 */
export async function handleCheckInFromDetail() {
  const pinInput = document.getElementById('member-detail-pin-input');
  const pin = pinInput ? pinInput.value.trim() : '';

  if (!/^\d{6}$/.test(pin)) {
    showToast('Mã PIN điểm danh phải gồm đúng 6 chữ số!', 'warning');
    if (pinInput) pinInput.focus();
    return;
  }

  const btn = document.getElementById('btn-member-detail-checkin');
  if (btn) setButtonLoading(btn, true);
  if (pinInput) pinInput.disabled = true;

  try {
    const res = await callApi('checkInAttendance', {
      pinCode: pin,
      mssv: appState.user.mssv
    });

    if (btn) setButtonLoading(btn, false);
    if (pinInput) pinInput.disabled = false;

    if (res && res.success) {
      showToast(res.message || 'Điểm danh thành công!', 'success');
      // Tải lại dữ liệu và làm mới modal
      await loadMemberData(true);
      if (currentMemberDetailSessionId) {
        openMemberSessionDetailModal(currentMemberDetailSessionId);
      }
    } else {
      showToast((res && res.message) ? res.message : 'Điểm danh không thành công!', 'error');
      if (pinInput) pinInput.focus();
    }
  } catch (err) {
    if (btn) setButtonLoading(btn, false);
    if (pinInput) pinInput.disabled = false;
    showToast('Lỗi điểm danh: ' + (err.message || err.toString()), 'error');
  }
}

/**
 * Render danh sách nhiệm vụ cần làm
 */
export function renderMemberTasks() {
  const container = document.getElementById('member-task-list') || document.getElementById('member-tasks-list');
  if (!container) return;

  const tasks = appState.tasks || [];
  const subs = appState.submissions || [];
  const user = appState.user || {};

  const myTasks = tasks.filter(t => {
    const target = String(t.NguoiNhan || 'ALL').trim().toUpperCase();
    return target === 'ALL' || target === user.mssv;
  });

  if (myTasks.length === 0) {
    container.innerHTML = emptyStateTemplate('Hiện tại không có nhiệm vụ nào cần thực hiện!', 'fa-clipboard-check');
    return;
  }

  container.innerHTML = myTasks.map(t => {
    const isOpen = String(t.TrangThai || '').toLowerCase() === 'open';
    const sub = subs.find(s => s.TaskID === t.TaskID);
    const isSubmitted = !!sub;

    return `
      <div class="bht-card p-5 hover:border-strong transition-colors flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="bht-badge-mono text-accent font-bold">${t.TaskID}</span>
            <div class="flex items-center gap-1.5">
              ${isSubmitted ? `<span class="bht-badge ${sub.TrangThaiDuyet === 'Approved' ? 'bht-badge-ok' : 'bht-badge-warn'}">${sub.TrangThaiDuyet === 'Approved' ? 'Đạt' : 'Đã nộp'}</span>` : ''}
              <span class="bht-badge ${isOpen ? 'bht-badge-ok' : 'bg-subtle text-ink-faint'}">
                ${isOpen ? 'Đang mở' : 'Đã kết thúc'}
              </span>
            </div>
          </div>
          <h4 class="bht-heading-serif text-base font-semibold text-ink">${escapeHtml(t.TieuDe)}</h4>
          <p class="text-xs text-ink-muted mt-1.5 line-clamp-3 leading-relaxed">${escapeHtml(t.MoTa || '')}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
          <div class="text-[11px] text-ink-faint font-mono">
            Hạn: ${t.Deadline ? t.Deadline.replace('T', ' ') : 'N/A'}
          </div>
          ${isOpen ? `
            <button data-action="open-submit-modal" data-id="${t.TaskID}" class="bht-btn bht-btn-primary bht-btn-xs">
              <i class="fa-solid fa-cloud-arrow-up text-[10px]"></i>
              <span>${isSubmitted ? 'Nộp lại' : 'Nộp bài'}</span>
            </button>
          ` : '<span class="text-xs text-ink-faint italic">Đã khóa</span>'}
        </div>
      </div>
    `;
  }).join('');
}

let currentDocCategory = 'ALL';

/**
 * Lọc tài liệu theo danh mục chuyên đề (Category Pills)
 * @param {string} category Mã phân loại (ALL, CHUAN_DAU_RA, WORD_DO_AN, EXCEL_DATA, AI_TOOLS, OLYMPIC)
 */
export function filterDocsByCategory(category) {
  currentDocCategory = category || 'ALL';
  applyDocsFilter();
}

/**
 * Áp dụng kết hợp cả Danh mục chuyên đề và Từ khóa tìm kiếm cho kho tài liệu
 */
export function applyDocsFilter() {
  const searchInput = document.getElementById('input-search-docs');
  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const allDocs = appState.docs || [];

  // Đồng bộ thanh filter pills động cho học liệu
  const container = document.getElementById('member-docs-categories');
  if (container) {
    container.innerHTML = renderTopicFilterBarHtml({
      activeCat: currentDocCategory,
      items: allDocs,
      tagField: 'PhanLoai',
      actionName: 'filter-docs-category'
    });
  }

  const filtered = allDocs.filter(d => {
    // 1. Lọc theo Danh mục
    if (currentDocCategory && currentDocCategory !== 'ALL') {
      if (!matchesTopicCategory(d.PhanLoai, currentDocCategory)) return false;
    }

    // 2. Lọc theo Từ khóa tìm kiếm
    if (query) {
      const matchText = ((d.TenTaiLieu || '') + ' ' + (d.MoTa || '') + ' ' + (d.PhanLoai || '')).toLowerCase();
      if (!matchText.includes(query)) return false;
    }

    return true;
  });

  lastMemberFilteredDocs = filtered;
  resetPagination('member-docs');
  renderMemberDocs(filtered);
}

let lastMemberFilteredDocs = null;

/**
 * Render kho học liệu
 */
export function renderMemberDocs(filteredDocs) {
  const container = document.getElementById('member-doc-list') || document.getElementById('member-docs-grid');
  const pagEl = document.getElementById('member-docs-pagination');
  if (!container) return;

  const allDocs = appState.docs || [];

  // Luôn cập nhật thanh filter pills động nếu container tồn tại
  const filterContainer = document.getElementById('member-docs-categories');
  if (filterContainer) {
    filterContainer.innerHTML = renderTopicFilterBarHtml({
      activeCat: currentDocCategory,
      items: allDocs,
      tagField: 'PhanLoai',
      actionName: 'filter-docs-category'
    });
  }

  const docs = filteredDocs !== undefined ? filteredDocs : (lastMemberFilteredDocs || appState.docs || []);
  lastMemberFilteredDocs = docs;

  if (docs.length === 0) {
    container.innerHTML = emptyStateTemplate('Chưa có tài liệu nào phù hợp với bộ lọc!', 'fa-book-open');
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const { pagedItems } = paginate('member-docs', docs, {
    pageSize: 6,
    pageSizeOptions: [3, 6, 9, 15],
    onPageChange: () => renderMemberDocs()
  });

  container.innerHTML = pagedItems.map(d => memberDocCardTemplate(d)).join('');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('member-docs');
  }
}

export function handleSearchDocs(query) {
  applyDocsFilter();
}

/**
 * Mở Modal nộp bài tập
 */
export function openSubmitModal(taskId) {
  const modal = document.getElementById('modal-submit-task') || document.getElementById('modal-submit-assignment');
  const task = (appState.tasks || []).find(t => t.TaskID === taskId);

  const taskIdInput = document.getElementById('submit-task-id');
  if (taskIdInput) taskIdInput.value = taskId;

  const titleEl = document.getElementById('modal-submit-task-title');
  if (titleEl && task) titleEl.textContent = task.TieuDe;

  const deadlineEl = document.getElementById('modal-submit-task-deadline');
  if (deadlineEl && task) deadlineEl.textContent = 'Hạn chót: ' + (task.Deadline ? task.Deadline.replace('T', ' ') : 'N/A');

  const fileInput = document.getElementById('file-upload-input') || document.getElementById('submit-file-input');
  if (fileInput) fileInput.value = '';

  const nameDisplay = document.getElementById('file-chosen-name') || document.getElementById('submit-file-name');
  if (nameDisplay) nameDisplay.textContent = 'Bấm hoặc kéo thả file vào đây';

  const progress = document.getElementById('submit-upload-progress');
  if (progress) progress.classList.add('hidden');

  if (modal) modal.classList.remove('hidden');
}

export function closeSubmitModal() {
  const modal = document.getElementById('modal-submit-task') || document.getElementById('modal-submit-assignment');
  if (modal) modal.classList.add('hidden');
}

export function handleFileSelected(input) {
  const display = document.getElementById('file-chosen-name') || document.getElementById('submit-file-name');
  if (display && input.files && input.files.length > 0) {
    const file = input.files[0];
    display.innerHTML = `
      <span class="text-accent font-semibold">${file.name}</span>
      <span class="text-[11px] text-ink-muted block mt-0.5">(${Math.round(file.size / 1024)} KB)</span>
    `;
  }
}

/**
 * Xử lý nộp bài tập (Base64)
 */
export async function handleUploadSubmission(e) {
  if (e && e.preventDefault) e.preventDefault();

  const taskIdInput = document.getElementById('submit-task-id');
  const taskId = taskIdInput ? taskIdInput.value : '';
  const fileInput = document.getElementById('file-upload-input') || document.getElementById('submit-file-input');
  const form = document.getElementById('form-submit-file') || document.getElementById('form-submit-assignment');
  const btn = document.getElementById('btn-confirm-upload') || document.getElementById('btn-submit-file-action');
  const cancelBtn = document.getElementById('btn-cancel-upload') || document.getElementById('btn-submit-file-cancel');
  const progressBox = document.getElementById('submit-upload-progress');
  const progressBar = document.getElementById('upload-progress-bar');
  const progressPct = document.getElementById('upload-status-pct');
  const dropzoneEl = document.getElementById('dropzone');

  clearFormError(form);

  if (!taskId) {
    showFormError(form, 'Vui lòng chọn bài tập / nhiệm vụ cần nộp!');
    return;
  }

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showFormError(form, 'Vui lòng chọn một tệp để nộp bài!', dropzoneEl);
    return;
  }

  const file = fileInput.files[0];
  if (file.size === 0) {
    showFormError(form, 'Tệp đã chọn rỗng (0 bytes)! Vui lòng kiểm tra lại.', dropzoneEl);
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    showFormError(form, 'Tệp quá lớn! Vui lòng chọn tệp nhỏ hơn 20MB.', dropzoneEl);
    return;
  }

  const allowedExts = ['.docx', '.doc', '.pdf', '.xlsx', '.xls', '.zip', '.rar', '.7z', '.cpp', '.py', '.java', '.sql', '.txt', '.c', '.cs', '.ipynb', '.pptx', '.ppt'];
  const extMatch = file.name.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  if (!allowedExts.includes(ext)) {
    showFormError(form, `Định dạng tệp ${ext || 'này'} không được hỗ trợ. Vui lòng nộp: docx, pdf, xlsx, zip, cpp, py...`, dropzoneEl);
    return;
  }

  setFormControlsDisabled(form, true);
  if (cancelBtn) cancelBtn.disabled = true;
  if (btn) setButtonLoading(btn, true);
  if (progressBox) progressBox.classList.remove('hidden');
  if (progressBar) progressBar.style.width = '40%';
  if (progressPct) progressPct.textContent = '40%';

  const user = appState.user || {};
  const reader = new FileReader();

  reader.onload = async function(event) {
    try {
      if (progressBar) progressBar.style.width = '70%';
      if (progressPct) progressPct.textContent = '70%';

      const base64Data = event.target.result.split(',')[1];
      const payload = {
        taskId: taskId,
        mssv: user.mssv,
        hoTen: user.hoTen,
        email: user.email,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64Data: base64Data
      };

      const res = await callApi('submitTaskAssignment', payload);

      setFormControlsDisabled(form, false);
      if (cancelBtn) cancelBtn.disabled = false;
      if (btn) setButtonLoading(btn, false);
      if (progressBar) progressBar.style.width = '100%';
      if (progressPct) progressPct.textContent = '100%';

      if (res && res.success) {
        showToast(res.message || 'Nộp bài thành công!', 'success');
        closeSubmitModal();
        refreshMemberData();
      } else {
        showFormError(form, (res && res.message) ? res.message : 'Lỗi khi nộp bài!');
      }
    } catch (err) {
      setFormControlsDisabled(form, false);
      if (cancelBtn) cancelBtn.disabled = false;
      if (btn) setButtonLoading(btn, false);
      showFormError(form, 'Lỗi nộp bài: ' + (err.message || err.toString()));
    }
  };

  reader.onerror = function() {
    setFormControlsDisabled(form, false);
    if (cancelBtn) cancelBtn.disabled = false;
    if (btn) setButtonLoading(btn, false);
    showFormError(form, 'Không thể đọc file từ thiết bị!', dropzoneEl);
  };

  reader.readAsDataURL(file);
}

/**
 * Xử lý điểm danh nhanh bằng mã PIN 6 số
 */
export async function handleQuickAttendance(e) {
  if (e && e.preventDefault) e.preventDefault();

  const pinInput = document.getElementById('input-attendance-pin');
  const pin = pinInput ? pinInput.value.trim() : '';

  if (!/^\d{6}$/.test(pin)) {
    showToast('Mã PIN điểm danh phải gồm đúng 6 chữ số!', 'warning');
    if (pinInput) pinInput.focus();
    return;
  }

  const user = appState.user;
  const btn = document.getElementById('btn-attendance-submit');

  if (btn) setButtonLoading(btn, true);
  if (pinInput) pinInput.disabled = true;

  try {
    const res = await callApi('checkInAttendance', {
      pinCode: pin,
      mssv: user.mssv
    });

    if (btn) setButtonLoading(btn, false);
    if (pinInput) pinInput.disabled = false;

    if (res && res.success) {
      showToast(res.message, 'success');
      if (pinInput) pinInput.value = '';
      refreshMemberData();
    } else {
      showToast((res && res.message) ? res.message : 'Điểm danh không thành công!', 'error');
      if (pinInput) pinInput.focus();
    }
  } catch (err) {
    if (btn) setButtonLoading(btn, false);
    if (pinInput) pinInput.disabled = false;
    showToast('Lỗi điểm danh: ' + (err.message || err.toString()), 'error');
  }
}

/**
 * Mở Modal Popup Nhập PIN Điểm Danh Nhanh Cho Thành Viên
 * @param {string} sessionId
 */
export function openQuickPinModal(sessionId) {
  const modal = document.getElementById('modal-member-quick-pin');
  if (!modal) return;

  const s = (appState.attendance || []).find(item => item.SessionID === sessionId);
  if (!s) {
    showToast('Không tìm thấy thông tin buổi học!', 'error');
    return;
  }

  const idEl = document.getElementById('quick-pin-session-id');
  const titleEl = document.getElementById('quick-pin-session-title');
  const pinInput = document.getElementById('quick-pin-input-code');

  if (idEl) idEl.textContent = s.SessionID;
  if (titleEl) titleEl.textContent = s.TenBuoiHop || 'Chuyên đề học thuật';
  if (pinInput) {
    pinInput.value = '';
    pinInput.disabled = false;
    setTimeout(() => pinInput.focus(), 100);
  }

  modal.dataset.sessionId = sessionId;
  modal.classList.remove('hidden');
}

/**
 * Đóng Modal Popup Nhập PIN Điểm Danh Nhanh Cho Thành Viên
 */
export function closeQuickPinModal() {
  const modal = document.getElementById('modal-member-quick-pin');
  if (modal) modal.classList.add('hidden');
}

/**
 * Xử lý xác nhận điểm danh từ Quick PIN Modal
 */
export async function handleSubmitQuickPinModal(e) {
  if (e && e.preventDefault) e.preventDefault();

  const pinInput = document.getElementById('quick-pin-input-code');
  const pin = pinInput ? pinInput.value.trim() : '';

  clearFormError('form-quick-pin-modal');

  if (!/^\d{6}$/.test(pin)) {
    showFormError('form-quick-pin-modal', 'Mã PIN điểm danh phải gồm đúng 6 chữ số!', pinInput);
    return;
  }

  const modal = document.getElementById('modal-member-quick-pin');
  const sessionId = modal ? modal.dataset.sessionId : null;
  const btn = document.getElementById('btn-submit-quick-pin-modal');
  const user = appState.user;

  if (btn) setButtonLoading(btn, true);
  if (pinInput) pinInput.disabled = true;

  try {
    const res = await callApi('checkInAttendance', {
      pinCode: pin,
      mssv: user.mssv,
      sessionId: sessionId
    });

    if (btn) setButtonLoading(btn, false);
    if (pinInput) pinInput.disabled = false;

    if (res && res.success) {
      showToast(res.message || 'Điểm danh thành công!', 'success');
      closeQuickPinModal();
      await loadMemberData(true, true);
    } else {
      showFormError('form-quick-pin-modal', (res && res.message) ? res.message : 'Mã PIN không đúng hoặc buổi học đã đóng!', pinInput);
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    }
  } catch (err) {
    if (btn) setButtonLoading(btn, false);
    if (pinInput) pinInput.disabled = false;
    showFormError('form-quick-pin-modal', 'Lỗi điểm danh: ' + (err.message || err.toString()), pinInput);
  }
}
