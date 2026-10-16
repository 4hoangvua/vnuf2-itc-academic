// ====================================================================
// MODULE QUẢN LÝ PHÂN TRANG CHUẨN HÓA (PAGINATION MANAGER MODULE)
// Ban Học Thuật - CLB Tin Học VNUF2
// Phong cách: Editorial Academic Studio (Notion / Stripe Docs Style)
// ====================================================================
// 1. Quản lý trạng thái đa thực thể (Multi-instance state management).
// 2. Tính toán phân đoạn mảng (Array slicing) & điều phối trang thông minh.
// 3. Render giao diện phân trang chuẩn mực với 3 họ font và icon tinh gọn.
// 4. Hỗ trợ đầy đủ Event Delegation thông qua data-action và data-pagination-id.
// ====================================================================

import { escapeHTML } from '../utils/dom.js';

/**
 * Lưu trữ trạng thái của tất cả các thực thể phân trang
 * Key: instanceId (string) -> Value: PaginationState
 */
const paginationInstances = new Map();

/**
 * Cấu hình mặc định cho một thực thể phân trang
 */
const DEFAULT_CONFIG = {
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
  pageSizeOptions: [5, 10, 20, 50],
  showPageSize: true,
  onPageChange: null
};

/**
 * Đăng ký hoặc cập nhật cấu hình cho một thực thể phân trang
 * @param {string} id Mã định danh thực thể (vd: 'admin-submissions', 'admin-members')
 * @param {Object} options Cấu hình tùy chọn
 * @returns {Object} Trạng thái hiện tại của thực thể
 */
export function registerPagination(id, options = {}) {
  const current = paginationInstances.get(id) || { ...DEFAULT_CONFIG };
  const updated = {
    ...current,
    ...options,
    pageSizeOptions: options.pageSizeOptions || current.pageSizeOptions || DEFAULT_CONFIG.pageSizeOptions
  };
  paginationInstances.set(id, updated);
  return updated;
}

/**
 * Lấy trạng thái hiện tại của một thực thể phân trang
 * @param {string} id Mã định danh thực thể
 * @returns {Object}
 */
export function getPaginationState(id) {
  if (!paginationInstances.has(id)) {
    paginationInstances.set(id, { ...DEFAULT_CONFIG });
  }
  return paginationInstances.get(id);
}

/**
 * Đặt lại trang hiện tại về 1 (Thường dùng khi đổi bộ lọc hoặc từ khóa tìm kiếm)
 * @param {string} id Mã định danh thực thể
 */
export function resetPagination(id) {
  const state = getPaginationState(id);
  state.currentPage = 1;
}

/**
 * Chuyển tới một trang cụ thể
 * @param {string} id Mã định danh thực thể
 * @param {number} page Số trang muốn chuyển đến
 */
export function setPaginationPage(id, page) {
  const state = getPaginationState(id);
  const targetPage = Math.max(1, Math.min(page, state.totalPages || 1));
  
  if (state.currentPage !== targetPage) {
    state.currentPage = targetPage;
    if (typeof state.onPageChange === 'function') {
      state.onPageChange(state.currentPage, state.pageSize, id);
    }
  }
}

/**
 * Chuyển về trang trước
 * @param {string} id Mã định danh thực thể
 */
export function prevPaginationPage(id) {
  const state = getPaginationState(id);
  if (state.currentPage > 1) {
    setPaginationPage(id, state.currentPage - 1);
  }
}

/**
 * Chuyển sang trang tiếp theo
 * @param {string} id Mã định danh thực thể
 */
export function nextPaginationPage(id) {
  const state = getPaginationState(id);
  if (state.currentPage < state.totalPages) {
    setPaginationPage(id, state.currentPage + 1);
  }
}

/**
 * Thay đổi số lượng phần tử trên mỗi trang (Page Size)
 * @param {string} id Mã định danh thực thể
 * @param {number} newPageSize Số dòng mới
 */
export function setPaginationPageSize(id, newPageSize) {
  const state = getPaginationState(id);
  const size = Math.max(1, parseInt(newPageSize, 10) || DEFAULT_CONFIG.pageSize);
  
  state.hasCustomPageSize = true;
  if (state.pageSize !== size) {
    state.pageSize = size;
    state.currentPage = 1; // Luôn reset về trang 1 khi đổi kích thước
    if (typeof state.onPageChange === 'function') {
      state.onPageChange(state.currentPage, state.pageSize, id);
    }
  }
}

/**
 * Hàm phân đoạn mảng dữ liệu (Array Slicing) kết hợp cập nhật thông số phân trang
 * @template T
 * @param {string} id Mã định danh thực thể phân trang
 * @param {T[]} items Danh sách đầy đủ (đã lọc nếu có)
 * @param {Object} [options] Cấu hình bổ sung (pageSize, onPageChange)
 * @returns {{
 *   pagedItems: T[],
 *   currentPage: number,
 *   totalPages: number,
 *   pageSize: number,
 *   totalItems: number,
 *   startIndex: number,
 *   endIndex: number
 * }}
 */
export function paginate(id, items = [], options = {}) {
  const state = getPaginationState(id);
  
  // Chỉ dùng options.pageSize làm giá trị khởi tạo mặc định nếu người dùng chưa tự chọn số dòng
  if (options.pageSize && !state.hasCustomPageSize) {
    state.pageSize = options.pageSize;
  }
  if (options.onPageChange) {
    state.onPageChange = options.onPageChange;
  }
  if (options.showPageSize !== undefined) {
    state.showPageSize = options.showPageSize;
  }
  if (options.pageSizeOptions) {
    state.pageSizeOptions = options.pageSizeOptions;
  }

  const safeItems = Array.isArray(items) ? items : [];
  state.totalItems = safeItems.length;
  state.totalPages = Math.max(1, Math.ceil(state.totalItems / state.pageSize));

  // Tự động căn chỉnh trang hiện tại nếu vượt quá tổng số trang sau khi lọc
  if (state.currentPage > state.totalPages) {
    state.currentPage = state.totalPages;
  }
  if (state.currentPage < 1) {
    state.currentPage = 1;
  }

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = Math.min(state.totalItems, startIndex + state.pageSize);
  const pagedItems = safeItems.slice(startIndex, endIndex);

  return {
    pagedItems,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    pageSize: state.pageSize,
    totalItems: state.totalItems,
    startIndex,
    endIndex
  };
}

/**
 * Sinh danh sách các nút số trang thông minh (Smart Windowing with Ellipsis)
 * @param {number} current Trang hiện tại
 * @param {number} total Tổng số trang
 * @returns {(number|string)[]} Mảng số trang và dấu '...'
 */
function generatePageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);
  return pages;
}

/**
 * Render chuỗi HTML thanh điều khiển phân trang chuẩn Editorial Academic
 * @param {string} id Mã định danh thực thể
 * @param {Object} [renderOptions] Các tùy chọn hiển thị
 * @returns {string} Chuỗi HTML phân trang
 */
export function renderPagination(id, renderOptions = {}) {
  const state = getPaginationState(id);
  const totalItems = renderOptions.totalItems !== undefined ? renderOptions.totalItems : state.totalItems;
  const totalPages = renderOptions.totalPages !== undefined ? renderOptions.totalPages : state.totalPages;
  const currentPage = renderOptions.currentPage !== undefined ? renderOptions.currentPage : state.currentPage;
  const pageSize = renderOptions.pageSize !== undefined ? renderOptions.pageSize : state.pageSize;
  const showPageSize = renderOptions.showPageSize !== undefined ? renderOptions.showPageSize : state.showPageSize;
  const pageSizeOptions = renderOptions.pageSizeOptions || state.pageSizeOptions || DEFAULT_CONFIG.pageSizeOptions;

  // Nếu không có dữ liệu nào, không hiển thị thanh phân trang
  if (totalItems === 0) {
    return '';
  }

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(totalItems, startIndex + pageSize);
  const startNum = totalItems > 0 ? startIndex + 1 : 0;

  // Xây dựng các nút chuyển trang
  const pageNumbers = generatePageNumbers(currentPage, totalPages);
  const pageButtonsHtml = pageNumbers.map(p => {
    if (p === '...') {
      return `<span class="px-1.5 py-1 text-ink-faint select-none text-xs font-mono font-medium">…</span>`;
    }
    const isActive = p === currentPage;
    return `
      <button
        type="button"
        data-action="change-page"
        data-pagination-id="${escapeHTML(id)}"
        data-page="${p}"
        class="bht-pagination-btn ${isActive ? 'active' : ''}"
        ${isActive ? 'aria-current="page"' : ''}
        title="Trang ${p}"
      >
        ${p}
      </button>
    `;
  }).join('');

  // Selector chọn số phần tử trên mỗi trang (Số dòng)
  let pageSizeSelectorHtml = '';
  if (showPageSize && pageSizeOptions.length > 0) {
    const optionsHtml = pageSizeOptions.map(opt => `
      <option value="${opt}" ${opt === pageSize ? 'selected' : ''}>${opt} dòng</option>
    `).join('');

    pageSizeSelectorHtml = `
      <div class="flex items-center gap-1.5 text-ink-muted text-xs">
        <span class="text-[11px] hidden sm:inline">Số dòng:</span>
        <select 
          data-action="change-page-size" 
          data-pagination-id="${escapeHTML(id)}" 
          class="bht-pagination-select"
          title="Chọn số lượng dòng hiển thị trên mỗi trang"
        >
          ${optionsHtml}
        </select>
      </div>
    `;
  }

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return `
    <div class="bht-pagination" data-pagination-container="${escapeHTML(id)}">
      <div class="flex items-center justify-end gap-2.5 sm:gap-3 w-full">
        ${pageSizeSelectorHtml}

        <nav class="bht-pagination-nav" aria-label="Điều hướng trang danh sách">
          <!-- Nút Trang trước -->
          <button
            type="button"
            data-action="prev-page"
            data-pagination-id="${escapeHTML(id)}"
            class="bht-pagination-btn ${prevDisabled ? 'disabled' : ''}"
            ${prevDisabled ? 'disabled' : ''}
            title="Trang trước"
            aria-label="Trang trước"
          >
            <i class="fa-solid fa-chevron-left text-[10px]"></i>
          </button>

          <!-- Các nút số trang -->
          ${pageButtonsHtml}

          <!-- Nút Trang sau -->
          <button
            type="button"
            data-action="next-page"
            data-pagination-id="${escapeHTML(id)}"
            class="bht-pagination-btn ${nextDisabled ? 'disabled' : ''}"
            ${nextDisabled ? 'disabled' : ''}
            title="Trang tiếp"
            aria-label="Trang tiếp"
          >
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </nav>
      </div>
    </div>
  `.trim();
}
