/**
 * SUB-MODULE QUẢN TRỊ SỰ KIỆN & GỬI EMAIL HÀNG LOẠT (ADMIN CAMPAIGNS & MAILER)
 * Tách từ admin.js theo chuẩn add-feature-workflow.
 * 
 * Phụ trách:
 * 1. Chuyển đổi chiến dịch sự kiện mẫu (OCT20, TET, MARCH8, ANNIVERSARY, NONE)
 * 2. Cài đặt hẹn giờ bắt đầu / kết thúc (Auto-Scheduler)
 * 3. Soạn thảo Email template, Live Preview cá nhân hóa
 * 4. Phát gửi thư hàng loạt với tính năng CHỌN TỪNG NGƯỜI NHẬN (Bulk Dispatch Queue)
 */

import { callApi, broadcastDataSync, setActiveCampaign } from '../../services/api.js';
import { appState } from '../store.js';
import { showToast, showGlobalLoading, hideGlobalLoading } from '../ui.js';
import { renderAdminCampaignTabContent } from '../templates/campaignTemplates.js';
import { renderAdminCampaignSelector } from '../gift2010.js';

// Danh sách chiến dịch mặc định (Fallback an toàn trên Production khi backend chưa trả về kịp)
const DEFAULT_FALLBACK_CAMPAIGNS = [
  {
    id: 'OCT20',
    title: 'Hộp Quà 20/10 · Tôn Vinh Nữ Sinh VNUF2',
    subtitle: 'Dành riêng cho bóng hồng công nghệ VNUF2',
    targetAudience: 'female',
    icon: '🌸',
    startDate: '2026-10-20T00:00',
    endDate: '2026-10-21T23:59',
    emailSubject: '[VNUF2-ITC] Thân chúc bạn ngày 20/10 rực rỡ & Món quà học thuật đặc biệt 🌸',
    emailTemplate: 'Thân gửi {HoTen} (MSSV: {MSSV}),\n\nNhân ngày 20/10, Ban Học Thuật thân chúc bạn luôn xinh đẹp, tự tin và ngập tràn niềm vui!\n\nBan gửi tặng riêng bạn một Hộp quà Học thuật đặc quyền. Đăng nhập cổng {LinkWeb} để tự tay mở quà nhé!\n\nThân ái,\nBan Học Thuật CLB Tin Học VNUF2',
    gifts: [
      { id: 'EXTEND_24H', icon: '⏳', title: 'Thẻ Gia Hạn Deadline +24H', shortTitle: 'Gia hạn +24h', description: 'Gia hạn thêm 24 giờ cho bài tập bất kỳ.' },
      { id: 'BONUS_10PT', icon: '⭐', title: 'Voucher +10 Điểm Trắc Nghiệm', shortTitle: 'Cộng 10đ Quiz', description: 'Cộng thêm 10 điểm vào bài trắc nghiệm.' },
      { id: 'DEBUG_VIP', icon: '💻', title: 'Suất VIP Debug Code 1-1', shortTitle: 'VIP Debug 1-1', description: 'Hỗ trợ debug trực tiếp cùng Trưởng Ban.' }
    ]
  },
  {
    id: 'TET',
    title: 'Lì Xì Học Thuật Khai Xuân VNUF2',
    subtitle: 'Khai xuân như ý · Lộc mã vinh quy',
    targetAudience: 'all',
    icon: '🧧',
    startDate: '2027-02-06T00:00',
    endDate: '2027-02-15T23:59',
    emailSubject: '[VNUF2-ITC] Lì Xì Học Thuật Khai Xuân - May Mắn & Khởi Sắc 🧧',
    emailTemplate: 'Thân gửi {HoTen} (MSSV: {MSSV}),\n\nNhân dịp Năm Mới, Ban Học Thuật chúc bạn khai xuân như ý, học tập xuất sắc và gặt hái nhiều thành công!\n\nBan gửi tặng bạn phong bao lì xì học thuật tại: {LinkWeb}\n\nThân ái,\nBan Học Thuật CLB Tin Học VNUF2',
    gifts: [
      { id: 'LIXI_15PT', icon: '🧧', title: 'Bao Lì Xì +15 Điểm Quiz', shortTitle: 'Lì xì +15đ', description: 'Cộng 15 điểm vào bài thi khai xuân.' },
      { id: 'EXTEND_48H', icon: '⏳', title: 'Thẻ Đặc Quyền +48H Deadline', shortTitle: 'Gia hạn +48h', description: 'Thong thả du xuân, gia hạn thêm 48 giờ.' },
      { id: 'VIP_TET', icon: '✨', title: 'Suất Code Review Đầu Năm', shortTitle: 'Review 1-1', description: 'Được Ban Chủ nhiệm review code 1-1.' }
    ]
  },
  {
    id: 'MARCH8',
    title: 'Hộp Quà 8/3 · Ngày Quốc Tế Phụ Nữ',
    subtitle: 'Tôn vinh bóng hồng công nghệ Ban Học Thuật',
    targetAudience: 'female',
    icon: '🌷',
    startDate: '2027-03-08T00:00',
    endDate: '2027-03-09T23:59',
    emailSubject: '[VNUF2-ITC] Chúc mừng Ngày Quốc Tế Phụ Nữ 8/3 🌷',
    emailTemplate: 'Thân gửi {HoTen} (MSSV: {MSSV}),\n\nChúc bạn ngày 8/3 rạng rỡ, tự tin và ngập tràn hạnh phúc!\n\nĐăng nhập cổng {LinkWeb} để mở quà 8/3 nhé!\n\nThân ái,\nBan Học Thuật CLB Tin Học VNUF2',
    gifts: [
      { id: 'EXTEND_24H', icon: '⏳', title: 'Thẻ Gia Hạn Deadline +24H', shortTitle: 'Gia hạn +24h', description: 'Gia hạn thêm 24 giờ cho bài tập.' },
      { id: 'BONUS_10PT', icon: '⭐', title: 'Voucher +10 Điểm Trắc Nghiệm', shortTitle: 'Cộng 10đ Quiz', description: 'Cộng thêm 10 điểm vào bài trắc nghiệm.' },
      { id: 'DEBUG_VIP', icon: '💻', title: 'Suất VIP Debug Code 1-1', shortTitle: 'VIP Debug 1-1', description: 'Hỗ trợ debug trực tiếp cùng Trưởng Ban.' }
    ]
  },
  {
    id: 'ANNIVERSARY',
    title: 'Quà Tri Ân Sinh Nhật CLB Tin Học VNUF2',
    subtitle: 'Tự hào truyền thống học thuật & sáng tạo',
    targetAudience: 'all',
    icon: '🎂',
    startDate: '2027-05-15T00:00',
    endDate: '2027-05-20T23:59',
    emailSubject: '[VNUF2-ITC] Mừng Sinh Nhật CLB - Nhận Quà Tri Ân Đặc Biệt 🎂',
    emailTemplate: 'Thân gửi {HoTen} (MSSV: {MSSV}),\n\nChúc mừng sinh nhật CLB Tin học VNUF2! Cảm ơn bạn đã luôn đồng hành cùng Ban Học Thuật.\n\nNhận quà tri ân tại: {LinkWeb}\n\nThân ái,\nBan Học Thuật CLB Tin Học VNUF2',
    gifts: [
      { id: 'BONUS_10PT', icon: '⭐', title: 'Voucher +10 Điểm Trắc Nghiệm', shortTitle: 'Cộng 10đ Quiz', description: 'Cộng điểm sinh nhật CLB.' },
      { id: 'EXTEND_24H', icon: '⏳', title: 'Thẻ Gia Hạn Deadline +24H', shortTitle: 'Gia hạn +24h', description: 'Gia hạn bài tập thêm 24h.' },
      { id: 'STREAK_SHIELD', icon: '🛡️', title: 'Khiên Bảo Lưu Streak Học Tập', shortTitle: 'Khiên Streak', description: 'Bảo lưu chuỗi ngày sinh hoạt khi vắng mặt.' }
    ]
  }
];

// State nội bộ của phân hệ Quản lý Chiến Dịch
export let adminCampaignsList = [...DEFAULT_FALLBACK_CAMPAIGNS];
export let adminActiveCampaignId = 'OCT20';
export let adminSelectedCampaignId = 'OCT20';
export let adminLastEmailDispatch = null;

// Bản đồ lưu trữ tập hợp MSSV được chọn gửi email theo từng chiến dịch: { [campaignId]: Set<mssv> }
export const adminRecipientSelectionMap = {};

/**
 * Tải và hiển thị Tab Sự Kiện & Gửi Thư trên Admin Portal
 */
export async function loadAdminCampaigns() {
  const container = document.getElementById('admin-tab-campaigns');
  if (!container) return;

  try {
    const res = await callApi('getAllCampaigns', {});
    if (res && res.success && res.data) {
      if (Array.isArray(res.data)) {
        adminCampaignsList = res.data.length > 0 ? res.data : DEFAULT_FALLBACK_CAMPAIGNS;
        adminActiveCampaignId = res.activeCampaignId || 'OCT20';
      } else {
        adminCampaignsList = (Array.isArray(res.data.campaigns) && res.data.campaigns.length > 0)
          ? res.data.campaigns
          : DEFAULT_FALLBACK_CAMPAIGNS;
        adminActiveCampaignId = res.data.activeCampaignId || res.activeCampaignId || 'OCT20';
        adminLastEmailDispatch = res.data.lastEmailDispatch || null;
      }

      if (!adminSelectedCampaignId || adminSelectedCampaignId === 'NONE') {
        adminSelectedCampaignId = adminActiveCampaignId !== 'NONE' ? adminActiveCampaignId : 'OCT20';
      }
    }
  } catch (err) {
    console.warn('Không thể tải dữ liệu campaigns từ server, sử dụng cấu hình mặc định:', err);
    adminCampaignsList = DEFAULT_FALLBACK_CAMPAIGNS;
  }

  renderAdminCampaignsView();
}

/**
 * Render lại giao diện Tab Sự Kiện
 */
export function renderAdminCampaignsView() {
  const tabEl = document.getElementById('admin-tab-campaigns');
  if (!tabEl) return;

  // 1. Cập nhật Bộ Chọn Sự Kiện (Campaign Selector Card) ở đầu tab
  const selectorContainer = document.getElementById('admin-campaign-selector-container');
  if (selectorContainer) {
    selectorContainer.innerHTML = renderAdminCampaignSelector(adminActiveCampaignId);
  }

  // 2. Cập nhật Vùng Nội dung chính của Tab Sự kiện
  const contentContainer = document.getElementById('admin-campaign-tab-content') || tabEl;
  const members = appState.members || [];

  const currentCamp = adminCampaignsList.find(c => c.id === adminSelectedCampaignId) || adminCampaignsList[0] || {};
  const isFemaleTarget = (currentCamp.targetAudience === 'female');
  const targetMembers = members.filter(m => {
    if (isFemaleTarget) {
      return String(m.Sex || '').trim().toLowerCase() === 'female';
    }
    return true;
  });
  const validEmailMembers = targetMembers.filter(m => m.Email && String(m.Email).includes('@'));

  // Khởi tạo danh sách người nhận được chọn nếu chưa có
  if (!adminRecipientSelectionMap[adminSelectedCampaignId]) {
    adminRecipientSelectionMap[adminSelectedCampaignId] = new Set(validEmailMembers.map(m => m.MSSV));
  }
  const currentSelectedSet = adminRecipientSelectionMap[adminSelectedCampaignId];

  contentContainer.innerHTML = renderAdminCampaignTabContent({
    campaigns: adminCampaignsList,
    activeCampaignId: adminActiveCampaignId,
    selectedCampaignId: adminSelectedCampaignId,
    members: members,
    lastDispatch: adminLastEmailDispatch,
    selectedMssvs: Array.from(currentSelectedSet)
  });

  // Tự động gắn sự kiện input để Live Preview phản hồi gõ phím theo thời gian thực
  const subjInput = document.getElementById('admin-campaign-email-subject');
  const bodyInput = document.getElementById('admin-campaign-email-body');
  const linkInput = document.getElementById('admin-campaign-web-link');
  if (subjInput) subjInput.addEventListener('input', handleUpdateCampaignEmailPreview);
  if (bodyInput) bodyInput.addEventListener('input', handleUpdateCampaignEmailPreview);
  if (linkInput) linkInput.addEventListener('input', handleUpdateCampaignEmailPreview);
}

/**
 * Xử lý khi Admin chọn chuyển đổi sự kiện (áp dụng khi click nút ở bộ chọn sự kiện)
 * @param {string} campaignId ID chiến dịch hoặc 'NONE'
 */
export async function handleSwitchAdminCampaign(campaignId) {
  if (!campaignId) return;

  if (campaignId === 'NONE') {
    return handleSelectAdminCampaign('NONE');
  }

  showGlobalLoading(`Đang kích hoạt sự kiện ${campaignId}...`);
  try {
    const res = await setActiveCampaign(campaignId);
    hideGlobalLoading();
    if (res && res.success) {
      adminActiveCampaignId = campaignId;
      adminSelectedCampaignId = campaignId;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bht_active_campaign', campaignId);
      }
      broadcastDataSync('activeCampaign');
      showToast(res.message || `Đã kích hoạt sự kiện "${campaignId}" thành công!`, 'success');
      renderAdminCampaignsView();
    } else {
      showToast(res ? res.message : 'Không thể kích hoạt sự kiện!', 'error');
    }
  } catch (err) {
    hideGlobalLoading();
    showToast('Lỗi khi cập nhật sự kiện: ' + (err.message || err.toString()), 'error');
  }
}

/**
 * Xử lý khi Admin chọn một Chiến dịch Sự kiện khác từ danh mục (preset card)
 * @param {string} campaignId ID chiến dịch hoặc 'NONE'
 */
export async function handleSelectAdminCampaign(campaignId) {
  if (!campaignId) return;

  if (campaignId === 'NONE') {
    const isConfirm = confirm('Bạn có chắc chắn muốn TẮT toàn bộ sự kiện để đưa Cổng học thuật về giao diện tiêu chuẩn?');
    if (!isConfirm) return;

    showGlobalLoading('Đang tắt sự kiện...');
    try {
      const res = await callApi('setActiveCampaign', { campaignId: 'NONE' });
      hideGlobalLoading();
      if (res && res.success) {
        adminActiveCampaignId = 'NONE';
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('bht_active_campaign', 'NONE');
        }
        broadcastDataSync('activeCampaign');
        showToast('Đã tắt sự kiện! Giao diện cổng trở về chế độ tiêu chuẩn.', 'success');
        renderAdminCampaignsView();
      } else {
        showToast(res.message || 'Lỗi khi tắt sự kiện!', 'error');
      }
    } catch (err) {
      hideGlobalLoading();
      showToast('Lỗi: ' + (err.message || err.toString()), 'error');
    }
    return;
  }

  // Chọn chiến dịch để xem và chỉnh sửa cấu hình
  adminSelectedCampaignId = campaignId;
  renderAdminCampaignsView();
}

/**
 * Lưu lịch trình hẹn giờ & nội dung thư cho chiến dịch
 * @param {string} campaignId
 */
export async function handleSaveCampaignSchedule(campaignId) {
  const targetId = campaignId || adminSelectedCampaignId;
  const startInput = document.getElementById('admin-campaign-start-time');
  const endInput = document.getElementById('admin-campaign-end-time');
  const audienceSelect = document.getElementById('admin-campaign-target-audience');
  const subjectInput = document.getElementById('admin-campaign-email-subject');
  const bodyInput = document.getElementById('admin-campaign-email-body');
  const linkInput = document.getElementById('admin-campaign-web-link');

  const startDate = startInput ? startInput.value : '';
  const endDate = endInput ? endInput.value : '';
  const targetAudience = audienceSelect ? audienceSelect.value : 'all';
  const emailSubject = subjectInput ? subjectInput.value.trim() : '';
  const emailTemplate = bodyInput ? bodyInput.value.trim() : '';
  const webLink = linkInput ? linkInput.value.trim() : '';

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    showToast('Thời gian bắt đầu không thể diễn ra sau thời gian kết thúc!', 'warning');
    return;
  }

  showGlobalLoading('Đang lưu cấu hình sự kiện...');
  try {
    const res = await callApi('saveCampaignConfig', {
      campaignId: targetId,
      startDate,
      endDate,
      targetAudience,
      emailSubject,
      emailTemplate,
      webLink,
      setActive: true
    });

    hideGlobalLoading();
    if (res && res.success) {
      adminActiveCampaignId = targetId;
      adminCampaignsList = adminCampaignsList.map(c => 
        c.id === targetId ? { ...c, startDate, endDate, targetAudience, emailSubject, emailTemplate, webLink } : c
      );

      broadcastDataSync('activeCampaign');
      showToast(`Đã kích hoạt và lưu lịch trình sự kiện "${targetId}" thành công!`, 'success');
      renderAdminCampaignsView();
    } else {
      showToast(res.message || 'Không thể lưu cấu hình sự kiện!', 'error');
    }
  } catch (err) {
    hideGlobalLoading();
    showToast('Lỗi lưu cấu hình: ' + (err.message || err.toString()), 'error');
  }
}

/**
 * Chèn thẻ biến nhanh vào ô soạn thảo email tại vị trí con trỏ
 * @param {string} tag Tên tag như {HoTen}, {MSSV}, {TenQua}, {MaVoucher}
 */
export function handleInsertCampaignEmailTag(tag) {
  const textarea = document.getElementById('admin-campaign-email-body');
  if (!textarea || !tag) return;

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const text = textarea.value;

  textarea.value = text.substring(0, start) + tag + text.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + tag.length;

  handleUpdateCampaignEmailPreview();
}

/**
 * Cập nhật tức thì khung Live Preview Email bên phải
 */
export function handleUpdateCampaignEmailPreview() {
  const subjectInput = document.getElementById('admin-campaign-email-subject');
  const bodyInput = document.getElementById('admin-campaign-email-body');
  const linkInput = document.getElementById('admin-campaign-web-link');
  const previewSubjectEl = document.getElementById('email-preview-subject');
  const previewBodyEl = document.getElementById('email-preview-body');
  const ctaBtnEl = document.getElementById('email-preview-cta-btn');

  if (!previewSubjectEl || !previewBodyEl) return;

  const sampleName = 'Nguyễn Thu Trang';
  const sampleMSSV = '2251120002';
  const currentCamp = adminCampaignsList.find(c => c.id === adminSelectedCampaignId) || {
    title: 'Hộp Quà May Mắn'
  };

  const defaultWebOrigin = (typeof window !== 'undefined' && window.location && window.location.origin) 
    ? (window.location.origin + window.location.pathname) 
    : 'https://vnuf2-itc.edu.vn/app';
  const webLink = (linkInput && linkInput.value.trim()) 
    ? linkInput.value.trim() 
    : (currentCamp.webLink || defaultWebOrigin);

  if (ctaBtnEl) {
    ctaBtnEl.setAttribute('href', webLink);
  }

  const rawSubject = subjectInput ? subjectInput.value : '';
  const rawBody = bodyInput ? bodyInput.value : '';

  previewSubjectEl.textContent = rawSubject
    .replace(/\{HoTen\}/g, sampleName)
    .replace(/\{MSSV\}/g, sampleMSSV)
    .replace(/\{TenSuKien\}/g, currentCamp.title);

  const formattedBody = rawBody
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{HoTen\}/g, `<strong>${sampleName}</strong>`)
    .replace(/\{MSSV\}/g, `<code class="font-mono text-accent font-semibold">${sampleMSSV}</code>`)
    .replace(/\{TenSuKien\}/g, `<strong>${currentCamp.title}</strong>`)
    .replace(/\{LinkWeb\}/g, `<a href="${webLink}" target="_blank" rel="noopener noreferrer" class="text-accent underline font-mono break-all">${webLink}</a>`)
    .replace(/\n/g, '<br>');

  previewBodyEl.innerHTML = formattedBody;
}

/**
 * Xử lý toggle checkbox của từng người nhận trong danh sách
 * @param {string} mssv Mã sinh viên
 * @param {boolean} isChecked Trạng thái tick
 */
export function handleToggleCampaignRecipientCheckbox(mssv, isChecked) {
  if (!mssv) return;

  if (!adminRecipientSelectionMap[adminSelectedCampaignId]) {
    adminRecipientSelectionMap[adminSelectedCampaignId] = new Set();
  }
  const set = adminRecipientSelectionMap[adminSelectedCampaignId];

  if (isChecked) {
    set.add(mssv);
  } else {
    set.delete(mssv);
  }

  updateCampaignRecipientSelectionUI();
}

/**
 * Xử lý checkbox "Chọn tất cả" / "Bỏ chọn tất cả"
 * @param {boolean} isChecked
 */
export function handleToggleCampaignSelectAll(isChecked) {
  const members = appState.members || [];
  const currentCamp = adminCampaignsList.find(c => c.id === adminSelectedCampaignId) || adminCampaignsList[0] || {};
  const isFemale = (currentCamp.targetAudience === 'female');
  const validMssvs = members
    .filter(m => (!isFemale || String(m.Sex || '').trim().toLowerCase() === 'female') && m.Email && String(m.Email).includes('@'))
    .map(m => m.MSSV);

  if (!adminRecipientSelectionMap[adminSelectedCampaignId]) {
    adminRecipientSelectionMap[adminSelectedCampaignId] = new Set();
  }
  const set = adminRecipientSelectionMap[adminSelectedCampaignId];

  if (isChecked) {
    validMssvs.forEach(id => set.add(id));
  } else {
    set.clear();
  }

  // Đồng bộ nhanh tất cả checkbox trên bảng
  const checkboxes = document.querySelectorAll('.js-campaign-recipient-cb');
  checkboxes.forEach(cb => {
    cb.checked = isChecked;
    const tr = cb.closest('tr');
    if (tr) {
      if (isChecked) tr.classList.add('bg-accent-soft/10');
      else tr.classList.remove('bg-accent-soft/10');
    }
  });

  updateCampaignRecipientSelectionUI();
}

/**
 * Nút Chọn Tất Cả người nhận
 */
export function handleSelectAllCampaignRecipients() {
  handleToggleCampaignSelectAll(true);
}

/**
 * Nút Bỏ Chọn Tất Cả người nhận
 */
export function handleDeselectAllCampaignRecipients() {
  handleToggleCampaignSelectAll(false);
}

/**
 * Cập nhật giao diện thanh điều khiển và nút gửi nhanh mà không reload DOM
 */
function updateCampaignRecipientSelectionUI() {
  const members = appState.members || [];
  const currentCamp = adminCampaignsList.find(c => c.id === adminSelectedCampaignId) || adminCampaignsList[0] || {};
  const isFemale = (currentCamp.targetAudience === 'female');
  const validEmailMembers = members.filter(m => (!isFemale || String(m.Sex || '').trim().toLowerCase() === 'female') && m.Email && String(m.Email).includes('@'));
  const set = adminRecipientSelectionMap[adminSelectedCampaignId] || new Set();
  const selectedCount = validEmailMembers.filter(m => set.has(m.MSSV)).length;
  const isAll = (validEmailMembers.length > 0 && selectedCount === validEmailMembers.length);

  // 1. Cập nhật Badge số lượng
  const badgeEl = document.getElementById('campaign-selected-count-badge');
  if (badgeEl) {
    badgeEl.textContent = `Đã chọn: ${selectedCount} / ${validEmailMembers.length} người`;
  }

  // 2. Cập nhật Thẻ Thống Kê
  const statEl = document.getElementById('stat-selected-recipients-count');
  if (statEl) {
    statEl.innerHTML = `${selectedCount} <span class="text-xs font-normal text-ink-muted">/ ${validEmailMembers.length} có mail</span>`;
  }

  // 3. Cập nhật Nút Phát Gửi
  const btn = document.getElementById('btn-dispatch-campaign-bulk-email');
  const btnLabel = document.getElementById('btn-dispatch-campaign-label');
  if (btn) {
    btn.disabled = (selectedCount === 0);
  }
  if (btnLabel) {
    btnLabel.textContent = `Gửi Email Tới ${selectedCount} Người Đã Chọn`;
  }

  // 4. Cập nhật Checkbox Chọn Tất Cả
  const selectAllCb = document.getElementById('campaign-select-all-checkbox');
  if (selectAllCb) {
    selectAllCb.checked = isAll;
  }
}

/**
 * Xử lý phát gửi email hàng loạt tới các thành viên ĐƯỢC CHỌN
 * @param {string} campaignId
 */
export async function handleDispatchCampaignBulkEmail(campaignId) {
  const targetId = campaignId || adminSelectedCampaignId;
  const subjectInput = document.getElementById('admin-campaign-email-subject');
  const bodyInput = document.getElementById('admin-campaign-email-body');
  const linkInput = document.getElementById('admin-campaign-web-link');
  const audienceSelect = document.getElementById('admin-campaign-target-audience');

  const subject = subjectInput ? subjectInput.value.trim() : '';
  const template = bodyInput ? bodyInput.value.trim() : '';
  const webLink = linkInput ? linkInput.value.trim() : '';
  const targetFilter = audienceSelect ? audienceSelect.value : 'all';

  const set = adminRecipientSelectionMap[targetId] || new Set();
  const selectedMssvs = Array.from(set);

  if (selectedMssvs.length === 0) {
    showToast('Vui lòng chọn ít nhất 1 thành viên có email hợp lệ để gửi thư!', 'warning');
    return;
  }

  const isConfirmed = confirm(`XÁC NHẬN PHÁT GỬI EMAIL HÀNG LOẠT:\n\n• Chiến dịch: ${targetId}\n• Số lượng người nhận: ${selectedMssvs.length} sinh viên đã chọn\n• Hệ thống sẽ gửi email mời các bạn vào mở hộp quà bí ẩn.\n\nBạn có chắc chắn muốn phát gửi ngay bây giờ?`);
  if (!isConfirmed) return;

  showGlobalLoading(`Đang tiến hành gửi email tới ${selectedMssvs.length} thành viên...`);
  try {
    const res = await callApi('sendEventBulkEmail', {
      campaignId: targetId,
      subject,
      template,
      targetFilter,
      webLink,
      selectedMssvs
    });

    hideGlobalLoading();
    if (res && res.success && res.data) {
      adminLastEmailDispatch = res.data;
      showToast(res.message || `Đã phát gửi thành công ${res.data.sentCount} email!`, 'success');
      renderAdminCampaignsView();
    } else {
      showToast(res.message || 'Lỗi khi phát gửi email hàng loạt!', 'error');
    }
  } catch (err) {
    hideGlobalLoading();
    showToast('Lỗi gửi email: ' + (err.message || err.toString()), 'error');
  }
}
