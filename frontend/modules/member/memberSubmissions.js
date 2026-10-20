/**
 * MODULE QUẢN LÝ BÀI TẬP & NỘP BÀI DÀNH CHO THÀNH VIÊN (MEMBER SUBMISSIONS CONTROLLER)
 * Tách từ frontend/modules/member.js để tinh giản kích thước và module hóa hệ thống.
 * 
 * Phụ trách:
 * 1. Render danh sách bài tập của cá nhân thành viên
 * 2. Lấy danh sách bài nộp và sắp xếp theo lượt nộp (newest first)
 * 3. Modal nộp bài tập kéo thả tệp tin (hỗ trợ đọc Base64, thanh tiến trình, kiểm tra định dạng)
 */

import { callApi } from '../../services/api.js';
import { 
  appState, 
  showToast, 
  showFormError, 
  clearFormError, 
  setButtonLoading, 
  setFormControlsDisabled, 
  escapeHtml 
} from '../ui.js';
import { emptyStateTemplate } from '../templates.js';
import { refreshMemberData, getCurrentMemberUser } from '../member.js';
import { getClaimedGift } from '../gift2010.js';

/**
 * Lấy danh sách bài nộp của thành viên cho một task, sắp xếp mới nhất lên đầu
 */
export function getMemberSubmissionsForTask(submissions = [], taskId = '') {
  const list = (submissions || []).filter(s => s.TaskID === taskId);
  list.sort((a, b) => {
    const timeA = new Date(a.ThoiGianNop).getTime() || 0;
    const timeB = new Date(b.ThoiGianNop).getTime() || 0;
    if (timeB !== timeA) return timeB - timeA;
    return String(b.SubID || '').localeCompare(String(a.SubID || ''));
  });
  return list;
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

  // Kiểm tra quà 20/10 của sinh viên để hiển thị lựa chọn đính kèm
  const user = getCurrentMemberUser();
  const claimedGift = getClaimedGift(user);
  const giftContainer = document.getElementById('submit-gift-2010-container');
  const giftLabel = document.getElementById('submit-gift-2010-label');
  const giftCheckbox = document.getElementById('submit-gift-2010-checkbox');

  if (giftContainer && giftLabel && giftCheckbox) {
    if (claimedGift && claimedGift.claimCode) {
      giftContainer.classList.remove('hidden');
      giftContainer.classList.add('flex');
      giftLabel.textContent = `${claimedGift.claimCode} (${claimedGift.shortTitle || claimedGift.giftTitle})`;
      giftCheckbox.checked = false;
    } else {
      giftContainer.classList.add('hidden');
      giftContainer.classList.remove('flex');
      giftCheckbox.checked = false;
    }
  }

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
      const giftCheckbox = document.getElementById('submit-gift-2010-checkbox');
      const claimedGift = getClaimedGift(user);
      const isAttachingGift = giftCheckbox && giftCheckbox.checked && claimedGift && claimedGift.claimCode;

      const payload = {
        taskId: taskId,
        mssv: user.mssv,
        hoTen: user.hoTen,
        email: user.email,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64Data: base64Data,
        ...(isAttachingGift ? {
          giftCode: claimedGift.claimCode,
          feedback: `[🎁 Quà 20/10: ${claimedGift.claimCode}]`
        } : {})
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
