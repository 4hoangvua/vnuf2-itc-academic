// ====================================================================
// MODULE SKELETON SHIMMER LOADING (ACADEMIC SKELETON ENGINE)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================
// Cung cấp các khối khung giả lập tinh tế, chống Layout Shift (CLS = 0)
// khi trang web đang nạp dữ liệu từ máy chủ hoặc Google Apps Script API.
// ====================================================================

/**
 * 1. Skeleton Khung Sự kiện Tâm điểm (Spotlight Hero Bento Card 7/12)
 * Giữ nguyên chính xác tỷ lệ và bố cục của thẻ sự kiện lớn bên trái Dashboard
 */
export function renderSpotlightSkeleton() {
  return `
    <div class="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#0B0F17] via-[#07241d]/40 to-[#041a15]/40 p-5 sm:p-6 flex flex-col justify-between h-full min-h-[260px] animate-pulse">
      <!-- Ambient Blur Shimmers -->
      <div class="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div>
        <!-- Top Status Row -->
        <div class="flex flex-wrap items-center justify-between gap-2.5 mb-4">
          <div class="flex items-center gap-2">
            <div class="h-6 w-28 rounded-full bht-skeleton"></div>
            <div class="h-6 w-24 rounded-full bht-skeleton"></div>
          </div>
          <div class="h-6 w-36 rounded-full bht-skeleton hidden sm:block"></div>
        </div>

        <!-- Session Title Placeholder -->
        <div class="space-y-2.5 mb-4">
          <div class="h-7 w-3/4 rounded-lg bht-skeleton"></div>
          <div class="h-5 w-1/2 rounded-lg bht-skeleton"></div>
        </div>

        <!-- Metadata Strip Placeholder (Date + Room) -->
        <div class="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-slate-950/40 border border-white/5 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full bht-skeleton"></div>
            <div class="h-4 w-32 rounded bht-skeleton"></div>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded-full bht-skeleton"></div>
            <div class="h-4 w-40 rounded bht-skeleton"></div>
          </div>
        </div>
      </div>

      <!-- Action Footer (Buttons) -->
      <div class="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div class="h-9 w-40 rounded-lg bht-skeleton"></div>
        <div class="h-9 w-36 rounded-lg bht-skeleton"></div>
      </div>
    </div>
  `.trim();
}

/**
 * 2. Skeleton Cụm 3 Thẻ Chỉ Số KPI Học Vụ & ĐRL (Bento Stats 5/12)
 * Giữ nguyên cấu trúc 3 card bên phải: Chuyên cần, Bài tập Lab, Điểm rèn luyện
 */
export function renderDrlWidgetSkeleton() {
  return `
    <div class="flex flex-col justify-between gap-3 h-full animate-pulse">
      <!-- Thẻ 1: Chỉ số chuyên cần học vụ -->
      <div class="bht-card p-4 rounded-xl border border-hairline bg-surface/80 flex items-center justify-between gap-3">
        <div class="space-y-2 flex-1 min-w-0">
          <div class="h-3 w-32 rounded bht-skeleton"></div>
          <div class="h-5 w-44 rounded-lg bht-skeleton"></div>
          <div class="h-3 w-28 rounded bht-skeleton"></div>
        </div>
        <div class="w-12 h-12 rounded-full bht-skeleton shrink-0"></div>
      </div>

      <!-- Thẻ 2: Tiến độ bài tập Lab -->
      <div class="bht-card p-4 rounded-xl border border-hairline bg-surface/80 space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <div class="h-3 w-28 rounded bht-skeleton"></div>
            <div class="h-5 w-40 rounded-lg bht-skeleton"></div>
          </div>
          <div class="h-6 w-12 rounded-full bht-skeleton"></div>
        </div>
        <div class="h-2 w-full rounded-full bht-skeleton"></div>
        <div class="flex justify-between items-center">
          <div class="h-3 w-36 rounded bht-skeleton"></div>
          <div class="h-3 w-16 rounded bht-skeleton"></div>
        </div>
      </div>

      <!-- Thẻ 3: Điểm rèn luyện học kỳ -->
      <div class="bht-card p-4 rounded-xl border border-hairline bg-surface/80 flex items-center justify-between gap-3">
        <div class="space-y-2 flex-1 min-w-0">
          <div class="h-3 w-36 rounded bht-skeleton"></div>
          <div class="h-5 w-28 rounded-lg bht-skeleton"></div>
          <div class="h-3 w-32 rounded bht-skeleton"></div>
        </div>
        <div class="h-6 w-20 rounded-full bht-skeleton shrink-0"></div>
      </div>
    </div>
  `.trim();
}

/**
 * 3. Skeleton Bảng Nhật Ký Tham Gia Học Vụ (Audit Table Rows)
 * @param {number} [rows=4] Số dòng skeleton cần tạo
 */
export function renderAuditTableSkeleton(rows = 4) {
  return Array.from({ length: rows }).map(() => `
    <tr class="animate-pulse border-b border-hairline">
      <td class="p-3.5 pl-4 w-16">
        <div class="w-11 h-11 rounded-xl bht-skeleton"></div>
      </td>
      <td class="p-3.5">
        <div class="h-4.5 w-3/4 max-w-sm rounded-md bht-skeleton mb-2"></div>
        <div class="flex items-center gap-2">
          <div class="h-3 w-24 rounded bht-skeleton"></div>
          <div class="h-3 w-32 rounded bht-skeleton"></div>
        </div>
      </td>
      <td class="p-3.5 text-center hidden md:table-cell">
        <div class="h-5 w-24 rounded-full bht-skeleton mx-auto"></div>
      </td>
      <td class="p-3.5 text-center">
        <div class="h-5.5 w-24 rounded-full bht-skeleton mx-auto"></div>
      </td>
      <td class="p-3.5 pr-4 text-right">
        <div class="h-8 w-24 rounded-lg bht-skeleton ml-auto"></div>
      </td>
    </tr>
  `).join('');
}

/**
 * 4. Skeleton Thẻ Danh Sách Dạng Lưới (Card Skeleton)
 * Sử dụng cho: Danh sách buổi sinh hoạt (Tab 2), Nhiệm vụ bài tập, Kho học liệu (Tab 3)
 * @param {number} [count=3] Số lượng card skeleton
 */
export function renderCardSkeleton(count = 3) {
  return Array.from({ length: count }).map(() => `
    <div class="bht-card p-5 rounded-xl border border-hairline bg-surface/80 animate-pulse space-y-3.5">
      <div class="flex items-center justify-between">
        <div class="h-5 w-24 rounded-full bht-skeleton"></div>
        <div class="h-4 w-20 rounded bht-skeleton"></div>
      </div>
      <div class="h-6 w-4/5 rounded-lg bht-skeleton"></div>
      <div class="space-y-1.5">
        <div class="h-3.5 w-full rounded bht-skeleton"></div>
        <div class="h-3.5 w-2/3 rounded bht-skeleton"></div>
      </div>
      <div class="pt-3 border-t border-hairline flex items-center justify-between">
        <div class="h-4 w-28 rounded bht-skeleton"></div>
        <div class="h-8 w-28 rounded-lg bht-skeleton"></div>
      </div>
    </div>
  `).join('');
}

/**
 * 5. Skeleton Huy Hiệu Số Liệu Nhỏ (Stat Counter Skeleton)
 */
export function renderStatSkeleton() {
  return `<span class="inline-block h-6 w-10 rounded bht-skeleton align-middle"></span>`;
}

/**
 * 6. Skeleton Bảng Quản Trị Viên (Admin Table Rows Skeleton)
 * @param {number} [rows=5] Số dòng
 * @param {number} [cols=6] Số cột
 */
export function renderAdminTableSkeleton(rows = 5, cols = 6) {
  return Array.from({ length: rows }).map(() => `
    <tr class="animate-pulse border-b border-hairline">
      ${Array.from({ length: cols }).map((_, idx) => `
        <td class="py-3 px-4 ${idx === 0 ? 'w-28' : ''} ${idx === cols - 1 ? 'text-center' : ''}">
          <div class="h-4 ${idx === 0 ? 'w-20 font-mono' : (idx === 1 ? 'w-36' : (idx === cols - 1 ? 'w-20 mx-auto' : 'w-24'))} rounded bht-skeleton"></div>
        </td>
      `).join('')}
    </tr>
  `).join('');
}

/**
 * 7. Skeleton Tab Quản Lý Sự Kiện & Gửi Thư Hàng Loạt (Campaign Studio Skeleton)
 * Giữ nguyên chính xác cấu trúc layout của Tab Sự kiện, chỉ shimmer vùng dữ liệu động
 */
export function renderCampaignTabSkeleton() {
  return `
    <div class="space-y-6 animate-pulse max-w-7xl mx-auto">
      <!-- 1. Dãy 4 Thẻ Chiến Dịch Sự Kiện (Preset Cards) -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="h-4 w-44 rounded bht-skeleton"></div>
          <div class="h-3 w-56 rounded bht-skeleton hidden sm:block"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          ${Array.from({ length: 4 }).map(() => `
            <div class="bht-card p-4 rounded-xl border border-hairline bg-surface/80 space-y-3">
              <div class="w-8 h-8 rounded-lg bht-skeleton"></div>
              <div class="space-y-1.5">
                <div class="h-4 w-3/4 rounded bht-skeleton"></div>
                <div class="h-3 w-1/2 rounded bht-skeleton"></div>
              </div>
              <div class="pt-2 border-t border-hairline flex justify-between items-center">
                <div class="h-3 w-12 rounded bht-skeleton"></div>
                <div class="h-3 w-16 rounded bht-skeleton"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 2. Khung Cấu Hình & Mô Phỏng Thư -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Cột Trái: Lập Lịch & Soạn Thư (7 Cols) -->
        <div class="lg:col-span-7 space-y-5">
          <!-- Card Lập lịch -->
          <div class="bht-card p-5 bg-surface border border-hairline rounded-2xl space-y-4">
            <div class="h-4 w-52 rounded bht-skeleton"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div class="h-9 w-full rounded-lg bht-skeleton"></div>
              <div class="h-9 w-full rounded-lg bht-skeleton"></div>
            </div>
            <div class="h-9 w-full rounded-lg bht-skeleton"></div>
            <div class="pt-2 flex justify-between items-center">
              <div class="h-3 w-64 rounded bht-skeleton"></div>
              <div class="h-8 w-36 rounded-lg bht-skeleton"></div>
            </div>
          </div>

          <!-- Card Soạn thư -->
          <div class="bht-card p-5 bg-surface border border-hairline rounded-2xl space-y-4">
            <div class="h-4 w-56 rounded bht-skeleton"></div>
            <div class="h-9 w-full rounded-lg bht-skeleton"></div>
            <div class="h-9 w-full rounded-lg bht-skeleton"></div>
            <div class="h-36 w-full rounded-xl bht-skeleton"></div>
            <div class="flex justify-between items-center">
              <div class="h-3 w-64 rounded bht-skeleton"></div>
              <div class="h-8 w-36 rounded-lg bht-skeleton"></div>
            </div>
          </div>
        </div>

        <!-- Cột Phải: Mockup Email Live Preview (5 Cols) -->
        <div class="lg:col-span-5 space-y-3">
          <div class="flex justify-between items-center">
            <div class="h-4 w-48 rounded bht-skeleton"></div>
            <div class="h-3 w-20 rounded bht-skeleton"></div>
          </div>
          <div class="bht-card bg-surface border border-hairline rounded-2xl overflow-hidden p-4 space-y-3">
            <div class="h-14 w-full rounded-xl bht-skeleton"></div>
            <div class="h-12 w-full rounded-xl bht-skeleton"></div>
            <div class="space-y-2 py-3">
              <div class="h-3.5 w-full rounded bht-skeleton"></div>
              <div class="h-3.5 w-5/6 rounded bht-skeleton"></div>
              <div class="h-3.5 w-4/5 rounded bht-skeleton"></div>
              <div class="h-3.5 w-2/3 rounded bht-skeleton"></div>
            </div>
            <div class="h-28 w-full rounded-xl bht-skeleton"></div>
          </div>
        </div>
      </div>

      <!-- 3. Bảng Danh Sách Sinh Viên Nhận Thư -->
      <div class="bht-card bg-surface border border-hairline rounded-2xl p-5 space-y-4">
        <div class="flex justify-between items-center">
          <div class="h-4 w-60 rounded bht-skeleton"></div>
          <div class="h-7 w-28 rounded-lg bht-skeleton"></div>
        </div>
        <div class="space-y-2">
          ${Array.from({ length: 4 }).map(() => `
            <div class="h-10 w-full rounded-lg bht-skeleton"></div>
          `).join('')}
        </div>
      </div>
    </div>
  `.trim();
}

