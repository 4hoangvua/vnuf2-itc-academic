/**
 * MODULE QUẢN LÝ KHO HỌC LIỆU DÀNH CHO ADMIN (ADMIN DOCS CONTROLLER)
 * Tách từ frontend/modules/admin.js để tinh giản kích thước và module hóa hệ thống.
 * 
 * Phụ trách:
 * 1. Hiển thị danh sách học liệu, phân trang (6 items/trang), lọc taxonomy đa tầng
 * 2. Tìm kiếm học liệu thời gian thực theo từ khóa
 * 3. Modal thêm/sửa tài liệu với phân loại tùy biến động (custom categories)
 * 4. Xóa học liệu khỏi hệ thống
 */

import { callApi } from '../../services/api.js';
import { 
  appState, 
  showToast, 
  showFormError, 
  clearFormError, 
  setButtonLoading, 
  setFormControlsDisabled, 
  diffRenderList, 
  escapeHtml 
} from '../ui.js';
import { 
  renderDocCard, 
  renderTopicFilterBarHtml, 
  matchesTopicCategory, 
  extractDynamicTopics 
} from '../templates.js';
import { 
  paginate, 
  renderPagination, 
  resetPagination 
} from '../pagination.js';

/**
 * Lọc tài liệu theo danh mục (Pills)
 * @param {string} category Mã phân loại hoặc 'ALL'
 */
export function handleFilterAdminDocs(category = 'ALL') {
  appState.adminDocCategory = category;
  resetPagination('admin-docs');
  renderAdminDocsGrid();
}

/**
 * Tìm kiếm tài liệu theo từ khóa
 * @param {string} query Từ khóa tìm kiếm
 */
export function handleSearchAdminDocs(query = '') {
  appState.adminDocSearchQuery = String(query).toLowerCase().trim();
  resetPagination('admin-docs');
  renderAdminDocsGrid();
}

/**
 * Render Lưới Tài Liệu Học Thuật trong Quản Trị
 */
export function renderAdminDocsGrid() {
  const grid = document.getElementById('admin-docs-grid');
  const pagEl = document.getElementById('admin-docs-pagination');
  if (!grid) return;

  const docs = appState.documents || appState.docs || [];
  const cat = appState.adminDocCategory || 'ALL';
  const search = appState.adminDocSearchQuery || '';

  // 1. Đồng bộ dải nút Filter Pills động tái sử dụng (Tự động phát hiện tag mới)
  const filterContainer = document.getElementById('admin-doc-category-filters');
  if (filterContainer) {
    filterContainer.innerHTML = renderTopicFilterBarHtml({
      activeCat: cat,
      items: docs,
      tagField: 'PhanLoai',
      actionName: 'filter-admin-docs'
    });
  }

  const filtered = docs.filter(d => {
    // 1. Lọc theo danh mục dùng hàm so sánh taxonomy chuẩn
    let matchCat = true;
    if (cat !== 'ALL') {
      matchCat = matchesTopicCategory(d.PhanLoai, cat);
    }

    // 2. Lọc theo từ khóa tìm kiếm
    let matchSearch = true;
    if (search) {
      matchSearch = String(d.TenTaiLieu || '').toLowerCase().includes(search) ||
                    String(d.PhanLoai || '').toLowerCase().includes(search) ||
                    String(d.MoTa || '').toLowerCase().includes(search) ||
                    String(d.DocID || '').toLowerCase().includes(search);
    }

    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full bht-card p-8 text-center text-ink-muted">
        <i class="fa-solid fa-box-open text-3xl mb-2 text-ink-faint"></i>
        <p class="text-sm">Không tìm thấy tài liệu học thuật nào phù hợp!</p>
      </div>
    `;
    if (pagEl) pagEl.innerHTML = '';
    return;
  }

  const { pagedItems } = paginate('admin-docs', filtered, {
    pageSize: 6,
    pageSizeOptions: [6, 12, 24, 48],
    onPageChange: () => renderAdminDocsGrid()
  });

  diffRenderList(grid, pagedItems, 'DocID', d => renderDocCard(d, { isAdmin: true }));

  if (pagEl) {
    pagEl.innerHTML = renderPagination('admin-docs');
  }
}

export function populateDocCategorySelect(selectedValue = 'Slide') {
  const catSelect = document.getElementById('edit-doc-category');
  if (!catSelect) return;

  const docs = appState.documents || appState.docs || [];
  const baseOptions = [
    { value: 'Slide', label: 'Slide bài giảng' },
    { value: 'Chuẩn đầu ra MOS/IC3', label: 'Chuẩn đầu ra MOS/IC3' },
    { value: 'Word & Đồ án', label: 'Word & Đồ án' },
    { value: 'Excel & Số liệu', label: 'Excel & Số liệu' },
    { value: 'Prompt AI & Tools', label: 'Prompt AI & Tools' },
    { value: 'Olympic & Thuật toán', label: 'Olympic & Thuật toán' },
    { value: 'Ebook & Sách', label: 'Ebook & Sách' }
  ];

  const dynamicTopics = extractDynamicTopics(docs, 'PhanLoai');
  const customTopics = dynamicTopics.filter(t => t.isCustom);

  let html = baseOptions.map(opt => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join('\n');
  if (customTopics.length > 0) {
    html += '\n<optgroup label="── Phân loại đã tạo trước đó ──">';
    customTopics.forEach(t => {
      html += `\n<option value="${escapeHtml(t.id)}">${escapeHtml(t.label)}</option>`;
    });
    html += '\n</optgroup>';
  }
  html += '\n<option value="CUSTOM">+ Thêm phân loại mới (Tự nhập)...</option>';
  catSelect.innerHTML = html;
  catSelect.value = selectedValue;
}

/**
 * Quản lý Kho học liệu / Tài liệu: Thêm, Sửa, Xóa
 */
export function openCreateDocModal() {
  const modal = document.getElementById('modal-edit-doc');
  const heading = document.getElementById('modal-doc-heading');
  const form = document.getElementById('form-edit-doc');
  if (form) form.reset();
  const idInput = document.getElementById('edit-doc-id');
  if (idInput) idInput.value = '';
  const customContainer = document.getElementById('edit-doc-custom-category-container');
  if (customContainer) customContainer.classList.add('hidden');
  const customInput = document.getElementById('edit-doc-input-custom-category');
  if (customInput) customInput.value = '';
  populateDocCategorySelect('Slide');
  if (heading) heading.textContent = 'Thêm Tài Liệu Mới Vào Kho';
  if (modal) modal.classList.remove('hidden');
}

export function openEditDocModal(docId) {
  const docs = appState.documents || appState.docs || [];
  const doc = docs.find(d => d.DocID === docId);
  if (!doc) {
    showToast('Không tìm thấy tài liệu!', 'error');
    return;
  }

  const modal = document.getElementById('modal-edit-doc');
  const heading = document.getElementById('modal-doc-heading');
  if (heading) heading.textContent = 'Cập Nhật Tài Liệu Học Thuật';

  const idInput = document.getElementById('edit-doc-id');
  const titleInput = document.getElementById('edit-doc-title');
  const catSelect = document.getElementById('edit-doc-category');
  const linkInput = document.getElementById('edit-doc-link');
  const descInput = document.getElementById('edit-doc-desc');
  const customContainer = document.getElementById('edit-doc-custom-category-container');
  const customInput = document.getElementById('edit-doc-input-custom-category');

  if (idInput) idInput.value = doc.DocID;
  if (titleInput) titleInput.value = doc.TenTaiLieu || '';
  if (linkInput) linkInput.value = doc.LinkDrive || '';
  if (descInput) descInput.value = doc.MoTa || '';

  const defaultCategories = ['Slide', 'Chuẩn đầu ra MOS/IC3', 'Word & Đồ án', 'Excel & Số liệu', 'Prompt AI & Tools', 'Olympic & Thuật toán', 'Ebook & Sách'];
  const docCategory = doc.PhanLoai || 'Slide';

  populateDocCategorySelect(docCategory);

  if (defaultCategories.includes(docCategory) || catSelect?.value === docCategory) {
    if (customContainer) customContainer.classList.add('hidden');
    if (customInput) customInput.value = '';
  } else {
    if (catSelect) catSelect.value = 'CUSTOM';
    if (customContainer) customContainer.classList.remove('hidden');
    if (customInput) customInput.value = docCategory;
  }

  if (modal) modal.classList.remove('hidden');
}

export function closeEditDocModal() {
  const modal = document.getElementById('modal-edit-doc');
  if (modal) modal.classList.add('hidden');
}

export async function handleSaveDocument(e) {
  if (e && e.preventDefault) e.preventDefault();

  const form = document.getElementById('form-edit-doc');
  const btn = document.getElementById('btn-submit-edit-doc');
  const docId = document.getElementById('edit-doc-id')?.value;
  const titleInput = document.getElementById('edit-doc-title');
  const linkInput = document.getElementById('edit-doc-link');

  const title = titleInput?.value.trim();
  let category = document.getElementById('edit-doc-category')?.value || 'Slide';
  if (category === 'CUSTOM') {
    const customInput = document.getElementById('edit-doc-input-custom-category');
    const customVal = customInput?.value.trim();
    if (!customVal) {
      showFormError(form, 'Vui lòng nhập tên phân loại học liệu mới!', customInput);
      return;
    }
    category = customVal;
  }
  const link = linkInput?.value.trim();
  const desc = document.getElementById('edit-doc-desc')?.value.trim() || '';

  clearFormError(form);

  if (!title) {
    showFormError(form, 'Vui lòng nhập tên tài liệu / slide / giáo trình!', titleInput);
    return;
  }

  if (!link) {
    showFormError(form, 'Vui lòng nhập đường link Google Drive / tải về!', linkInput);
    return;
  }

  if (!/^https?:\/\//i.test(link)) {
    showFormError(form, 'Link tài liệu phải là một đường dẫn URL hợp lệ (bắt đầu bằng http:// hoặc https://)!', linkInput);
    return;
  }

  setFormControlsDisabled(form, true);
  if (btn) setButtonLoading(btn, true);

  try {
    const isEdit = Boolean(docId);
    const action = isEdit ? 'updateDocument' : 'addDocument';
    const payload = isEdit ? { docId, tenTaiLieu: title, phanLoai: category, linkDrive: link, moTa: desc }
                           : { tenTaiLieu: title, phanLoai: category, linkDrive: link, moTa: desc };

    const res = await callApi(action, payload);
    setFormControlsDisabled(form, false);
    if (btn) setButtonLoading(btn, false);

    if (res && res.success) {
      showToast(res.message || 'Lưu tài liệu thành công!', 'success');
      closeEditDocModal();

      const docs = appState.documents || appState.docs || [];
      if (isEdit) {
        const d = docs.find(x => x.DocID === docId);
        if (d) {
          d.TenTaiLieu = title;
          d.PhanLoai = category;
          d.LinkDrive = link;
          d.MoTa = desc;
        }
      } else {
        const newDoc = {
          DocID: res.docId || ('DOC_' + Date.now()),
          TenTaiLieu: title,
          PhanLoai: category,
          LinkDrive: link,
          MoTa: desc
        };
        docs.unshift(newDoc);
      }
      appState.documents = docs;
      appState.docs = docs;
      appState.adminDocCategory = 'ALL';
      appState.adminDocSearchQuery = '';
      resetPagination('admin-docs');
      renderAdminDocsGrid();
      populateDocCategorySelect(category);
    } else {
      showFormError(form, (res && res.message) ? res.message : 'Không thể lưu tài liệu!');
    }
  } catch (err) {
    setFormControlsDisabled(form, false);
    if (btn) setButtonLoading(btn, false);
    showFormError(form, 'Lỗi: ' + (err.message || err.toString()));
  }
}

export async function handleDeleteDocument(docId) {
  if (!docId) return;
  const docs = appState.documents || appState.docs || [];
  const doc = docs.find(d => d.DocID === docId);
  const docTitle = doc ? doc.TenTaiLieu : docId;

  const confirmed = window.confirm(`Bạn có chắc muốn XÓA tài liệu "${docTitle}" khỏi kho học liệu?`);
  if (!confirmed) return;

  try {
    const res = await callApi('deleteDocument', { docId });
    if (res && res.success) {
      showToast(res.message || 'Đã xóa tài liệu!', 'success');
      const updatedDocs = docs.filter(d => d.DocID !== docId);
      appState.documents = updatedDocs;
      appState.docs = updatedDocs;
      renderAdminDocsGrid();
    } else {
      showToast((res && res.message) ? res.message : 'Không thể xóa tài liệu!', 'error');
    }
  } catch (err) {
    showToast('Lỗi khi xóa tài liệu: ' + (err.message || err.toString()), 'error');
  }
}
