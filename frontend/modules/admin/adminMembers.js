// ====================================================================
// MODULE QUẢN LÝ NHÂN SỰ & THÀNH VIÊN ADMIN (ADMIN MEMBERS CONTROLLER)
// ====================================================================

import { callApi, setActiveCampaign } from '../../services/api.js';
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
import { renderMemberRow, uiEmptyState } from '../templates.js';
import { paginate, renderPagination, resetPagination } from '../pagination.js';
import { updateAdminStats } from '../admin.js';
import { 
  getActiveCampaign, 
  getActiveCampaignId 
} from '../gift2010.js';

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

  diffRenderList(tbody, pagedItems, 'MSSV', m => {
    const isStatusBusy = uiActionLocks.activeMemberToggleIds.has(m.MSSV);
    const isResetBusy = uiActionLocks.activeResetEmailMssvs.has(m.MSSV);
    return renderMemberRow(m, { isStatusBusy, isResetBusy });
  });

  if (pagEl) {
    pagEl.innerHTML = renderPagination('admin-members');
  }


  // Cập nhật thống kê Quà / Đặc quyền học thuật theo sự kiện đang chọn
  const activeCamp = getActiveCampaign();
  const statBadge = document.getElementById('admin-gift-2010-stat-badge');
  const statCard = document.getElementById('admin-gift-2010-stat-card');

  if (activeCamp && statCard) {
    statCard.classList.remove('hidden');
    const isFemaleOnly = activeCamp.targetAudience === 'female';
    const targetPool = isFemaleOnly ? members.filter(m => String(m.Sex || '').toLowerCase() === 'female') : members;
    const claimedCount = targetPool.filter(m => {
      const raw = m.gift2010 || m.Gift2010;
      return !!raw;
    }).length;

    if (statBadge) {
      statBadge.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-accent-soft text-accent border border-hairline">
          <span>${activeCamp.icon}</span>
          <span>${claimedCount}/${targetPool.length} ${isFemaleOnly ? 'Bạn nữ có quà' : 'Đã nhận quà'}</span>
        </span>
        <button 
          type="button" 
          data-action="open-gift-modal" 
          class="bht-btn bht-btn-xs bg-accent text-accent-fg font-semibold shadow-xs"
          title="Xem thử hoặc mở Hộp quà sự kiện"
        >
          <i class="fa-solid fa-gift mr-1"></i>Xem Quà
        </button>
      `;
    }
  } else if (statCard) {
    // Nếu chọn NONE (Tắt sự kiện), tạm ẩn stat card
    statCard.classList.add('hidden');
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
