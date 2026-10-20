/**
 * MODULE DUYỆT BÀI NỘP DÀNH CHO ADMIN (ADMIN SUBMISSIONS CONTROLLER)
 * Tách từ frontend/modules/admin.js để tinh giản kích thước và module hóa hệ thống.
 * 
 * Phụ trách:
 * 1. Bảng duyệt bài nộp: Lọc bài nộp mới nhất của từng thành viên (1 bài/MSSV/Task)
 * 2. Phân loại theo trạng thái (Pending, Approved, Rejected) và TaskID
 * 3. Thẩm định bài nộp trực tiếp tại dòng (Inline Review) kèm Feedback
 * 4. Drawer thẩm định chi tiết toàn màn hình (Review Drawer)
 */

import { callApi } from '../../services/api.js';
import { 
  appState, 
  showToast, 
  diffRenderList, 
  uiActionLocks, 
  setButtonLoading 
} from '../ui.js';
import { 
  uiEmptyState, 
  renderSubmissionRow 
} from '../templates.js';
import { 
  paginate, 
  renderPagination, 
  resetPagination 
} from '../pagination.js';
import { updateAdminStats } from '../admin.js';

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

/**
 * Lọc danh sách bài nộp sao cho mỗi thành viên (MSSV) trên từng nhiệm vụ (TaskID)
 * chỉ giữ lại DUY NHẤT 1 bài nộp mới nhất, kèm thuộc tính _submissionTurn (tổng số lần đã nộp).
 */
export function getLatestSubmissionsPerMember(submissions = []) {
  const map = new Map();
  (submissions || []).forEach(sub => {
    const key = (sub.TaskID || '') + '_' + (sub.MSSV || '');
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(sub);
  });

  const latestList = [];
  map.forEach(list => {
    // Sắp xếp bài mới nhất lên đầu dựa vào ThoiGianNop và SubID
    list.sort((a, b) => {
      const timeA = new Date(a.ThoiGianNop).getTime() || 0;
      const timeB = new Date(b.ThoiGianNop).getTime() || 0;
      if (timeB !== timeA) return timeB - timeA;
      return String(b.SubID || '').localeCompare(String(a.SubID || ''));
    });
    const latest = { ...list[0] };
    latest._submissionTurn = list.length;
    latestList.push(latest);
  });

  return latestList;
}

export function renderAdminSubmissionsTable() {
  const tbody = document.getElementById('admin-submissions-table-body');
  const pagEl = document.getElementById('admin-submissions-pagination');
  if (!tbody) return;

  const rawSubs = appState.submissions || [];
  const subs = getLatestSubmissionsPerMember(rawSubs);
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

  diffRenderList(tbody, pagedItems, 'SubID', s => {
    const isProcessing = uiActionLocks.activeReviewSubIds.has(s.SubID || s.SubmissionID);
    return renderSubmissionRow(s, { showTaskColumn: true, isProcessing });
  });

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

  // Xử lý hiển thị Card Quà 20/10 nếu bài nộp hoặc sinh viên sở hữu quà 20/10
  const giftContainer = document.getElementById('drawer-gift-2010-container');
  const giftCodeEl = document.getElementById('drawer-gift-code');
  const giftTitleEl = document.getElementById('drawer-gift-title');
  const giftDescEl = document.getElementById('drawer-gift-desc');
  const btnBonus = document.getElementById('btn-apply-bonus-feedback');

  const rawFeedback = target.Feedback || '';
  const rawFileName = target.TenFile || '';
  
  // Tra cứu quà từ thông tin sinh viên trong appState
  const student = (appState.members || []).find(m => String(m.MSSV).toUpperCase() === String(target.MSSV || '').toUpperCase());
  let studentGift = null;
  if (student) {
    const rawG = student.gift2010 || student.Gift2010;
    if (typeof rawG === 'string' && rawG.trim()) {
      try { studentGift = JSON.parse(rawG); } catch (e) {}
    } else if (typeof rawG === 'object' && rawG !== null) {
      studentGift = rawG;
    }
  }

  const hasGift = target.giftCode || rawFeedback.includes('20/10') || rawFileName.includes('20/10') || rawFileName.includes('2010_GIFT') || (studentGift && studentGift.claimCode);

  if (giftContainer) {
    if (hasGift) {
      // Trích xuất mã quà
      let code = target.giftCode || '';
      if (!code && studentGift && studentGift.claimCode) {
        code = studentGift.claimCode;
      }
      if (!code) {
        const match = (rawFeedback + ' ' + rawFileName).match(/ITC2010-[0-9A-Za-z_-]+/);
        code = match ? match[0] : 'ITC2010-VALID';
      }

      if (giftCodeEl) giftCodeEl.textContent = code;

      // Nhận diện loại quà dựa trên studentGift hoặc từ khóa
      let giftType = 'BONUS_10PT';
      if (studentGift && studentGift.giftId) {
        giftType = studentGift.giftId;
      } else if (rawFeedback.includes('Deadline') || rawFileName.includes('Deadline') || rawFeedback.includes('24h') || rawFeedback.includes('24H')) {
        giftType = 'DEADLINE_24H';
      } else if (rawFeedback.includes('Debug') || rawFileName.includes('Debug') || rawFeedback.includes('VIP')) {
        giftType = 'VIP_DEBUG';
      }

      if (giftTitleEl) {
        if (giftType === 'DEADLINE_24H') {
          giftTitleEl.innerHTML = '<i class="fa-regular fa-clock text-rose-500 mr-1"></i>Thẻ Gia Hạn Deadline +24H';
        } else if (giftType === 'VIP_DEBUG') {
          giftTitleEl.innerHTML = '<i class="fa-solid fa-laptop-code text-rose-500 mr-1"></i>Vé Debug Code 1-1 Với Mentor';
        } else {
          giftTitleEl.innerHTML = '<i class="fa-solid fa-chart-line text-rose-500 mr-1"></i>Voucher Cộng +10 Điểm Học Thuật';
        }
      }

      if (giftDescEl) {
        if (giftType === 'DEADLINE_24H') {
          giftDescEl.textContent = 'Đặc quyền: Bài nộp được bảo lưu tính đúng hạn (On-time) kể cả khi nộp muộn tới 24h. Vui lòng duyệt Đạt nếu bài làm đạt chất lượng.';
        } else if (giftType === 'VIP_DEBUG') {
          giftDescEl.textContent = 'Đặc quyền: Sinh viên đăng ký lịch hướng dẫn đồ án/thuật toán 1-1 trực tiếp với Mentor Ban Học Thuật.';
        } else {
          giftDescEl.textContent = 'Đặc quyền: Sinh viên dùng voucher cộng trực tiếp +10 điểm vào kết quả đánh giá bài tập này.';
        }
      }

      if (btnBonus) {
        btnBonus.classList.remove('hidden');
        if (giftType === 'BONUS_10PT') {
          btnBonus.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Áp dụng +10 điểm vào nhận xét';
          btnBonus.onclick = () => {
            if (feedbackInput) {
              const bonusText = '[+10 ĐIỂM QUÀ 20/10] Bài làm tốt. Đã áp dụng Voucher +10 điểm 20/10.';
              if (!feedbackInput.value.includes(bonusText)) {
                feedbackInput.value = (feedbackInput.value ? feedbackInput.value + ' - ' : '') + bonusText;
              }
            }
            showToast('Đã thêm ghi chú +10 điểm vào ô nhận xét!', 'info');
          };
        } else if (giftType === 'DEADLINE_24H') {
          btnBonus.innerHTML = '<i class="fa-regular fa-clock mr-1"></i>Xác nhận Gia hạn Đúng hạn (+24h)';
          btnBonus.onclick = () => {
            if (feedbackInput) {
              const noteText = '[ĐÃ DUYỆT GIA HẠN +24H] Áp dụng Thẻ Gia Hạn Deadline 20/10 (On-time).';
              if (!feedbackInput.value.includes(noteText)) {
                feedbackInput.value = (feedbackInput.value ? feedbackInput.value + ' - ' : '') + noteText;
              }
            }
            showToast('Đã thêm ghi chú duyệt gia hạn vào nhận xét!', 'info');
          };
        } else {
          btnBonus.innerHTML = '<i class="fa-solid fa-laptop-code mr-1"></i>Xác nhận Lịch Debug 1-1';
          btnBonus.onclick = () => {
            if (feedbackInput) {
              const noteText = '[XÁC NHẬN LỊCH DEBUG 1-1] Mentor sẽ liên hệ sắp xếp buổi hướng dẫn trực tiếp.';
              if (!feedbackInput.value.includes(noteText)) {
                feedbackInput.value = (feedbackInput.value ? feedbackInput.value + ' - ' : '') + noteText;
              }
            }
            showToast('Đã thêm ghi chú duyệt Debug 1-1 vào nhận xét!', 'info');
          };
        }
      }

      giftContainer.classList.remove('hidden');
    } else {
      giftContainer.classList.add('hidden');
    }
  }

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
