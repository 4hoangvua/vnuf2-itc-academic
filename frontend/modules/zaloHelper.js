/**
 * MODULE HỖ TRỢ XỬ LÝ TRÌNH DUYỆT NỘI BỘ ZALO (ZALO IN-APP BROWSER HELPER)
 * Ban Học Thuật - CLB Tin Học VNUF2
 * 
 * Vấn đề: Zalo trên điện thoại (Android & iPhone) tự mở web bằng In-App WebView.
 * WebView này hoạt động trong Sandbox riêng, không lưu được phiên đăng nhập lâu dài
 * khi thoát ứng dụng hoặc mở lại từ trình duyệt ngoài.
 * 
 * Giải pháp tối ưu:
 * 1. Trên Android: Tự động kích hoạt Android Chrome Intent Scheme để bật Google Chrome thật.
 * 2. Trên iPhone (iOS): Hiển thị Smart Banner thanh lịch hướng dẫn bấm nút [...] góc trên
 *    bên phải để chọn "Mở bằng trình duyệt" (Safari), kèm nút sao chép link nhanh.
 * 3. Trên PC: Bỏ qua hoàn toàn vì Zalo PC tự động mở bằng Chrome/Edge mặc định.
 */

import { showToast } from './ui.js';

/**
 * Kiểm tra xem người dùng có đang truy cập bằng Zalo trên thiết bị di động hay không
 * @returns {{ isZalo: boolean, isAndroid: boolean, isIOS: boolean }}
 */
export function detectZaloEnvironment() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isZalo: false, isAndroid: false, isIOS: false };
  }

  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isZalo = /Zalo/i.test(ua) || /ZaloTheme/i.test(ua);

  return { isZalo, isAndroid, isIOS };
}

/**
 * Tạo URL Android Intent để ép mở bằng Chrome ngoài
 * @param {string} url 
 * @returns {string}
 */
export function buildAndroidChromeIntent(url) {
  const clean = (url || window.location.href).replace(/^https?:\/\//i, '');
  return `intent://${clean}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end;`;
}

/**
 * Khởi tạo hỗ trợ và hiển thị hướng dẫn khi phát hiện Zalo trên Mobile
 */
export function initZaloInAppNotice() {
  const { isZalo, isAndroid, isIOS } = detectZaloEnvironment();

  // Trên PC hoặc trình duyệt thông thường thì bỏ qua hoàn toàn
  if (!isZalo || (!isAndroid && !isIOS)) {
    return;
  }

  // 1. Xử lý cho Android: Tự động thử bật Chrome qua Intent Scheme
  if (isAndroid) {
    try {
      const intentUrl = buildAndroidChromeIntent();
      const hasTriggered = sessionStorage.getItem('bht_zalo_intent_done');
      if (!hasTriggered) {
        sessionStorage.setItem('bht_zalo_intent_done', 'true');
        // Kích hoạt redirect ra ngoài Chrome
        window.location.href = intentUrl;
      }
    } catch (e) {
      console.warn('[ZaloHelper] Lỗi khi kích hoạt Android Intent:', e);
    }
  }

  // Kiểm tra nếu người dùng đã bấm ẩn banner trong phiên này thì không làm phiền
  if (sessionStorage.getItem('bht_zalo_banner_dismissed') === 'true') {
    return;
  }

  // 2. Render Smart Floating Banner hướng dẫn ở đầu trang
  renderZaloGuideBanner(isIOS);
}

/**
 * Render thanh banner hướng dẫn mở Safari / Chrome
 * @param {boolean} isIOS 
 */
function renderZaloGuideBanner(isIOS) {
  if (document.getElementById('zalo-inapp-banner')) return;

  const currentUrl = window.location.href;
  const cleanUrl = currentUrl.replace(/^https?:\/\//i, '');
  const targetBrowserName = isIOS ? 'Safari' : 'Chrome';

  const bannerEl = document.createElement('div');
  bannerEl.id = 'zalo-inapp-banner';
  bannerEl.className = 'fixed top-0 left-0 right-0 z-[99999] bg-[#0E1110]/95 text-slate-100 backdrop-blur-md border-b border-teal-500/30 p-3 sm:p-4 shadow-2xl animate-fade-in font-sans';
  
  bannerEl.innerHTML = `
    <div class="max-w-2xl mx-auto flex flex-col gap-2.5">
      <!-- Dòng tiêu đề & Mũi tên chỉ dẫn -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center text-sm font-bold shrink-0">
            <i class="fa-solid ${isIOS ? 'fa-compass' : 'fa-globe'}"></i>
          </span>
          <div>
            <h4 class="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
              <span>Mở bằng ${targetBrowserName} để lưu đăng nhập</span>
            </h4>
            <p class="text-[11px] sm:text-xs text-slate-300 leading-snug mt-0.5">
              Bấm dấu <strong class="text-teal-400 font-mono text-sm">···</strong> ở góc trên bên phải màn hình ↗️ rồi chọn <strong class="text-white">"Mở bằng trình duyệt"</strong> nhé!
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <!-- Mũi tên nhấp nháy chỉ lên dấu 3 chấm của Zalo -->
          <div class="w-7 h-7 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center animate-bounce text-xs font-bold" title="Nhìn lên góc trên bên phải">
            ↗
          </div>
          <button 
            type="button" 
            data-action="dismiss-zalo-banner" 
            class="text-slate-400 hover:text-white p-1 text-sm ml-1"
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Thanh nút bấm thao tác nhanh -->
      <div class="flex items-center gap-2 pt-1 border-t border-white/5 flex-wrap">
        <button 
          type="button" 
          data-action="copy-zalo-link" 
          class="bht-btn bht-btn-secondary text-[11px] py-1 px-2.5 rounded-lg border-teal-500/30 text-teal-300 hover:bg-teal-500/10"
        >
          <i class="fa-regular fa-copy mr-1 text-[10px]"></i>
          <span>Sao Chép Link</span>
        </button>

        ${!isIOS ? `
          <a 
            href="${buildAndroidChromeIntent()}" 
            class="bht-btn bht-btn-primary text-[11px] py-1 px-3 rounded-lg"
          >
            <i class="fa-brands fa-chrome mr-1 text-[10px]"></i>
            <span>Mở Ngoài Chrome</span>
          </a>
        ` : `
          <a 
            href="googlechrome://${cleanUrl}" 
            class="bht-btn bht-btn-ghost text-[11px] py-1 px-2.5 rounded-lg text-slate-300 hover:text-white"
          >
            <i class="fa-brands fa-chrome mr-1 text-[10px]"></i>
            <span>Mở Chrome (nếu có)</span>
          </a>
        `}

        <button 
          type="button" 
          data-action="dismiss-zalo-banner" 
          class="text-[11px] text-slate-400 hover:text-slate-200 underline ml-auto"
        >
          Tiếp tục tại đây
        </button>
      </div>
    </div>
  `;

  document.body.prepend(bannerEl);
}

/**
 * Xử lý khi người dùng bấm sao chép link trang để dán vào Safari/Chrome
 */
export async function handleCopyZaloLink() {
  const url = window.location.href;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const tempInput = document.createElement('input');
      tempInput.value = url;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      tempInput.remove();
    }
    showToast('Đã sao chép liên kết! Bạn hãy mở Safari/Chrome và dán vào thanh địa chỉ nhé.', 'success');
  } catch (err) {
    showToast('Không thể tự động sao chép, vui lòng copy liên kết trên thanh địa chỉ!', 'info');
  }
}

/**
 * Ẩn banner hướng dẫn và ghi nhớ để không làm phiền người dùng trong phiên
 */
export function handleDismissZaloBanner() {
  const banner = document.getElementById('zalo-inapp-banner');
  if (banner) {
    banner.remove();
  }
  try {
    sessionStorage.setItem('bht_zalo_banner_dismissed', 'true');
  } catch (e) {}
}
