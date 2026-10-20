/**
 * TEMPLATES PHÂN HỆ QUẢN LÝ SỰ KIỆN & GỬI EMAIL (CAMPAIGN & MAILER STUDIO)
 * Phụ trách:
 * 1. Khung chọn sự kiện & lập lịch tự động (Schedule Setup)
 * 2. Trình soạn thảo thư & xem trước trực quan (Email Live Preview)
 * 3. Thống kê & phát gửi thư hàng loạt (Bulk Dispatch Queue)
 */

import { escapeHTML } from '../../utils/dom.js';

/**
 * Render toàn bộ nội dung của Tab Sự kiện & Email trên Admin Portal
 * @param {Object} data Dữ liệu sự kiện, thành viên và cấu hình
 * @returns {string} Chuỗi HTML
 */
export function renderAdminCampaignTabContent(data = {}) {
  const {
    campaigns = [],
    activeCampaignId = 'OCT20',
    selectedCampaignId = activeCampaignId,
    members = [],
    lastDispatch = null
  } = data;

  const currentCamp = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0] || {
    id: 'OCT20',
    title: 'Hộp Quà 20/10 · Tôn Vinh Nữ Sinh VNUF2',
    subtitle: 'Dành riêng cho bóng hồng công nghệ VNUF2',
    targetAudience: 'female',
    icon: '🌸',
    startDate: '2026-10-20T00:00',
    endDate: '2026-10-21T23:59',
    emailSubject: '[VNUF2-ITC] Thân chúc bạn ngày 20/10 rực rỡ & Món quà học thuật đặc biệt 🌸',
    emailTemplate: 'Thân gửi {HoTen} (MSSV: {MSSV}),\n\nNhân ngày 20/10, Ban Học Thuật thân chúc bạn luôn xinh đẹp, tự tin và ngập tràn niềm vui!\n\nBan gửi tặng riêng bạn: {TenQua}\nMã voucher: {MaVoucher}\n\nĐăng nhập cổng {LinkWeb} để mở quà nhé!'
  };

  const isCurrentActive = (currentCamp.id === activeCampaignId && activeCampaignId !== 'NONE');

  // Danh sách các món quà trong sự kiện dạng text để chèn vào mail
  const giftsTextList = (currentCamp.gifts || []).map(g => 
    `• ${g.icon || '🎁'} ${g.title || g.shortTitle}: ${g.description || ''}`
  ).join('\n');

  // Danh sách các món quà dạng HTML cho Live Preview
  const giftsHtmlList = (currentCamp.gifts || []).map(g => `
    <div class="flex items-start gap-2.5 p-2 rounded-lg bg-surface border border-hairline/80">
      <span class="text-base shrink-0">${g.icon || '🎁'}</span>
      <div class="min-w-0 flex-1">
        <div class="font-bold text-xs text-ink">${escapeHTML(g.title || g.shortTitle)}</div>
        <div class="text-[11px] text-ink-muted leading-tight mt-0.5">${escapeHTML(g.description || '')}</div>
      </div>
    </div>
  `).join('');

  const defaultEmailTemplate = `Thân gửi {HoTen} (MSSV: {MSSV}),

Nhân dịp {TenSuKien}, Ban Học Thuật - CLB Tin học VNUF2 thân chúc bạn luôn tràn đầy niềm vui, sức khỏe và đạt nhiều kết quả học tập xuất sắc!

🎁 Ban gửi tặng riêng bạn một Hộp Quà May Mắn Bí Ẩn trên Cổng Học Thuật. Bên trong chứa những đặc quyền học thuật và phần quà bất ngờ dành riêng cho bạn đang chờ tự tay khám phá!

👉 Hãy truy cập ngay Cổng Quản Lý Học Thuật theo đường link dưới đây để tự tay bấm mở hộp quà nhé:
{LinkWeb}

Thân ái,
Ban Học Thuật - CLB Tin Học VNUF2`;

  const emailTemplateToUse = currentCamp.emailTemplate || defaultEmailTemplate;

  // Lọc danh sách thành viên theo targetAudience của chiến dịch đang chọn
  const isFemaleTarget = (currentCamp.targetAudience === 'female');
  const targetMembers = members.filter(m => {
    if (isFemaleTarget) {
      return String(m.Sex || '').trim().toLowerCase() === 'female';
    }
    return true;
  });

  const validEmailMembers = targetMembers.filter(m => m.Email && String(m.Email).includes('@'));
  const missingEmailMembers = targetMembers.filter(m => !m.Email || !String(m.Email).includes('@'));

  // Mẫu xem trước email dựa trên thành viên đầu tiên
  const sampleMember = validEmailMembers[0] || targetMembers[0] || {
    HoTen: 'Nguyễn Thu Trang',
    MSSV: '2251120002',
    Email: 'thutrang.cntt@vnuf2.edu.vn'
  };

  const currentWebOrigin = (typeof window !== 'undefined' && window.location && window.location.origin) 
    ? (window.location.origin + window.location.pathname) 
    : 'https://vnuf2-itc.edu.vn/app';
  const webLink = currentCamp.webLink || currentWebOrigin;

  const previewSubject = (currentCamp.emailSubject || `[VNUF2-ITC] Thân chúc bạn ngày ${currentCamp.title} & Món quà học thuật đặc biệt 🌸`)
    .replace(/\{HoTen\}/g, sampleMember.HoTen)
    .replace(/\{MSSV\}/g, sampleMember.MSSV)
    .replace(/\{TenSuKien\}/g, currentCamp.title);

  const previewBodyFormatted = emailTemplateToUse
    .replace(/\{HoTen\}/g, `<strong>${escapeHTML(sampleMember.HoTen)}</strong>`)
    .replace(/\{MSSV\}/g, `<code class="font-mono text-accent font-semibold">${escapeHTML(sampleMember.MSSV)}</code>`)
    .replace(/\{TenSuKien\}/g, `<strong>${escapeHTML(currentCamp.title)}</strong>`)
    .replace(/\{LinkWeb\}/g, `<a href="${escapeHTML(webLink)}" target="_blank" rel="noopener noreferrer" class="text-accent underline font-mono break-all">${escapeHTML(webLink)}</a>`)
    .replace(/\n/g, '<br>');

  return `
    <div class="space-y-6 animate-fade-in max-w-7xl mx-auto">
      
      <!-- 1. HEADER SECTION -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-hairline shadow-xs">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-soft text-accent border border-accent/20">
              <i class="fa-solid fa-wand-magic-sparkles text-[11px]"></i>
              <span>Trung Tâm Chiến Dịch & Lễ Hội</span>
            </span>
            ${isCurrentActive ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Đang Bật Trên Toàn Hệ Thống</span>
              </span>
            ` : (
              activeCampaignId === 'NONE' ? `
                <span class="text-xs text-ink-muted font-mono">(Hệ thống đang ở giao diện thường)</span>
              ` : `
                <span class="text-xs text-ink-muted font-mono">(Chiến dịch đang chạy: ${escapeHTML(activeCampaignId)})</span>
              `
            )}
          </div>
          <h2 class="bht-heading-serif text-xl sm:text-2xl font-bold text-ink">
            Quản Lý Sự Kiện & Gửi Thư Tự Động (Mailer Studio)
          </h2>
          <p class="text-xs sm:text-sm text-ink-muted max-w-3xl leading-relaxed">
            Thiết lập hiệu ứng lễ hội, cài đặt hẹn giờ kích hoạt tự động theo ngày/giờ và gửi thư chúc mừng kèm thẻ quà tặng độc quyền tới hộp thư sinh viên.
          </p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button 
            type="button" 
            data-action="select-admin-campaign" 
            data-campaign-id="NONE" 
            class="bht-btn ${activeCampaignId === 'NONE' ? 'bht-btn-secondary border-accent text-accent font-bold' : 'bht-btn-secondary text-ink-muted'} text-xs py-2 px-3.5"
            title="Đưa toàn bộ cổng về giao diện học thuật tiêu chuẩn"
          >
            <i class="fa-solid fa-power-off mr-1.5 text-xs"></i>
            <span>Tắt Sự Kiện</span>
          </button>
        </div>
      </div>

      <!-- 2. DANH SÁCH SỰ KIỆN MẪU (PRESET CARDS) -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-layer-group text-accent"></i>
            <span>1. Chọn Chiến Dịch Sự Kiện</span>
          </h3>
          <span class="text-xs text-ink-muted">Bấm vào thẻ để chọn và chỉnh sửa cấu hình</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          ${campaigns.map(camp => {
            const isSelected = (camp.id === currentCamp.id);
            const isActiveSystem = (camp.id === activeCampaignId && activeCampaignId !== 'NONE');
            return `
              <div 
                data-action="select-admin-campaign" 
                data-campaign-id="${camp.id}" 
                class="bht-card p-4 rounded-xl cursor-pointer transition-all border relative overflow-hidden flex flex-col justify-between select-none ${
                  isSelected 
                    ? 'border-accent ring-2 ring-accent/30 bg-accent-soft/20 shadow-sm' 
                    : 'border-hairline hover:border-accent/40 hover:bg-subtle/50'
                }"
              >
                ${isActiveSystem ? `
                  <div class="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                    Đang chạy
                  </div>
                ` : ''}

                <div class="space-y-2">
                  <div class="text-2xl">${camp.icon}</div>
                  <div>
                    <h4 class="font-bold text-sm text-ink leading-snug">${escapeHTML(camp.title)}</h4>
                    <p class="text-xs text-ink-muted mt-0.5 line-clamp-2">${escapeHTML(camp.subtitle)}</p>
                  </div>
                </div>

                <div class="pt-3 mt-3 border-t border-hairline/60 flex items-center justify-between text-[11px]">
                  <span class="text-ink-faint font-mono uppercase">${camp.id}</span>
                  <span class="inline-flex items-center gap-1 font-semibold ${camp.targetAudience === 'female' ? 'text-rose-500' : 'text-accent'}">
                    <i class="fa-solid ${camp.targetAudience === 'female' ? 'fa-venus' : 'fa-users'} text-[10px]"></i>
                    <span>${camp.targetAudience === 'female' ? 'Chỉ Nữ Sinh' : 'Toàn Bộ CLB'}</span>
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 3. KHUNG LẬP LỊCH & BỘ SOẠN THẢO THƯ (SCHEDULER & EMAIL STUDIO) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- CỘT TRÁI: FORM CẤU HÌNH & SOẠN THẢO THƯ (7 COLS) -->
        <div class="lg:col-span-7 space-y-5">
          
          <!-- KHỐI LẬP LỊCH (AUTO SCHEDULER) -->
          <div class="bht-card p-5 bg-surface border border-hairline rounded-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-hairline">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-clock text-accent"></i>
                <h4 class="font-bold text-sm text-ink uppercase tracking-wider">
                  2. Lịch Trình Tự Động: ${escapeHTML(currentCamp.title)}
                </h4>
              </div>
              <span class="text-xs text-ink-muted font-mono">${currentCamp.id}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div class="space-y-1.5">
                <label for="admin-campaign-start-time" class="text-xs font-semibold text-ink flex items-center gap-1">
                  <span>Thời gian bắt đầu:</span>
                  <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="datetime-local" 
                  id="admin-campaign-start-time" 
                  value="${escapeHTML(currentCamp.startDate || '2026-10-20T00:00')}"
                  class="bht-input w-full text-xs font-mono"
                >
              </div>

              <div class="space-y-1.5">
                <label for="admin-campaign-end-time" class="text-xs font-semibold text-ink flex items-center gap-1">
                  <span>Thời gian kết thúc:</span>
                  <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="datetime-local" 
                  id="admin-campaign-end-time" 
                  value="${escapeHTML(currentCamp.endDate || '2026-10-21T23:59')}"
                  class="bht-input w-full text-xs font-mono"
                >
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="admin-campaign-target-audience" class="text-xs font-semibold text-ink">
                Đối tượng hiển thị & nhận quà:
              </label>
              <select id="admin-campaign-target-audience" class="bht-select w-full text-xs">
                <option value="female" ${currentCamp.targetAudience === 'female' ? 'selected' : ''}>Chỉ dành riêng cho thành viên Nữ (20/10, 8/3)</option>
                <option value="all" ${currentCamp.targetAudience === 'all' ? 'selected' : ''}>Tất cả thành viên CLB (Tết, Sinh nhật CLB, Giáng sinh)</option>
              </select>
            </div>

            <div class="pt-2 flex items-center justify-between gap-3">
              <span class="text-[11px] text-ink-muted">
                💡 Hệ thống tự động so sánh giờ hiện tại để bật/tắt banner mà không cần thao tác tay.
              </span>
              <button 
                type="button" 
                data-action="save-campaign-schedule" 
                data-campaign-id="${currentCamp.id}"
                class="bht-btn bht-btn-primary text-xs py-2 px-4 shadow-sm shrink-0"
              >
                <i class="fa-solid fa-floppy-disk mr-1.5 text-xs"></i>
                <span>Lưu & Kích Hoạt Lịch</span>
              </button>
            </div>
          </div>

          <!-- KHỐI SOẠN THẢO THƯ (EMAIL EDITOR) -->
          <div class="bht-card p-5 bg-surface border border-hairline rounded-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-hairline">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-envelope-open-text text-accent"></i>
                <h4 class="font-bold text-sm text-ink uppercase tracking-wider">
                  3. Soạn Nội Dung Email Gửi Sinh Viên
                </h4>
              </div>
              <span class="text-xs text-ink-muted">Hỗ trợ cá nhân hóa</span>
            </div>

            <div class="space-y-1.5">
              <label for="admin-campaign-email-subject" class="text-xs font-semibold text-ink flex items-center justify-between">
                <span>Tiêu đề Email (Subject):</span>
                <span class="text-[11px] text-ink-muted font-normal">Hỗ trợ {HoTen}, {MSSV}</span>
              </label>
              <input 
                type="text" 
                id="admin-campaign-email-subject" 
                value="${escapeHTML(currentCamp.emailSubject || '')}" 
                placeholder="[VNUF2-ITC] Thân chúc mừng bạn..." 
                class="bht-input w-full text-xs font-medium"
              >
            </div>

            <div class="space-y-1.5">
              <label for="admin-campaign-web-link" class="text-xs font-semibold text-ink flex items-center justify-between">
                <span>Đường Dẫn Cổng Mở Quà ({LinkWeb}):</span>
                <span class="text-[11px] text-ink-muted font-normal">Tùy biến URL (không hardcode)</span>
              </label>
              <input 
                type="url" 
                id="admin-campaign-web-link" 
                value="${escapeHTML(webLink)}" 
                placeholder="https://vnuf2-itc.edu.vn/app" 
                class="bht-input w-full text-xs font-mono"
              >
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="admin-campaign-email-body" class="text-xs font-semibold text-ink">
                  Nội dung thư chúc mừng:
                </label>
                <div class="flex items-center gap-1 flex-wrap">
                  <span class="text-[10px] text-ink-muted mr-1">Chèn nhanh:</span>
                  <button type="button" data-action="insert-campaign-email-tag" data-tag="{HoTen}" class="bht-btn bht-btn-ghost text-[10px] py-0.5 px-1.5 border border-hairline">+{HoTen}</button>
                  <button type="button" data-action="insert-campaign-email-tag" data-tag="{MSSV}" class="bht-btn bht-btn-ghost text-[10px] py-0.5 px-1.5 border border-hairline">+{MSSV}</button>
                  <button type="button" data-action="insert-campaign-email-tag" data-tag="{TenSuKien}" class="bht-btn bht-btn-ghost text-[10px] py-0.5 px-1.5 border border-hairline">+{TenSuKien}</button>
                  <button type="button" data-action="insert-campaign-email-tag" data-tag="{LinkWeb}" class="bht-btn bht-btn-ghost text-[10px] py-0.5 px-1.5 border border-hairline">+{LinkWeb}</button>
                </div>
              </div>

              <textarea 
                id="admin-campaign-email-body" 
                rows="8" 
                class="bht-textarea w-full text-xs font-sans leading-relaxed"
                placeholder="Nhập nội dung thư chúc mừng..."
              >${escapeHTML(emailTemplateToUse)}</textarea>
            </div>

            <div class="flex items-center justify-between pt-1">
              <span class="text-[11px] text-ink-muted">
                💡 Sử dụng Emoji Unicode thật (🎁, 🌸, 👉, ✨...) để Gmail và điện thoại hiển thị chuẩn 100%.
              </span>
              <button 
                type="button" 
                data-action="update-campaign-email-preview" 
                class="bht-btn bht-btn-secondary text-xs py-1.5 px-3"
              >
                <i class="fa-solid fa-eye mr-1 text-xs text-accent"></i>
                <span>Cập Nhật Xem Trước</span>
              </button>
            </div>
          </div>
        </div>

        <!-- CỘT PHẢI: KHUNG XEM TRƯỚC GIAO DIỆN THƯ GỬI ĐẾN (5 COLS) -->
        <div class="lg:col-span-5 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-desktop text-accent"></i>
              <span>4. Mô Phỏng Hộp Thư Của Sinh Viên</span>
            </h3>
            <span class="text-xs text-ink-muted">Live Preview</span>
          </div>

          <!-- MOCKUP EMAIL CLIENT (CHỐNG LỖI CSS BẰNG HAIRLINE BORDERS) -->
          <div class="bht-card bg-surface border border-hairline rounded-2xl overflow-hidden shadow-xs flex flex-col">
            <!-- Email Header Bar -->
            <div class="p-3.5 bg-subtle/70 border-b border-hairline space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-ink-muted font-medium">Từ:</span>
                <span class="font-semibold text-ink truncate text-[11px]">Ban Học Thuật VNUF2 &lt;itc.vnuf2@gmail.com&gt;</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-ink-muted font-medium">Đến:</span>
                <span class="font-mono text-accent truncate text-[11px]">${escapeHTML(sampleMember.HoTen)} &lt;${escapeHTML(sampleMember.Email || 'thutrang@vnuf2.edu.vn')}&gt;</span>
              </div>
              <div class="pt-1 border-t border-hairline/60">
                <div id="email-preview-subject" class="font-bold text-xs sm:text-sm text-ink leading-snug">
                  ${escapeHTML(previewSubject)}
                </div>
              </div>
            </div>

            <!-- Email Body Content -->
            <div class="p-5 space-y-4 text-xs leading-relaxed bg-surface">
              <!-- Banner thư VNUF2 -->
              <div class="p-3 rounded-xl bg-gradient-to-r from-teal-500/10 via-accent/5 to-transparent border border-accent/20 flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-accent text-accent-fg flex items-center justify-center text-lg font-bold shrink-0">
                  ${currentCamp.icon}
                </div>
                <div>
                  <h5 class="font-bold text-xs text-ink uppercase tracking-wider">CLB Tin Học VNUF2</h5>
                  <p class="text-[11px] text-ink-muted">Ban Học Thuật · Thông Báo Sự Kiện Học Thuật</p>
                </div>
              </div>

              <!-- Nội dung văn bản -->
              <div id="email-preview-body" class="text-ink space-y-2 text-xs leading-relaxed">
                ${previewBodyFormatted}
              </div>

              <!-- Hộp Kêu Gọi Vào Cổng Tự Mở Quà (Không phơi trước mã) -->
              <div class="p-4 rounded-xl border border-dashed border-accent/40 bg-accent-soft/30 space-y-2.5 text-center">
                <div class="text-3xl animate-bounce">🎁</div>
                <div class="font-bold text-sm text-ink">Hộp Quà May Mắn Đang Chờ Bạn Tự Mở!</div>
                <p class="text-[11px] text-ink-muted max-w-xs mx-auto leading-relaxed">
                  Mỗi thành viên sẽ được hệ thống sinh ngẫu nhiên một đặc quyền cố định khi bạn bấm mở quà trực tiếp trên website.
                </p>
                <div class="pt-1">
                  <a 
                    id="email-preview-cta-btn"
                    href="${escapeHTML(webLink)}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style="background-color: #0F6256; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px;"
                  >
                    👉 Vào Cổng Để Tự Tay Bấm Mở Quà Ngay
                  </a>
                </div>
              </div>

              <div class="pt-3 border-t border-hairline text-center text-[10px] text-ink-faint">
                Email này được gửi tự động từ Hệ thống Quản trị Ban Học Thuật CLB Tin học VNUF2.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. THỐNG KÊ DANH SÁCH & PHÁT GỬI HÀNG LOẠT (BULK DISPATCH QUEUE) -->
      <div class="bht-card p-5 sm:p-6 bg-surface border border-hairline rounded-2xl space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-hairline">
          <div>
            <h3 class="bht-heading-serif text-base sm:text-lg font-bold text-ink flex items-center gap-2">
              <i class="fa-solid fa-paper-plane text-accent"></i>
              <span>5. Danh Sách Phát Thư Hàng Loạt (Bulk Dispatch Queue)</span>
            </h3>
            <p class="text-xs text-ink-muted mt-0.5">
              Hệ thống lọc tự động danh sách thành viên hợp lệ và tạo mã voucher đặc quyền cho từng người.
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button 
              type="button" 
              data-action="dispatch-campaign-bulk-email" 
              data-campaign-id="${currentCamp.id}"
              class="bht-btn bht-btn-primary font-bold text-xs py-2 px-4 shadow-md bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-0"
              ${validEmailMembers.length === 0 ? 'disabled' : ''}
            >
              <i class="fa-solid fa-paper-plane mr-1.5 text-xs"></i>
              <span>Gửi Email Tới ${validEmailMembers.length} Thành Viên</span>
            </button>
          </div>
        </div>

        <!-- THẺ THỐNG KÊ NHANH -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-3.5 rounded-xl bg-subtle/50 border border-hairline flex items-center justify-between">
            <div>
              <span class="text-[11px] text-ink-muted font-medium">Tổng đối tượng nhận:</span>
              <div class="text-xl font-bold font-mono text-ink mt-0.5">${targetMembers.length}</div>
            </div>
            <div class="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-users"></i>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Đã có Email (Sẵn sàng gửi):</span>
              <div class="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">${validEmailMembers.length}</div>
            </div>
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-check"></i>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
            <div>
              <span class="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Chưa cập nhật Email:</span>
              <div class="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">${missingEmailMembers.length}</div>
            </div>
            <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
        </div>

        <!-- BẢNG DANH SÁCH THÀNH VIÊN NHẬN THƯ -->
        <div class="overflow-x-auto rounded-xl border border-hairline">
          <table class="w-full text-left text-xs">
            <thead class="bg-subtle/60 text-ink-muted uppercase text-[11px] border-b border-hairline">
              <tr>
                <th class="py-2.5 px-3.5 text-center w-12">STT</th>
                <th class="py-2.5 px-3.5">Họ và Tên</th>
                <th class="py-2.5 px-3.5 hidden sm:table-cell">MSSV</th>
                <th class="py-2.5 px-3.5">Email Nhận Thư</th>
                <th class="py-2.5 px-3.5 hidden md:table-cell">Cơ Chế Nhận Quà</th>
                <th class="py-2.5 px-3.5 text-center">Trạng Thái Email</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline/60">
              ${targetMembers.map((m, idx) => {
                const hasMail = m.Email && String(m.Email).includes('@');
                const giftsCount = (currentCamp.gifts && currentCamp.gifts.length) ? currentCamp.gifts.length : 3;
                return `
                  <tr class="hover:bg-subtle/30 transition-colors">
                    <td class="py-2.5 px-3.5 text-center font-mono text-ink-muted">${idx + 1}</td>
                    <td class="py-2.5 px-3.5 font-semibold text-ink">${escapeHTML(m.HoTen)}</td>
                    <td class="py-2.5 px-3.5 font-mono text-ink-muted hidden sm:table-cell">${escapeHTML(m.MSSV)}</td>
                    <td class="py-2.5 px-3.5 font-mono text-xs">
                      ${hasMail 
                        ? `<span class="text-ink">${escapeHTML(m.Email)}</span>` 
                        : `<span class="text-amber-500 italic">(Chưa có email)</span>`}
                    </td>
                    <td class="py-2.5 px-3.5 hidden md:table-cell text-xs">
                      <span class="inline-flex items-center gap-1.5 font-medium text-accent text-[11px] bg-accent-soft px-2 py-0.5 rounded-full">
                        <i class="fa-solid fa-gift text-accent"></i>
                        <span>Tự mở trên Web (${giftsCount} món)</span>
                      </span>
                    </td>
                    <td class="py-2.5 px-3.5 text-center">
                      ${hasMail 
                        ? `<span class="bht-badge bht-badge-ok text-[10px] py-0.5 px-2">Sẵn sàng</span>` 
                        : `<span class="bht-badge bht-badge-warn text-[10px] py-0.5 px-2">Thiếu mail</span>`}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${lastDispatch ? `
          <div class="p-3.5 rounded-xl bg-accent-soft/40 border border-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-circle-check text-accent text-sm"></i>
              <span>Đợt phát gửi gần nhất: <strong class="text-ink">${lastDispatch.sentCount} email thành công</strong> vào lúc <span class="font-mono">${new Date(lastDispatch.dispatchedAt).toLocaleString('vi-VN')}</span>.</span>
            </div>
            <span class="bht-badge-mono text-[10px] bg-surface text-ink-muted px-2 py-0.5 rounded border border-hairline">Chiến dịch: ${escapeHTML(lastDispatch.campaignId)}</span>
          </div>
        ` : ''}

      </div>

    </div>
  `;
}
