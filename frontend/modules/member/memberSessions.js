// ====================================================================
// MODULE QUẢN LÝ BUỔI SINH HOẠT & ĐIỂM DANH THÀNH VIÊN
// (MEMBER SESSIONS & ATTENDANCE CONTROLLER)
// ====================================================================

import { callApi } from '../../services/api.js';
import { 
  appState, 
  showToast, 
  escapeHtml, 
  setButtonLoading, 
  showFormError, 
  clearFormError 
} from '../ui.js';
import { 
  memberSessionCardTemplate, 
  emptyStateTemplate, 
  uiTopicTagBadge, 
  formatSessionDateVN, 
  renderTopicFilterBarHtml, 
  matchesTopicCategory 
} from '../templates.js';
import { loadMemberQuiz } from './memberQuiz.js';
import { paginate, renderPagination, resetPagination } from '../pagination.js';
import { getCurrentMemberUser, switchMemberTab, loadMemberData, refreshMemberData } from '../member.js';

export let currentMemberDetailSessionId = null;
export let currentMemberSessionSubTab = 'info';

export function getCurrentMemberDetailSessionId() {
  return currentMemberDetailSessionId;
}

export function setCurrentMemberDetailSessionId(id) {
  currentMemberDetailSessionId = id;
}

export let currentSessionCategory = 'ALL';
export let lastMemberFilteredSessions = null;

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

    const absences = appState.absences || [];
    const cleanUserMssv = String(user.mssv || '').trim().toUpperCase();
    const userAbsence = absences.find(a => a.SessionID === s.SessionID && a.MSSV === cleanUserMssv && a.TrangThaiDuyet !== 'Cancelled') || null;

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

    return memberSessionCardTemplate(s, { hasAttended, userAbsence, taskStatusLabel, taskBadgeClass, isOpen });
  }).join('');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('member-sessions');
  }
}

// Lưu lại tab trước đó để khi bấm "Quay lại" sẽ trả về chính xác
export let previousMemberTab = 'dashboard';

/**
 * Mở màn hình Sub-view Chi tiết Chuyên đề cho Thành viên (Full Master-Detail View)
 * @param {string} sessionId
 */
export function openMemberSessionDetail(sessionId, updateHash = true, targetSubTab = null) {
  const sessions = appState.attendance || [];
  const s = sessions.find(item => item.SessionID === sessionId);
  if (!s) {
    showToast('Không tìm thấy thông tin buổi học!', 'error');
    return;
  }

  if (targetSubTab) {
    currentMemberSessionSubTab = targetSubTab;
  } else if (sessionId !== currentMemberDetailSessionId) {
    currentMemberSessionSubTab = 'info';
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

  const absences = appState.absences || [];
  const cleanMssv = String(user.mssv || '').trim().toUpperCase();
  const userAbsence = absences.find(a => a.SessionID === sessionId && a.MSSV === cleanMssv && a.TrangThaiDuyet !== 'Cancelled') || null;

  const bannerAbsenceBtn = document.getElementById('member-detail-banner-absence-btn');
  if (bannerAbsenceBtn) {
    if (!hasAttended && !userAbsence) {
      bannerAbsenceBtn.setAttribute('data-id', sessionId);
      bannerAbsenceBtn.classList.remove('hidden');
    } else {
      bannerAbsenceBtn.classList.add('hidden');
    }
  }

  if (hasAttended) {
    if (badgeEl) {
      badgeEl.className = 'bht-badge bht-badge-ok text-xs';
      badgeEl.innerHTML = '<i class="fa-solid fa-circle-check mr-1 text-[11px]"></i>Đã có mặt';
      badgeEl.classList.remove('hidden');
    }
    if (ctaBtn) ctaBtn.classList.add('hidden');
    if (bannerPinBtn) bannerPinBtn.classList.add('hidden');
  } else if (userAbsence) {
    if (badgeEl) {
      const isAppr = userAbsence.TrangThaiDuyet === 'Approved';
      const isRej = userAbsence.TrangThaiDuyet === 'Rejected';
      badgeEl.className = isAppr ? 'bht-badge bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 text-xs' : (isRej ? 'bht-badge bht-badge-err text-xs' : 'bht-badge bht-badge-warn text-xs');
      badgeEl.innerHTML = `<i class="fa-solid ${isAppr ? 'fa-envelope-circle-check' : (isRej ? 'fa-circle-xmark' : 'fa-clock')} mr-1 text-[11px]"></i>${isAppr ? 'Đã duyệt nghỉ có phép' : (isRej ? 'Không phép' : 'Chờ duyệt vắng')}`;
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
  } else if (userAbsence) {
    if (checkinStatusEl) {
      const isAppr = userAbsence.TrangThaiDuyet === 'Approved';
      const isRej = userAbsence.TrangThaiDuyet === 'Rejected';
      const reasonMap = {
        'TRUNG_LICH_HOC': 'Trùng lịch học / Lịch thi trên lớp',
        'LY_DO_SUC_KHOE': 'Lý do sức khỏe / Bị ốm, sốt',
        'VIEC_GIA_DINH': 'Gia đình có việc đột xuất / Về quê',
        'THI_CU_DU_AN': 'Tham gia kỳ thi học thuật / Dự án',
        'LY_DO_KHAC': 'Lý do cá nhân khác'
      };
      const reasonLabel = reasonMap[userAbsence.LyDo] || userAbsence.LyDo || 'Khác';

      checkinStatusEl.innerHTML = `
        <div class="p-4 rounded-xl border ${isAppr ? 'border-teal-500/30 bg-teal-500/5' : (isRej ? 'border-err/30 bg-err-soft/50' : 'border-warn/30 bg-warn-soft/50')} text-xs space-y-2 text-left">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="font-bold flex items-center gap-1.5 ${isAppr ? 'text-teal-600 dark:text-teal-400' : (isRej ? 'text-err' : 'text-warn')}">
              <i class="fa-solid ${isAppr ? 'fa-envelope-circle-check' : (isRej ? 'fa-circle-xmark' : 'fa-clock-rotate-left')}"></i>
              <span>${isAppr ? 'Đã duyệt nghỉ có phép' : (isRej ? 'Đơn xin vắng bị từ chối' : 'Đơn xin vắng đang chờ BCN duyệt')}</span>
            </span>
            ${userAbsence.TrangThaiDuyet === 'Pending' ? `
              <button 
                type="button" 
                data-action="cancel-absence-request" 
                data-id="${userAbsence.AbsenceID}" 
                class="text-[11px] text-err hover:underline font-mono"
              >
                <i class="fa-solid fa-trash-can mr-1"></i>Hủy đơn
              </button>
            ` : ''}
          </div>
          <div class="text-ink-muted leading-relaxed">
            <strong class="text-ink">Lý do:</strong> ${escapeHtml(reasonLabel)}
          </div>
          ${userAbsence.ChiTiet ? `
            <div class="text-ink-muted leading-relaxed">
              <strong class="text-ink">Giải trình:</strong> ${escapeHtml(userAbsence.ChiTiet)}
            </div>
          ` : ''}
          ${userAbsence.Feedback ? `
            <div class="pt-2 border-t border-hairline text-accent font-sans">
              <strong>Phản hồi từ Mentor:</strong> ${escapeHtml(userAbsence.Feedback)}
            </div>
          ` : ''}
        </div>
      `;
    }
    if (pinBoxEl) pinBoxEl.classList.add('hidden');
  } else if (isOpen) {
    if (checkinStatusEl) {
      checkinStatusEl.innerHTML = `
        <div class="space-y-2 text-left">
          <span class="text-ink-muted block">Buổi học đang mở điểm danh. Vui lòng nhập mã PIN gồm 6 số hiển thị trên máy chiếu:</span>
          <button 
            type="button" 
            data-action="open-quick-absence-modal" 
            data-id="${sessionId}"
            class="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium inline-flex items-center gap-1"
          >
            <i class="fa-regular fa-paper-plane text-[10px]"></i>
            <span>Không thể tham gia? Gửi thư xin vắng mặt tại đây</span>
          </button>
        </div>
      `;
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
  if (currentMemberSessionSubTab === 'quiz') {
    const quizSection = document.getElementById('member-subtab-quiz-content') || document.getElementById('btn-member-subtab-quiz');
    if (quizSection) quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
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

  // Tự động tải dữ liệu trắc nghiệm khi mở tab Quiz
  if (targetTab === 'quiz' && currentMemberDetailSessionId) {
    loadMemberQuiz(currentMemberDetailSessionId);
  }
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

/**
 * Mở Modal Popup Gửi Thư Xin Vắng Mặt Nhanh Cho Thành Viên
 * @param {string} sessionId
 */
export function openQuickAbsenceModal(sessionId) {
  const modal = document.getElementById('modal-member-quick-absence');
  if (!modal) return;

  const s = (appState.attendance || []).find(item => item.SessionID === sessionId);
  if (!s) {
    showToast('Không tìm thấy thông tin buổi sinh hoạt!', 'error');
    return;
  }

  // 1. Chặn nếu buổi học đã kết thúc
  const isClosed = String(s.TrangThai || '').trim().toLowerCase() === 'closed';
  if (isClosed) {
    showToast('Buổi sinh hoạt này đã kết thúc, không thể gửi đơn xin vắng mặt!', 'warning');
    return;
  }

  // 2. Chặn nếu sinh viên đã điểm danh có mặt
  const user = getCurrentMemberUser();
  const cleanMssv = String(user.mssv || '').trim().toUpperCase();
  let dsCoMat = [];
  try { dsCoMat = JSON.parse(s.DS_CoMat || '[]'); } catch (_) { dsCoMat = []; }
  if (Array.isArray(dsCoMat) && dsCoMat.includes(cleanMssv)) {
    showToast('Bạn đã điểm danh có mặt trong buổi học này, không thể nộp đơn xin vắng!', 'warning');
    return;
  }

  // 3. Chặn nếu sinh viên đã có đơn xin vắng đang có hiệu lực
  const allAbs = appState.absences || [];
  const existingAbs = allAbs.find(a => a.SessionID === sessionId && a.MSSV === cleanMssv && a.TrangThaiDuyet !== 'Cancelled');
  if (existingAbs) {
    const isApproved = existingAbs.TrangThaiDuyet === 'Approved' || existingAbs.TrangThai === 'Approved';
    showToast(isApproved ? 'Đơn xin vắng của bạn đã được phê duyệt cho buổi học này!' : 'Bạn đã gửi đơn xin vắng và đang chờ Ban tổ chức duyệt!', 'info');
    return;
  }

  const titleEl = document.getElementById('quick-absence-session-title');
  const dateEl = document.getElementById('quick-absence-session-date');
  const roomEl = document.getElementById('quick-absence-session-room');
  const detailInput = document.getElementById('quick-absence-detail-input');
  const proofInput = document.getElementById('quick-absence-proof-input');
  const reasonSelect = document.getElementById('quick-absence-reason-select');

  if (titleEl) titleEl.textContent = s.TenBuoiHop || 'Chuyên đề học thuật';
  if (dateEl) dateEl.innerHTML = `<i class="fa-regular fa-calendar-check mr-1 text-accent"></i>${formatSessionDateVN(s.NgayDienRa)}`;
  if (roomEl) roomEl.innerHTML = `<i class="fa-solid fa-location-dot mr-1 text-rose-500"></i>${s.PhongHoc || 'Lab CNTT'}`;

  if (detailInput) {
    detailInput.value = '';
    detailInput.disabled = false;
  }
  if (proofInput) {
    proofInput.value = '';
    proofInput.disabled = false;
  }
  if (reasonSelect) {
    reasonSelect.selectedIndex = 0;
    reasonSelect.disabled = false;
  }

  clearFormError('form-quick-absence-modal');

  modal.dataset.sessionId = sessionId;
  modal.classList.remove('hidden');
  setTimeout(() => { if (detailInput) detailInput.focus(); }, 100);
}

/**
 * Đóng Modal Popup Gửi Thư Xin Vắng Mặt Cho Thành Viên
 */
export function closeQuickAbsenceModal() {
  const modal = document.getElementById('modal-member-quick-absence');
  if (modal) modal.classList.add('hidden');
}

/**
 * Xử lý gửi thư xin vắng mặt từ Quick Absence Modal
 */
export async function handleSubmitQuickAbsenceModal(e) {
  if (e && e.preventDefault) e.preventDefault();

  const modal = document.getElementById('modal-member-quick-absence');
  const sessionId = modal ? modal.dataset.sessionId : null;
  if (!sessionId) {
    showToast('Thiếu thông tin buổi sinh hoạt!', 'error');
    return;
  }

  const reasonSelect = document.getElementById('quick-absence-reason-select');
  const detailInput = document.getElementById('quick-absence-detail-input');
  const proofInput = document.getElementById('quick-absence-proof-input');

  const lyDo = reasonSelect ? reasonSelect.value.trim() : 'LY_DO_KHAC';
  const chiTiet = detailInput ? detailInput.value.trim() : '';
  const minhChungLink = proofInput ? proofInput.value.trim() : '';

  clearFormError('form-quick-absence-modal');

  if (!chiTiet) {
    showFormError('form-quick-absence-modal', 'Vui lòng giải trình lý do xin vắng mặt cụ thể!', detailInput);
    if (detailInput) detailInput.focus();
    return;
  }

  const btn = document.getElementById('btn-submit-quick-absence-modal');
  const user = getCurrentMemberUser();

  if (btn) setButtonLoading(btn, true);
  if (detailInput) detailInput.disabled = true;
  if (reasonSelect) reasonSelect.disabled = true;
  if (proofInput) proofInput.disabled = true;

  try {
    const res = await callApi('submitAbsenceRequest', {
      sessionId: sessionId,
      mssv: user.mssv,
      lyDo: lyDo,
      chiTiet: chiTiet,
      minhChungLink: minhChungLink
    });

    if (btn) setButtonLoading(btn, false);
    if (detailInput) detailInput.disabled = false;
    if (reasonSelect) reasonSelect.disabled = false;
    if (proofInput) proofInput.disabled = false;

    if (res && res.success) {
      showToast(res.message || 'Đã gửi thư xin vắng mặt thành công!', 'success');
      closeQuickAbsenceModal();
      await loadMemberData(true, true);
      if (currentMemberDetailSessionId && currentMemberDetailSessionId === sessionId) {
        openMemberSessionDetail(sessionId, false);
      }
    } else {
      showFormError('form-quick-absence-modal', (res && res.message) ? res.message : 'Gửi thư không thành công!', detailInput);
    }
  } catch (err) {
    if (btn) setButtonLoading(btn, false);
    if (detailInput) detailInput.disabled = false;
    if (reasonSelect) reasonSelect.disabled = false;
    if (proofInput) proofInput.disabled = false;
    showFormError('form-quick-absence-modal', 'Lỗi gửi thư: ' + (err.message || err.toString()), detailInput);
  }
}

/**
 * Xử lý hủy đơn xin vắng mặt (khi đang ở trạng thái Pending)
 * @param {string} absenceId
 */
export async function handleCancelAbsenceRequest(absenceId) {
  if (!absenceId) return;
  if (!confirm('Bạn có chắc chắn muốn hủy đơn xin vắng mặt này không?')) return;

  const user = getCurrentMemberUser();
  try {
    const res = await callApi('cancelAbsenceRequest', {
      absenceId: absenceId,
      mssv: user.mssv
    });

    if (res && res.success) {
      showToast(res.message || 'Đã hủy đơn xin vắng thành công!', 'success');
      await loadMemberData(true, true);
      if (currentMemberDetailSessionId) {
        openMemberSessionDetail(currentMemberDetailSessionId, false);
      }
    } else {
      showToast((res && res.message) ? res.message : 'Không thể hủy đơn!', 'error');
    }
  } catch (err) {
    showToast('Lỗi hủy đơn: ' + (err.message || err.toString()), 'error');
  }
}
