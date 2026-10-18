// ====================================================================
// TIỆN ÍCH THAO TÁC DOM & CHỐNG SPAGHETTI (DOM & EVENT DELEGATION UTILS)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================
// 1. Chống XSS triệt để qua escapeHTML().
// 2. Cơ chế Event Delegation tập trung qua thuộc tính data-action & data-id.
// 3. Loại bỏ hoàn toàn sự phụ thuộc vào window.* và inline onclick="...".
// 4. Điều khiển Loading State, Toast Notification và Auto Button Lock.
// ====================================================================

/**
 * Làm sạch chuỗi hiển thị để chống tấn công XSS (Cross-Site Scripting)
 * Bắt buộc áp dụng cho mọi dữ liệu người dùng (Họ tên, Nhận xét, Tên file, Mô tả)
 * @param {string|any} str Chuỗi văn bản cần làm sạch
 * @returns {string} Chuỗi an toàn để chèn vào HTML
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Bí danh chữ thường tương thích ngược
 */
export const escapeHtml = escapeHTML;

/**
 * Trình truy vấn DOM ngắn gọn (Shorthand Selector)
 */
export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/**
 * CƠ CHẾ EVENT DELEGATION TẬP TRUNG
 * Gắn 1 listener duy nhất trên Container để quản lý toàn bộ các phần tử con có data-action="..."
 * 
 * @param {HTMLElement|string} container Phần tử DOM hoặc CSS selector cha
 * @param {Object} actionMap Bản đồ các handler: { [actionName]: (element, event, dataset) => void }
 * @param {string} [eventType='click'] Loại sự kiện lắng nghe (click, change, input...)
 * @returns {Function} Hàm hủy đăng ký listener (Cleanup)
 */
export function attachEventDelegation(container, actionMap, eventType = 'click') {
  const rootEl = typeof container === 'string' ? $(container) : container;
  if (!rootEl) {
    console.warn('[EventDelegation] Không tìm thấy container:', container);
    return () => {};
  }

  const listener = (event) => {
    // Tìm phần tử gần nhất có thuộc tính data-action
    const actionEl = event.target.closest('[data-action]');
    if (!actionEl || !rootEl.contains(actionEl)) return;

    // QUAN TRỌNG: Nếu sự kiện là 'click' mà phần tử khớp data-action là thẻ FORM hoặc SELECT,
    // bỏ qua ngay lập tức để tránh việc click vào dropdown/form làm kích hoạt nhầm action click!
    // Mọi hành động của form xử lý qua 'submit', dropdown xử lý qua 'change'.
    if (eventType === 'click' && (actionEl.tagName === 'FORM' || actionEl.tagName === 'SELECT')) {
      return;
    }

    const actionName = actionEl.getAttribute('data-action');
    if (!actionName) return;

    const handler = actionMap[actionName];
    if (typeof handler === 'function') {
      // Nếu là thẻ a hoặc button, ngăn reload trang mặc định nếu là hash / dummy link
      if (actionEl.tagName === 'A' && (actionEl.getAttribute('href') === '#' || actionEl.getAttribute('href') === 'javascript:void(0)')) {
        event.preventDefault();
      }

      // Trích xuất dataset tiện lợi: { id, tab, status, paginationId, page, ... }
      const dataset = {
        id: actionEl.getAttribute('data-id') || actionEl.dataset.id || '',
        tab: actionEl.getAttribute('data-tab') || actionEl.dataset.tab || '',
        status: actionEl.getAttribute('data-status') || actionEl.dataset.status || '',
        paginationId: actionEl.getAttribute('data-pagination-id') || actionEl.dataset.paginationId || '',
        page: actionEl.getAttribute('data-page') || actionEl.dataset.page || '',
        ...actionEl.dataset
      };

      try {
        handler(actionEl, event, dataset);
      } catch (err) {
        console.error(`[EventDelegation] Lỗi khi xử lý action "${actionName}":`, err);
      }
    } else {
      console.warn(`[EventDelegation] Chưa có handler cho action "${actionName}"`);
    }
  };

  rootEl.addEventListener(eventType, listener);
  return () => rootEl.removeEventListener(eventType, listener);
}

/**
 * Event Delegation chuyên dụng cho các thẻ Form submit ([data-action])
 * @param {HTMLElement|string} container Container bao bọc các form
 * @param {Object} formActionMap Bản đồ các handler: { [actionName]: (formEl, event, formData) => void }
 * @returns {Function}
 */
export function attachFormDelegation(container, formActionMap) {
  const rootEl = typeof container === 'string' ? $(container) : container;
  if (!rootEl) return () => {};

  // Vô hiệu hóa HTML5 validation tự động của browser (Không dùng popup tooltip mặc định)
  const forms = rootEl.querySelectorAll ? rootEl.querySelectorAll('form') : [];
  forms.forEach(f => { f.noValidate = true; });

  const submitListener = (event) => {
    const formEl = event.target.closest('form[data-action]');
    if (!formEl || !rootEl.contains(formEl)) return;

    formEl.noValidate = true;
    event.preventDefault();

    // Xóa thông báo lỗi cũ của form trước khi xử lý submit
    clearFormError(formEl);

    const actionName = formEl.getAttribute('data-action');
    const handler = formActionMap[actionName];

    if (typeof handler === 'function') {
      const formData = new FormData(formEl);
      try {
        handler(formEl, event, formData);
      } catch (err) {
        console.error(`[FormDelegation] Lỗi khi submit form "${actionName}":`, err);
      }
    }
  };

  rootEl.addEventListener('submit', submitListener);
  return () => rootEl.removeEventListener('submit', submitListener);
}

// --------------------------------------------------------------------
// ĐIỀU KHIỂN THÔNG BÁO LỖI FORM CHUYÊN DỤNG (DEDICATED FORM VALIDATION ERRORS)
// --------------------------------------------------------------------

/**
 * Hiển thị lỗi form riêng biệt (Dedicated Form Error Alert)
 * Thay thế hoàn toàn popup tooltip tự động mặc định của trình duyệt.
 * 
 * @param {HTMLFormElement|string} form Form phần tử hoặc Selector / ID
 * @param {string} message Thông báo lỗi hiển thị cho người dùng
 * @param {HTMLElement|string} [invalidInput] Phần tử input bị lỗi để highlight và focus
 */
export function showFormError(form, message, invalidInput = null) {
  const formEl = typeof form === 'string' ? (document.getElementById(form) || $(form)) : form;
  if (!formEl) return;

  // 1. Tìm hoặc tạo khối thông báo lỗi riêng biệt cho Form
  let errBox = formEl.querySelector('.js-form-error, [id$="-error"], [id$="-error-alert"]');
  let errMsg = null;

  if (errBox) {
    errMsg = errBox.querySelector('.js-error-msg, [id$="-error-msg"]') || errBox;
  } else {
    // Tự động tạo khối thông báo lỗi chuẩn BHT nếu form chưa có sẵn
    errBox = document.createElement('div');
    errBox.className = 'bht-form-error-alert js-form-error mb-3';
    errBox.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation mt-0.5 shrink-0 text-sm"></i>
      <span class="leading-relaxed js-error-msg"></span>
    `;
    formEl.prepend(errBox);
    errMsg = errBox.querySelector('.js-error-msg');
  }

  if (errMsg) {
    errMsg.textContent = message;
  }
  errBox.classList.remove('hidden');

  // 2. Highlight trường nhập liệu bị lỗi (nếu có)
  const inputEl = typeof invalidInput === 'string' 
    ? (document.getElementById(invalidInput) || formEl.querySelector(invalidInput)) 
    : invalidInput;

  if (inputEl) {
    inputEl.classList.add('has-error');
    try {
      inputEl.focus();
    } catch (_) {}

    // Tự động xóa lỗi ngay khi người dùng bắt đầu nhập / sửa giá trị
    const clearHandler = () => {
      inputEl.classList.remove('has-error');
      if (errBox) errBox.classList.add('hidden');
      inputEl.removeEventListener('input', clearHandler);
      inputEl.removeEventListener('change', clearHandler);
    };
    inputEl.addEventListener('input', clearHandler);
    inputEl.addEventListener('change', clearHandler);
  }
}

/**
 * Xóa thông báo lỗi và bỏ highlight tất cả các trường trong form
 * @param {HTMLFormElement|string} form Form phần tử hoặc Selector / ID
 */
export function clearFormError(form) {
  const formEl = typeof form === 'string' ? (document.getElementById(form) || $(form)) : form;
  if (!formEl) return;

  const errBoxes = formEl.querySelectorAll('.js-form-error, [id$="-error"], [id$="-error-alert"]');
  errBoxes.forEach(b => b.classList.add('hidden'));

  const inputs = formEl.querySelectorAll('.has-error');
  inputs.forEach(i => i.classList.remove('has-error'));
}

// --------------------------------------------------------------------
// ĐIỀU KHIỂN TOAST THÔNG BÁO TOÀN CỤC
// --------------------------------------------------------------------

let toastTimeout = null;

/**
 * Hiển thị thông báo Toast nổi (Floating Toast)
 * @param {string} message Nội dung thông báo
 * @param {'info'|'success'|'warning'|'error'} [type='info'] Loại thông báo
 * @param {number} [duration=4000] Thời gian hiển thị (mili-giây)
 */
export function showToast(message, type = 'info', duration = 4000) {
  const toast = $('#global-toast');
  const text = $('#global-toast-text');
  const icon = $('#global-toast-icon');
  if (!toast || !text || !icon) return;

  text.textContent = message;

  // Cấu hình icon và màu sắc theo Tokens
  icon.className = 'text-base flex-shrink-0 ';
  if (type === 'success') {
    icon.className += 'fa-solid fa-circle-check text-ok';
  } else if (type === 'error') {
    icon.className += 'fa-solid fa-circle-exclamation text-err';
  } else if (type === 'warning') {
    icon.className += 'fa-solid fa-triangle-exclamation text-warn';
  } else {
    icon.className += 'fa-solid fa-circle-info text-accent';
  }

  toast.classList.remove('opacity-0', 'translate-y-8', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(hideToast, duration);
}

/**
 * Ẩn thông báo Toast ngay lập tức
 */
export function hideToast() {
  const toast = $('#global-toast');
  if (!toast) return;
  toast.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none');
  toast.classList.remove('opacity-100', 'translate-y-0');
}

// --------------------------------------------------------------------
// ĐIỀU KHIỂN OVERLAY LOADING TOÀN CỤC
// --------------------------------------------------------------------

/**
 * Hiển thị màn che Loading toàn cục
 * @param {string} [text='Đang tải dữ liệu...'] Dòng chữ hiển thị kèm spinner
 */
export function showGlobalLoading(text = 'Đang tải dữ liệu...') {
  const overlay = $('#global-loading-overlay');
  const label = $('#global-loading-text');
  if (label) label.textContent = text;
  if (overlay) overlay.classList.remove('hidden');
}

/**
 * Ẩn màn che Loading toàn cục
 */
export function hideGlobalLoading() {
  const overlay = $('#global-loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// --------------------------------------------------------------------
// TỰ ĐỘNG KHÓA NÚT BẤM (BUTTON LOADING & LOCK HELPER)
// --------------------------------------------------------------------

/**
 * Đặt trạng thái Loading cho một nút bấm:
 * CHỈ thay đổi/chèn icon spinner (fa-circle-notch fa-spin),
 * TUYỆT ĐỐI KHÔNG thay đổi text hay thay cả khối HTML,
 * khóa kích thước tạm thời để tránh làm nhảy hoặc bể layout các phần tử bên cạnh.
 * 
 * @param {HTMLButtonElement|HTMLElement} buttonEl Nút bấm cần khóa/mở
 * @param {boolean} isLoading Trạng thái đang tải (true/false)
 */
export function setButtonLoading(buttonEl, isLoading) {
  if (!buttonEl) return;

  if (isLoading) {
    if (buttonEl.dataset.isBtnBusy === 'true') return;
    buttonEl.dataset.isBtnBusy = 'true';
    buttonEl.disabled = true;
    buttonEl.classList.add('bht-btn-loading', 'pointer-events-none');

    // Khóa tạm thời kích thước bề ngang để tránh layout shift / giật nút
    const rect = buttonEl.getBoundingClientRect();
    if (rect.width > 0 && !buttonEl.style.minWidth) {
      buttonEl.style.minWidth = `${rect.width}px`;
      buttonEl.dataset.hadLockedWidth = 'true';
    }

    // Tìm icon font-awesome hiện có bên trong nút
    const existingIcon = buttonEl.querySelector('i.fa, i.fas, i.far, i.fa-solid, i.fa-regular, i.fa-brands');
    if (existingIcon) {
      if (!existingIcon.dataset.originalClass) {
        existingIcon.dataset.originalClass = existingIcon.className;
      }
      // Giữ lại các class margin (mr-*, ml-*) và kích thước (text-*) nếu có
      const preserveClasses = existingIcon.className.match(/(m[lrxy]-[0-9.]+|text-[a-z0-9]+)/g) || [];
      existingIcon.className = `fa-solid fa-circle-notch fa-spin ${preserveClasses.join(' ')}`.trim();
    } else {
      // Nếu nút chưa có icon nào, chỉ chèn tạm spinner phía trước text mà không xóa/sửa text
      const spinner = document.createElement('i');
      spinner.className = 'fa-solid fa-circle-notch fa-spin text-xs mr-1.5 js-btn-temp-spinner';
      buttonEl.prepend(spinner);
    }
  } else {
    buttonEl.dataset.isBtnBusy = 'false';
    buttonEl.disabled = false;
    buttonEl.classList.remove('bht-btn-loading', 'pointer-events-none');

    // Mở khóa kích thước đã đặt tạm
    if (buttonEl.dataset.hadLockedWidth === 'true') {
      buttonEl.style.minWidth = '';
      delete buttonEl.dataset.hadLockedWidth;
    }

    // Gỡ spinner tạm thời nếu trước đó chèn thêm
    const tempSpinner = buttonEl.querySelector('.js-btn-temp-spinner');
    if (tempSpinner) {
      tempSpinner.remove();
    }

    // Phục hồi class icon gốc
    const existingIcon = buttonEl.querySelector('i[data-original-class]');
    if (existingIcon) {
      existingIcon.className = existingIcon.dataset.originalClass;
      delete existingIcon.dataset.originalClass;
    }

    if (buttonEl.dataset.originalHtml) {
      delete buttonEl.dataset.originalHtml;
    }
  }
}

/**
 * Bọc một tác vụ bất đồng bộ (Async Function) với trạng thái khóa nút bấm tự động
 * @param {HTMLButtonElement} buttonEl Nút bấm kích hoạt tác vụ
 * @param {Function} asyncFn Hàm async cần thực thi
 */
export async function withButtonLock(buttonEl, asyncFn) {
  if (!buttonEl || buttonEl.disabled) return;
  setButtonLoading(buttonEl, true);
  try {
    return await asyncFn();
  } finally {
    setButtonLoading(buttonEl, false);
  }
}

/**
 * Khóa hoặc mở khóa tất cả các control trong một Form
 * @param {HTMLFormElement} formEl Form cần khóa
 * @param {boolean} disabled Trạng thái khóa
 */
export function setFormDisabled(formEl, disabled) {
  if (!formEl) return;
  const elements = formEl.querySelectorAll('input, select, textarea, button');
  elements.forEach(el => {
    el.disabled = disabled;
    if (disabled) {
      el.classList.add('opacity-70', 'pointer-events-none');
    } else {
      el.classList.remove('opacity-70', 'pointer-events-none');
    }
  });
}

/**
 * Khởi tạo tính năng kéo chuột (Mouse Drag-to-Scroll) và lăn chuột (Wheel-to-Scroll)
 * cho các dải container cuộn ngang trên Desktop (Notion / Spotify Style).
 * Hoạt động qua Event Delegation toàn cục nên tự động áp dụng cho mọi thanh filter động.
 */
export function initHorizontalDragScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const SCROLL_CONTAINER_SELECTOR = '.scrollbar-none, .scrollbar-hide, [data-drag-scroll], .bht-scroll-x';

  let isDown = false;
  let startX = 0;
  let initialScrollLeft = 0;
  let activeContainer = null;
  let hasDragged = false;
  const dragThreshold = 6;

  // 1. Mousedown: Bắt đầu theo dõi kéo
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Chỉ xử lý chuột trái
    const container = e.target.closest(SCROLL_CONTAINER_SELECTOR);
    if (!container) return;

    // Chỉ kích hoạt nếu container có nội dung bị tràn cần cuộn
    if (container.scrollWidth <= container.clientWidth) return;

    isDown = true;
    hasDragged = false;
    activeContainer = container;
    startX = e.pageX - container.getBoundingClientRect().left;
    initialScrollLeft = container.scrollLeft;
  });

  // 2. Mousemove: Di chuyển chuột kéo cuộn
  window.addEventListener('mousemove', (e) => {
    if (!isDown || !activeContainer) return;

    const currentX = e.pageX - activeContainer.getBoundingClientRect().left;
    const diff = currentX - startX;

    if (Math.abs(diff) > dragThreshold) {
      if (!hasDragged) {
        hasDragged = true;
        activeContainer.classList.add('is-dragging');
        document.body.classList.add('select-none');
      }
      activeContainer.scrollLeft = initialScrollLeft - diff;
    }
  });

  // 3. Mouseup / Mouseleave: Kết thúc kéo
  const endDrag = () => {
    if (!isDown) return;
    isDown = false;
    if (activeContainer) {
      activeContainer.classList.remove('is-dragging');
      activeContainer = null;
    }
    document.body.classList.remove('select-none');
    if (hasDragged) {
      setTimeout(() => {
        hasDragged = false;
      }, 60);
    }
  };

  window.addEventListener('mouseup', endDrag);

  // 4. Click capture: Chặn click kích hoạt nhầm action khi vừa kéo chuột xong
  document.addEventListener('click', (e) => {
    if (hasDragged) {
      const container = e.target.closest(SCROLL_CONTAINER_SELECTOR);
      if (container) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }
  }, true);

  // 5. Wheel: Lăn chuột dọc chuyển thành cuộn ngang mượt mà trên desktop
  document.addEventListener('wheel', (e) => {
    const container = e.target.closest(SCROLL_CONTAINER_SELECTOR);
    if (!container) return;

    if (container.scrollWidth > container.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const atStart = container.scrollLeft <= 1 && e.deltaY < 0;
      const atEnd = container.scrollLeft >= maxScroll - 1 && e.deltaY > 0;

      if (!atStart && !atEnd) {
        container.scrollLeft += e.deltaY * 0.85;
        e.preventDefault();
      }
    }
  }, { passive: false });
}

