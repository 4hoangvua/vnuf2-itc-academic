// ====================================================================
// MODULE QUÀ TẶNG & EASTER EGG 20/10 (ACADEMIC 20/10 GIFT MODULE)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================
// Hỗ trợ:
// 1. Nhận diện thành viên Nữ chính xác (Sex === 'female' hoặc phân tích tên đệm)
// 2. Thuật toán Deterministic Gift (Hash theo MSSV) - Cố định 1 món quà duy nhất
//    dù đăng nhập trên điện thoại, máy tính cá nhân hay phòng máy trường.
// 3. Đồng bộ đa thiết bị tức thì qua Google Apps Script API + Cache LocalStorage.
// ====================================================================

import { saveMemberGift } from '../services/api.js';
import { appState, showToast, escapeHtml } from './ui.js';
import { escapeHTML } from '../utils/dom.js';

/**
 * Danh sách 3 phần quà học thuật đặc quyền 20/10
 */
export const ACADEMIC_GIFTS_2010 = [
  {
    id: 'DEADLINE_24H',
    giftId: 'DEADLINE_24H',
    title: '🎫 Thẻ Gia Hạn Deadline (+24h nộp bài tập không trừ điểm)',
    shortTitle: 'Gia Hạn Deadline (+24h)',
    icon: 'fa-solid fa-clock-rotate-left',
    iconColor: 'text-emerald-500',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    description: 'Đặc quyền cộng thêm 24 giờ cho một bài tập thực hành bất kỳ mà không bị tính nộp muộn.'
  },
  {
    id: 'BONUS_10PT',
    giftId: 'BONUS_10PT',
    title: '🏅 Thẻ Điểm Thưởng Học Thuật (+10 điểm vào bài tập/Quiz)',
    shortTitle: 'Điểm Thưởng (+10 điểm)',
    icon: 'fa-solid fa-award',
    iconColor: 'text-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    description: 'Cộng trực tiếp 10 điểm vào điểm số của một bài tập thực hành hoặc bài trắc nghiệm Quiz bất kỳ.'
  },
  {
    id: 'VIP_DEBUG',
    giftId: 'VIP_DEBUG',
    title: '🛠️ Thẻ VIP Debug 1-1 (Quyền gọi Ban Học thuật hỗ trợ fix bug 1-1)',
    shortTitle: 'Hỗ trợ VIP Debug 1-1',
    icon: 'fa-solid fa-wand-magic-sparkles',
    iconColor: 'text-purple-500',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    description: 'Quyền hẹn lịch hỗ trợ kỹ thuật trực tiếp 1-1 cùng ban chuyên môn để gỡ bug bài tập lớn.'
  }
];

/**
 * Danh mục các Chiến dịch Sự kiện & Đặc quyền Học thuật (Universal Campaigns Catalog)
 */
export const CAMPAIGNS_CATALOG = {
  OCT20: {
    id: 'OCT20',
    title: 'Hộp Quà 20/10 · Tôn Vinh Nữ Sinh VNUF2',
    subtitle: 'Dành riêng cho bóng hồng công nghệ VNUF2',
    targetAudience: 'female',
    icon: '🌸',
    badgeText: '20/10 • Ngày Phụ Nữ Việt Nam',
    themeClass: 'from-rose-500/10 via-pink-500/5 to-teal-500/10 border-pink-400/30 text-rose-600 dark:text-rose-300',
    btnGradient: 'from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500',
    greeting: 'Thân chúc bạn ngày 20/10 ngập tràn niềm vui & rực rỡ! 💐',
    bannerDesc: 'Ban Học thuật CLB Tin học VNUF2 chúc bạn luôn xinh đẹp, tự tin, đam mê công nghệ và gặt hái thật nhiều thành tựu xuất sắc. Ban gửi tặng bạn một hộp quà học thuật đặc biệt nhân ngày hôm nay!',
    maleReminder: 'Hôm nay là Ngày Phụ nữ Việt Nam 20/10. Hãy gửi những lời chúc tốt đẹp nhất tới cô giáo, các bạn nữ và những người phụ nữ yêu thương nhé! 💐',
    cornerIcon: '🌸',
    gifts: ACADEMIC_GIFTS_2010
  },
  TET: {
    id: 'TET',
    title: 'Lì Xì Học Thuật Khai Xuân VNUF2',
    subtitle: 'Khai xuân như ý · Lộc mã vinh quy',
    targetAudience: 'all',
    icon: '🧧',
    badgeText: 'Tết Nguyên Đán • Lì Xì Khai Xuân',
    themeClass: 'from-red-500/15 via-amber-500/10 to-yellow-500/10 border-red-400/40 text-red-600 dark:text-amber-400',
    btnGradient: 'from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500',
    greeting: 'Khai xuân như ý, code mượt không bug, GPA xuất sắc và gặt hái nhiều thành công rực rỡ! 🧧',
    bannerDesc: 'Ban Học Thuật chúc mừng năm mới! Ban gửi tặng toàn thể thành viên bao lì xì học thuật lấy may đầu xuân.',
    maleReminder: '',
    cornerIcon: '🧧',
    gifts: [
      {
        id: 'BONUS_15PT',
        giftId: 'BONUS_15PT',
        title: '🧧 Lì Xì May Mắn +15 Điểm Học Thuật',
        shortTitle: 'Lì Xì +15 Điểm',
        icon: 'fa-solid fa-coins',
        iconColor: 'text-amber-500',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        description: 'Cộng trực tiếp 15 điểm vào bài thi trắc nghiệm hoặc bài tập thực hành đầu xuân.'
      },
      {
        id: 'DEADLINE_48H',
        giftId: 'DEADLINE_48H',
        title: '🎫 Thẻ Du Xuân Gia Hạn Deadline (+48h)',
        shortTitle: 'Gia Hạn Du Xuân (+48h)',
        icon: 'fa-regular fa-calendar-plus',
        iconColor: 'text-emerald-500',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        description: 'Thoải mái du xuân! Tự động bảo lưu tính đúng hạn khi nộp bài muộn đến 48 giờ.'
      },
      {
        id: 'VIP_DEBUG_TET',
        giftId: 'VIP_DEBUG_TET',
        title: '🛠️ Vé Khai Xuân Debug 1-1 Cùng Trưởng Ban',
        shortTitle: 'Khai Xuân Debug 1-1',
        icon: 'fa-solid fa-laptop-code',
        iconColor: 'text-red-500',
        badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        description: '1 suất hỗ trợ review kiến trúc đồ án và debug chuyên sâu đầu năm.'
      }
    ]
  },
  MARCH8: {
    id: 'MARCH8',
    title: 'Hộp Quà 8/3 · Ngày Quốc Tế Phụ Nữ',
    subtitle: 'Tôn vinh bóng hồng công nghệ Ban Học Thuật',
    targetAudience: 'female',
    icon: '🌷',
    badgeText: '8/3 • Ngày Quốc Tế Phụ Nữ',
    themeClass: 'from-purple-500/10 via-pink-500/5 to-rose-500/10 border-purple-400/30 text-purple-600 dark:text-purple-300',
    btnGradient: 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500',
    greeting: 'Chúc bạn ngày 8/3 rạng rỡ, tự tin, hạnh phúc và gặt hái thật nhiều thành tựu lập trình! 🌷',
    bannerDesc: 'Ban Học thuật CLB Tin học VNUF2 gửi tặng bạn hộp quà 8/3 với các đặc quyền học thuật ngọt ngào.',
    maleReminder: 'Hôm nay là Ngày Quốc tế Phụ Nữ 8/3. Đừng quên gửi lời chúc tới những người phụ nữ tuyệt vời nhé! 💐',
    cornerIcon: '🌷',
    gifts: ACADEMIC_GIFTS_2010
  },
  ANNIVERSARY: {
    id: 'ANNIVERSARY',
    title: 'Quà Tri Ân Sinh Nhật CLB Tin Học VNUF2',
    subtitle: 'Tự hào truyền thống học thuật & sáng tạo',
    targetAudience: 'all',
    icon: '🎂',
    badgeText: 'Sinh Nhật CLB Tin Học VNUF2',
    themeClass: 'from-teal-500/10 via-cyan-500/5 to-blue-500/10 border-teal-400/30 text-teal-600 dark:text-teal-300',
    btnGradient: 'from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500',
    greeting: 'Chào mừng sinh nhật CLB Tin Học VNUF2! Chúc toàn thể thành viên luôn giữ vững ngọn lửa đam mê! 🎂',
    bannerDesc: 'Ban gửi tặng toàn bộ thành viên hộp quà tri ân đặc biệt nhân ngày sinh nhật CLB!',
    maleReminder: '',
    cornerIcon: '🎂',
    gifts: [
      {
        id: 'BONUS_10PT_ANNI',
        giftId: 'BONUS_10PT_ANNI',
        title: '🏅 Voucher Sinh Nhật +10 Điểm Học Thuật',
        shortTitle: 'Voucher +10 Điểm',
        icon: 'fa-solid fa-award',
        iconColor: 'text-teal-500',
        badgeClass: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
        description: 'Cộng trực tiếp 10 điểm vào kết quả trắc nghiệm hoặc bài tập thực hành.'
      },
      {
        id: 'DEADLINE_24H_ANNI',
        giftId: 'DEADLINE_24H_ANNI',
        title: '🎫 Thẻ Sinh Nhật Gia Hạn Deadline (+24h)',
        shortTitle: 'Gia Hạn Deadline (+24h)',
        icon: 'fa-regular fa-clock',
        iconColor: 'text-emerald-500',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        description: 'Bảo lưu tính đúng hạn khi nộp bài muộn tối đa 24 giờ.'
      },
      {
        id: 'STREAK_SHIELD_3D',
        giftId: 'STREAK_SHIELD_3D',
        title: '🛡️ Khiên Bảo Toàn Chuỗi Học Tập (3 Ngày)',
        shortTitle: 'Khiên Streak 3 Ngày',
        icon: 'fa-solid fa-shield-heart',
        iconColor: 'text-indigo-500',
        badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        description: 'Tự động bảo vệ chuỗi ngày làm bài trắc nghiệm liên tục (Streak) nếu bạn lỡ quên 1-3 ngày.'
      }
    ]
  }
};

/**
 * Lấy ID chiến dịch sự kiện đang kích hoạt
 * @returns {string} OCT20 | TET | MARCH8 | ANNIVERSARY | NONE
 */
export function getActiveCampaignId() {
  if (typeof localStorage !== 'undefined') {
    const storeStr = localStorage.getItem('bht_mock_store');
    if (storeStr) {
      try {
        const parsed = JSON.parse(storeStr);
        if (parsed && parsed.activeCampaignId) return parsed.activeCampaignId;
      } catch (e) {}
    }
    const localAct = localStorage.getItem('bht_active_campaign');
    if (localAct) return localAct;
  }
  return 'OCT20';
}

/**
 * Lấy đối tượng chiến dịch sự kiện đang kích hoạt
 * @returns {Object|null}
 */
export function getActiveCampaign() {
  const id = getActiveCampaignId();
  if (id === 'NONE') return null;

  // Kiểm tra thời gian bắt đầu & kết thúc nếu có cấu hình
  if (typeof localStorage !== 'undefined') {
    const storeStr = localStorage.getItem('bht_mock_store');
    if (storeStr) {
      try {
        const parsed = JSON.parse(storeStr);
        if (parsed && Array.isArray(parsed.campaigns)) {
          const match = parsed.campaigns.find(c => c.id === id);
          if (match && match.startDate && match.endDate) {
            const now = new Date().getTime();
            const start = new Date(match.startDate).getTime();
            const end = new Date(match.endDate).getTime();
            // Nếu chưa đến giờ hoặc đã quá hạn thì tự động tắt
            if (!isNaN(start) && !isNaN(end)) {
              if (now < start || now > end) {
                return null;
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  return CAMPAIGNS_CATALOG[id] || CAMPAIGNS_CATALOG.OCT20;
}

/**
 * Hàm băm chuỗi ký tự theo chuẩn 32-bit integer
 * @param {string} str Chuỗi đầu vào
 * @returns {number}
 */
export function hashString(str) {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Nhận diện thành viên Nữ dựa trên trường Sex trong Sheet ThanhVien (male / female)
 * @param {Object} user Thông tin người dùng
 * @returns {boolean}
 */
export function isFemaleMember(user) {
  if (!user) return false;
  const sex = String(user.Sex || user.sex || user.gioiTinh || user.GioiTinh || '').trim().toLowerCase();
  if (sex === 'female' || sex === 'nữ' || sex === 'nu' || sex === 'f') return true;
  const name = String(user.hoTen || user.HoTen || '').toLowerCase();
  if (name.includes('thị') || name.includes('thi') || name.includes('trang') || name.includes('ngọc') || name.includes('nguyên') || name.includes('nguyen') || name.includes('hương') || name.includes('anh') || name.includes('hoa') || name.includes('mai') || name.includes('linh') || name.includes('yến') || name.includes('lan')) {
    return true;
  }
  return false;
}

/**
 * Thuật toán "Deterministic Gift": Sinh quà cố định cho từng người dùng
 * Dựa trên seed: `${user.id || user.username || user.mssv}_VNUF2_ITC_20_10_2026`
 * @param {Object} user Người dùng
 * @returns {Object} Quà tặng cố định
 */
export function getDeterministicGiftForUser(user) {
  if (!user) return null;
  const identifier = String(user.id || user.username || user.mssv || user.MSSV || 'VNUF2').trim().toUpperCase();
  const seed = `${identifier}_VNUF2_ITC_20_10_2026`;
  const hash = Math.abs(hashString(seed));

  const giftIndex = hash % ACADEMIC_GIFTS_2010.length;
  const gift = ACADEMIC_GIFTS_2010[giftIndex];

  // Sinh mã nhận quà định dạng: ITC2010-XXXXX-YYY
  const part1 = (hash % 90000 + 10000).toString();
  const part2 = ((hash >> 3) % 900 + 100).toString();
  const claimCode = `ITC2010-${part1}-${part2}`;

  return {
    giftId: gift.id,
    giftTitle: gift.title,
    shortTitle: gift.shortTitle,
    icon: gift.icon,
    iconColor: gift.iconColor,
    badgeClass: gift.badgeClass,
    description: gift.description,
    claimCode: claimCode
  };
}

/**
 * Lấy quà đã nhận của người dùng (từ user object hoặc LocalStorage cache)
 * @param {Object} user Người dùng
 * @returns {Object|null}
 */
export function getClaimedGift(user) {
  if (!user) return null;
  const mssv = String(user.mssv || user.MSSV || user.id || '').trim().toUpperCase();

  // 1. Kiểm tra trong user object (từ API backend hoặc session)
  const rawGift = user.gift2010 || user.Gift2010;
  if (rawGift) {
    if (typeof rawGift === 'string' && rawGift.trim()) {
      try {
        const parsed = JSON.parse(rawGift);
        if (parsed && (parsed.claimCode || parsed.giftId)) return parsed;
      } catch (e) {}
    } else if (typeof rawGift === 'object' && (rawGift.claimCode || rawGift.giftId)) {
      return rawGift;
    }
  }

  // 2. Kiểm tra trong appState.members nếu có
  if (typeof appState !== 'undefined' && Array.isArray(appState.members) && mssv) {
    const mem = appState.members.find(m => String(m.MSSV || '').trim().toUpperCase() === mssv);
    if (mem) {
      const memRaw = mem.gift2010 || mem.Gift2010;
      if (memRaw) {
        if (typeof memRaw === 'string' && memRaw.trim()) {
          try {
            const parsed = JSON.parse(memRaw);
            if (parsed && (parsed.claimCode || parsed.giftId)) return parsed;
          } catch (e) {}
        } else if (typeof memRaw === 'object' && (memRaw.claimCode || memRaw.giftId)) {
          return memRaw;
        }
      }
    }
  }

  // 3. Kiểm tra trong LocalStorage cache
  try {
    if (typeof localStorage !== 'undefined' && mssv) {
      const cached = localStorage.getItem(`bht_gift_2010_${mssv}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.claimCode || parsed.giftId)) return parsed;
      }
    }
  } catch (e) {}

  // 4. Fallback tự động: Nếu là thành viên Nữ thì sinh quà theo thuật toán cố định
  if (isFemaleMember(user)) {
    const det = getDeterministicGiftForUser(user);
    if (det && (det.claimCode || det.giftId)) return det;
  }

  return null;
}

/**
 * Thực hiện mở quà và đồng bộ lên Backend / LocalStorage
 * @param {Object} user Người dùng
 * @returns {Promise<Object>}
 */
export async function claimGiftForUser(user) {
  if (!user) return null;
  const mssv = String(user.mssv || user.MSSV || user.id || '').trim().toUpperCase();

  // Nếu đã nhận trước đó thì trả về quà cũ
  const existing = getClaimedGift(user);
  if (existing) return existing;

  const detGift = getDeterministicGiftForUser(user);
  if (!detGift) return null;

  const giftData = {
    giftId: detGift.giftId,
    giftTitle: detGift.giftTitle,
    shortTitle: detGift.shortTitle,
    claimCode: detGift.claimCode,
    claimedAt: new Date().toISOString(),
    used: false
  };

  // 1. Lưu tức thì vào LocalStorage
  try {
    if (typeof localStorage !== 'undefined' && mssv) {
      localStorage.setItem(`bht_gift_2010_${mssv}`, JSON.stringify(giftData));
    }
  } catch (e) {}

  // 2. Cập nhật appState.user
  if (appState.user) {
    appState.user = {
      ...appState.user,
      gift2010: giftData
    };
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('bht_user', JSON.stringify(appState.user));
      }
    } catch (e) {}
  }

  // Cập nhật viewingAs nếu đang ở chế độ xem trước một sinh viên cụ thể
  try {
    if (typeof sessionStorage !== 'undefined') {
      const viewingAs = sessionStorage.getItem('bht_viewing_as_member');
      if (viewingAs && viewingAs !== 'true') {
        const parsed = JSON.parse(viewingAs);
        if (parsed && String(parsed.mssv || '').toUpperCase() === mssv) {
          parsed.gift2010 = giftData;
          sessionStorage.setItem('bht_viewing_as_member', JSON.stringify(parsed));
        }
      }
    }
  } catch (e) {}

  // 3. Đồng bộ lên Backend Google Apps Script (hoặc Mock Data)
  try {
    await saveMemberGift(mssv, giftData);
  } catch (err) {
    console.warn('[Gift2010] Không thể đồng bộ quà lên Backend (đã lưu cache local):', err);
  }

  return giftData;
}

/**
 * Danh sách 5 câu chúc 20/10 ấm áp, đa ngành dành riêng cho phái đẹp VNUF2
 */
export const FEMALE_IT_WISHES_2010 = [
  '🌸 Chúc bạn luôn rạng rỡ, tự tin tỏa sáng trên giảng đường VNUF2, học tập xuất sắc, vạn sự như ý và mỗi ngày đều đong đầy niềm vui! 💐',
  '💖 Chúc phái đẹp VNUF2: Nụ cười luôn tỏa nắng, đồ án điểm cao, học bổng ngập tràn và luôn là đóa hoa thơm ngát rực rỡ nhất trường! ✨',
  '🌷 Chúc bạn ngày 20/10 thật hạnh phúc, deadline luôn hoàn thành nhẹ nhàng, tri thức vững vàng và thanh xuân rực rỡ dưới mái trường VNUF2! 🌸',
  '🎀 Chúc các nữ sinh VNUF2 luôn duyên dáng, kiên định theo đuổi đam mê, mọi kỳ thi đều đạt thành tích xuất sắc và luôn được nâng niu yêu thương! 💐',
  '✨ Chúc bạn tràn đầy năng lượng tích cực, sáng tạo không giới hạn, gặt hái thật nhiều thành tựu trong học tập và rạng ngời trên con đường tương lai! 💖'
];

/**
 * Danh sách 5 câu chúc 20/10 ấm áp dành cho các bạn nam gửi tặng nhóm chat CLB
 */
export const MALE_IT_WISHES_2010 = [
  '🌸 Chúc toàn thể bóng hồng VNUF2 ngày 20/10 ngập tràn hoa, quà và tiếng cười! Chúc các bạn luôn xinh đẹp, tự tin và học tập thật giỏi! 💐',
  '💐 Chúc các bạn nữ VNUF2 luôn rạng ngời như hoa mùa xuân, bài thi điểm cao chót vót, đồ án luôn dẫn đầu và mãi là niềm tự hào của CLB! 🌸',
  '🌷 Anh em CLB gửi ngàn lời chúc yêu thương tới các bạn nữ: Chúc các bạn luôn tươi trẻ, duyên dáng, hạnh phúc và thành công trên mọi nẻo đường! 💖',
  '🎀 Chúc phái đẹp VNUF2 một ngày 20/10 ngọt ngào, nhận được thật nhiều điều bất ngờ, học tập giỏi giang và luôn tỏa sáng rực rỡ! 💐',
  '✨ Thay mặt anh em CLB, chúc các bạn nữ luôn xinh xắn, tự tin, năng động, mọi ước mơ học tập và sự nghiệp đều sớm nở hoa thành công! 🌸'
];

/**
 * Định dạng thời gian nhận quà sang HH:mm - DD/MM/YYYY
 * @param {string} isoStr 
 * @returns {string}
 */
export function formatClaimDate(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const DD = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const YYYY = d.getFullYear();
    return `${hh}:${mm} - ${DD}/${MM}/${YYYY}`;
  } catch (e) {
    return '';
  }
}

/**
 * Hiệu ứng 1: Pháo hoa bung nở 360 độ khi mở quà (Confetti Burst)
 * @param {HTMLElement} containerElement Khung chứa pháo hoa
 */
export function triggerCelebrationBurst(containerElement) {
  if (!containerElement) return;
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const burstContainer = document.createElement('div');
  burstContainer.className = 'bht-confetti-burst';
  burstContainer.setAttribute('aria-hidden', 'true');

  const icons = ['🌸', '🌷', '✨', '💖', '⭐', '🎉', 'petal', 'gold', 'teal'];
  const particleCount = 32;

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'bht-confetti-particle';
    
    const pick = icons[Math.floor(Math.random() * icons.length)];
    if (pick === 'petal') {
      p.style.width = '8px';
      p.style.height = '12px';
      p.style.background = '#f43f5e';
      p.style.borderRadius = '50% 0 50% 50%';
    } else if (pick === 'gold') {
      p.style.width = '7px';
      p.style.height = '10px';
      p.style.background = '#f59e0b';
      p.style.borderRadius = '2px';
    } else if (pick === 'teal') {
      p.style.width = '6px';
      p.style.height = '10px';
      p.style.background = '#14b8a6';
      p.style.borderRadius = '2px';
    } else {
      p.textContent = pick;
      p.style.fontSize = `${Math.floor(12 + Math.random() * 12)}px`;
      p.style.lineHeight = '1';
    }

    const angle = Math.random() * 2 * Math.PI;
    const distance = 90 + Math.random() * 160;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 30;
    const rot = (Math.random() - 0.5) * 720;
    const duration = 1.2 + Math.random() * 0.6;

    p.style.setProperty('--tx', `${tx}px`);
    p.style.setProperty('--ty', `${ty}px`);
    p.style.setProperty('--rot', `${rot}deg`);
    p.style.animation = `bht-burst-fly ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;

    burstContainer.appendChild(p);
  }

  containerElement.appendChild(burstContainer);
  setTimeout(() => {
    burstContainer.remove();
  }, 1900);
}

/**
 * Hiệu ứng 2: Khởi tạo hiệu ứng nghiêng 3D trên Thẻ Voucher Holographic
 * @param {HTMLElement} [cardEl] Thẻ voucher cần tạo hiệu ứng
 */
export function initVoucher3DTilt(cardEl) {
  if (!cardEl) cardEl = document.querySelector('.bht-voucher-holo');
  if (!cardEl) return;

  const handleMouseMove = (e) => {
    if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(pointer: fine)').matches) return;
    const rect = cardEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((centerY - y) / centerY) * 6; // Tối đa ±6 độ
    const rotY = ((x - centerX) / centerX) * 6;

    cardEl.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`;
  };

  const handleMouseLeave = () => {
    cardEl.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  cardEl.removeEventListener('mousemove', cardEl._tiltMoveHandler);
  cardEl.removeEventListener('mouseleave', cardEl._tiltLeaveHandler);
  cardEl._tiltMoveHandler = handleMouseMove;
  cardEl._tiltLeaveHandler = handleMouseLeave;
  cardEl.addEventListener('mousemove', handleMouseMove);
  cardEl.addEventListener('mouseleave', handleMouseLeave);
}

/**
 * Hiệu ứng 4: Hiệu ứng gõ chữ (Typewriter Effect) cho lời chúc
 * @param {HTMLElement} element 
 * @param {string} text 
 * @param {number} speed 
 */
let typewriterTimer = null;
export function startTypewriter(element, text, speed = 20) {
  if (!element || !text) return;
  if (typewriterTimer) {
    clearInterval(typewriterTimer);
    typewriterTimer = null;
  }

  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.innerHTML = `"${escapeHTML(text)}"<span class="bht-typewriter-cursor">_</span>`;
    return;
  }

  let index = 0;
  element.innerHTML = `"<span class="bht-typewriter-content"></span><span class="bht-typewriter-cursor">_</span>"`;
  const contentSpan = element.querySelector('.bht-typewriter-content');

  typewriterTimer = setInterval(() => {
    index++;
    if (contentSpan) {
      contentSpan.textContent = text.slice(0, index);
    }
    if (index >= text.length) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
    }
  }, speed);
}

/**
 * Hiệu ứng 5: Chạm nở hoa (Click Blossom Micro-interaction)
 * @param {HTMLElement} targetEl 
 * @param {MouseEvent} event 
 */
export function triggerClickBlossom(targetEl, event) {
  const container = targetEl || (event ? event.currentTarget : null);
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const clickX = event && event.clientX ? event.clientX - rect.left : rect.width / 2;
  const clickY = event && event.clientY ? event.clientY - rect.top : rect.height / 2;

  const blossomBox = document.createElement('div');
  blossomBox.className = 'bht-blossom-box';
  blossomBox.style.left = `${clickX}px`;
  blossomBox.style.top = `${clickY}px`;
  blossomBox.setAttribute('aria-hidden', 'true');

  const petals = ['🌸', '✨', '💖', '🌷', '🎀'];
  for (let i = 0; i < 5; i++) {
    const span = document.createElement('span');
    span.className = 'bht-blossom-item';
    span.textContent = petals[i % petals.length];
    
    const offsetX = (Math.random() - 0.5) * 50;
    const offsetY = -35 - Math.random() * 25;
    const rot = (Math.random() - 0.5) * 60;
    
    span.style.setProperty('--bx', `${offsetX}px`);
    span.style.setProperty('--by', `${offsetY}px`);
    span.style.setProperty('--brot', `${rot}deg`);
    span.style.animation = `bht-blossom-float 0.8s ease-out forwards`;
    span.style.animationDelay = `${i * 0.05}s`;

    blossomBox.appendChild(span);
  }

  const prevPos = window.getComputedStyle(container).position;
  if (prevPos === 'static') {
    container.style.position = 'relative';
  }
  container.appendChild(blossomBox);

  setTimeout(() => {
    blossomBox.remove();
  }, 900);
}

/**
 * Render Banner Sự Kiện & Đặc Quyền trên Member Dashboard
 * @param {Object} user Người dùng hiện tại
 * @returns {string} Chuỗi HTML
 */
export function renderGift2010Banner(user) {
  if (!user) return '';

  const campaign = getActiveCampaign();
  if (!campaign) return ''; // Nếu đã tắt sự kiện (NONE) thì ẩn banner

  const isFemale = isFemaleMember(user);
  const fullName = escapeHTML(user.hoTen || user.HoTen || 'Bạn');
  const claimed = getClaimedGift(user);

  // 1. Trường hợp sự kiện OCT20 (Bảo đảm tương thích ngược 100% cho test suites)
  if (campaign.id === 'OCT20') {
    if (isFemale) {
      let claimedBadgeHtml = '';
      if (claimed) {
        const giftObj = ACADEMIC_GIFTS_2010.find(g => g.id === claimed.giftId) || ACADEMIC_GIFTS_2010[0];
        const shortTitle = escapeHTML(claimed.shortTitle || giftObj.shortTitle || claimed.giftTitle || '');
        const code = escapeHTML(claimed.claimCode || '');
        const isUsed = Boolean(claimed.used);
        const statusBadge = isUsed 
          ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">⚪ Đã dùng</span>'
          : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">🟢 Sẵn sàng sử dụng</span>';

        claimedBadgeHtml = `
          <div class="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface/90 dark:bg-surface/60 border border-rose-400/30 text-xs text-ink shadow-xs">
            <span class="font-medium text-rose-600 dark:text-rose-300">🎁 Đã sở hữu: <strong>${shortTitle}</strong></span>
            <span class="font-mono text-[11px] text-ink-muted">(Mã: <span class="font-bold text-ink">${code}</span>)</span>
            ${statusBadge}
          </div>
        `;
      }

      return `
        <div id="banner-oct20-female" class="bht-card relative overflow-hidden p-5 sm:p-6 border border-pink-400/30 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-teal-500/10 shadow-sm animate-fade-in">
          <!-- Hoa văn trang trí góc & Đom đóm lấp lánh -->
          <div class="absolute -right-4 -bottom-4 text-6xl opacity-15 select-none pointer-events-none">🌸</div>
          <div class="absolute right-12 top-2 text-2xl opacity-20 select-none pointer-events-none">✨</div>
          <span class="bht-sparkle" style="top: 10px; right: 28%; animation-delay: 0.3s;">✨</span>
          <span class="bht-sparkle" style="bottom: 12px; left: 35%; animation-delay: 1.2s;">✨</span>

          <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="space-y-1.5 max-w-2xl">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                  <span>🌸</span>
                  <span>20/10 • Ngày Phụ Nữ Việt Nam</span>
                </span>
                <span class="text-[11px] font-mono text-ink-muted">Dành riêng cho bóng hồng VNUF2</span>
              </div>

              <h3 class="bht-heading-serif text-lg sm:text-xl font-bold text-ink">
                Thân chúc bạn ${fullName} ngày 20/10 ngập tràn niềm vui & rực rỡ! 💐
              </h3>

              <p class="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Ban Học thuật CLB Tin học VNUF2 chúc bạn luôn xinh đẹp, tự tin, đam mê học hỏi và gặt hái thật nhiều thành tựu xuất sắc. Ban gửi tặng bạn một hộp quà đặc biệt nhân ngày hôm nay!
              </p>
            </div>

            <div class="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-2.5">
              ${claimed ? `
                ${claimedBadgeHtml}
                <button 
                  type="button" 
                  data-action="open-gift-modal" 
                  class="bht-btn bht-btn-secondary border-rose-400 text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 w-full sm:w-auto justify-center font-semibold text-xs sm:text-sm shadow-sm py-2.5 px-4"
                  title="Xem lại thẻ quà học thuật của bạn"
                >
                  <span>🎟️ Xem Thẻ Quà 20/10 của bạn</span>
                </button>
              ` : `
                <button 
                  type="button" 
                  data-action="open-gift-modal" 
                  class="bht-btn bht-btn-primary bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white border-0 w-full sm:w-auto justify-center font-bold text-xs sm:text-sm shadow-md py-2.5 px-5 active:scale-95 transition-transform"
                  title="Mở hộp quà 20/10"
                >
                  <span class="animate-bounce mr-1">🎁</span>
                  <span>Mở Hộp Quà 20/10</span>
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div id="banner-oct20-male" class="bht-card relative overflow-hidden p-4 sm:p-5 border border-pink-400/25 bg-gradient-to-r from-pink-500/5 via-teal-500/5 to-transparent shadow-sm animate-fade-in">
        <span class="bht-sparkle" style="top: 8px; right: 26%; animation-delay: 0.5s;">✨</span>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center text-lg shrink-0 border border-pink-500/20">
              🌸
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono">20/10 • Ngày Phụ Nữ Việt Nam</span>
              </div>
              <p class="text-xs sm:text-sm text-ink mt-0.5 leading-relaxed">
                Hôm nay là 20/10! Anh em CLB Tin học VNUF2 đừng quên gửi những lời chúc tốt đẹp nhất tới các bóng hồng của CLB mình nhé! 💐
              </p>
            </div>
          </div>
          <div class="shrink-0 w-full sm:w-auto">
            <button 
              type="button" 
              data-action="random-male-wish" 
              class="bht-btn bht-btn-secondary border-rose-400/40 text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 w-full sm:w-auto justify-center font-semibold text-xs py-2 px-3.5 shadow-xs transition-transform active:scale-95"
              title="Tạo và sao chép lời chúc 20/10 gửi nhóm chat"
            >
              <i class="fa-regular fa-envelope-open mr-1.5 text-rose-500"></i>
              <span>💌 Tạo lời chúc 20/10 gửi nhóm</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Trường hợp các sự kiện khác (TET, MARCH8, ANNIVERSARY...)
  const isEligible = (campaign.targetAudience === 'all') || (campaign.targetAudience === 'female' && isFemale);

  if (isEligible) {
    return `
      <div id="banner-campaign-${campaign.id}" class="bht-card relative overflow-hidden p-5 sm:p-6 border bg-gradient-to-br ${campaign.themeClass} shadow-sm animate-fade-in">
        <div class="absolute -right-4 -bottom-4 text-6xl opacity-15 select-none pointer-events-none">${campaign.cornerIcon}</div>
        <div class="absolute right-12 top-2 text-2xl opacity-20 select-none pointer-events-none">✨</div>

        <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1.5 max-w-2xl">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-hairline shadow-xs">
                <span>${campaign.icon}</span>
                <span>${campaign.badgeText}</span>
              </span>
              <span class="text-[11px] font-mono text-ink-muted">${campaign.subtitle}</span>
            </div>

            <h3 class="bht-heading-serif text-lg sm:text-xl font-bold text-ink">
              Thân chúc ${fullName} ${campaign.greeting}
            </h3>

            <p class="text-xs sm:text-sm text-ink-muted leading-relaxed">
              ${campaign.bannerDesc}
            </p>
          </div>

          <div class="shrink-0 w-full sm:w-auto">
            ${claimed ? `
              <button 
                type="button" 
                data-action="open-gift-modal" 
                class="bht-btn bht-btn-secondary border-hairline hover:bg-subtle w-full sm:w-auto justify-center font-semibold text-xs sm:text-sm shadow-sm py-2.5 px-4"
                title="Xem lại thẻ quà học thuật của bạn"
              >
                <span>🎟️ Xem Thẻ Quà Của Bạn</span>
              </button>
            ` : `
              <button 
                type="button" 
                data-action="open-gift-modal" 
                class="bht-btn bht-btn-primary bg-gradient-to-r ${campaign.btnGradient} text-white border-0 w-full sm:w-auto justify-center font-bold text-xs sm:text-sm shadow-md py-2.5 px-5 active:scale-95 transition-transform"
                title="Mở hộp quà học thuật"
              >
                <span class="animate-bounce mr-1">🎁</span>
                <span>Mở Hộp Quà May Mắn</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // Nếu là chiến dịch dành cho Nữ nhưng user là Nam
  if (campaign.maleReminder) {
    return `
      <div id="banner-campaign-reminder" class="bht-card relative overflow-hidden p-4 sm:p-5 border border-hairline bg-gradient-to-r from-pink-500/5 via-teal-500/5 to-transparent shadow-sm animate-fade-in">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center text-lg shrink-0 border border-pink-500/20">
            ${campaign.icon}
          </div>
          <div>
            <h4 class="font-bold text-xs sm:text-sm text-ink flex items-center gap-1.5">
              <span>${campaign.title}</span>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-soft text-accent">Ban Học Thuật</span>
            </h4>
            <p class="text-xs text-ink-muted mt-0.5">
              ${campaign.maleReminder}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

/**
 * Render Giao diện Hoạt cảnh Xáo Thẻ Bốc Quà 20/10 (3D Card Shuffle Stage)
 * @param {Object} giftData 
 * @param {Object} user 
 * @returns {string} Chuỗi HTML
 */
export function renderGift2010UnboxingStage(giftData, user) {
  const userName = escapeHTML(user ? (user.hoTen || user.HoTen || 'Bạn') : 'Bạn');
  const targetGiftId = giftData ? giftData.giftId : ACADEMIC_GIFTS_2010[0].id;

  return `
    <div class="bht-petals-container pointer-events-none absolute inset-0 overflow-hidden z-0">
      <span class="bht-petal p1">🌸</span>
      <span class="bht-petal p2">✨</span>
      <span class="bht-petal p3">🌸</span>
      <span class="bht-petal p4">🌷</span>
      <span class="bht-petal p5">✨</span>
      <span class="bht-petal p6">🌸</span>
      <span class="bht-sparkle" style="top: 15px; left: 20px; animation-delay: 0.2s;">✨</span>
      <span class="bht-sparkle" style="top: 20px; right: 25px; animation-delay: 1.1s;">✨</span>
      <span class="bht-sparkle" style="bottom: 20px; left: 25px; animation-delay: 0.7s;">✨</span>
      <span class="bht-sparkle" style="bottom: 25px; right: 20px; animation-delay: 1.6s;">✨</span>
    </div>

    <div class="relative z-10 text-center space-y-3 sm:space-y-4 py-1 sm:py-2">
      <div class="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 animate-pulse">
        <span>🎁</span>
        <span>HỘP QUÀ 20/10 · ĐANG XÁO THẺ BỐC QUÀ...</span>
      </div>

      <div class="px-1">
        <h3 class="bht-heading-serif text-lg sm:text-2xl lg:text-3xl font-bold text-ink leading-tight">
          Thân tặng ${userName} đặc quyền học thuật 20/10 🌸
        </h3>
        <p id="bht-shuffle-status-text" class="text-xs sm:text-sm text-ink-muted mt-1 sm:mt-1.5 transition-all duration-300 line-clamp-2">
          ✨ Hệ thống đang xáo thẻ và tìm kiếm món quà đặc quyền dành riêng cho bạn...
        </p>
      </div>

      <!-- SÀN XÁO THẺ 3D RỘNG RÃI & RESPONSIVE (3D CARD SHUFFLE ARENA) -->
      <div class="bht-shuffle-arena relative mx-auto my-2 sm:my-4 max-w-2xl overflow-hidden rounded-2xl border border-rose-300/40 dark:border-rose-500/30 bg-gradient-to-b from-rose-500/5 via-surface to-rose-500/10 p-2 sm:p-4 md:p-6 flex items-center justify-center shadow-inner">
        ${ACADEMIC_GIFTS_2010.map((gift, idx) => {
          const isTarget = gift.id === targetGiftId;
          const initialPos = idx === 1 ? 'pos-center' : (idx === 0 ? 'pos-left' : 'pos-right');
          return `
            <div 
              id="shuffle-card-${idx}" 
              data-gift-id="${gift.id}" 
              data-is-winner="${isTarget ? 'true' : 'false'}"
              class="bht-shuffle-card ${initialPos} bg-surface border-2 ${isTarget ? 'border-rose-400' : 'border-hairline'}"
            >
              <div class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl sm:text-2xl md:text-3xl shadow-xs border border-rose-500/20 shrink-0">
                <i class="${gift.icon}"></i>
              </div>
              <h4 class="font-bold text-xs sm:text-sm text-ink leading-snug line-clamp-1 sm:line-clamp-2">
                ${escapeHTML(gift.shortTitle)}
              </h4>
              <p class="text-[9.5px] sm:text-[11px] text-ink-muted line-clamp-2 leading-relaxed px-0.5">
                ${escapeHTML(gift.description)}
              </p>
              <span class="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold font-mono tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                VNUF2 PRIVILEGE
              </span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- THANH TIẾN TRÌNH HỒI HỘP -->
      <div class="max-w-md mx-auto space-y-1.5 sm:space-y-2 pt-1 px-2">
        <div class="bht-shuffle-progress">
          <div id="bht-shuffle-progress-bar" class="bht-shuffle-progress-bar"></div>
        </div>
        <div class="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-ink-muted">
          <span>Khởi tạo seed...</span>
          <span id="bht-shuffle-step-label">Đang xáo thẻ [1/5]</span>
          <button 
            type="button" 
            data-action="skip-gift-shuffle" 
            class="text-rose-500 hover:text-rose-600 dark:text-rose-400 underline font-semibold transition-colors cursor-pointer"
            title="Bỏ qua hiệu ứng xáo thẻ và xem quà ngay"
          >
            ⏩ Xem ngay
          </button>
        </div>
      </div>
    </div>
  `;
}

// Biến lưu danh sách timer ID để có thể huỷ khi bấm Skip
let currentShuffleTimers = [];

/**
 * Điều khiển diễn tiến hoạt cảnh xáo thẻ bốc quà chuyển động qua lại chậm rãi rồi mới chốt vị trí
 * @param {HTMLElement} modalBody 
 * @param {Object} giftData 
 * @param {Object} user 
 * @param {Function} onComplete 
 */
export function startGiftCardShuffleAnimation(modalBody, giftData, user, onComplete) {
  if (!modalBody) return;

  // Dọn dẹp các timer cũ nếu có
  if (currentShuffleTimers && currentShuffleTimers.length) {
    currentShuffleTimers.forEach(id => clearTimeout(id));
    currentShuffleTimers = [];
  }

  // Nếu người dùng bật giảm chuyển động, bỏ qua và hiển thị kết quả ngay
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (onComplete) onComplete();
    return;
  }

  // 1. Render khung sàn xáo thẻ
  modalBody.innerHTML = renderGift2010UnboxingStage(giftData, user);

  // Kích hoạt thanh tiến trình sau 50ms
  const barTimer = setTimeout(() => {
    const bar = document.getElementById('bht-shuffle-progress-bar');
    if (bar) bar.style.width = '100%';
  }, 50);
  currentShuffleTimers.push(barTimer);

  const card0 = document.getElementById('shuffle-card-0');
  const card1 = document.getElementById('shuffle-card-1');
  const card2 = document.getElementById('shuffle-card-2');
  const statusText = document.getElementById('bht-shuffle-status-text');
  const stepLabel = document.getElementById('bht-shuffle-step-label');

  if (!card0 || !card1 || !card2) {
    if (onComplete) onComplete();
    return;
  }

  const cards = [card0, card1, card2];
  const targetGiftId = giftData ? giftData.giftId : ACADEMIC_GIFTS_2010[0].id;
  const winnerCard = cards.find(c => c.getAttribute('data-gift-id') === targetGiftId) || card0;
  const loserCards = cards.filter(c => c !== winnerCard);

  const setPositions = (cLeft, cCenter, cRight) => {
    [cLeft, cCenter, cRight].forEach(c => {
      c.className = c.className.replace(/\bpos-(center|left|right|winner|loser)\b/g, '').trim();
    });
    cLeft.classList.add('pos-left');
    cCenter.classList.add('pos-center');
    cRight.classList.add('pos-right');
  };

  // NHỊP 1: Bắt đầu chuyển động xáo qua lại nhịp nhàng (0.7s)
  const t1 = setTimeout(() => {
    setPositions(cards[1], cards[2], cards[0]);
    if (stepLabel) stepLabel.textContent = 'Đang xáo thẻ [1/5]';
    if (statusText) statusText.textContent = '✨ Các thẻ quà đặc quyền bắt đầu chuyển động xáo trộn...';
  }, 700);
  currentShuffleTimers.push(t1);

  // NHỊP 2: Đảo hướng hoán đổi ngược lại (1.6s)
  const t2 = setTimeout(() => {
    setPositions(cards[2], cards[0], cards[1]);
    if (stepLabel) stepLabel.textContent = 'Đang hoán đổi [2/5]';
    if (statusText) statusText.textContent = '🌸 Hệ thống đang hoán đổi vị trí các phần quà 20/10...';
  }, 1600);
  currentShuffleTimers.push(t2);

  // NHỊP 3: Đảo hướng lần 3 bay lượn trên sàn 3D (2.5s)
  const t3 = setTimeout(() => {
    setPositions(cards[0], cards[1], cards[2]);
    if (stepLabel) stepLabel.textContent = 'Đang hoán đổi [3/5]';
    if (statusText) statusText.textContent = '✨ Từng thẻ quà đang lướt qua lướt lại trên sàn đấu 3D...';
  }, 2500);
  currentShuffleTimers.push(t3);

  // NHỊP 4: Bắt đầu giảm tốc rõ rệt (hãm phanh hồi hộp) (3.4s)
  const t4 = setTimeout(() => {
    setPositions(cards[1], cards[0], cards[2]);
    if (stepLabel) stepLabel.textContent = 'Đang hãm tốc độ [4/5]';
    if (statusText) statusText.textContent = '🎯 Đang giảm dần tốc độ... Phần quà định mệnh sắp lộ diện!';
  }, 3400);
  currentShuffleTimers.push(t4);

  // NHỊP 5: Thẻ trúng thưởng từ từ lướt vào vị trí trung tâm chính diện (4.2s)
  const t5 = setTimeout(() => {
    setPositions(loserCards[0], winnerCard, loserCards[1]);
    if (stepLabel) stepLabel.textContent = 'Đã chọn quà! [5/5]';
    if (statusText) {
      statusText.innerHTML = '🎉 <strong>Chúc mừng bạn!</strong> Món quà đặc quyền của bạn đã được chốt!';
      statusText.classList.add('text-rose-600', 'dark:text-rose-400');
    }
  }, 4200);
  currentShuffleTimers.push(t5);

  // NHỊP 6: Thẻ trúng bừng sáng hào quang phóng to và nổ pháo hoa rực rỡ (4.8s)
  const t6 = setTimeout(() => {
    winnerCard.classList.remove('pos-center');
    winnerCard.classList.add('pos-winner');
    loserCards.forEach(c => {
      c.classList.remove('pos-left', 'pos-right');
      c.classList.add('pos-loser');
    });
    triggerCelebrationBurst(modalBody.parentElement || modalBody);
  }, 4800);
  currentShuffleTimers.push(t6);

  // NHỊP 7: Chuyển mượt mà sang màn hình Thẻ Voucher hoàn chỉnh (5.6s)
  const t7 = setTimeout(() => {
    if (onComplete) {
      onComplete();
    }
  }, 5600);
  currentShuffleTimers.push(t7);
}

/**
 * Hủy bỏ hoạt cảnh xáo thẻ và chuyển ngay tới kết quả
 */
export function stopGiftCardShuffleAnimation() {
  if (currentShuffleTimers && currentShuffleTimers.length) {
    currentShuffleTimers.forEach(id => clearTimeout(id));
    currentShuffleTimers = [];
  }
}

/**
 * Render Nội Dung Modal Thẻ Quà 20/10 theo phong cách Thiệp Chúc Mừng & Vé Coupon
 * @param {Object} giftData Thông tin quà
 * @param {Object} user Người dùng
 * @returns {string} Chuỗi HTML
 */
export function renderGift2010ModalContent(giftData, user) {
  if (!giftData) return '';

  const matched = ACADEMIC_GIFTS_2010.find(g => g.id === giftData.giftId) || ACADEMIC_GIFTS_2010[0];
  const claimCode = escapeHTML(giftData.claimCode || '');
  const userName = escapeHTML(user ? (user.hoTen || user.HoTen || 'Bạn') : 'Bạn');
  const mssv = escapeHTML(user ? (user.mssv || user.MSSV || user.id || '') : '');
  const isUsed = Boolean(giftData.used);
  const formattedClaimDate = formatClaimDate(giftData.claimedAt) || formatClaimDate(new Date().toISOString());

  // Lựa chọn câu chúc ban đầu
  const initialWish = FEMALE_IT_WISHES_2010[0];
  const fullShareText = `🌸 [Quà 20/10 Ban Học Thuật VNUF2] Mình là ${userName}${mssv ? ` (${mssv})` : ''}, vừa nhận được đặc quyền: ${matched.title} 🎁 Mã xác nhận: ${claimCode}`;

  return `
    <!-- Cánh hoa rơi hiệu ứng CSS 3D & Đom đóm lấp lánh -->
    <div class="bht-petals-container pointer-events-none absolute inset-0 overflow-hidden z-0">
      <span class="bht-petal p1">🌸</span>
      <span class="bht-petal p2">✨</span>
      <span class="bht-petal p3">🌸</span>
      <span class="bht-petal p4">🌷</span>
      <span class="bht-petal p5">✨</span>
      <span class="bht-petal p6">🌸</span>
      <span class="bht-sparkle" style="top: 12px; left: 16px; animation-delay: 0.2s;">✨</span>
      <span class="bht-sparkle" style="top: 24px; right: 28px; animation-delay: 1.1s;">✨</span>
      <span class="bht-sparkle" style="bottom: 24px; left: 20px; animation-delay: 0.7s;">✨</span>
      <span class="bht-sparkle" style="bottom: 30px; right: 22px; animation-delay: 1.6s;">✨</span>
    </div>

    <div class="relative z-10 text-center space-y-3 sm:space-y-4">
      <!-- Header Badge -->
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
        <span>🎁</span>
        <span>HỘP QUÀ HỌC THUẬT 20/10</span>
      </div>

      <!-- PHẦN 1 - KHUNG THIỆP CÁ NHÂN HÓA (GREETING CARD) -->
      <div class="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-amber-500/5 border border-rose-300/40 dark:border-rose-500/30 text-left space-y-2 shadow-xs">
        <p class="text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-300 flex flex-wrap items-center gap-1.5 leading-snug">
          <span>🌸</span>
          <span>Thân tặng bông hồng công nghệ: <strong class="underline decoration-rose-400 font-bold">${userName} (${mssv || 'VNUF2'})</strong></span>
        </p>

        <!-- Dòng gõ chữ phong cách terminal hiện đại -->
        <div class="text-[10px] sm:text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15 px-2.5 py-1 rounded-md flex items-center gap-1.5 overflow-hidden">
          <span class="text-rose-500 font-bold shrink-0">&gt;</span>
          <span class="truncate">Chúc bóng hồng VNUF2: Nụ cười rạng rỡ • Học tập xuất sắc • Thanh xuân như ý!</span>
          <span class="bht-typewriter-cursor shrink-0">_</span>
        </div>

        <!-- Greeting Box -->
        <div class="p-2.5 sm:p-3 rounded-xl bg-surface/85 dark:bg-surface/60 border border-rose-200/50 dark:border-rose-500/20 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-300 tracking-wide uppercase font-mono">
              <i class="fa-solid fa-heart text-[10px] text-rose-500"></i> Thông Điệp 20/10 Yêu Thương
            </span>
            <button 
              type="button" 
              data-action="shuffle-2010-wish" 
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-surface hover:bg-subtle border border-rose-400/30 text-rose-600 dark:text-rose-300 shadow-xs transition-colors cursor-pointer active:scale-95"
              title="Đổi lời chúc ngẫu nhiên khác"
            >
              <span>🎲 Đổi lời chúc</span>
            </button>
          </div>
          <p id="gift-2010-wish-text" class="text-xs sm:text-sm text-ink font-medium leading-relaxed italic transition-opacity duration-200">
            "${initialWish}"
          </p>
        </div>
      </div>

      <!-- PHẦN 2 - THẺ VOUCHER RĂNG CƯA / BẤM LỖ (COUPON TICKET UI) & ÁNH KIM 3D -->
      <div class="bht-ticket-container bht-voucher-holo relative border border-rose-400/30 bg-surface text-left shadow-sm">
        <!-- Nửa trên của vé -->
        <div class="p-3.5 sm:p-4 space-y-2.5">
          <div class="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-base sm:text-lg shrink-0 border border-rose-500/20">
                <i class="${matched.icon}"></i>
              </div>
              <div class="min-w-0">
                <h4 class="font-bold text-xs sm:text-sm md:text-base text-ink leading-snug">
                  ${escapeHTML(giftData.giftTitle || matched.title)}
                </h4>
                <p class="text-[10px] sm:text-[11px] text-ink-muted">Đặc quyền học thuật Ban Học Thuật</p>
              </div>
            </div>

            <!-- Badge trạng thái -->
            <div class="shrink-0 self-start xs:self-auto">
              ${isUsed ? `
                <span class="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/25">
                  ⚪ ĐÃ SỬ DỤNG
                </span>
              ` : `
                <span class="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  🟢 SẴN SÀNG SỬ DỤNG
                </span>
              `}
            </div>
          </div>

          <p class="text-xs text-ink-muted leading-relaxed">
            ${escapeHTML(matched.description)}
          </p>
        </div>

        <!-- Ranh giới bấm lỗ vé (Ticket Punch Cutouts) -->
        <div class="relative py-1">
          <div class="bht-ticket-cutout-left"></div>
          <div class="bht-ticket-cutout-right"></div>
          <div class="border-t-2 border-dashed border-rose-300/60 dark:border-rose-500/30 mx-4"></div>
        </div>

        <!-- Nửa dưới của vé -->
        <div class="p-3.5 sm:p-4 bg-rose-500/[0.03] dark:bg-rose-500/[0.06] space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span class="text-[9.5px] sm:text-[10px] font-mono text-ink-muted uppercase tracking-wider block">Mã xác thực độc quyền</span>
              <span id="gift-2010-code-text" class="font-mono text-base xs:text-lg sm:text-xl md:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-wider sm:tracking-widest select-all block mt-0.5 break-all sm:break-normal">
                ${claimCode}
              </span>
            </div>

            <!-- Dấu mộc nhỏ ở góc vé -->
            <div class="shrink-0 flex items-center self-start sm:self-auto">
              <div class="bht-ticket-stamp text-rose-600/80 dark:text-rose-400/80 border-rose-500/40 bg-rose-500/5 text-[8.5px] sm:text-[9.5px]">
                <i class="fa-solid fa-stamp text-[9px]"></i>
                <span>VERIFIED • BAN HỌC THUẬT ITC</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col xs:flex-row xs:items-center justify-between text-[10px] sm:text-[11px] text-ink-muted pt-1 border-t border-hairline gap-1">
            <span>Thời gian nhận: <strong class="font-mono text-ink">${formattedClaimDate}</strong></span>
            <span class="font-mono text-[9.5px] sm:text-[10px] text-ink-faint">VNUF2-ITC-SECURE</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1 w-full">
        <button 
          type="button" 
          data-action="copy-gift-code" 
          data-code="${claimCode}" 
          data-full-share="${escapeHTML(fullShareText)}"
          class="bht-btn bht-btn-primary bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white border-0 w-full sm:w-auto justify-center font-semibold text-xs sm:text-sm py-2.5 px-4 shadow-sm active:scale-95 transition-transform"
        >
          <i class="fa-regular fa-copy mr-1.5"></i>
          <span>Sao chép Mã Nhận Quà</span>
        </button>

        <button 
          type="button" 
          data-action="replay-gift-unboxing" 
          class="bht-btn bht-btn-secondary border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 w-full sm:w-auto justify-center font-semibold text-xs sm:text-sm py-2.5 px-3.5 shadow-xs transition-transform active:scale-95"
          title="Xem lại hoạt cảnh xáo thẻ bốc quà 20/10"
        >
          <i class="fa-solid fa-arrows-rotate mr-1.5 text-rose-500"></i>
          <span>🎲 Xáo thẻ lại</span>
        </button>

        <button 
          type="button" 
          data-action="close-gift-modal" 
          class="bht-btn bht-btn-secondary w-full sm:w-auto justify-center text-xs sm:text-sm py-2.5 px-4"
        >
          <span>Đóng lại</span>
        </button>
      </div>

      <p class="text-[10px] sm:text-[11px] text-ink-faint">
        💡 Bạn có thể gửi mã này vào nhóm CLB hoặc tích chọn đính kèm khi nộp bài tập thực hành.
      </p>

    </div>
  `;
}

/**
 * Reset quà 20/10 của người dùng (phục vụ kiểm thử trải nghiệm lại nút Mở Quà)
 * @param {Object} user Người dùng
 */
export async function resetGiftForUser(user) {
  if (!user) return;
  const mssv = String(user.mssv || user.MSSV || user.id || '').trim().toUpperCase();

  // 1. Xóa cache localStorage
  try {
    if (typeof localStorage !== 'undefined' && mssv) {
      localStorage.removeItem(`bht_gift_2010_${mssv}`);
    }
  } catch (e) {}

  // 2. Xóa trong user object & appState
  user.gift2010 = null;
  delete user.gift2010;
  if (appState.user) {
    appState.user.gift2010 = null;
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('bht_user', JSON.stringify(appState.user));
      }
    } catch (e) {}
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      const viewingAs = sessionStorage.getItem('bht_viewing_as_member');
      if (viewingAs && viewingAs !== 'true') {
        const parsed = JSON.parse(viewingAs);
        if (parsed && String(parsed.mssv || '').toUpperCase() === mssv) {
          parsed.gift2010 = null;
          sessionStorage.setItem('bht_viewing_as_member', JSON.stringify(parsed));
        }
      }
    }
  } catch (e) {}

  // 3. Xóa trong mock store nếu có
  try {
    if (typeof localStorage !== 'undefined') {
      const storeStr = localStorage.getItem('bht_mock_store');
      if (storeStr) {
        const parsed = JSON.parse(storeStr);
        if (parsed.members) {
          const m = parsed.members.find(x => x.MSSV === mssv);
          if (m) {
            m.gift2010 = null;
            localStorage.setItem('bht_mock_store', JSON.stringify(parsed));
          }
        }
      }
    }
  } catch (e) {}

  // 4. Đồng bộ lên backend
  try {
    await saveMemberGift(mssv, null);
  } catch (e) {}
}

/**
 * Chuyển đổi sang loại quà khác để test cả 3 trường hợp
 * @param {Object} user Người dùng
 * @param {string} targetGiftId DEADLINE_24H | BONUS_10PT | VIP_DEBUG
 */
export async function switchGiftTypeForUser(user, targetGiftId) {
  if (!user || !targetGiftId) return null;
  const mssv = String(user.mssv || user.MSSV || user.id || '').trim().toUpperCase();
  const matched = ACADEMIC_GIFTS_2010.find(g => g.id === targetGiftId) || ACADEMIC_GIFTS_2010[0];

  const existing = getClaimedGift(user) || getDeterministicGiftForUser(user);
  const claimCode = existing ? existing.claimCode : `ITC2010-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(100 + Math.random() * 900)}`;

  const newGiftData = {
    giftId: matched.id,
    giftTitle: matched.title,
    shortTitle: matched.shortTitle,
    claimCode: claimCode,
    claimedAt: new Date().toISOString(),
    used: false
  };

  try {
    if (typeof localStorage !== 'undefined' && mssv) {
      localStorage.setItem(`bht_gift_2010_${mssv}`, JSON.stringify(newGiftData));
    }
  } catch (e) {}

  user.gift2010 = newGiftData;
  if (appState.user) {
    appState.user.gift2010 = newGiftData;
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('bht_user', JSON.stringify(appState.user));
      }
    } catch (e) {}
  }

  try {
    if (typeof sessionStorage !== 'undefined') {
      const viewingAs = sessionStorage.getItem('bht_viewing_as_member');
      if (viewingAs && viewingAs !== 'true') {
        const parsed = JSON.parse(viewingAs);
        if (parsed && String(parsed.mssv || '').toUpperCase() === mssv) {
          parsed.gift2010 = newGiftData;
          sessionStorage.setItem('bht_viewing_as_member', JSON.stringify(parsed));
        }
      }
    }
  } catch (e) {}

  try {
    await saveMemberGift(mssv, newGiftData);
  } catch (e) {}

  return newGiftData;
}

/**
 * Render Bộ Chọn Sự Kiện dành cho Admin (Universal Campaign Selector)
 * @param {string} currentActiveId ID sự kiện đang chọn
 * @returns {string} Chuỗi HTML
 */
export function renderAdminCampaignSelector(currentActiveId) {
  const activeId = currentActiveId || getActiveCampaignId();
  const options = [
    { id: 'OCT20', name: '🌸 20/10 · Phụ Nữ Việt Nam', target: 'Chỉ dành cho Nữ', gifts: 'Thẻ +24h, Voucher +10đ, Debug 1-1' },
    { id: 'TET', name: '🧧 Tết Nguyên Đán · Khai Xuân', target: 'Tất cả thành viên', gifts: 'Lì xì +15đ, Gia hạn +48h, Debug Trưởng Ban' },
    { id: 'MARCH8', name: '🌷 8/3 · Quốc Tế Phụ Nữ', target: 'Chỉ dành cho Nữ', gifts: 'Thẻ +24h, Voucher +10đ, Debug 1-1' },
    { id: 'ANNIVERSARY', name: '🎂 Sinh Nhật CLB VNUF2', target: 'Tất cả thành viên', gifts: 'Voucher +10đ, Gia hạn +24h, Khiên Streak 3D' },
    { id: 'NONE', name: '⏸️ Tắt sự kiện (Chế độ thường)', target: 'Toàn hệ thống', gifts: 'Ẩn banner và tạm dừng quà tặng đặc quyền' }
  ];

  return `
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="bht-label font-bold text-ink flex items-center gap-1.5 mb-0">
          <i class="fa-solid fa-wand-magic-sparkles text-accent"></i>
          <span>Kích hoạt Sự kiện Đặc quyền Học thuật:</span>
        </label>
        <span class="text-[11px] text-ink-muted">Tự động thích ứng giao diện &amp; đặc quyền</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        ${options.map(opt => {
          const isAct = opt.id === activeId;
          return `
            <button 
              type="button" 
              data-action="switch-admin-campaign" 
              data-campaign-id="${opt.id}" 
              class="p-2.5 rounded-xl border text-left transition-all relative cursor-pointer ${isAct ? 'bg-accent/10 border-accent ring-1 ring-accent text-ink shadow-xs' : 'bg-surface hover:bg-subtle/60 border-hairline text-ink-muted'}"
            >
              <div class="flex items-center justify-between gap-1.5">
                <span class="font-bold text-xs text-ink truncate">${opt.name}</span>
                ${isAct ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent text-white shrink-0">ĐANG CHẠY</span>' : ''}
              </div>
              <div class="text-[10px] text-accent font-semibold mt-1">Đối tượng: ${opt.target}</div>
              <p class="text-[11px] text-ink-muted mt-0.5 leading-snug line-clamp-2">${opt.gifts}</p>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
