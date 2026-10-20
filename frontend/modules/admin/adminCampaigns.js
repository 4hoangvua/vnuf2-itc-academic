/**
 * SUB-MODULE QUẢN TRỊ SỰ KIỆN & GỬI EMAIL HÀNG LOẠT (ADMIN CAMPAIGNS & MAILER)
 * Tách từ admin.js theo chuẩn add-feature-workflow.
 * 
 * Phụ trách:
 * 1. Chuyển đổi chiến dịch sự kiện mẫu (OCT20, TET, MARCH8, ANNIVERSARY, NONE)
 * 2. Cài đặt hẹn giờ bắt đầu / kết thúc (Auto-Scheduler)
 * 3. Soạn thảo Email template, Live Preview cá nhân hóa
 * 4. Phát gửi thư hàng loạt & nhật ký gửi mail
 */

import { callApi, broadcastDataSync } from '../../services/api.js';
import { appState } from '../store.js';
import { showToast, showGlobalLoading, hideGlobalLoading } from '../ui.js';
import { renderAdminCampaignTabContent } from '../templates/campaignTemplates.js';

// State nội bộ của phân hệ Quản lý Chiến Dịch
export let adminCampaignsList = [];
export let adminActiveCampaignId = 'OCT20';
export let adminSelectedCampaignId = 'OCT20';
export let adminLastEmailDispatch = null;

/**
 * Tải và hiển thị Tab Sự Kiện & Gửi Thư trên Admin Portal
 */
export async function loadAdminCampaigns() {
  const container = document.getElementById('admin-tab-campaigns');
  if (!container) return;

  try {
    const res = await callApi('getAllCampaigns', {});
    if (res && res.success && res.data) {
      adminCampaignsList = res.data.campaigns || [];
      adminActiveCampaignId = res.data.activeCampaignId || 'OCT20';
      if (!adminSelectedCampaignId || adminSelectedCampaignId === 'NONE') {
        adminSelectedCampaignId = adminActiveCampaignId !== 'NONE' ? adminActiveCampaignId : 'OCT20';
      }
      adminLastEmailDispatch = res.data.lastEmailDispatch || null;
    }
  } catch (err) {
    console.warn('Không thể tải dữ liệu campaigns:', err);
  }

  renderAdminCampaignsView();
}

/**
 * Render lại giao diện Tab Sự Kiện
 */
export function renderAdminCampaignsView() {
  const container = document.getElementById('admin-tab-campaigns');
  if (!container) return;

  const members = appState.members || [];
  container.innerHTML = renderAdminCampaignTabContent({
    campaigns: adminCampaignsList,
    activeCampaignId: adminActiveCampaignId,
    selectedCampaignId: adminSelectedCampaignId,
    members: members,
    lastDispatch: adminLastEmailDispatch
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
 * Xử lý khi Admin chọn một Chiến dịch Sự kiện khác từ danh mục
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
      // Cập nhật lại trong danh sách local
      adminCampaignsList = adminCampaignsList.map(c => 
        c.id === targetId ? { ...c, startDate, endDate, targetAudience, emailSubject, emailTemplate, webLink } : c
      );

      // Phát tín hiệu đồng bộ realtime tới tất cả các tab
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

  // Tự động cập nhật lại khung xem trước
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
 * Xử lý phát gửi email hàng loạt tới các thành viên hợp lệ
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

  const members = appState.members || [];
  const validMembers = members.filter(m => {
    if (targetFilter === 'female' && String(m.Sex || '').trim().toLowerCase() !== 'female') return false;
    return Boolean(m.Email && String(m.Email).includes('@'));
  });

  if (validMembers.length === 0) {
    showToast('Không có thành viên nào có địa chỉ email hợp lệ để gửi thư!', 'warning');
    return;
  }

  const isConfirmed = confirm(`XÁC NHẬN PHÁT GỬI EMAIL HÀNG LOẠT:\n\n• Chiến dịch: ${targetId}\n• Số lượng người nhận: ${validMembers.length} sinh viên (có email hợp lệ)\n• Hệ thống sẽ gửi email mời các bạn vào mở hộp quà bí ẩn.\n\nBạn có chắc chắn muốn phát gửi ngay bây giờ?`);
  if (!isConfirmed) return;

  showGlobalLoading(`Đang tiến hành gửi email tới ${validMembers.length} thành viên...`);
  try {
    const res = await callApi('sendEventBulkEmail', {
      campaignId: targetId,
      subject,
      template,
      targetFilter,
      webLink
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
