// ====================================================================
// MODULE QUẢN LÝ BUỔI SINH HOẠT, ĐIỂM DANH & NHIỆM VỤ ADMIN
// (ADMIN SESSIONS, ATTENDANCE & TASKS CONTROLLER)
// ====================================================================

import { callApi } from '../../services/api.js';
import { 
  appState, 
  uiActionLocks, 
  showToast, 
  escapeHtml, 
  setFormControlsDisabled, 
  setButtonLoading, 
  showFormError, 
  clearFormError, 
  diffRenderList 
} from '../ui.js';
import { 
  adminSessionCardTemplate, 
  emptyStateTemplate, 
  renderAttendeeRow, 
  renderSubmissionRow, 
  uiTopicTagBadge, 
  formatSessionDateVN, 
  uiEmptyState, 
  renderTopicFilterBarHtml, 
  matchesTopicCategory, 
  extractDynamicTopics 
} from '../templates.js';
import { loadAdminQuiz } from './adminQuiz.js';
import { openProjectorMode, closeProjectorMode } from '../projector.js';
import { paginate, renderPagination, resetPagination } from '../pagination.js';
import { getLatestSubmissionsPerMember } from './adminSubmissions.js';
import { updateAdminStats } from '../admin.js';

// ====================================================================
// 1. PHÂN HỆ QUẢN LÝ NHIỆM VỤ
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
        <option value="${escapeHtml(s.SessionID)}" ${s.SessionID === defaultSessionId ? 'selected' : ''}>
          ${escapeHtml(s.SessionID)} - ${escapeHtml(s.TenBuoiHop)}
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
// 2. PHÂN HỆ BUỔI SINH HOẠT & ĐIỂM DANH PIN
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

  diffRenderList(container, pagedItems, 'SessionID', s => {
    const isOpen = String(s.TrangThai || '').toLowerCase() === 'open';
    let attendeeCount = 0;
    try { attendeeCount = JSON.parse(s.DS_CoMat || '[]').length; } catch (e) {
      attendeeCount = s.DS_CoMat ? s.DS_CoMat.split(',').length : 0;
    }

    const task = s.BaiTap || allTasks.find(t => t.SessionID === s.SessionID);
    return adminSessionCardTemplate(s, { attendeeCount, isOpen, taskTitle: task ? task.TieuDe : '' });
  });

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
// 3. TRANG CHI TIẾT BUỔI HỌC CỦA ADMIN (FULL-PAGE MASTER-DETAIL HUB)
// ====================================================================

export let currentAdminActiveSessionId = null;
export let currentAdminSessionSubTab = 'info';

export function getCurrentAdminActiveSessionId() {
  return currentAdminActiveSessionId;
}

export function setCurrentAdminActiveSessionId(id) {
  currentAdminActiveSessionId = id;
}

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

  // Tự động tải dữ liệu trắc nghiệm cho Admin khi mở subtab quiz
  if (tab === 'quiz' && currentAdminActiveSessionId) {
    loadAdminQuiz(currentAdminActiveSessionId);
  }
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
      const subsForTask = getLatestSubmissionsPerMember(allSubs.filter(sub => sub.TaskID === task.TaskID));
      const approvedCount = subsForTask.filter(sub => sub.TrangThaiDuyet === 'Approved').length;
      const pendingCount = subsForTask.filter(sub => sub.TrangThaiDuyet === 'Pending').length;
      const isOpen = String(task.TrangThai || '').toLowerCase() === 'open';

      existPanel.innerHTML = `
        <div class="bht-card p-5 bg-surface border border-hairline space-y-3.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="bht-badge-mono text-accent text-xs font-bold">${escapeHtml(task.TaskID)}</span>
                <span class="bht-badge ${isOpen ? 'bht-badge-ok' : 'bg-subtle text-ink-faint'} text-[10px]">
                  ${isOpen ? 'Đang nhận bài nộp' : 'Đã khóa bài nộp'}
                </span>
                ${task.FolderID ? `
                  <a 
                    href="https://drive.google.com/drive/folders/${encodeURIComponent(task.FolderID)}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="bht-badge bht-badge-mono bg-subtle text-accent text-[10px] hover:underline inline-flex items-center gap-1"
                    title="Mở thư mục Google Drive lưu bài nộp"
                  >
                    <i class="fa-brands fa-google-drive"></i>
                    <span>Folder Drive</span>
                  </a>
                ` : ''}
              </div>
              <h4 class="text-base font-bold text-ink mt-1">${escapeHtml(task.TieuDe)}</h4>
              <p class="text-xs text-ink-muted font-mono mt-0.5"><i class="fa-regular fa-clock mr-1"></i>Hạn nộp: <strong class="text-ink">${escapeHtml(task.Deadline ? task.Deadline.replace('T', ' ') : 'Không giới hạn')}</strong></p>
            </div>

            <div class="flex items-center gap-2 shrink-0 flex-wrap">
              ${task.FolderID ? `
                <a 
                  href="https://drive.google.com/drive/folders/${encodeURIComponent(task.FolderID)}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="bht-btn bht-btn-secondary bht-btn-xs text-accent"
                  title="Mở thư mục Google Drive bài nộp"
                >
                  <i class="fa-brands fa-google-drive mr-1"></i>
                  <span>Mở Drive</span>
                </a>
              ` : ''}
              <button 
                data-action="open-edit-task-modal"
                data-id="${escapeHtml(task.TaskID)}"
                class="bht-btn bht-btn-secondary bht-btn-xs"
                title="Sửa thông tin hoặc đổi link Folder Google Drive"
              >
                <i class="fa-solid fa-pen-to-square mr-1"></i>
                <span>Sửa bài tập</span>
              </button>
              <button 
                data-action="toggle-task-status"
                data-id="${escapeHtml(task.TaskID)}"
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
            <span>Tổng bài nộp (SV): <strong class="text-accent">${subsForTask.length}</strong></span>
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
  const rawSubsForTask = allSubs.filter(sub => sub.TaskID === task.TaskID);
  const subsForTask = getLatestSubmissionsPerMember(rawSubsForTask);

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
// 4. CÁC THAO TÁC QUẢN TRỊ SỬA & XÓA (ADMIN CRUD OPERATIONS)
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
  const folderInput = document.getElementById('edit-task-folder-id');

  if (idInput) idInput.value = task.TaskID;
  if (titleInput) titleInput.value = task.TieuDe || '';
  if (assigneeInput) assigneeInput.value = task.NguoiNhan || 'ALL';
  if (deadlineInput) deadlineInput.value = task.Deadline || '';
  if (descInput) descInput.value = task.MoTa || '';
  if (statusSelect) statusSelect.value = task.TrangThai || 'Open';
  if (folderInput) folderInput.value = task.FolderID || '';

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
  const folderIdInput = document.getElementById('edit-task-folder-id');

  const title = titleInput?.value.trim();
  const assignee = document.getElementById('edit-task-assignee')?.value.trim() || 'ALL';
  const deadline = deadlineInput?.value || '';
  const desc = document.getElementById('edit-task-desc')?.value.trim() || '';
  const status = document.getElementById('edit-task-status')?.value || 'Open';
  const folderId = folderIdInput?.value.trim() || '';

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
      trangThai: status,
      folderId
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
        if (res.folderId !== undefined) {
          t.FolderID = res.folderId;
        } else if (folderId) {
          const m = folderId.match(/[-\w]{25,}/);
          t.FolderID = m ? m[0] : folderId;
        } else {
          t.FolderID = '';
        }
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
