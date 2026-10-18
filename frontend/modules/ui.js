// ====================================================================
// MODULE ĐIỀU KHIỂN GIAO DIỆN & TRẠNG THÁI (UI CONTROLLER)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================

// Tái xuất (Re-export) từ Reactive Store
export { store, getState, setState, subscribe, appState } from './store.js';

// Tái xuất (Re-export) từ DOM Utils
export {
  escapeHTML,
  escapeHtml,
  showToast,
  hideToast,
  showGlobalLoading,
  hideGlobalLoading,
  showFormError,
  clearFormError,
  setButtonLoading,
  withButtonLock,
  setFormDisabled,
  setFormDisabled as setFormControlsDisabled,
  attachEventDelegation,
  attachFormDelegation,
  initHorizontalDragScroll,
  $,
  $$
} from '../utils/dom.js';

import { store } from './store.js';

// Khóa thao tác UI chống spam click (Liên kết với Store.uiLocks)
export const uiActionLocks = store.getState('uiLocks');

/**
 * Chuyển đổi màn hình chính (App Shell view routing)
 */
export function showView(viewId) {
  const views = [
    'view-unauthenticated',
    'view-bind-account',
    'view-member',
    'view-admin'
  ];

  views.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === viewId) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // Tự động cuộn lên đầu trang mượt mà
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Bật/tắt Giao diện Sáng/Tối (Dark/Light Theme)
 */
export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const nextTheme = isDark ? 'light' : 'dark';

  if (nextTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem('bht_theme', nextTheme);
  updateThemeIcons(nextTheme);
}

/**
 * Khởi tạo Theme theo thiết lập đã lưu hoặc System Preference
 */
export function initTheme() {
  const saved = localStorage.getItem('bht_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved ? saved : (prefersDark ? 'dark' : 'light');

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcons(theme);
}

/**
 * Cập nhật biểu tượng và nhãn theme trên thanh điều hướng
 */
function updateThemeIcons(theme) {
  const icons = document.querySelectorAll('.js-theme-icon');
  const labels = document.querySelectorAll('.js-theme-label');

  icons.forEach(icon => {
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun js-theme-icon text-amber-400';
    } else {
      icon.className = 'fa-solid fa-moon js-theme-icon';
    }
  });

  labels.forEach(label => {
    label.textContent = theme === 'dark' ? 'Sáng' : 'Tối';
  });
}

/**
 * Thu nhỏ hoặc mở rộng Sidebar trên Desktop
 */
export function toggleSidebar() {
  const sidebars = document.querySelectorAll('.bht-sidebar');
  if (!sidebars.length) return;
  const isCurrentlyCollapsed = sidebars[0].classList.contains('is-collapsed');
  const nextCollapsed = !isCurrentlyCollapsed;

  sidebars.forEach(sb => {
    if (nextCollapsed) {
      sb.classList.add('is-collapsed');
    } else {
      sb.classList.remove('is-collapsed');
    }
  });

  localStorage.setItem('bht_sidebar_collapsed', nextCollapsed ? 'true' : 'false');
  updateSidebarToggleIcons(nextCollapsed);
}

/**
 * Khởi tạo trạng thái Sidebar theo thiết lập lưu trong LocalStorage
 */
export function initSidebar() {
  const saved = localStorage.getItem('bht_sidebar_collapsed') === 'true';
  const sidebars = document.querySelectorAll('.bht-sidebar');
  sidebars.forEach(sb => {
    if (saved) {
      sb.classList.add('is-collapsed');
    } else {
      sb.classList.remove('is-collapsed');
    }
  });
  updateSidebarToggleIcons(saved);
}

/**
 * Cập nhật icon cho các nút toggle sidebar
 */
function updateSidebarToggleIcons(isCollapsed) {
  const icons = document.querySelectorAll('.sidebar-toggle-icon');
  const btns = document.querySelectorAll('.sidebar-toggle-btn');

  icons.forEach(icon => {
    if (isCollapsed) {
      icon.className = 'fa-solid fa-angles-right text-xs sidebar-toggle-icon';
    } else {
      icon.className = 'fa-solid fa-angles-left text-xs sidebar-toggle-icon';
    }
  });

  btns.forEach(btn => {
    btn.setAttribute('title', isCollapsed ? 'Mở rộng menu' : 'Thu nhỏ menu');
  });
}
