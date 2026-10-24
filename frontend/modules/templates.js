// ====================================================================
// MODULE TEMPLATES GIAO DIỆN CHUẨN HÓA (REUSABLE UI COMPONENTS)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================
// 1. Functional UI Component Library dùng chung cho toàn bộ dự án.
// 2. Chống XSS 100%: Mọi biến dữ liệu người dùng đều được escapeHTML().
// 3. Sử dụng hệ tiền tố .bht-*, font 3 tầng, và Event Delegation (data-action).
// ====================================================================

import { escapeHTML } from '../utils/dom.js';

/**
 * @typedef {import('../types.js').Member} Member
 * @typedef {import('../types.js').AttendanceSession} AttendanceSession
 * @typedef {import('../types.js').Task} Task
 * @typedef {import('../types.js').Submission} Submission
 * @typedef {import('../types.js').AcademicDocument} AcademicDocument
 */
export {
  renderSpotlightSkeleton,
  renderDrlWidgetSkeleton,
  renderAuditTableSkeleton,
  renderCardSkeleton,
  renderStatSkeleton,
  renderAdminTableSkeleton,
  renderAdminTableSkeleton as renderTableSkeleton,
  renderCampaignTabSkeleton
} from './skeleton.js';


// ====================================================================
// 1. NHÓM ATOMIC COMPONENTS (THÀNH PHẦN CƠ BẢN DÙNG CHUNG)
// ====================================================================

/**
 * Sinh chuỗi HTML nút bấm chuẩn mực .bht-btn
 * @param {Object} options
 * @param {string} [options.label] Văn bản hiển thị trên nút
 * @param {string} [options.icon] Tên icon FontAwesome (vd: 'fa-check', 'fa-trash')
 * @param {string} [options.action] Tên data-action phục vụ Event Delegation
 * @param {Object} [options.dataset] Các thuộc tính data-* phụ trợ (vd: { id: '...', status: '...' })
 * @param {'primary'|'secondary'|'danger'|'success'|'ghost'} [options.variant='primary'] Màu sắc nút
 * @param {'xs'|'sm'|'md'|'lg'} [options.size='sm'] Kích thước nút
 * @param {string} [options.extraClass=''] Class CSS tùy biến bổ sung
 * @param {boolean} [options.disabled=false] Trạng thái vô hiệu hóa
 * @param {string} [options.title=''] Chú thích tooltip khi hover
 * @param {'button'|'submit'|'reset'} [options.type='button'] Thuộc tính type HTML
 * @returns {string} Chuỗi HTML nút bấm
 */
export function uiButton({
  label = '',
  icon = '',
  action = '',
  dataset = {},
  variant = 'primary',
  size = 'sm',
  extraClass = '',
  disabled = false,
  title = '',
  type = 'button'
} = {}) {
  const variantClass = variant === 'success' ? 'bht-btn-success' : `bht-btn-${variant}`;
  const sizeClass = `bht-btn-${size}`;
  const actionAttr = action ? `data-action="${escapeHTML(action)}"` : '';
  const titleAttr = title ? `title="${escapeHTML(title)}"` : '';
  const disabledAttr = disabled ? 'disabled' : '';
  const disabledClass = disabled ? 'opacity-60 pointer-events-none' : '';

  // Render các thuộc tính data-*
  const dataAttrs = Object.entries(dataset)
    .filter(([_, val]) => val !== undefined && val !== null)
    .map(([key, val]) => `data-${escapeHTML(key)}="${escapeHTML(String(val))}"`)
    .join(' ');

  const iconHtml = icon ? `<i class="fa-solid ${escapeHTML(icon)} ${label ? 'mr-1.5' : ''}"></i>` : '';
  const labelHtml = label ? `<span>${escapeHTML(label)}</span>` : '';

  return `
    <button 
      type="${type}"
      ${actionAttr}
      ${dataAttrs}
      ${titleAttr}
      ${disabledAttr}
      class="bht-btn ${variantClass} ${sizeClass} ${disabledClass} ${extraClass}".trim()
    >
      ${iconHtml}${labelHtml}
    </button>
  `.trim();
}

/**
 * Tự động ánh xạ trạng thái sang class .bht-badge chuẩn và nhãn tiếng Việt
 * @param {string} status Trạng thái (Open, Closed, Pending, Approved, Rejected, Active, Inactive...)
 * @param {string} [customText=''] Nhãn ghi đè tùy chọn
 * @returns {string} Chuỗi HTML badge trạng thái
 */
export function uiStatusBadge(status = '', customText = '') {
  const norm = String(status || '').trim().toLowerCase();
  let badgeClass = 'bg-subtle text-ink-muted';
  let label = customText || status || 'Không rõ';

  switch (norm) {
    case 'open':
      badgeClass = 'bht-badge-ok';
      if (!customText) label = 'Đang mở';
      break;
    case 'closed':
    case 'ended':
      badgeClass = 'bg-subtle text-ink-faint';
      if (!customText) label = 'Đã kết thúc';
      break;
    case 'pending':
      badgeClass = 'bht-badge-warn';
      if (!customText) label = 'Chờ duyệt';
      break;
    case 'approved':
      badgeClass = 'bht-badge-ok';
      if (!customText) label = 'Đạt';
      break;
    case 'rejected':
      badgeClass = 'bht-badge-err';
      if (!customText) label = 'Cần sửa';
      break;
    case 'active':
      badgeClass = 'bht-badge-ok';
      if (!customText) label = 'Active';
      break;
    case 'inactive':
      badgeClass = 'bht-badge-err';
      if (!customText) label = 'Inactive';
      break;
    default:
      badgeClass = 'bg-subtle text-ink-muted';
      break;
  }

  return `<span class="bht-badge ${badgeClass} text-[10px] sm:text-xs">${escapeHTML(label)}</span>`;
}

/**
 * Sinh huy hiệu font Monospace chuyên dùng cho MSSV, SessionID, TaskID, PIN
 * @param {string|number} code Mã kỹ thuật
 * @param {string} [extraClass=''] Class CSS tùy biến bổ sung
 * @returns {string} Chuỗi HTML huy hiệu kỹ thuật
 */
export function uiMonoBadge(code = '', extraClass = '') {
  return `<span class="bht-badge-mono ${extraClass}">${escapeHTML(String(code || ''))}</span>`;
}

// ====================================================================
// HỆ THỐNG PHÂN LOẠI & BỘ LỌC CHUYÊN ĐỀ / HỌC LIỆU DÙNG CHUNG (TAXONOMY REGISTRY)
// ====================================================================

export const CORE_ACADEMIC_TOPICS = [
  { id: 'ALL', label: 'Tất cả', icon: 'fa-shapes' },
  { id: 'CHUAN_DAU_RA', label: 'Chuẩn đầu ra MOS/IC3', icon: 'fa-certificate', keywords: ['mos', 'ic3', 'chuẩn đầu ra', 'chuan_dau_ra'] },
  { id: 'WORD_DO_AN', label: 'Word Khóa luận & Đồ án', icon: 'fa-file-lines', keywords: ['word', 'khóa luận', 'luận văn', 'đồ án', 'word_do_an'] },
  { id: 'EXCEL_DATA', label: 'Excel & Xử lý số liệu', icon: 'fa-table-cells', keywords: ['excel', 'số liệu', 'bảng tính', 'dashboard', 'excel_data'] },
  { id: 'AI_TOOLS', label: 'Prompt AI & Kỹ năng', icon: 'fa-brain', keywords: ['ai', 'prompt', 'chatgpt', 'trí tuệ nhân tạo', 'ai_tools'] },
  { id: 'OLYMPIC', label: 'Olympic & Thuật toán', icon: 'fa-award', keywords: ['olympic', 'thuật toán', 'đề thi', 'c++', 'quy hoạch động'] },
  { id: 'SLIDE', label: 'Slide bài giảng', icon: 'fa-file-powerpoint', keywords: ['slide', 'ppt', 'bài giảng'] },
  { id: 'EBOOK', label: 'Ebook & Sách', icon: 'fa-book-bookmark', keywords: ['ebook', 'sách', 'giáo trình'] }
];

/**
 * Trích xuất danh sách Tag độc nhất từ dữ liệu (tự động phát hiện tag tùy biến mới)
 * @param {Array} items Mảng dữ liệu (attendance hoặc documents)
 * @param {string} tagField Tên trường lưu tag ('TagChuyenDe' hoặc 'PhanLoai')
 * @returns {Array} Danh sách topics gồm các topic cốt lõi + các topic tùy biến mới
 */
export function extractDynamicTopics(items = [], tagField = 'TagChuyenDe') {
  const topicsMap = new Map();
  CORE_ACADEMIC_TOPICS.forEach(t => topicsMap.set(t.id, { ...t }));

  if (Array.isArray(items)) {
    items.forEach(item => {
      const rawTag = String(item[tagField] || '').trim();
      if (!rawTag) return;

      // Kiểm tra xem tag này đã thuộc về topic chuẩn nào chưa
      const isKnown = CORE_ACADEMIC_TOPICS.some(core => {
        if (core.id === 'ALL') return false;
        if (core.id.toUpperCase() === rawTag.toUpperCase()) return true;
        if (core.keywords && core.keywords.some(kw => rawTag.toLowerCase().includes(kw))) return true;
        return false;
      });

      // Nếu là tag tùy biến hoàn toàn mới do Admin gõ tự do
      if (!isKnown && !topicsMap.has(rawTag)) {
        topicsMap.set(rawTag, {
          id: rawTag,
          label: rawTag,
          icon: 'fa-bookmark',
          isCustom: true
        });
      }
    });
  }

  return Array.from(topicsMap.values());
}

/**
 * Kiểm tra xem một item có khớp với bộ lọc category được chọn không
 * @param {string} itemTag Giá trị tag của item
 * @param {string} selectedCat Mã category được chọn
 * @returns {boolean}
 */
export function matchesTopicCategory(itemTag = '', selectedCat = 'ALL') {
  if (!selectedCat || selectedCat === 'ALL') return true;
  const rawTag = String(itemTag || '').trim();
  if (!rawTag) return false;

  const catNorm = selectedCat.toUpperCase().trim();
  const rawNorm = rawTag.toUpperCase().trim();

  if (rawNorm === catNorm) return true;

  const core = CORE_ACADEMIC_TOPICS.find(t => t.id === selectedCat);
  if (core && core.keywords) {
    const lower = rawTag.toLowerCase();
    return core.keywords.some(kw => lower.includes(kw));
  }

  return rawNorm.includes(catNorm) || catNorm.includes(rawNorm);
}

/**
 * Sinh chuỗi HTML thanh bộ lọc Tag tái sử dụng dùng chung cho cả Chuyên đề và Học liệu
 * @param {Object} options
 * @param {string} [options.activeCat='ALL'] Tag đang được chọn
 * @param {Array} [options.items=[]] Danh sách dữ liệu để trích xuất tag độc nhất
 * @param {string} [options.tagField='TagChuyenDe'] Trường tag ('TagChuyenDe' hoặc 'PhanLoai')
 * @param {string} [options.actionName='filter-topics'] Tên data-action của nút bấm
 * @returns {string} Chuỗi HTML các nút .bht-category-pill
 */
export function renderTopicFilterBarHtml({ activeCat = 'ALL', items = [], tagField = 'TagChuyenDe', actionName = 'filter-topics' } = {}) {
  const topics = extractDynamicTopics(items, tagField);
  return topics.map(topic => {
    const isActive = String(topic.id || '').toUpperCase() === String(activeCat || 'ALL').toUpperCase();
    return `
      <button 
        data-action="${escapeHTML(actionName)}" 
        data-cat="${escapeHTML(topic.id)}" 
        data-category="${escapeHTML(topic.id)}"
        class="bht-category-pill ${isActive ? 'active' : ''}"
        title="${escapeHTML(topic.label)}"
      >
        <i class="fa-solid ${escapeHTML(topic.icon)}"></i>
        <span>${escapeHTML(topic.label)}</span>
      </button>
    `.trim();
  }).join('\n');
}

/**
 * Sinh huy hiệu phân loại Chuyên đề học thuật (Academic Topic Badge)
 * @param {string} tagKey Khóa phân loại (CHUAN_DAU_RA, WORD_DO_AN, EXCEL_DATA, AI_TOOLS, OLYMPIC, GENERAL)
 * @param {string} [customText=''] Nhãn tùy biến (nếu có)
 * @returns {string} Chuỗi HTML huy hiệu chuyên đề
 */
export function uiTopicTagBadge(tagKey = '', customText = '') {
  const norm = String(tagKey || '').toUpperCase().trim();
  let label = customText;
  let icon = 'fa-tag';
  let colorClass = 'bg-accent-soft text-accent border border-accent/20';

  switch (norm) {
    case 'CHUAN_DAU_RA':
      if (!label) label = 'Chuẩn đầu ra MOS/IC3';
      icon = 'fa-certificate';
      colorClass = 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20';
      break;
    case 'WORD_DO_AN':
      if (!label) label = 'Đồ án & Luận văn Word';
      icon = 'fa-file-lines';
      colorClass = 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20';
      break;
    case 'EXCEL_DATA':
      if (!label) label = 'Excel & Xử lý số liệu';
      icon = 'fa-table-cells';
      colorClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20';
      break;
    case 'AI_TOOLS':
      if (!label) label = 'Kỹ năng AI thực chiến';
      icon = 'fa-brain';
      colorClass = 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20';
      break;
    case 'OLYMPIC':
      if (!label) label = 'Olympic & Thuật toán';
      icon = 'fa-award';
      colorClass = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20';
      break;
    case 'GENERAL':
      if (!label) label = 'Sinh hoạt & Học vụ';
      icon = 'fa-chalkboard-user';
      colorClass = 'bg-accent-soft text-accent border border-accent/20';
      break;
    default:
      // Hỗ trợ mọi Custom Tag mới do Admin nhập tự do
      if (!label) label = String(tagKey || 'Chuyên đề').trim();
      icon = 'fa-bookmark';
      colorClass = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20';
      break;
  }

  return `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorClass}">
      <i class="fa-solid ${icon} text-[9px]"></i>
      <span>${escapeHTML(label)}</span>
    </span>
  `.trim();
}

/**
 * Khối giao diện Empty State chuẩn mực học thuật (hỗ trợ cả dạng Grid Card và dạng hàng Table <tr>)
 * @param {Object} options
 * @param {string} [options.icon='fa-inbox'] Icon FontAwesome
 * @param {string} [options.title='Chưa có dữ liệu nào!'] Tiêu đề chính
 * @param {string} [options.desc=''] Mô tả chi tiết hoặc hướng dẫn
 * @param {string} [options.actionBtnHtml=''] Nút hành động đính kèm (nếu có)
 * @param {boolean} [options.isTableRow=false] Render dưới dạng dòng <tr> của bảng table
 * @param {number} [options.colspan=5] Số cột gộp khi isTableRow = true
 * @returns {string} Chuỗi HTML Empty State
 */
export function uiEmptyState({
  icon = 'fa-inbox',
  title = 'Chưa có dữ liệu nào!',
  desc = '',
  actionBtnHtml = '',
  isTableRow = false,
  colspan = 5
} = {}) {
  const safeIcon = escapeHTML(icon);
  const safeTitle = escapeHTML(title);
  const safeDesc = desc ? `<p class="text-xs text-ink-muted leading-relaxed">${escapeHTML(desc)}</p>` : '';
  const actionWrapper = actionBtnHtml ? `<div class="mt-2.5">${actionBtnHtml}</div>` : '';

  if (isTableRow) {
    return `
      <tr>
        <td colspan="${colspan}" class="py-8 text-center text-ink-muted">
          <div class="flex flex-col items-center justify-center gap-1.5 py-2">
            <i class="fa-solid ${safeIcon} text-2xl text-ink-faint mb-1"></i>
            <p class="text-sm font-semibold text-ink">${safeTitle}</p>
            ${safeDesc}
            ${actionWrapper}
          </div>
        </td>
      </tr>
    `.trim();
  }

  return `
    <div class="col-span-full bht-card p-8 text-center text-ink-muted flex flex-col items-center justify-center gap-2">
      <i class="fa-solid ${safeIcon} text-3xl mb-1 text-ink-faint"></i>
      <p class="text-sm font-semibold text-ink">${safeTitle}</p>
      ${safeDesc}
      ${actionWrapper}
    </div>
  `.trim();
}

// Alias tương thích ngược cho emptyStateTemplate
export function emptyStateTemplate(message = 'Chưa có dữ liệu nào!', icon = 'fa-box-open') {
  return uiEmptyState({ title: message, icon: icon });
}

// ====================================================================
// 2. NHÓM COMPOSITE COMPONENTS (THÀNH PHẦN NGHIỆP VỤ DÙNG CHUNG)
// ====================================================================

/**
 * Render một dòng bài nộp trong Bảng Chấm bài của Quản trị viên
 * DÙNG CHUNG cho cả 2 nơi:
 * 1. #admin-submissions-table-body (Tổng quan chấm bài - có cột Nhiệm vụ)
 * 2. #admin-detail-submissions-tbody (Tab Bài tập trong chi tiết buổi học)
 * 
 * @param {Object} submission Bản ghi bài nộp
 * @param {Object} options Tùy chọn render
 * @param {boolean} [options.showTaskColumn=true] Hiển thị cột mã nhiệm vụ (TaskID)
 * @param {boolean} [options.isProcessing=false] Vô hiệu hóa nút khi đang duyệt
 * @param {string} [options.memberName=''] Họ tên sinh viên ghi đè nếu có
 * @returns {string} Chuỗi HTML thẻ <tr>
 */
export function renderSubmissionRow(submission = {}, options = {}) {
  const s = submission || {};
  const {
    showTaskColumn = true,
    isProcessing = false,
    memberName = ''
  } = options;

  const subId = escapeHTML(s.SubID || s.SubmissionID || '');
  const mssv = escapeHTML(s.MSSV || '');
  const hoTen = escapeHTML(memberName || s.HoTen || `Sinh viên ${mssv}`);
  const taskId = escapeHTML(s.TaskID || '');
  const driveLink = escapeHTML(s.DriveLink || '#');
  const tenFile = escapeHTML(s.TenFile || 'Tệp nộp');
  const thoiGianNop = escapeHTML(s.ThoiGianNop ? s.ThoiGianNop.replace('T', ' ') : '');
  const feedback = escapeHTML(s.Feedback || '');
  const statusBadge = uiStatusBadge(s.TrangThaiDuyet || 'Pending');
  const turn = Number(options.submissionTurn || s._submissionTurn || 0);
  const turnBadge = turn > 0 ? `<span class="bht-badge-mono text-[9px] px-1 py-0.5 bg-subtle text-ink-muted border border-hairline ml-1 font-semibold">Lần ${turn}/3</span>` : '';
  const hasGift2010 = s.giftCode || (s.TenFile && s.TenFile.includes('20/10')) || (s.Feedback && s.Feedback.includes('20/10'));
  const giftBadge = hasGift2010 ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 ml-1" title="Bài nộp áp dụng đặc quyền Quà 20/10">🌸 Quà 20/10</span>` : '';

  // Nút duyệt Đạt / Sửa
  const disabledClass = isProcessing ? 'opacity-60 pointer-events-none' : '';
  const disabledAttr = isProcessing ? 'disabled' : '';

  if (showTaskColumn) {
    // 5 CỘT: [Thành viên (Họ tên + MSSV)] | [Nhiệm vụ] | [File nộp & Giờ] | [Trạng thái] | [Nhận xét & Duyệt]
    return `
      <tr data-key="${subId}" class="hover:bg-subtle/40 transition-colors">
        <td class="py-3 px-4">
          <p class="font-semibold text-ink">${hoTen}</p>
          ${uiMonoBadge(mssv, 'text-[10px] mt-0.5')}
        </td>
        <td class="py-3 px-4">
          ${uiMonoBadge(taskId, 'text-accent font-semibold')}
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-1.5 flex-wrap">
            <a href="${driveLink}" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline font-medium inline-flex items-center gap-1.5">
              <i class="fa-solid fa-file-arrow-down text-ink-faint"></i>
              <span class="truncate max-w-[190px]" title="${tenFile}">${tenFile}</span>
            </a>
            ${turnBadge}
            ${giftBadge}
          </div>
          <p class="text-[10px] text-ink-faint font-mono mt-0.5">${thoiGianNop}</p>
        </td>
        <td class="py-3 px-4 text-center">${statusBadge}</td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <input 
              type="text" 
              id="feedback-${subId}" 
              value="${feedback}" 
              placeholder="Nhận xét..." 
              ${disabledAttr}
              class="bht-input h-8 text-xs w-32 sm:w-44 ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}"
            >
            <button 
              data-action="open-review-drawer"
              data-id="${subId}"
              title="Mở ngăn kéo thẩm định & nhận xét chi tiết"
              class="bht-btn bht-btn-xs bht-btn-secondary"
            >
              <i class="fa-solid fa-pen-to-square text-accent"></i>
              <span class="hidden sm:inline">Chấm bài</span>
            </button>
            <button 
              data-action="review-submission"
              data-id="${subId}"
              data-status="Approved"
              ${disabledAttr}
              title="Duyệt Đạt nhanh"
              class="bht-btn bht-btn-xs bht-btn-success ${disabledClass}"
            >
              <i class="fa-solid fa-check"></i>
              <span class="hidden sm:inline">Đạt</span>
            </button>
            <button 
              data-action="review-submission"
              data-id="${subId}"
              data-status="Rejected"
              ${disabledAttr}
              title="Yêu cầu sửa lại"
              class="bht-btn bht-btn-xs bht-btn-danger ${disabledClass}"
            >
              <i class="fa-solid fa-xmark"></i>
              <span class="hidden sm:inline">Sửa</span>
            </button>
          </div>
        </td>
      </tr>
    `.trim();
  }

  // 5 CỘT (Trong chi tiết buổi học): [MSSV] | [Họ tên] | [File nộp] | [Trạng thái] | [Nhận xét & Duyệt]
  return `
    <tr data-key="${subId}" class="hover:bg-subtle/30 transition-colors">
      <td class="py-3 px-3.5 font-mono text-accent font-bold">${mssv}</td>
      <td class="py-3 px-3.5 font-medium text-ink">${hoTen}</td>
      <td class="py-3 px-3.5">
        <div class="font-mono text-xs text-accent truncate max-w-[200px] flex items-center gap-1.5 flex-wrap">
          <a href="${driveLink}" target="_blank" rel="noopener noreferrer" class="hover:underline inline-flex items-center gap-1">
            <i class="fa-solid fa-file-code"></i>
            <span class="truncate" title="${tenFile}">${tenFile}</span>
          </a>
          ${turnBadge}
        </div>
        <div class="text-[10px] text-ink-faint font-mono mt-0.5">${thoiGianNop}</div>
      </td>
      <td class="py-3 px-3.5 text-center">${statusBadge}</td>
      <td class="py-3 px-3.5">
        <div class="flex items-center gap-1.5">
          <input 
            type="text" 
            id="feedback-${subId}" 
            value="${feedback}" 
            placeholder="Nhận xét..." 
            ${disabledAttr}
            class="bht-input h-8 text-xs w-24 sm:w-32 ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}"
          >
          <button 
            data-action="open-review-drawer"
            data-id="${subId}"
            title="Mở ngăn kéo thẩm định & nhận xét chi tiết"
            class="bht-btn bht-btn-xs bht-btn-secondary"
          >
            <i class="fa-solid fa-pen-to-square text-accent"></i>
          </button>
          <button 
            data-action="review-submission"
            data-id="${subId}"
            data-status="Approved"
            ${disabledAttr}
            title="Duyệt Đạt"
            class="bht-btn bht-btn-xs bht-btn-success ${disabledClass}"
          >
            <i class="fa-solid fa-check"></i>
            <span>Đạt</span>
          </button>
          <button 
            data-action="review-submission"
            data-id="${subId}"
            data-status="Rejected"
            ${disabledAttr}
            title="Yêu cầu sửa lại"
            class="bht-btn bht-btn-xs bht-btn-danger ${disabledClass}"
          >
            <i class="fa-solid fa-xmark"></i>
            <span>Sửa</span>
          </button>
        </div>
      </td>
    </tr>
  `.trim();
}

// Alias tương thích ngược
export const adminSubmissionRowTemplate = (sub, options = {}) => renderSubmissionRow(sub, { showTaskColumn: true, ...options });

/**
 * Render Thẻ Buổi Sinh Hoạt Chuyên Đề trong Grid (Dùng chung cho cả Admin & Member)
 * @param {Object} session Buổi sinh hoạt
 * @param {Object} options Tùy chọn render
 * @param {boolean} [options.isAdmin=false] Render dưới quyền Admin hay Thành viên
 * @param {string} [options.currentMssv=''] MSSV người dùng hiện tại
 * @param {boolean} [options.hasAttended=false] Thành viên đã điểm danh hay chưa
 * @param {number} [options.attendeeCount=0] Tổng số người có mặt (dành cho Admin)
 * @param {boolean} [options.isOpen=false] Buổi học đang mở hay đã kết thúc
 * @param {string} [options.taskTitle=''] Tên nhiệm vụ đính kèm
 * @param {string} [options.taskStatusLabel='Không có bài tập'] Nhãn trạng thái bài tập của thành viên
 * @param {string} [options.taskBadgeClass='bg-subtle text-ink-faint'] Class badge bài tập của thành viên
 * @returns {string} Chuỗi HTML card
 */
export function renderSessionCard(session = {}, options = {}) {
  const s = session || {};
  const {
    isAdmin = false,
    hasAttended = false,
    userAbsence = null,
    attendeeCount = 0,
    isOpen = false,
    taskTitle = '',
    taskStatusLabel = 'Không có bài tập',
    taskBadgeClass = 'bg-subtle text-ink-faint'
  } = options;

  const sessionId = escapeHTML(s.SessionID || '');
  const tenBuoiHop = escapeHTML(s.TenBuoiHop || 'Chưa đặt tên');
  const ngayDienRa = escapeHTML(formatSessionDateVN(s.NgayDienRa));
  const maPin = escapeHTML(s.MaPin || '------');
  const phongHoc = escapeHTML(s.PhongHoc || 'Phòng Lab 02 - Tầng 3 Nhà A3');
  const tagBadgeHtml = uiTopicTagBadge(s.TagChuyenDe || 'GENERAL');
  const isClosed = String(s.TrangThai || '').trim().toLowerCase() === 'closed';

  if (isAdmin) {
    // Master Card Quản Trị Viên
    return `
      <div 
        data-key="${sessionId}"
        data-action="open-admin-session-detail"
        data-id="${sessionId}"
        class="bht-card p-4 sm:p-5 hover:border-strong transition-all cursor-pointer group hover:shadow-md flex flex-col justify-between"
      >
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div class="flex flex-wrap items-center gap-1.5">
              ${tagBadgeHtml}
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="bht-badge ${isOpen ? 'bht-badge-ok' : 'bg-subtle text-ink-faint'} text-[10px] sm:text-[11px]">
                ${isOpen ? 'Đang mở PIN' : 'Đã khóa'}
              </span>
              <span class="bht-badge bg-subtle text-ink font-mono text-[10px] sm:text-[11px] font-bold tracking-wider" title="Mã PIN điểm danh">
                PIN: ${maPin}
              </span>
            </div>
          </div>

          <h4 class="bht-heading-serif text-lg font-semibold text-ink group-hover:text-accent transition-colors leading-snug">
            ${tenBuoiHop}
          </h4>
          <div class="text-xs text-ink-muted mt-1.5 font-mono flex flex-wrap items-center gap-y-1 gap-x-3">
            <span class="flex items-center gap-1.5">
              <i class="fa-regular fa-calendar-check text-[11px]"></i>
              <span>${ngayDienRa}</span>
            </span>
            <span class="flex items-center gap-1 font-sans text-ink-faint">
              <i class="fa-solid fa-location-dot text-[10px] text-rose-500"></i>
              <span class="truncate max-w-[170px]">${phongHoc}</span>
            </span>
          </div>
        </div>

        <div class="mt-4 pt-3.5 border-t border-hairline flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs text-ink-muted">
            <span class="flex items-center gap-1" title="Số lượng thành viên có mặt">
              <i class="fa-solid fa-users text-ink-faint"></i>
              <span class="font-semibold text-ink">${attendeeCount}</span> SV
            </span>
            ${taskTitle ? `
              <span class="flex items-center gap-1 truncate max-w-[140px] text-accent" title="${escapeHTML(taskTitle)}">
                <i class="fa-solid fa-list-check"></i>
                <span>Bài tập</span>
              </span>
            ` : ''}
          </div>

          <span class="text-xs text-accent font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Quản lý</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </span>
        </div>
      </div>
    `.trim();
  }

  // Roadmap Timeline Item Thành Viên
  const nodeStatusClass = isOpen ? 'active' : (hasAttended ? 'completed' : '');
  const nodeIcon = isOpen ? '<i class="fa-solid fa-play text-[8px]"></i>' : (hasAttended ? '<i class="fa-solid fa-check text-[9px]"></i>' : '<i class="fa-solid fa-circle text-[6px] text-ink-faint"></i>');

  return `
    <div data-key="${sessionId}" class="bht-timeline-item">
      <!-- Dấu mốc dòng thời gian -->
      <div class="bht-timeline-node ${nodeStatusClass}" title="${isOpen ? 'Buổi học đang diễn ra' : (hasAttended ? 'Đã tham gia' : 'Buổi học')}">
        ${nodeIcon}
      </div>

      <div 
        class="bht-card p-4 sm:p-5 hover:border-strong transition-all group hover:shadow-md flex flex-col justify-between ${isOpen ? 'border-accent/40 shadow-[0_0_15px_-3px_rgba(15,98,86,0.15)] dark:shadow-[0_0_20px_-3px_rgba(45,212,191,0.15)] bg-surface' : ''}"
      >
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex flex-wrap items-center gap-1.5">
              ${tagBadgeHtml}
              ${isOpen ? `
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-soft text-accent border border-accent/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-accent animate-badge-dot"></span>
                  TUẦN NÀY
                </span>
              ` : ''}
            </div>
            <div class="flex items-center gap-1.5">
              <span class="bht-badge ${isOpen ? 'bht-badge-ok' : 'bg-subtle text-ink-faint'} text-[10px]">
                ${isOpen ? 'Đang mở' : 'Đã kết thúc'}
              </span>
            </div>
          </div>

          <h4 
            data-action="open-member-session-detail"
            data-id="${sessionId}"
            class="bht-heading-serif text-base sm:text-lg font-semibold text-ink leading-snug group-hover:text-accent transition-colors cursor-pointer"
          >
            ${tenBuoiHop}
          </h4>
          <div class="text-xs text-ink-muted mt-1.5 font-mono flex flex-wrap items-center gap-y-1 gap-x-3">
            <span class="flex items-center gap-1.5">
              <i class="fa-regular fa-calendar-check text-[11px]"></i>
              <span>${ngayDienRa}</span>
            </span>
            <span class="flex items-center gap-1 font-sans text-ink-faint">
              <i class="fa-solid fa-location-dot text-[10px] text-rose-500"></i>
              <span>${phongHoc}</span>
            </span>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <!-- Chip Điểm danh / Vắng mặt -->
            ${hasAttended ? `
              <span class="bht-badge bht-badge-ok text-[10px]">
                <i class="fa-solid fa-user-check text-[9px] mr-1"></i>Đã có mặt
              </span>
            ` : (userAbsence ? `
              <span class="bht-badge ${(userAbsence.TrangThai === 'Approved' || userAbsence.TrangThaiDuyet === 'Approved') ? 'bht-badge-ok bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20' : ((userAbsence.TrangThai === 'Rejected' || userAbsence.TrangThaiDuyet === 'Rejected') ? 'bht-badge-err' : 'bht-badge-warn')} text-[10px]" title="${escapeHTML(userAbsence.Feedback || userAbsence.ChiTiet || '')}">
                <i class="fa-solid ${(userAbsence.TrangThai === 'Approved' || userAbsence.TrangThaiDuyet === 'Approved') ? 'fa-envelope-circle-check' : ((userAbsence.TrangThai === 'Rejected' || userAbsence.TrangThaiDuyet === 'Rejected') ? 'fa-circle-xmark' : 'fa-clock')} text-[9px] mr-1"></i>
                ${(userAbsence.TrangThai === 'Approved' || userAbsence.TrangThaiDuyet === 'Approved') ? 'Vắng có phép' : ((userAbsence.TrangThai === 'Rejected' || userAbsence.TrangThaiDuyet === 'Rejected') ? 'Vắng không phép' : 'Vắng (Chờ duyệt)')}
              </span>
            ` : `
              <span class="bht-badge bg-subtle text-ink-muted text-[10px]">
                <i class="fa-solid fa-user-clock text-[9px] mr-1"></i>Chưa điểm danh
              </span>
            `)}

            <!-- Chip Bài tập -->
            <span class="bht-badge ${taskBadgeClass} text-[10px]">
              <i class="fa-solid fa-list-check text-[9px] mr-1"></i>
              ${escapeHTML(taskStatusLabel)}
            </span>

            <!-- Chip Slide -->
            ${s.LinkTaiLieu ? `
              <span class="bht-badge bg-subtle text-accent text-[10px]" title="Có tài liệu / slide">
                <i class="fa-solid fa-link text-[9px] mr-1"></i>Slide
              </span>
            ` : ''}
          </div>

          <div class="flex items-center gap-1.5">
            ${(isOpen && !hasAttended) ? `
              <button 
                data-action="open-quick-pin-modal" 
                data-id="${sessionId}"
                class="bht-btn bht-btn-primary bht-btn-xs font-semibold shadow-sm animate-pulse"
                title="Nhập PIN điểm danh ngay"
              >
                <i class="fa-solid fa-qrcode text-[10px]"></i>
                <span>Điểm danh PIN</span>
              </button>
            ` : ''}
            ${(!isClosed && !hasAttended && !userAbsence) ? `
              <button 
                data-action="open-quick-absence-modal" 
                data-id="${sessionId}"
                class="bht-btn bht-btn-secondary bht-btn-xs text-ink-muted hover:text-amber-500"
                title="Gửi thư xin vắng mặt buổi này"
              >
                <i class="fa-regular fa-paper-plane text-[10px]"></i>
                <span>Báo vắng</span>
              </button>
            ` : ''}
            <button 
              data-action="open-member-session-detail" 
              data-id="${sessionId}"
              class="bht-btn bht-btn-ghost bht-btn-xs text-accent font-semibold flex items-center gap-1 hover:underline"
            >
              <span>Chi tiết</span>
              <i class="fa-solid fa-chevron-right text-[9px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Chuẩn hóa ngày giờ học thuật sang định dạng hiển thị tiếng Việt 'HH:mm • DD/MM/YYYY' hoặc 'DD/MM/YYYY'
 * @param {string} dateStr Chuỗi ngày giờ thô (từ Sheet hoặc input datetime-local)
 * @returns {string} Chuỗi hiển thị chuẩn
 */
export function formatSessionDateVN(dateStr) {
  if (!dateStr) return 'Chưa xếp lịch';
  const str = String(dateStr).trim();

  // Khớp ISO format YYYY-MM-DDTHH:mm hoặc YYYY-MM-DD HH:mm hoặc YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{1,2}))?/);
  if (isoMatch) {
    const [, y, m, d, hh, mm] = isoMatch;
    const dStr = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    if (hh !== undefined) {
      return `${hh.padStart(2, '0')}:${(mm || '00').padStart(2, '0')} • ${dStr}`;
    }
    return dStr;
  }

  // Khớp định dạng VN DD/MM/YYYY HH:mm hoặc DD/MM/YYYY
  const vnMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (vnMatch) {
    const [, d, m, y, hh, mm] = vnMatch;
    const dStr = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    if (hh !== undefined) {
      return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')} • ${dStr}`;
    }
    return dStr;
  }

  return str;
}

/**
 * Phân tích chuỗi ngày giờ từ Sheet để tính thời gian còn lại đến buổi học
 * Hỗ trợ các định dạng: 'DD/MM/YYYY HH:mm', 'DD/MM/YYYY', ISO 'YYYY-MM-DDTHH:mm'
 * @param {string} dateStr Chuỗi ngày giờ diễn ra
 * @returns {Object|null} { text, badgeText, isLive, isImminent, diffMs }
 */
export function getSessionRemainingTime(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  let targetDate = null;
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{1,2}))?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hour = isoMatch[4] !== undefined ? parseInt(isoMatch[4], 10) : 19;
    const minute = isoMatch[5] !== undefined ? parseInt(isoMatch[5], 10) : 30;
    targetDate = new Date(year, month, day, hour, minute);
  } else {
    const vnMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
    if (vnMatch) {
      const day = parseInt(vnMatch[1], 10);
      const month = parseInt(vnMatch[2], 10) - 1;
      const year = parseInt(vnMatch[3], 10);
      const hour = vnMatch[4] ? parseInt(vnMatch[4], 10) : 19;
      const minute = vnMatch[5] ? parseInt(vnMatch[5], 10) : 30;
      targetDate = new Date(year, month, day, hour, minute);
    } else {
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) targetDate = parsed;
    }
  }

  if (!targetDate) return null;

  const now = Date.now();
  const diffMs = targetDate.getTime() - now;

  if (diffMs <= 0) {
    if (diffMs > -4 * 3600 * 1000) {
      return { 
        text: 'Đang diễn ra', 
        badgeText: 'ĐANG DIỄN RA',
        isLive: true, 
        isImminent: false, 
        diffMs 
      };
    }
    return { 
      text: 'Đã kết thúc', 
      badgeText: 'ĐÃ KẾT THÚC',
      isLive: false, 
      isImminent: false, 
      diffMs 
    };
  }

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (3600 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 3600 * 1000));

  if (diffMinutes < 60) {
    return {
      text: `Bắt đầu sau ${diffMinutes} phút`,
      badgeText: `CÒN ${diffMinutes} PHÚT NỮA`,
      isLive: false,
      isImminent: true,
      diffMs
    };
  } else if (diffHours < 24) {
    const remainingMins = diffMinutes % 60;
    const minText = remainingMins > 0 ? ` ${remainingMins} phút` : '';
    return {
      text: `Còn ${diffHours} giờ${minText}`,
      badgeText: `CÒN ${diffHours} GIỜ${minText.toUpperCase()}`,
      isLive: false,
      isImminent: true,
      diffMs
    };
  } else {
    const remainingHours = diffHours % 24;
    const hourText = remainingHours > 0 ? ` ${remainingHours} giờ` : '';
    return {
      text: `Còn ${diffDays} ngày${hourText}`,
      badgeText: `CÒN ${diffDays} NGÀY${hourText.toUpperCase()}`,
      isLive: false,
      isImminent: diffDays <= 1,
      diffMs
    };
  }
}

/**
 * Render Thẻ Tiêu Điểm Buổi Học Mới Nhất / Sắp Diễn Ra (Member Spotlight Card)
 * Hiển thị nổi bật trên Tab 1 Dashboard của sinh viên
 * @param {Object} session Buổi học mới nhất
 * @param {boolean} [userAttended=false] Sinh viên đã điểm danh có mặt chưa
 * @param {Object|null} [userAbsence=null] Đơn xin vắng mặt của sinh viên (nếu có)
 * @returns {string} Chuỗi HTML card
 */
export function renderMemberSpotlightCard(session, userAttended = false, userAbsence = null) {
  if (!session || !session.SessionID) {
    return `
      <div class="glass-bento-card p-6 rounded-2xl flex flex-col items-center justify-center text-center py-10 h-full">
        <i class="fa-solid fa-calendar-check text-3xl text-ink-muted mb-2"></i>
        <h4 class="text-base font-bold text-ink font-sans">Chưa có lịch sinh hoạt mới</h4>
        <p class="text-xs text-ink-muted mt-1 max-w-sm">Ban Học Thuật đang chuẩn bị chuyên đề tiếp theo. Bạn hãy theo dõi thông báo trên nhóm Zalo CLB nhé!</p>
      </div>
    `.trim();
  }

  const s = session;
  const sessionId = escapeHTML(s.SessionID || '');
  const tenBuoiHop = escapeHTML(s.TenBuoiHop || 'Chưa đặt tên');
  const formattedDate = escapeHTML(formatSessionDateVN(s.NgayDienRa));
  const phongHoc = escapeHTML(s.PhongHoc || 'Lab 02 - A3 (Tòa CNTT)');
  const isTrangThaiOpen = String(s.TrangThai || '').toLowerCase() === 'open';
  const isClosed = String(s.TrangThai || '').trim().toLowerCase() === 'closed';
  const tagBadgeHtml = uiTopicTagBadge(s.TagChuyenDe || 'GENERAL');

  const timeInfo = getSessionRemainingTime(s.NgayDienRa);
  const diffMs = timeInfo ? timeInfo.diffMs : null;

  // Buổi học chỉ thực sự "ĐANG DIỄN RA" khi:
  // 1. Trạng thái là Open
  // 2. VÀ thời gian thực tế đã tới giờ (diffMs <= 0) và chưa kết thúc quá 4 tiếng (hoặc không xác định ngày giờ cụ thể)
  const isActuallyLive = isTrangThaiOpen && (diffMs === null || (diffMs <= 0 && diffMs > -4 * 3600 * 1000));
  const isUpcoming = Boolean(diffMs !== null && diffMs > 0);
  const isImminent = Boolean(timeInfo && timeInfo.diffMs > 0 && timeInfo.isImminent);

  return `
    <div class="relative overflow-hidden rounded-2xl border ${isActuallyLive ? 'border-emerald-500/35 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : (isImminent ? 'border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.2)]' : 'border-emerald-500/20')} bg-gradient-to-br from-[#0B0F17] via-[#07241d] to-[#041a15] p-5 sm:p-6 flex flex-col justify-between emerald-glow-box h-full group">
      <!-- Ambient Glows -->
      <div class="absolute -top-20 -right-20 w-64 h-64 ${isActuallyLive ? 'bg-emerald-500/15' : (isImminent ? 'bg-amber-500/15' : 'bg-teal-500/10')} rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div>
        <!-- Top Status Row -->
        <div class="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
          <div class="flex flex-wrap items-center gap-2">
            ${isActuallyLive ? `
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                ĐANG DIỄN RA
              </span>
            ` : (isUpcoming ? `
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isImminent ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse' : 'bg-teal-500/15 border border-teal-500/30 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.15)]'} font-mono text-[11px] font-bold">
                <i class="fa-solid ${isImminent ? 'fa-hourglass-half' : 'fa-clock'} ${isImminent ? 'text-amber-400' : 'text-teal-400'}"></i>
                <span>${isImminent ? 'SẮP BẮT ĐẦU:' : 'SẮP DIỄN RA:'} ${timeInfo.badgeText}</span>
              </span>
            ` : `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-white/10 text-slate-400 font-mono text-[11px]">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                ${s.TrangThai === 'Closed' ? 'Đã kết thúc' : 'Sắp diễn ra'}
              </span>
            `)}
            ${tagBadgeHtml}
          </div>
        </div>

        <!-- Main Title (Strictly Sans-serif) -->
        <h2 
          class="text-lg sm:text-xl md:text-2xl font-bold font-sans text-slate-100 hover:text-emerald-400 transition-colors tracking-tight leading-snug mb-3 cursor-pointer"
          data-action="open-member-session-detail" 
          data-id="${sessionId}"
        >
          ${tenBuoiHop}
        </h2>

        <!-- Khung Hero Countdown Box Siêu Nổi Bật khi Buổi Học Chưa Diễn Ra -->
        ${isUpcoming ? `
          <div class="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r ${isImminent ? 'from-amber-950/40 via-slate-900/80 to-amber-950/40 border-amber-500/35 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'from-emerald-950/50 via-slate-900/80 to-teal-950/50 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'} border flex items-center justify-between gap-3 mb-3.5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl ${isImminent ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'} flex items-center justify-center text-lg shrink-0 shadow-sm">
                <i class="fa-solid fa-hourglass-half ${isImminent ? 'animate-pulse' : ''}"></i>
              </div>
              <div>
                <p class="text-[10px] uppercase font-mono tracking-wider ${isImminent ? 'text-amber-300/80' : 'text-emerald-300/80'} font-bold">Thời gian đếm ngược bắt đầu</p>
                <p class="text-base sm:text-lg md:text-xl font-mono font-black ${isImminent ? 'text-amber-300' : 'text-emerald-300'} tracking-tight">
                  ${timeInfo.badgeText}
                </p>
              </div>
            </div>
            <div class="hidden sm:flex flex-col items-end text-right font-mono text-xs text-slate-300">
              <span class="text-[10px] text-slate-400 uppercase tracking-wider">Khởi hành lúc</span>
              <span class="font-bold text-white">${formattedDate}</span>
            </div>
          </div>
        ` : ''}

        <!-- Single-line Compact Metadata Strip with Icons -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300 font-mono p-3 rounded-xl bg-slate-950/60 border border-white/5 backdrop-blur-sm mb-4">
          <span class="flex items-center gap-1.5">
            <i class="fa-regular fa-calendar-check text-emerald-400"></i>
            <span>${formattedDate}</span>
          </span>
          <span class="flex items-center gap-1.5 font-sans">
            <i class="fa-solid fa-location-dot text-rose-500"></i>
            <span class="text-slate-200 font-medium">${phongHoc}</span>
          </span>
          ${isActuallyLive ? `
            <div class="sm:ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
              <i class="fa-solid fa-door-open text-emerald-400"></i>
              <span>Phòng học đang mở</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Action Footer -->
      <div class="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <!-- Attendance Verification Badge / Quick PIN & Absence Actions -->
        <div class="flex flex-wrap items-center gap-2">
          ${userAttended ? `
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <i class="fa-solid fa-circle-check"></i>
              <span>Bạn đã điểm danh có mặt</span>
            </span>
          ` : (userAbsence ? `
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${(userAbsence.TrangThai === 'Approved' || userAbsence.TrangThaiDuyet === 'Approved') ? 'bht-badge-ok bg-teal-500/15 border-teal-500/30 text-teal-300' : ((userAbsence.TrangThai === 'Rejected' || userAbsence.TrangThaiDuyet === 'Rejected') ? 'bht-badge-err bg-rose-500/15 border-rose-500/30 text-rose-300' : 'bht-badge-warn bg-amber-500/15 border-amber-500/30 text-amber-300')} border text-xs font-semibold" title="${escapeHTML(userAbsence.Feedback || userAbsence.ChiTiet || '')}">
              <i class="fa-solid ${(userAbsence.TrangThai === 'Approved' || userAbsence.TrangThaiDuyet === 'Approved') ? 'fa-envelope-circle-check' : ((userAbsence.TrangThai === 'Rejected' || userAbsence.TrangThaiDuyet === 'Rejected') ? 'fa-circle-xmark' : 'fa-clock-rotate-left')}"></i>
              <span>${(userAbsence.TrangThai === 'Approved' || userAbsence.TrangThaiDuyet === 'Approved') ? 'Đã duyệt nghỉ có phép' : ((userAbsence.TrangThai === 'Rejected' || userAbsence.TrangThaiDuyet === 'Rejected') ? 'Đơn xin vắng bị từ chối' : 'Chờ duyệt đơn vắng')}</span>
            </span>
          ` : `
            ${isActuallyLive ? `
              <button 
                data-action="open-quick-pin-modal" 
                data-id="${sessionId}"
                class="bht-btn bht-btn-primary bht-btn-sm font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"
              >
                <i class="fa-solid fa-qrcode mr-1"></i>
                <span>Điểm danh ngay (Nhập PIN)</span>
              </button>
            ` : `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-white/5 text-slate-400 text-xs font-medium">
                <i class="fa-solid fa-clock"></i>
                <span>${isUpcoming ? 'Điểm danh chưa mở (Sắp diễn ra)' : 'Điểm danh đã đóng'}</span>
              </span>
            `}
            ${(!isClosed && (isActuallyLive || isUpcoming)) ? `
              <button 
                data-action="open-quick-absence-modal" 
                data-id="${sessionId}"
                class="bht-btn bht-btn-ghost bht-btn-sm text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 text-xs transition-colors"
                title="Gửi thư xin vắng mặt nếu không thể tham gia"
              >
                <i class="fa-regular fa-paper-plane mr-1 text-[11px]"></i>
                <span>Báo vắng</span>
              </button>
            ` : ''}
          `)}
        </div>

        <!-- Primary CTA: Xem chi tiết & Slide -->
        <button 
          data-action="open-member-session-detail" 
          data-id="${sessionId}"
          class="bht-btn bht-btn-primary bht-btn-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold shadow-[0_0_16px_rgba(16,185,129,0.35)] active:scale-[0.98] transition-all"
        >
          <span>Xem chi tiết &amp; Slide</span>
          <i class="fa-solid fa-arrow-right text-[11px] ml-1.5"></i>
        </button>
      </div>
    </div>
  `.trim();
}

/**
 * Render Bảng Nhật Ký Điểm Danh Chi Tiết Cho Thành Viên (Attendance Audit Log Table)
 * @param {Array} sessions Danh sách buổi học
 * @param {string} currentMssv MSSV người dùng hiện tại
 * @param {'ALL'|'OPEN'|'CLOSED'} [filter='ALL'] Bộ lọc trạng thái
 * @returns {string} Chuỗi HTML các thẻ <tr>
 */
export function renderMemberAttendanceAuditTable(sessions = [], currentMssv = '', filter = 'ALL', absences = []) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return uiEmptyState({
      icon: 'fa-calendar-xmark',
      title: 'Chưa có dữ liệu sinh hoạt',
      desc: 'Dữ liệu các buổi sinh hoạt chuyên đề sẽ hiển thị tại đây khi Ban tổ chức triển khai.',
      isTableRow: true,
      colspan: 5
    });
  }

  const cleanMssv = String(currentMssv || '').trim().toUpperCase();
  const allAbsences = Array.isArray(absences) && absences.length > 0
    ? absences
    : ((typeof appState !== 'undefined' && Array.isArray(appState.absences)) ? appState.absences : []);

  // Áp dụng filter tab nếu có
  const filtered = sessions.filter(s => {
    if (filter === 'OPEN') return String(s.TrangThai || '').toLowerCase() === 'open';
    if (filter === 'CLOSED') return String(s.TrangThai || '').toLowerCase() === 'closed';
    if (filter && filter !== 'ALL') {
      const tag = String(s.TagChuyenDe || '').toUpperCase();
      return tag === String(filter).toUpperCase();
    }
    return true;
  });

  if (filtered.length === 0) {
    return `
      <tr>
        <td colspan="5" class="py-8 text-center text-ink-muted italic font-mono text-xs">
          Không có buổi sinh hoạt nào phù hợp với bộ lọc "${escapeHTML(filter)}".
        </td>
      </tr>
    `;
  }

  return filtered.map(s => {
    const sid = escapeHTML(s.SessionID || '');
    const title = escapeHTML(s.TenBuoiHop || 'Chưa đặt tên');
    const fullDate = String(s.NgayDienRa || '---');
    const room = escapeHTML(s.PhongHoc || 'Lab CNTT');
    const tagBadge = uiTopicTagBadge(s.TagChuyenDe || 'GENERAL');

    // Parse ngày giờ gọn cho Date Badge Chip (ví dụ: '15/10/2026 19:30' -> '15 Th10' & '19:30')
    let dateStr = fullDate;
    let timeStr = '19:30';
    if (fullDate.includes(' ')) {
      const parts = fullDate.split(' ');
      dateStr = parts[0];
      timeStr = parts[1] || '19:30';
    }
    const dParts = dateStr.split('/');
    const dateChipLabel = dParts.length >= 2 ? `${dParts[0]} Th${dParts[1]}` : dateStr;

    let hasAttended = false;
    try {
      const ds = JSON.parse(s.DS_CoMat || '[]');
      hasAttended = Array.isArray(ds) && ds.includes(cleanMssv);
    } catch (_) {
      hasAttended = false;
    }

    const isOpen = String(s.TrangThai || '').toLowerCase() === 'open';
    const isClosed = String(s.TrangThai || '').toLowerCase() === 'closed';

    // Tìm đơn xin vắng của thành viên cho buổi này
    const userAbsence = allAbsences.find(a => 
      a.SessionID === s.SessionID && 
      String(a.MSSV || '').trim().toUpperCase() === cleanMssv && 
      a.TrangThaiDuyet !== 'Cancelled'
    );

    return `
      <tr class="hover:bg-subtle/30 transition-colors">
        <!-- Date Badge Chip -->
        <td class="py-3 px-4 font-mono text-xs">
          <div class="bg-subtle/80 text-ink px-2.5 py-1 rounded-lg border border-hairline text-center w-28 shrink-0">
            <span class="text-accent font-bold block">${dateChipLabel}</span>
            <span class="text-ink-muted text-[10px]">${timeStr}</span>
          </div>
        </td>

        <!-- Topic title & Room location -->
        <td class="py-3 px-4">
          <div 
            class="font-semibold text-ink font-sans hover:text-accent cursor-pointer transition-colors leading-snug"
            data-action="open-member-session-detail" 
            data-id="${sid}"
          >
            ${title}
          </div>
          <div class="flex flex-wrap items-center gap-2 mt-1">
            ${tagBadge}
            <span class="text-[11px] text-ink-muted font-mono flex items-center gap-1">
              <i class="fa-solid fa-location-dot text-[10px] text-rose-500"></i> ${room}
            </span>
          </div>
        </td>

        <!-- Session Status Dot (hidden on mobile) -->
        <td class="py-3 px-3 sm:px-4 text-center hidden sm:table-cell">
          ${isOpen ? `
            <span class="inline-flex items-center gap-1 text-accent font-medium text-xs font-mono">
              <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              Đang mở
            </span>
          ` : `
            <span class="inline-flex items-center gap-1 text-ink-muted text-xs font-mono">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              Đã kết thúc
            </span>
          `}
        </td>

        <!-- Attendance & Absence Status -->
        <td class="py-2.5 sm:py-3 px-2 sm:px-4 text-center whitespace-nowrap">
          ${hasAttended ? `
            <span class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-ok-soft text-ok font-semibold text-[11px] border border-ok/20 whitespace-nowrap">
              <i class="fa-solid fa-check text-[9px]"></i> Có mặt
            </span>
          ` : (userAbsence ? `
            ${(userAbsence.TrangThaiDuyet === 'Approved' || userAbsence.TrangThai === 'Approved') ? `
              <span class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-accent-soft text-accent font-semibold text-[11px] border border-accent/20 whitespace-nowrap" title="${escapeHTML(userAbsence.Feedback || userAbsence.ChiTiet || 'Vắng có phép')}">
                <i class="fa-solid fa-envelope-circle-check text-[9px]"></i> Vắng có phép
              </span>
            ` : ((userAbsence.TrangThaiDuyet === 'Rejected' || userAbsence.TrangThai === 'Rejected') ? `
              <span class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-500 font-semibold text-[11px] border border-rose-500/30 whitespace-nowrap" title="${escapeHTML(userAbsence.Feedback || 'Đơn bị từ chối')}">
                <i class="fa-solid fa-circle-xmark text-[9px]"></i> Không phép
              </span>
            ` : `
              <span class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 font-semibold text-[11px] border border-amber-500/30 whitespace-nowrap" title="Đang chờ Ban tổ chức phê duyệt">
                <i class="fa-solid fa-clock-rotate-left text-[9px]"></i> Chờ duyệt vắng
              </span>
            `)}
          ` : (isClosed ? `
            <span class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-subtle text-ink-muted text-[11px] border border-hairline font-mono whitespace-nowrap" title="Không tham gia và không có đơn xin vắng">
              <i class="fa-solid fa-minus text-[8px] text-ink-faint"></i> Vắng
            </span>
          ` : `
            <span class="text-ink-muted text-[11px] italic font-mono whitespace-nowrap">
              Chưa có mặt
            </span>
          `))}
        </td>

        <!-- Icon Action Button -->
        <td class="py-3 px-3 sm:px-4 text-center">
          <button 
            data-action="open-member-session-detail" 
            data-id="${sid}"
            class="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-lg bg-subtle hover:bg-accent-soft text-ink-muted hover:text-accent border border-hairline hover:border-accent/30 flex items-center justify-center transition-all group"
            title="Xem chi tiết & Slide"
          >
            <i class="fa-solid fa-arrow-up-right-from-square text-[10px] sm:text-xs group-hover:scale-110 transition-transform"></i>
          </button>
        </td>
      </tr>
    `.trim();
  }).join('\n');
}

/**
 * Render Cụm 3 Thẻ KPI Bento Trực Quan (Chuyên Cần, Bài Nộp, ĐRL)
 * Tỷ lệ 5 cột trong Bento Grid Row 1
 */
export function renderMemberDrlWidget(data = {}) {
  const {
    attendedCount = 0,
    totalSessions = 0,
    attendanceRate = 0,
    approvedTasks = 0,
    totalTasks = 0,
    excusedCount = 0,
    unexcusedCount = 0,
    pendingAbsenceCount = 0,
    drlTier = 'GOOD',
    drlTierLabel = 'Đạt chuẩn',
    drlPointsText = '+10 ĐRL',
    drlBadgeClass = 'bht-badge-ok',
    nextMilestoneTip = ''
  } = data;

  const safeRate = Math.min(100, Math.max(0, attendanceRate));
  const rateWidth = `${safeRate}%`;
  const taskTotal = totalTasks > 0 ? totalTasks : 5;
  const taskPct = Math.min(100, Math.round((approvedTasks / taskTotal) * 100));
  const remaining = Math.max(0, taskTotal - approvedTasks);

  return `
    <div class="bht-drl-card flex flex-col gap-3 h-full justify-between">
      <!-- Bento KPI 1: Circular Donut Progress (Chuyên cần) -->
      <div 
        data-action="scroll-to-member-audit"
        class="glass-bento-interactive rounded-xl p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:border-emerald-500/40 transition-all group"
        title="Bấm để cuộn xuống xem Nhật ký chuyên cần"
      >
        <div class="space-y-0.5">
          <span class="text-[10px] font-mono uppercase tracking-wider text-ink-muted block font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            CHỈ SỐ THAM GIA HỌC VỤ
          </span>
          <h4 class="text-sm sm:text-base font-bold text-ink font-sans">
            Chuyên cần học vụ
          </h4>
          <p class="text-xs text-ink-muted font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>${attendedCount}/${totalSessions} buổi tham gia</span>
            ${excusedCount > 0 ? `<span class="text-accent font-semibold">• ${excusedCount} có phép</span>` : ''}
            ${unexcusedCount > 0 ? `<span class="text-rose-500 font-semibold">• ${unexcusedCount} không phép</span>` : ''}
            ${pendingAbsenceCount > 0 ? `<span class="text-amber-500 font-semibold">• ${pendingAbsenceCount} chờ duyệt</span>` : ''}
          </p>
          <div class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-medium pt-0.5">
            <i class="fa-solid fa-circle-check text-[10px]"></i>
            <span>${attendedCount === totalSessions && totalSessions > 0 ? 'Không vắng buổi nào' : `Đạt ${safeRate}%`}</span>
          </div>
        </div>

        <!-- Donut SVG -->
        <div class="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path class="text-subtle stroke-current opacity-80" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-width="3.5"></path>
            <path class="text-emerald-500 dark:text-emerald-400 stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-dasharray="${safeRate}, 100" stroke-linecap="round" stroke-width="3.5"></path>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="font-mono text-xs font-bold text-ink">${safeRate}%</span>
          </div>
        </div>
      </div>

      <!-- Bento KPI 2: Bài nộp đạt tiêu chuẩn -->
      <div 
        data-action="switch-member-tab"
        data-tab="sessions"
        class="glass-bento-interactive rounded-xl p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer hover:border-emerald-500/40 transition-all group"
        title="Bấm để chuyển sang Lộ trình Chuyên đề & Bài tập"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div>
            <span class="text-[10px] font-mono uppercase tracking-wider text-ink-muted block font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              TIẾN ĐỘ BÀI TẬP LAB
            </span>
            <h4 class="text-sm sm:text-base font-bold text-ink font-sans">
              Bài nộp đạt tiêu chuẩn
            </h4>
          </div>
          <span class="font-mono text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            ${approvedTasks} / ${taskTotal}
          </span>
        </div>

        <!-- Progress track -->
        <div class="space-y-1 mt-1">
          <div class="w-full bg-subtle h-2 rounded-full overflow-hidden border border-hairline">
            <div class="bht-drl-progress-fill bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-400 h-full rounded-full transition-all duration-500" style="width: ${rateWidth};"></div>
          </div>
          <div class="flex justify-between items-center text-ink-muted font-mono text-[10px]">
            <span>Đạt ${safeRate}% (50% Đạt +10 · 80% Xuất sắc +15)</span>
            <span>Còn ${remaining} bài</span>
          </div>
        </div>
      </div>

      <!-- Bento KPI 3: Điểm Rèn Luyện — Trạng thái Chưa công bố -->
      <div 
        data-action="show-drl-notice"
        class="glass-bento-interactive rounded-xl p-3.5 sm:p-4 flex items-center justify-between border-l-4 border-l-slate-400 dark:border-l-slate-500/40 cursor-pointer hover:border-slate-500 transition-all group"
        title="Điểm Rèn Luyện sẽ được công bố vào đợt đánh giá cuối học kỳ"
      >
        <div class="space-y-0.5 flex-1">
          <div class="flex items-center gap-1.5">
            <i class="fa-solid fa-medal text-slate-500 dark:text-slate-400 text-xs"></i>
            <span class="text-[10px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
              ĐIỂM RÈN LUYỆN HỌC KỲ
            </span>
          </div>
          <div class="flex items-center gap-2 pt-0.5">
            <i class="fa-solid fa-lock text-slate-500 dark:text-slate-400 text-sm"></i>
            <span class="text-sm font-bold text-ink-muted font-mono">??? ĐRL</span>
          </div>
          <p class="text-[11px] text-ink-faint flex items-center gap-1.5 pt-0.5 font-mono">
            <i class="fa-solid fa-clock text-[10px]"></i>
            <span>Chờ công bố cuối kỳ</span>
          </p>
        </div>
        <div class="hidden sm:block text-right shrink-0">
          <span class="inline-flex px-2 py-0.5 rounded bg-subtle font-mono text-[10px] text-ink-faint border border-hairline">
            Kỳ I 26-27
          </span>
        </div>
      </div>
    </div>
  `.trim();
}

// Aliases tương thích ngược
export const memberSessionCardTemplate = (session, arg2 = {}, arg3 = {}) => {
  if (typeof arg2 === 'boolean') {
    return renderSessionCard(session, { isAdmin: false, hasAttended: arg2, ...arg3 });
  }
  return renderSessionCard(session, { isAdmin: false, ...arg2 });
};
export const adminSessionCardTemplate = (session, options = {}) => renderSessionCard(session, { isAdmin: true, ...options });

/**
 * Render một dòng sinh viên có mặt trong Bảng Điểm danh của Buổi học
 * @param {Object} member Bản ghi thành viên { MSSV, HoTen, Email }
 * @param {string} [checkinTime='Trong buổi học'] Thời gian điểm danh hoặc ngày diễn ra
 * @returns {string} Chuỗi HTML <tr>
 */
export function renderAttendeeRow(member = {}, checkinTime = '') {
  const m = member || {};
  const mssv = escapeHTML(String(m.MSSV || ''));
  const hoTen = escapeHTML(m.HoTen || `Sinh viên ${mssv}`);
  const email = m.Email ? escapeHTML(m.Email) : '';
  const timeStr = escapeHTML(checkinTime || 'Trong buổi học');

  return `
    <tr data-key="${mssv}" class="hover:bg-subtle/30 transition-colors">
      <td class="py-3 px-3.5 font-mono text-accent font-bold">${mssv}</td>
      <td class="py-3 px-3.5">
        <div class="font-semibold text-ink">${hoTen}</div>
        ${email ? `<div class="text-[11px] text-ink-muted">${email}</div>` : ''}
      </td>
      <td class="py-3 px-3.5 font-mono text-xs text-ink-muted">${timeStr}</td>
      <td class="py-3 px-3.5 text-center">
        <span class="bht-badge bht-badge-ok text-[11px]">
          <i class="fa-solid fa-check mr-1 text-[9px]"></i>Có mặt
        </span>
      </td>
    </tr>
  `.trim();
}

/**
 * Render một dòng Thành viên trong Bảng Nhân sự của Quản trị viên
 * @param {Object} member Thành viên
 * @param {Object} options { isStatusBusy, isResetBusy }
 * @returns {string} Chuỗi HTML <tr>
 */
export function renderMemberRow(member = {}, options = {}) {
  const m = member || {};
  const { isStatusBusy = false, isResetBusy = false } = options;

  const mssv = escapeHTML(m.MSSV || '');
  const hoTen = escapeHTML(m.HoTen || 'Thành viên');
  const email = m.Email ? escapeHTML(m.Email) : '<span class="text-warn italic">Chưa liên kết</span>';
  const role = escapeHTML(m.Role || 'MEMBER');
  const isActive = String(m.TrangThai || 'Active').toLowerCase() === 'active';

  // Badge quà 20/10 nếu thành viên đã nhận quà
  const rawGift = m.gift2010 || m.Gift2010;
  let giftData = null;
  if (typeof rawGift === 'string' && rawGift.trim()) {
    try { giftData = JSON.parse(rawGift); } catch (e) {}
  } else if (typeof rawGift === 'object' && rawGift !== null) {
    giftData = rawGift;
  }

  const giftBadge = giftData && giftData.claimCode 
    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20" title="${escapeHTML(giftData.giftTitle || 'Quà 20/10')} (Mã: ${escapeHTML(giftData.claimCode)})">
         <span>🎁</span>
         <span>${escapeHTML(giftData.claimCode)}</span>
       </span>`
    : '';

  return `
    <tr data-key="${mssv}" class="hover:bg-subtle/40 transition-colors">
      <td class="py-3 px-4 font-mono font-bold text-ink">${mssv}</td>
      <td class="py-3 px-4">
        <div class="flex items-center gap-2.5">
          ${uiInitialsAvatar(hoTen, 'sm')}
          <span class="font-medium text-ink">${hoTen}</span>
          ${giftBadge}
        </div>
      </td>
      <td class="py-3 px-4 font-mono text-ink-muted text-xs">${email}</td>
      <td class="py-3 px-4">
        <span class="bht-badge ${role === 'ADMIN' ? 'bht-badge-warn' : 'bg-subtle text-ink-muted'}">
          ${role}
        </span>
      </td>
      <td class="py-3 px-4 text-center">
        ${uiStatusBadge(isActive ? 'Active' : 'Inactive')}
      </td>
      <td class="py-3 px-4 text-center">
        <div class="inline-flex items-center justify-center gap-1.5 min-w-[245px]">
          <!-- Cột 1: Xem (Độ rộng cố định 64px) -->
          <div class="w-16 flex justify-center shrink-0">
            <button 
              data-action="view-as-member"
              data-id="${mssv}"
              title="Xem giao diện của thành viên ${hoTen}"
              class="bht-btn bht-btn-ghost bht-btn-xs text-accent hover:bg-accent-soft w-full justify-center"
            >
              <i class="fa-solid fa-eye text-[10px] mr-1"></i>
              <span>Xem</span>
            </button>
          </div>

          <!-- Cột 2: Reset Email (Độ rộng cố định 104px, giữ nguyên trục kể cả khi chưa có email) -->
          <div class="w-[104px] flex justify-center shrink-0">
            ${m.Email ? `
              <button 
                data-action="reset-member-email"
                data-id="${mssv}"
                ${isResetBusy ? 'disabled' : ''}
                title="Xóa liên kết Gmail"
                class="bht-btn bht-btn-ghost bht-btn-xs text-ink-muted hover:text-ink w-full justify-center ${isResetBusy ? 'opacity-60 pointer-events-none' : ''}"
              >
                <i class="fa-solid ${isResetBusy ? 'fa-circle-notch fa-spin' : 'fa-rotate-left'} text-[10px] mr-1"></i>
                <span class="truncate">Reset Email</span>
              </button>
            ` : `<span class="inline-block w-full" aria-hidden="true"></span>`}
          </div>

          <!-- Cột 3: Khóa / Mở Khóa (Độ rộng cố định 72px) -->
          <div class="w-[76px] flex justify-center shrink-0">
            <button 
              data-action="toggle-member-status"
              data-id="${mssv}"
              data-status="${isActive ? 'Inactive' : 'Active'}"
              ${isStatusBusy ? 'disabled' : ''}
              class="bht-btn bht-btn-ghost bht-btn-xs w-full justify-center ${isActive ? 'text-err hover:bg-err-soft' : 'text-ok hover:bg-ok-soft'} ${isStatusBusy ? 'opacity-60 pointer-events-none' : ''}"
            >
              <i class="fa-solid ${isStatusBusy ? 'fa-circle-notch fa-spin' : (isActive ? 'fa-lock' : 'fa-lock-open')} text-[10px] mr-1"></i>
              <span>${isActive ? 'Khóa' : 'Mở khóa'}</span>
            </button>
          </div>
        </div>
      </td>
    </tr>
  `.trim();
}

// Alias tương thích ngược
export const adminMemberRowTemplate = renderMemberRow;

/**
 * Sinh Avatar chữ cái đầu (Initials Avatar) với màu nền hài hòa
 * @param {string} name Họ và tên
 * @param {'sm'|'md'|'lg'} [size='sm'] Kích thước
 * @returns {string} Chuỗi HTML avatar tròn
 */
export function uiInitialsAvatar(name = '', size = 'sm') {
  const safeName = String(name || '').trim();
  const words = safeName.split(/\s+/).filter(Boolean);
  let initials = 'SV';
  if (words.length >= 2) {
    initials = (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0].slice(0, 2).toUpperCase();
  }

  // Bảng màu pastel học thuật cho avatar
  const colors = [
    'bg-accent-soft text-accent border-accent/20',
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
  ];
  let charCodeSum = 0;
  for (let i = 0; i < safeName.length; i++) charCodeSum += safeName.charCodeAt(i);
  const colorClass = colors[charCodeSum % colors.length];

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  };
  const sizeClass = sizeClasses[size] || sizeClasses.sm;

  return `<div class="bht-avatar ${sizeClass} ${colorClass} font-mono">${escapeHTML(initials)}</div>`;
}

/**
 * Render Thẻ tài liệu trong Kho học liệu (Rich Media Style)
 * @param {Object} doc Bản ghi tài liệu
 * @returns {string} Chuỗi HTML card tài liệu
 */
export function renderDocCard(doc = {}, options = {}) {
  const d = doc || {};
  const { isAdmin = false } = options;
  const docId = escapeHTML(d.DocID || '');
  const tenTaiLieu = escapeHTML(d.TenTaiLieu || 'Tài liệu học thuật');
  const phanLoai = escapeHTML(d.PhanLoai || 'Slide');
  const linkDrive = escapeHTML(d.LinkDrive || '#');
  const moTa = escapeHTML(d.MoTa || '');

  // Phân loại định dạng tài liệu để gán icon và màu sắc đặc trưng
  const normCategory = (phanLoai || '').toLowerCase();
  const normType = (normCategory + ' ' + (tenTaiLieu || '')).toLowerCase();
  
  let iconClass = 'fa-folder-open text-accent';
  let badgeStyleClass = 'bg-accent-soft text-accent border border-accent/20';
  let typeLabel = phanLoai || 'Slide';

  if (normCategory.includes('chuẩn đầu ra') || normCategory.includes('mos') || normCategory.includes('ic3')) {
    iconClass = 'fa-certificate text-teal-600 dark:text-teal-400';
    badgeStyleClass = 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20';
    typeLabel = 'Chuẩn đầu ra MOS/IC3';
  } else if (normCategory.includes('word') || normCategory.includes('luận văn') || normCategory.includes('đồ án') || normCategory.includes('khóa luận')) {
    iconClass = 'fa-file-word text-blue-600 dark:text-blue-400';
    badgeStyleClass = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20';
    typeLabel = 'Word & Đồ án';
  } else if (normCategory.includes('excel') || normCategory.includes('số liệu') || normCategory.includes('dashboard') || normCategory.includes('bảng tính')) {
    iconClass = 'fa-file-excel text-emerald-600 dark:text-emerald-400';
    badgeStyleClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20';
    typeLabel = 'Excel & Số liệu';
  } else if (normCategory.includes('ai') || normCategory.includes('prompt') || normCategory.includes('chatgpt') || normCategory.includes('trí tuệ nhân tạo')) {
    iconClass = 'fa-wand-magic-sparkles text-purple-600 dark:text-purple-400';
    badgeStyleClass = 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20';
    typeLabel = 'Prompt AI & Tools';
  } else if (normCategory.includes('đề thi') || normCategory.includes('olympic') || normCategory.includes('thuật toán') || normCategory.includes('c++')) {
    iconClass = 'fa-award text-amber-500';
    badgeStyleClass = 'bht-media-badge-quiz';
    typeLabel = 'Olympic & Thi cử';
  } else if (normCategory.includes('slide') || normCategory.includes('giảng') || normCategory.includes('ppt')) {
    iconClass = 'fa-file-powerpoint text-coral';
    badgeStyleClass = 'bht-media-badge-pdf';
    typeLabel = 'Slide bài giảng';
  } else if (normCategory.includes('code') || normCategory.includes('git') || normCategory.includes('repo')) {
    iconClass = 'fa-code-branch text-emerald-500';
    badgeStyleClass = 'bht-media-badge-code';
    typeLabel = 'Source code / Git';
  } else if (normCategory.includes('ebook') || normCategory.includes('sách')) {
    iconClass = 'fa-book-bookmark text-indigo-500';
    badgeStyleClass = 'bht-media-badge-book';
    typeLabel = 'Ebook & Sách';
  } else if (!phanLoai || phanLoai === 'Tài liệu') {
    // Nếu không có phân loại cụ thể, mới suy luận từ tên tài liệu
    if (normType.includes('chuẩn đầu ra') || normType.includes('mos') || normType.includes('ic3')) {
      iconClass = 'fa-certificate text-teal-600 dark:text-teal-400';
      badgeStyleClass = 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20';
      typeLabel = 'Chuẩn đầu ra MOS/IC3';
    } else if (normType.includes('word') || normType.includes('luận văn') || normType.includes('đồ án')) {
      iconClass = 'fa-file-word text-blue-600 dark:text-blue-400';
      badgeStyleClass = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20';
      typeLabel = 'Word & Đồ án';
    } else if (normType.includes('excel')) {
      iconClass = 'fa-file-excel text-emerald-600 dark:text-emerald-400';
      badgeStyleClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20';
      typeLabel = 'Excel & Số liệu';
    } else if (normType.includes('ai') || normType.includes('prompt')) {
      iconClass = 'fa-wand-magic-sparkles text-purple-600 dark:text-purple-400';
      badgeStyleClass = 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20';
      typeLabel = 'Prompt AI & Tools';
    }
  }

  return `
    <div data-key="${docId}" class="bht-card p-5 hover:border-strong transition-all flex flex-col justify-between group hover:shadow-md">
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="bht-badge ${badgeStyleClass} text-[10px] font-semibold">
            ${escapeHTML(typeLabel)}
          </span>
          ${uiMonoBadge(docId, 'text-[10px] text-ink-faint')}
        </div>
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-subtle/80 flex items-center justify-center shrink-0 border border-hairline group-hover:scale-105 transition-transform">
            <i class="fa-solid ${iconClass} text-lg"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-sm text-ink mb-1 leading-snug group-hover:text-accent transition-colors line-clamp-2">
              ${tenTaiLieu}
            </h4>
            ${moTa ? `<p class="text-xs text-ink-muted line-clamp-2 leading-relaxed">${moTa}</p>` : ''}
          </div>
        </div>
      </div>
      <div class="pt-3.5 mt-3 border-t border-hairline flex items-center justify-between gap-2">
        <span class="text-[11px] text-ink-faint flex items-center gap-1 font-mono">
          <i class="fa-brands fa-google-drive"></i> VNUF2 Drive
        </span>
        <div class="flex items-center gap-1.5">
          ${isAdmin ? `
            <button 
              data-action="open-edit-doc-modal" 
              data-id="${docId}"
              class="bht-btn bht-btn-ghost bht-btn-xs text-ink-muted hover:text-ink"
              title="Sửa tài liệu"
            >
              <i class="fa-solid fa-pen text-[10px]"></i>
            </button>
            <button 
              data-action="delete-doc" 
              data-id="${docId}"
              class="bht-btn bht-btn-ghost bht-btn-xs text-err hover:bg-err-soft"
              title="Xóa tài liệu"
            >
              <i class="fa-solid fa-trash text-[10px]"></i>
            </button>
          ` : ''}
          <a 
            href="${linkDrive}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="bht-btn bht-btn-secondary bht-btn-xs text-accent font-medium inline-flex items-center gap-1 hover:shadow-sm"
          >
            <span>Mở Drive</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
          </a>
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Render Thẻ Bài Tập / Nhiệm vụ trong Quản trị Admin (Có nút Sửa & Xóa)
 * @param {Object} task Bản ghi nhiệm vụ
 * @returns {string} Chuỗi HTML card bài tập
 */
export function renderAdminTaskItem(task = {}) {
  const t = task || {};
  const taskId = escapeHTML(t.TaskID || '');
  const tieuDe = escapeHTML(t.TieuDe || 'Nhiệm vụ chưa đặt tên');
  const deadline = escapeHTML(t.Deadline ? t.Deadline.replace('T', ' ') : 'Chưa có hạn');
  const nguoiNhan = escapeHTML(t.NguoiNhan || 'ALL');
  const moTa = escapeHTML(t.MoTa || '');
  const isOpen = String(t.TrangThai || 'Open').toLowerCase() === 'open';

  return `
    <div data-key="${taskId}" class="bht-card p-4 sm:p-5 bg-surface border border-hairline space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-hairline">
        <div class="flex items-center gap-2">
          ${uiMonoBadge(taskId, 'text-xs text-accent font-bold')}
          <span class="bht-badge ${isOpen ? 'bht-badge-ok' : 'bg-subtle text-ink-faint'} text-[10px]">
            ${isOpen ? 'Đang mở nộp' : 'Đã khóa'}
          </span>
          <span class="bht-badge bg-subtle text-ink-muted text-[10px] font-mono">
            Nhận: ${nguoiNhan}
          </span>
        </div>
        <div class="flex items-center gap-1.5">
          ${t.FolderID ? `
            <a 
              href="https://drive.google.com/drive/folders/${encodeURIComponent(t.FolderID)}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="bht-btn bht-btn-secondary bht-btn-xs text-accent"
              title="Mở thư mục Google Drive bài nộp"
            >
              <i class="fa-brands fa-google-drive mr-1 text-[10px]"></i>
              <span>Drive</span>
            </a>
          ` : ''}
          <button 
            data-action="open-edit-task-modal"
            data-id="${taskId}"
            class="bht-btn bht-btn-secondary bht-btn-xs"
            title="Sửa thông tin bài tập"
          >
            <i class="fa-solid fa-pen mr-1 text-[10px]"></i>
            <span>Sửa</span>
          </button>
          <button 
            data-action="delete-task"
            data-id="${taskId}"
            class="bht-btn bht-btn-danger bht-btn-xs"
            title="Xóa bài tập này"
          >
            <i class="fa-solid fa-trash mr-1 text-[10px]"></i>
            <span>Xóa</span>
          </button>
        </div>
      </div>

      <div>
        <h4 class="font-semibold text-sm sm:text-base text-ink mb-1">${tieuDe}</h4>
        ${moTa ? `<p class="text-xs text-ink-muted whitespace-pre-line leading-relaxed mb-2">${moTa}</p>` : ''}
        <p class="text-xs text-ink-muted font-mono flex items-center gap-1.5">
          <i class="fa-regular fa-clock text-accent"></i>
          <span>Hạn nộp: <strong class="text-ink">${deadline}</strong></span>
        </p>
      </div>
    </div>
  `.trim();
}

// Alias tương thích ngược
export const memberDocCardTemplate = renderDocCard;

// ====================================================================
// 17. QUIZ & PRACTICE MODULE TEMPLATES (EDITORIAL ACADEMIC STYLE)
// Re-export từ ./templates/quizTemplates.js để tinh giản kích thước module
// ====================================================================
export * from './templates/quizTemplates.js';

// ====================================================================
// 18. CAMPAIGN & MAILER STUDIO TEMPLATES (UNIVERSAL EVENT MANAGEMENT)
// ====================================================================
export * from './templates/campaignTemplates.js';

