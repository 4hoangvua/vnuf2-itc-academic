/**
 * MODULE KHO HỌC LIỆU DÀNH CHO THÀNH VIÊN (MEMBER DOCS CONTROLLER)
 * Tách từ frontend/modules/member.js để tinh giản kích thước và module hóa hệ thống.
 * 
 * Phụ trách:
 * 1. Hiển thị kho học liệu thành viên dạng Bento Grid, phân trang (6 items/trang)
 * 2. Lọc theo danh mục chuyên đề (Pills động)
 * 3. Tìm kiếm học liệu kết hợp từ khóa và danh mục
 */

import { appState } from '../ui.js';
import { 
  memberDocCardTemplate, 
  emptyStateTemplate, 
  renderTopicFilterBarHtml, 
  matchesTopicCategory 
} from '../templates.js';
import { 
  paginate, 
  renderPagination, 
  resetPagination 
} from '../pagination.js';

export let currentDocCategory = 'ALL';
export let lastMemberFilteredDocs = null;

/**
 * Lọc tài liệu theo danh mục chuyên đề (Category Pills)
 * @param {string} category Mã phân loại (ALL, CHUAN_DAU_RA, WORD_DO_AN, EXCEL_DATA, AI_TOOLS, OLYMPIC)
 */
export function filterDocsByCategory(category) {
  currentDocCategory = category || 'ALL';
  applyDocsFilter();
}

/**
 * Áp dụng kết hợp cả Danh mục chuyên đề và Từ khóa tìm kiếm cho kho tài liệu
 */
export function applyDocsFilter() {
  const searchInput = document.getElementById('input-search-docs');
  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const allDocs = appState.docs || [];

  // Đồng bộ thanh filter pills động cho học liệu
  const container = document.getElementById('member-docs-categories');
  if (container) {
    container.innerHTML = renderTopicFilterBarHtml({
      activeCat: currentDocCategory,
      items: allDocs,
      tagField: 'PhanLoai',
      actionName: 'filter-docs-category'
    });
  }

  const filtered = allDocs.filter(d => {
    // 1. Lọc theo Danh mục
    if (currentDocCategory && currentDocCategory !== 'ALL') {
      if (!matchesTopicCategory(d.PhanLoai, currentDocCategory)) return false;
    }

    // 2. Lọc theo Từ khóa tìm kiếm
    if (query) {
      const matchText = ((d.TenTaiLieu || '') + ' ' + (d.MoTa || '') + ' ' + (d.PhanLoai || '')).toLowerCase();
      if (!matchText.includes(query)) return false;
    }

    return true;
  });

  lastMemberFilteredDocs = filtered;
  resetPagination('member-docs');
  renderMemberDocs(filtered);
}

/**
 * Render kho học liệu
 */
export function renderMemberDocs(filteredDocs) {
  const container = document.getElementById('member-doc-list') || document.getElementById('member-docs-grid');
  const pagEl = document.getElementById('member-docs-pagination');
  if (!container) return;

  const allDocs = appState.docs || [];

  // Luôn cập nhật thanh filter pills động nếu container tồn tại
  const filterContainer = document.getElementById('member-docs-categories');
  if (filterContainer) {
    filterContainer.innerHTML = renderTopicFilterBarHtml({
      activeCat: currentDocCategory,
      items: allDocs,
      tagField: 'PhanLoai',
      actionName: 'filter-docs-category'
    });
  }

  const docs = filteredDocs !== undefined ? filteredDocs : (lastMemberFilteredDocs || appState.docs || []);
  lastMemberFilteredDocs = docs;

  if (docs.length === 0) {
    container.innerHTML = emptyStateTemplate('Chưa có tài liệu nào phù hợp với bộ lọc!', 'fa-book-open');
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const { pagedItems } = paginate('member-docs', docs, {
    pageSize: 6,
    pageSizeOptions: [3, 6, 9, 15],
    onPageChange: () => renderMemberDocs()
  });

  container.innerHTML = pagedItems.map(d => memberDocCardTemplate(d)).join('');

  if (pagEl) {
    pagEl.innerHTML = renderPagination('member-docs');
  }
}

export function handleSearchDocs(query) {
  applyDocsFilter();
}
