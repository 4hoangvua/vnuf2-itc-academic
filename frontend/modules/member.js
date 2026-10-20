// ====================================================================
// MODULE CỔNG THÀNH VIÊN (MEMBER PORTAL CONTROLLER)
// ====================================================================

import { callApi, hydrateAppFromBootstrap } from '../services/api.js';
import { appState, showToast, showView, showGlobalLoading, hideGlobalLoading, escapeHtml, setFormControlsDisabled, setButtonLoading, showFormError, clearFormError } from './ui.js';
import { 
  renderMemberDrlWidget,
  renderMemberSpotlightCard,
  renderMemberAttendanceAuditTable,
  renderTableSkeleton,
  renderCardSkeleton,
  renderStatSkeleton,
  renderSpotlightSkeleton,
  renderDrlWidgetSkeleton,
  renderAuditTableSkeleton
} from './templates.js';
import { 
  currentMemberDetailSessionId, 
  setCurrentMemberDetailSessionId, 
  openMemberSessionDetail, 
  applySessionsFilter, 
  renderMemberSessions 
} from './member/memberSessions.js';
import { handleSearchDocs, renderMemberDocs } from './member/memberDocs.js';
import { handleFileSelected } from './member/memberSubmissions.js';
import { isTakingMemberQuiz } from './member/memberQuiz.js';
import { paginate, renderPagination, resetPagination } from './pagination.js';
import { 
  renderGift2010Banner, 
  renderGift2010ModalContent, 
  claimGiftForUser, 
  isFemaleMember, 
  getClaimedGift,
  resetGiftForUser,
  switchGiftTypeForUser,
  FEMALE_IT_WISHES_2010,
  MALE_IT_WISHES_2010,
  triggerCelebrationBurst,
  initVoucher3DTilt,
  startTypewriter,
  triggerClickBlossom,
  startGiftCardShuffleAnimation,
  stopGiftCardShuffleAnimation,
  getDeterministicGiftForUser
} from './gift2010.js';
import { INITIAL_MOCK_DATA } from '../services/mockData.js';


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
  let user = null;
  const viewingAs = sessionStorage.getItem('bht_viewing_as_member');
  if (viewingAs && viewingAs !== 'true') {
    try {
      const parsed = JSON.parse(viewingAs);
      if (parsed && parsed.mssv) user = parsed;
    } catch (e) {}
  }
  if (!user) {
    user = appState.user || JSON.parse(sessionStorage.getItem('bht_user') || 'null') || { 
      hoTen: localStorage.getItem('bht_hoten') || 'Thành Viên', 
      mssv: localStorage.getItem('bht_mssv') || '',
      Sex: localStorage.getItem('bht_sex') || '',
      sex: localStorage.getItem('bht_sex') || ''
    };
  }

  // Đảm bảo user luôn có trường HoTen / hoTen và Sex chính xác từ danh sách members (kể cả khi session cũ chưa kịp lưu hoặc lưu sai)
  if (user && user.mssv) {
    let mockStoreMembers = [];
    try {
      if (typeof localStorage !== 'undefined') {
        const rawStore = localStorage.getItem('bht_mock_store');
        if (rawStore) {
          const parsedStore = JSON.parse(rawStore);
          if (parsedStore && Array.isArray(parsedStore.members)) {
            mockStoreMembers = parsedStore.members;
          }
        }
      }
    } catch (_) {}

    const memList = (appState.members && appState.members.length > 0) 
      ? appState.members 
      : (mockStoreMembers.length > 0 ? mockStoreMembers : (INITIAL_MOCK_DATA ? INITIAL_MOCK_DATA.members : []));
    const cleanUserMssv = String(user.mssv).trim().toUpperCase();
    const mem = memList.find(m => String(m.MSSV).trim().toUpperCase() === cleanUserMssv);
    
    if (mem) {
      if (mem.HoTen && (!user.hoTen || user.hoTen === 'Thành Viên' || user.hoTen === user.mssv)) {
        user.hoTen = mem.HoTen;
        user.HoTen = mem.HoTen;
        if (typeof localStorage !== 'undefined') localStorage.setItem('bht_hoten', mem.HoTen);
      }
      if (mem.Sex) {
        user.Sex = mem.Sex;
        user.sex = mem.Sex;
      }
      if (!user.gift2010 && mem.gift2010) user.gift2010 = mem.gift2010;
    } else {
      const initM = INITIAL_MOCK_DATA.members.find(x => String(x.MSSV).trim().toUpperCase() === cleanUserMssv);
      if (initM) {
        if (initM.HoTen && (!user.hoTen || user.hoTen === 'Thành Viên' || user.hoTen === user.mssv)) {
          user.hoTen = initM.HoTen;
          user.HoTen = initM.HoTen;
          if (typeof localStorage !== 'undefined') localStorage.setItem('bht_hoten', initM.HoTen);
        }
        if (initM.Sex) {
          user.Sex = initM.Sex;
          user.sex = initM.Sex;
        }
        if (!user.gift2010 && initM.gift2010) user.gift2010 = initM.gift2010;
      }
    }
  }

  // Luôn đồng bộ cả hai trường hoTen và HoTen, cùng Sex và sex
  if (user) {
    const validName = user.hoTen || user.HoTen || localStorage.getItem('bht_hoten') || '';
    user.hoTen = validName;
    user.HoTen = validName;
    const resolvedSex = String(user.Sex || user.sex || localStorage.getItem('bht_sex') || '').trim().toLowerCase();
    if (resolvedSex) {
      user.Sex = resolvedSex;
      user.sex = resolvedSex;
    }
  }

  return user;
}

/**
 * Khởi tạo giao diện Cổng Thành Viên (chỉ chạy 1 lần khi đăng nhập hoặc F5)
 * @param {boolean} silent Nếu true thì tải ngầm không hiện overlay loading toàn màn hình
 * @param {boolean} fetchApi Nếu true thì tự động gọi API nạp dữ liệu, nếu false chỉ dựng khung tĩnh & skeletons
 */
export function initMemberView(silent = true, fetchApi = true) {
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
  if (fetchApi) {
    loadMemberData(silent, false);
  }

  // ĐỒNG BỘ REALTIME & CROSS-TAB TỰ ĐỘNG (Khi Admin tạo Chuyên đề / Giao task / Mở khóa điểm danh)
  if (!window._memberStorageListenerAttached) {
    window._memberStorageListenerAttached = true;
    
    let syncThrottleTimer = null;
    const triggerSync = (src) => {
      // Bảo vệ phiên làm bài: Không làm gián đoạn khi người dùng đang làm trắc nghiệm trong Zen Arena
      if (isTakingMemberQuiz) {
        console.log(`[Sync] Bỏ qua reload (${src}) vì người dùng đang trong phiên thi/ôn luyện Zen Arena.`);
        return;
      }
      const isViewingAs = sessionStorage.getItem('bht_viewing_as_member');
      if (isViewingAs || (appState.user && appState.user.role === 'MEMBER')) {
        if (syncThrottleTimer) return;
        syncThrottleTimer = setTimeout(() => { syncThrottleTimer = null; }, 10000);
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

    // Nếu đang mở xem chi tiết một buổi học và KHÔNG trong phòng thi trắc nghiệm, cập nhật lại chi tiết
    if (currentMemberDetailSessionId && !isTakingMemberQuiz) {
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

export async function refreshMemberData() {
  renderMemberSkeletons(true);
  try {
    const res = await callApi('getAppInitData', {}, { skipCache: true });
    if (res && res.success && res.data) {
      const user = getCurrentMemberUser();
      hydrateAppFromBootstrap(res.data, 'MEMBER', user ? user.mssv : '');
      loadMemberData(false, false);
      showToast('Đã làm mới dữ liệu thành công!', 'success');
      return;
    }
  } catch (e) {}
  loadMemberData(false, true); // Bỏ qua cache để luôn lấy dữ liệu mới nhất (fallback)
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
  setCurrentMemberDetailSessionId(null);

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

  // Render Banner 20/10 (Tự động cá nhân hóa theo giới tính)
  const oct20Container = document.getElementById('member-oct20-banner-container');
  if (oct20Container) {
    oct20Container.innerHTML = renderGift2010Banner(user);
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

// ====================================================================
// PHÂN HỆ BÀI TẬP & NỘP BÀI (MEMBER SUBMISSIONS)
// Re-export từ ./member/memberSubmissions.js để tinh giản kích thước module
// ====================================================================
export * from './member/memberSubmissions.js';

// ====================================================================
// PHÂN HỆ KHO HỌC LIỆU & TÀI LIỆU (MEMBER DOCS)
// Re-export từ ./member/memberDocs.js để tinh giản kích thước module
// ====================================================================
export * from './member/memberDocs.js';




// ====================================================================
// PHÂN HỆ BUỔI SINH HOẠT & ĐIỂM DANH (MEMBER SESSIONS)
// Re-export từ ./member/memberSessions.js để tinh giản kích thước module
// ====================================================================
export * from './member/memberSessions.js';

// ====================================================================
// MODULE TRẮC NGHIỆM & ÔN TẬP THÀNH VIÊN (MEMBER QUIZ & ZEN ARENA)
// Re-export từ ./member/memberQuiz.js để tinh giản kích thước module
// ====================================================================
export * from './member/memberQuiz.js';

// ====================================================================
// PHÂN HỆ QUÀ TẶNG & EASTER EGG 20/10 (GIFT 20/10 HANDLERS)
// ====================================================================

/**
 * Hiển thị chiếc vé quà tặng hoàn chỉnh sau khi xáo thẻ xong
 */
function revealFinalGiftTicket(modal, body, giftData, user) {
  if (!modal || !body || !giftData) return;
  body.innerHTML = renderGift2010ModalContent(giftData, user);

  // Hiệu ứng 1: Pháo hoa bung nở 360 độ từ tâm Modal
  const modalInnerCard = modal.querySelector('.bht-card') || modal;
  triggerCelebrationBurst(modalInnerCard);

  // Hiệu ứng 2: Kích hoạt nghiêng 3D Holographic cho vé
  const voucherCard = modal.querySelector('.bht-voucher-holo');
  if (voucherCard) {
    initVoucher3DTilt(voucherCard);
  }

  // Hiệu ứng 4: Kích hoạt hiệu ứng gõ chữ Typewriter cho lời chúc
  const wishEl = document.getElementById('gift-2010-wish-text');
  if (wishEl) {
    const text = wishEl.textContent.trim().replace(/^"|"$/g, '');
    startTypewriter(wishEl, text, 20);
  }
}

/**
 * Mở modal hộp quà 20/10 cho nữ sinh viên (kèm hoạt cảnh xáo thẻ 3D chuyển động qua lại chậm rãi)
 */
export async function handleOpenGiftModal() {
  const user = getCurrentMemberUser();
  if (!user) return;

  // Tự động mở quà & đồng bộ nếu chưa nhận
  const giftData = await claimGiftForUser(user);
  if (!giftData) {
    showToast('Không thể mở quà tặng lúc này!', 'error');
    return;
  }

  const modal = document.getElementById('modal-gift-2010');
  const body = document.getElementById('gift-2010-modal-body');
  if (!modal || !body) return;

  modal.classList.remove('hidden');

  // Khởi chạy hoạt cảnh xáo thẻ 3D qua lại chậm rãi, sau đó mới lộ diện vé chính thức
  startGiftCardShuffleAnimation(body, giftData, user, () => {
    revealFinalGiftTicket(modal, body, giftData, user);
  });

  // Cập nhật lại banner trên dashboard
  const oct20Container = document.getElementById('member-oct20-banner-container');
  if (oct20Container) {
    oct20Container.innerHTML = renderGift2010Banner(user);
  }
}

/**
 * Xáo thẻ lại để thưởng thức hoạt cảnh 3D
 */
export function handleReplayGiftUnboxing() {
  const user = getCurrentMemberUser();
  if (!user) return;
  const giftData = getClaimedGift(user) || getDeterministicGiftForUser(user);
  const modal = document.getElementById('modal-gift-2010');
  const body = document.getElementById('gift-2010-modal-body');
  if (!modal || !body) return;

  modal.classList.remove('hidden');
  startGiftCardShuffleAnimation(body, giftData, user, () => {
    revealFinalGiftTicket(modal, body, giftData, user);
  });
}

/**
 * Bỏ qua hoạt cảnh xáo thẻ và hiển thị ngay vé quà tặng
 */
export function handleSkipGiftShuffle() {
  stopGiftCardShuffleAnimation();
  const user = getCurrentMemberUser();
  if (!user) return;
  const giftData = getClaimedGift(user) || getDeterministicGiftForUser(user);
  const modal = document.getElementById('modal-gift-2010');
  const body = document.getElementById('gift-2010-modal-body');
  if (!modal || !body) return;

  revealFinalGiftTicket(modal, body, giftData, user);
}

/**
 * Đóng modal hộp quà 20/10
 */
export function handleCloseGiftModal() {
  stopGiftCardShuffleAnimation();
  const modal = document.getElementById('modal-gift-2010');
  if (modal) modal.classList.add('hidden');
}

/**
 * Sao chép mã nhận quà 20/10 vào Clipboard (hỗ trợ sao chép toàn bộ thông điệp kèm mã)
 * @param {string} code Mã voucher
 * @param {string} [fullShare] Toàn bộ chuỗi thông điệp chia sẻ
 */
export function handleCopyGiftCode(code, fullShare) {
  const textToCopy = fullShare || code || (document.getElementById('gift-2010-code-text') ? document.getElementById('gift-2010-code-text').textContent.trim() : '');
  if (!textToCopy) return;

  const successMsg = fullShare 
    ? 'Đã sao chép trọn vẹn thông điệp nhận quà & mã xác nhận!' 
    : `Đã sao chép mã quà 20/10: ${textToCopy}`;

  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(successMsg, 'success');
    }).catch(() => {
      fallbackCopyText(textToCopy, successMsg);
    });
  } else {
    fallbackCopyText(textToCopy, successMsg);
  }
}

/**
 * Tạo câu chúc 20/10 ấm áp cho thành viên Nam và sao chép vào Clipboard
 */
export function handleRandomMaleWish() {
  const wish = MALE_IT_WISHES_2010[Math.floor(Math.random() * MALE_IT_WISHES_2010.length)];
  const msg = 'Đã sao chép lời chúc 20/10! Hãy dán gửi vào nhóm chat CLB nhé 💐';
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(wish).then(() => {
      showToast(msg, 'success');
    }).catch(() => {
      fallbackCopyText(wish, msg);
    });
  } else {
    fallbackCopyText(wish, msg);
  }
}

/**
 * Đổi câu chúc trên Modal quà 20/10 kèm hiệu ứng Typewriter
 */
export function handleShuffle2010Wish() {
  const wishEl = document.getElementById('gift-2010-wish-text');
  if (!wishEl) return;
  const currentWish = wishEl.textContent.trim().replace(/^"|"$/g, '');
  const available = FEMALE_IT_WISHES_2010.filter(w => w !== currentWish);
  const nextWish = available[Math.floor(Math.random() * available.length)] || FEMALE_IT_WISHES_2010[0];
  
  startTypewriter(wishEl, nextWish, 20);
}

function fallbackCopyText(text, successMsg) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(successMsg || `Đã sao chép: ${text}`, 'success');
  } catch (e) {
    showToast(`Nội dung của bạn: ${text}`, 'info');
  }
}

export * from './gift2010.js';

/**
 * Xử lý reset quà 20/10 để kiểm thử lại từ đầu
 */
export async function handleResetGift() {
  const user = getCurrentMemberUser();
  if (!user) return;

  await resetGiftForUser(user);
  handleCloseGiftModal();

  // Cập nhật lại banner trên dashboard thành nút mở quà màu đỏ
  const oct20Container = document.getElementById('member-oct20-banner-container');
  if (oct20Container) {
    oct20Container.innerHTML = renderGift2010Banner(user);
  }

  showToast('Đã reset quà! Bạn có thể bấm "🎁 Mở Hộp Quà 20/10" để thử lại hiệu ứng mở quà.', 'success');
}

/**
 * Xử lý chuyển đổi loại quà để kiểm thử cả 3 trường hợp
 * @param {string} giftId DEADLINE_24H | BONUS_10PT | VIP_DEBUG
 */
export async function handlePreviewGift(giftId) {
  const user = getCurrentMemberUser();
  if (!user || !giftId) return;

  const newGift = await switchGiftTypeForUser(user, giftId);
  if (!newGift) return;

  // Cập nhật ngay modal
  const body = document.getElementById('gift-2010-modal-body');
  if (body) {
    body.innerHTML = renderGift2010ModalContent(newGift, user);
  }

  // Cập nhật lại banner
  const oct20Container = document.getElementById('member-oct20-banner-container');
  if (oct20Container) {
    oct20Container.innerHTML = renderGift2010Banner(user);
  }

  showToast(`Đã chuyển sang quà: ${newGift.shortTitle || newGift.giftTitle}`, 'info');
}
