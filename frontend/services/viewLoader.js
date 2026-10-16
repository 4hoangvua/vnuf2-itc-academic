// ====================================================================
// BỘ TẢI GIAO DIỆN CON ĐỘNG (DYNAMIC VIEW PARTIAL LOADER)
// ====================================================================
// Tự động nạp các file view HTML độc lập từ thư mục views/ vào App Shell.
// Cho phép các thành viên CLB cùng lúc sửa từng file HTML riêng biệt
// mà không bao giờ bị merge conflict trên index.html.
// ====================================================================

const VIEW_PATHS = {
  auth: 'views/auth.html',
  member: 'views/member.html',
  admin: 'views/admin.html'
};

const viewCache = new Map();

/**
 * Tải nội dung một file HTML view từ thư mục views/
 * @param {string} viewKey Tên view ('auth' | 'member' | 'admin')
 * @returns {Promise<string>}
 */
export async function fetchViewHtml(viewKey) {
  if (viewCache.has(viewKey)) {
    return viewCache.get(viewKey);
  }

  const path = VIEW_PATHS[viewKey];
  if (!path) {
    throw new Error(`Đường dẫn view không hợp lệ: "${viewKey}"`);
  }

  try {
    const response = await fetch(`${path}?_cb=${Date.now()}`, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} khi tải view "${path}"`);
    }
    const html = await response.text();
    viewCache.set(viewKey, html);
    return html;
  } catch (err) {
    console.error(`Lỗi khi tải view partial [${viewKey}]:`, err);
    throw err;
  }
}

/**
 * Tải tất cả các Views vào container #app-root
 */
export async function loadAllViews() {
  const root = document.getElementById('app-root');
  if (!root) {
    console.error('Không tìm thấy phần tử #app-root trong index.html!');
    return;
  }

  try {
    // Tải song song tất cả các views để tối ưu hóa thời gian mở trang (chỉ tốn ~20ms trên local)
    const [authHtml, memberHtml, adminHtml] = await Promise.all([
      fetchViewHtml('auth'),
      fetchViewHtml('member'),
      fetchViewHtml('admin')
    ]);

    // Chèn vào app-root
    root.innerHTML = `
      <!-- 1. GIAO DIỆN XÁC THỰC MSSV & OTP GMAIL -->
      ${authHtml}

      <!-- 2. CỔNG THÀNH VIÊN BAN HỌC THUẬT -->
      ${memberHtml}

      <!-- 3. CỔNG QUẢN TRỊ VIÊN ADMIN -->
      ${adminHtml}
    `;

    console.log('[ViewLoader] Đã nạp thành công 3 view modules vào App Shell.');
  } catch (err) {
    console.error('[ViewLoader] Thất bại khi nạp views:', err);
    root.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-6 text-center">
        <div class="bht-card p-8 max-w-md border-hairline">
          <i class="fa-solid fa-triangle-exclamation text-warn text-3xl mb-3"></i>
          <h3 class="bht-heading-serif text-lg font-bold text-ink">Lỗi nạp thành phần giao diện</h3>
          <p class="text-xs text-ink-muted mt-2">
            Không thể tải các file giao diện con từ thư mục views/. Vui lòng kiểm tra lại Live Server hoặc đường dẫn.
          </p>
          <button data-action="reload-page" class="bht-btn bht-btn-primary bht-btn-sm mt-4">
            <i class="fa-solid fa-rotate-right mr-1"></i> Thử lại
          </button>
        </div>
      </div>
    `;
  }
}
