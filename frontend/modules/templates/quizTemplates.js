/**
 * QUIZ & PRACTICE MODULE TEMPLATES (EDITORIAL ACADEMIC STYLE)
 * Tách từ frontend/modules/templates.js để module hóa hệ thống.
 * 
 * Chứa các thành phần giao diện phục vụ:
 * 1. Zen Question Grid (ma trận câu hỏi modal)
 * 2. Zen Question Card (thẻ câu hỏi toàn màn hình)
 * 3. Zen Footer Dock (thanh điều hướng đáy màn hình)
 * 4. Member Quiz View (Dashboard bài thi & kết quả thành viên)
 * 5. Admin Quiz Panel (Bảng điều khiển & phân tích tỷ lệ đúng cho Admin)
 */

import { escapeHTML } from '../../utils/dom.js';

/**
 * Render ma trận câu hỏi cho modal chuyển câu nhanh (Question Grid)
 * @param {Array} questions Danh sách câu hỏi
 * @param {Object} currentAnswers Đáp án người dùng đã chọn
 * @param {Object} answerResults Kết quả đúng/sai (trong Practice Mode)
 * @param {number} currentIndex Câu đang hiển thị
 * @param {Array} bookmarkedIds Mảng ID câu hỏi đã bookmark
 * @returns {string} Chuỗi HTML
 */
export function renderQuizQuestionGridContent(questions = [], currentAnswers = {}, answerResults = {}, currentIndex = 0, bookmarkedIds = []) {
  if (!questions || !questions.length) {
    return '<p class="text-xs text-ink-muted text-center py-4">Không có câu hỏi trong danh sách này.</p>';
  }

  const itemsHtml = questions.map((q, idx) => {
    const isCurrent = idx === currentIndex;
    const isAnswered = currentAnswers[q.id] !== undefined;
    const res = answerResults[q.id];
    const isBookmarked = (bookmarkedIds || []).includes(q.id);

    let statusClass = 'border-hairline bg-surface text-ink hover:border-strong';
    let iconExtra = '';

    if (res) {
      if (res.isCorrect) {
        statusClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold';
      } else {
        statusClass = 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold';
      }
    } else if (isAnswered) {
      statusClass = 'border-accent bg-accent-soft text-accent font-semibold';
    }

    if (isCurrent) {
      statusClass += ' ring-2 ring-accent ring-offset-1 sm:ring-offset-2 ring-offset-canvas';
    }

    if (isBookmarked) {
      iconExtra = '<i class="fa-solid fa-star text-[8px] sm:text-[9px] text-amber-500 absolute -top-1 -right-1"></i>';
    }

    return `
      <button 
        type="button"
        data-action="jump-quiz-question" 
        data-index="${idx}"
        class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg border text-xs font-mono flex items-center justify-center transition-all ${statusClass} active:scale-95"
        title="Câu ${idx + 1}${isBookmarked ? ' (Đã đánh dấu)' : ''}"
      >
        <span>${idx + 1}</span>
        ${iconExtra}
      </button>
    `;
  }).join('');

  return `
    <div class="space-y-3.5">
      <div class="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-ink-muted border-b border-hairline pb-2.5 gap-2">
        <div class="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500 inline-block"></span> Đúng</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500 inline-block"></span> Sai</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-accent-soft border border-accent inline-block"></span> Đã làm</span>
          <span class="flex items-center gap-1"><i class="fa-solid fa-star text-amber-500 text-[9px]"></i> Đã lưu</span>
        </div>
      </div>
      <div class="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-2.5 max-h-[340px] sm:max-h-[380px] overflow-y-auto p-0.5">
        ${itemsHtml}
      </div>
    </div>
  `;
}

/**
 * Render thẻ câu hỏi lớn trong Zen Focus Arena (Toàn màn hình)
 * Tối ưu responsive: Không cố định min-height quá cao trên mobile, thu nhỏ touch padding, ẩn shortcut bàn phím trên cảm ứng.
 * @param {Object} currentQ Câu hỏi hiện tại
 * @param {number} safeIndex Chỉ số câu hỏi (0-based)
 * @param {number} totalCount Tổng số câu hỏi
 * @param {number|undefined} selectedOpt Đáp án người dùng chọn
 * @param {Object|undefined} qResult Kết quả đúng/sai (trong Practice Mode)
 * @param {boolean} isPractice Đang ở chế độ ôn luyện (có Instant Feedback)
 * @param {boolean} isBookmarked Câu hỏi đã được bookmark hay chưa
 * @param {boolean} autoNext Trạng thái tự động chuyển câu 1.2s
 * @returns {string} Chuỗi HTML
 */
export function renderZenQuestionCard(currentQ, safeIndex, totalCount, selectedOpt, qResult, isPractice, isBookmarked, autoNext) {
  if (!currentQ) return '<p class="text-center text-xs text-ink-muted py-6">Không có câu hỏi.</p>';

  const optionsHtml = (currentQ.luaChon || []).map((optText, optIdx) => {
    const isSelected = Number(selectedOpt) === optIdx;
    const optLetter = String.fromCharCode(65 + optIdx);
    const numKey = optIdx + 1;

    let cardClass = 'border-hairline bg-surface hover:border-strong hover:bg-subtle/50 text-ink cursor-pointer';
    let iconBadge = '';

    if (isPractice && qResult) {
      const isRight = Number(qResult.correctIndex) === optIdx;
      if (isRight) {
        cardClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500';
        iconBadge = '<i class="fa-solid fa-check text-emerald-500 ml-auto text-sm shrink-0"></i>';
      } else if (isSelected && !qResult.isCorrect) {
        cardClass = 'border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-100 font-semibold ring-1 ring-rose-500';
        iconBadge = '<i class="fa-solid fa-xmark text-rose-500 ml-auto text-sm shrink-0"></i>';
      } else {
        cardClass = 'border-hairline bg-surface/60 text-ink-faint opacity-50';
      }
    } else if (isSelected) {
      cardClass = 'border-accent bg-accent-soft text-accent font-semibold ring-1 ring-accent';
      iconBadge = '<i class="fa-solid fa-check text-accent ml-auto text-xs shrink-0"></i>';
    }

    return `
      <button
        type="button"
        data-action="select-quiz-option"
        data-question-id="${currentQ.id}"
        data-option-index="${optIdx}"
        class="w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex items-start gap-2.5 sm:gap-3.5 relative group ${cardClass} active:scale-[0.99]"
        ${(isPractice && qResult) ? 'disabled' : ''}
      >
        <div class="flex items-center gap-1 sm:gap-1.5 shrink-0 pt-0.5">
          <span class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-subtle text-ink font-mono font-bold flex items-center justify-center text-xs group-hover:bg-accent group-hover:text-white transition-colors">
            ${optLetter}
          </span>
          <span class="hidden sm:inline-block text-[10px] text-ink-faint font-mono">(${numKey})</span>
        </div>
        <span class="text-xs sm:text-sm md:text-base leading-relaxed grow pt-0.5">${escapeHTML(optText)}</span>
        ${iconBadge}
      </button>
    `;
  }).join('');

  // Smart Explanation Box trong chế độ ôn luyện
  let explanationBoxHtml = '';
  if (isPractice && qResult) {
    if (qResult.isCorrect) {
      explanationBoxHtml = `
        <div class="bht-card p-3 sm:p-4.5 bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm text-ink space-y-1 animate-fade-in rounded-xl sm:rounded-2xl">
          <div class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <i class="fa-solid fa-circle-check text-sm sm:text-base"></i>
            <span>Chính xác tuyệt đối!</span>
          </div>
          ${qResult.explanation ? `
            <p class="text-ink-muted leading-relaxed pl-5 sm:pl-6 text-[11px] sm:text-xs">${escapeHTML(qResult.explanation)}</p>
          ` : '<p class="text-ink-muted pl-5 sm:pl-6 text-[11px] sm:text-xs">Bạn đã nắm rất vững kiến thức này.</p>'}
        </div>
      `;
    } else {
      explanationBoxHtml = `
        <div class="bht-card p-3 sm:p-4.5 bg-rose-500/10 border border-rose-500/30 text-xs sm:text-sm text-ink space-y-1.5 animate-fade-in rounded-xl sm:rounded-2xl">
          <div class="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <i class="fa-solid fa-circle-xmark text-sm sm:text-base"></i>
            <span>Chưa đúng! Đáp án: <strong class="font-mono">${String.fromCharCode(65 + Number(qResult.correctIndex))}</strong></span>
          </div>
          ${qResult.explanation ? `
            <p class="text-ink-muted leading-relaxed pl-5 sm:pl-6 text-[11px] sm:text-xs">${escapeHTML(qResult.explanation)}</p>
          ` : ''}
          <div class="text-[10px] sm:text-[11px] text-rose-500 pl-5 sm:pl-6 flex items-center gap-1.5 font-mono">
            <i class="fa-solid fa-bullseye"></i> Đã lưu vào nhóm "Ôn câu sai" để bạn luyện lại.
          </div>
        </div>
      `;
    }
  }

  return `
    <div class="bht-card p-4 sm:p-6 md:p-8 bg-surface border border-hairline space-y-4 sm:space-y-5 shadow-sm rounded-2xl sm:rounded-3xl min-h-0 sm:min-h-[380px] flex flex-col justify-between transition-all duration-200">
      <div class="space-y-3.5 sm:space-y-4">
        <!-- Question Badge & Question Content -->
        <div class="flex items-start gap-2.5 sm:gap-3.5">
          <span class="text-accent font-mono font-black text-xs sm:text-sm px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-accent-soft shrink-0 mt-0.5">
            #${safeIndex + 1}
          </span>
          <h2 class="bht-heading-serif text-base sm:text-xl md:text-2xl font-bold text-ink leading-snug sm:leading-relaxed">
            ${escapeHTML(currentQ.cauHoi)}
          </h2>
        </div>

        <!-- Options Grid -->
        <div class="grid grid-cols-1 gap-2 sm:gap-3 pt-0.5">
          ${optionsHtml}
        </div>

        <!-- Explanation -->
        ${explanationBoxHtml}
      </div>

      <!-- Footer Shortcut Hint (Ẩn phím tắt trên mobile, giữ auto-next) -->
      <div class="pt-3 sm:pt-4 border-t border-hairline flex items-center justify-between text-xs text-ink-faint gap-2">
        <span class="hidden sm:inline-block font-mono text-[11px] text-ink-muted">
          Phím tắt: <strong>1-4</strong>/<strong>A-D</strong> (Chọn) • <strong>← / →</strong> (Chuyển câu) • <strong>S</strong> (Lưu)
        </span>
        <div class="flex items-center gap-2 ${isPractice ? 'w-full sm:w-auto justify-between sm:justify-end' : 'hidden sm:flex'}">
          ${isPractice ? `
            <div class="flex items-center gap-1.5 ml-auto">
              <input 
                type="checkbox" 
                id="chk-quiz-auto-next" 
                data-action="toggle-quiz-auto-next" 
                ${autoNext ? 'checked' : ''} 
                class="rounded border-hairline text-accent focus:ring-accent cursor-pointer"
              >
              <label for="chk-quiz-auto-next" class="text-[11px] sm:text-xs text-ink-muted cursor-pointer select-none">
                Tự chuyển câu (1.2s)
              </label>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render thanh điều hướng dưới đáy trong Zen Focus Arena
 * Tối ưu responsive: 3 nút Câu trước - Ma trận - Tiếp/Nộp luôn nằm gọn trên 1 dòng đơn trên mọi kích thước màn hình điện thoại (320px - 414px)
 * @param {number} safeIndex
 * @param {number} totalCount
 * @param {number} answeredCount
 * @param {boolean} isPractice
 * @param {string} sessionId
 * @param {string} quizId
 * @returns {string} Chuỗi HTML
 */
export function renderZenFooterDock(safeIndex, totalCount, answeredCount, isPractice, sessionId, quizId) {
  return `
    <div class="w-full flex items-center justify-between gap-1.5 sm:gap-3">
      <!-- Prev Button -->
      <button 
        type="button" 
        data-action="prev-quiz-question"
        ${safeIndex === 0 ? 'disabled' : ''}
        class="bht-btn bht-btn-secondary bht-btn-xs sm:bht-btn-md px-2.5 sm:px-4 shrink-0 ${safeIndex === 0 ? 'opacity-35 cursor-not-allowed' : ''}"
        title="Câu trước (Phím Z hoặc ←)"
      >
        <i class="fa-solid fa-arrow-left text-xs sm:mr-1.5"></i>
        <span class="hidden xs:inline sm:inline">Trước</span>
      </button>

      <!-- Middle Question Grid Trigger -->
      <button 
        type="button" 
        data-action="open-quiz-grid-modal" 
        class="bht-btn bht-btn-ghost bht-btn-xs sm:bht-btn-sm text-ink-muted font-mono px-2 sm:px-3 text-center truncate"
        title="Bấm để xem danh sách câu hỏi"
      >
        <i class="fa-solid fa-list-check mr-1 text-accent text-xs"></i>
        <span class="text-xs font-bold text-ink">${answeredCount}/${totalCount}</span>
        <span class="hidden sm:inline text-xs text-ink-muted ml-1">Đã làm</span>
      </button>

      <!-- Next or Submit Button -->
      ${safeIndex < totalCount - 1 ? `
        <button 
          type="button" 
          data-action="next-quiz-question" 
          class="bht-btn bht-btn-primary bht-btn-xs sm:bht-btn-md font-semibold px-3 sm:px-5 shrink-0 shadow-xs"
          title="Câu tiếp theo (Phím X hoặc →)"
        >
          <span>Tiếp</span>
          <i class="fa-solid fa-arrow-right text-xs ml-1 sm:ml-1.5"></i>
        </button>
      ` : `
        <button 
          type="button" 
          data-action="submit-member-quiz" 
          data-session-id="${escapeHTML(sessionId || '')}" 
          data-quiz-id="${escapeHTML(quizId || '')}" 
          class="bht-btn bht-btn-primary bht-btn-xs sm:bht-btn-md font-semibold px-2.5 sm:px-5 shrink-0 shadow-sm"
          title="Hoàn tất bài ôn tập"
        >
          <i class="fa-solid fa-paper-plane text-xs mr-1 sm:mr-1.5"></i>
          <span class="sm:hidden">${isPractice ? 'Xong' : 'Nộp bài'}</span>
          <span class="hidden sm:inline">${isPractice ? 'Hoàn thành Ôn luyện' : 'Nộp Bài Thi'}</span>
        </button>
      `}
    </div>
  `;
}

/**
 * Render Dashboard Quản lý Trắc nghiệm Buổi Sinh Hoạt cho Thành viên (Member View)
 * Hiển thị Tình trạng đề thi, Điểm số chính thức (đã chốt), Bảng xếp hạng và Nút mở Zen Focus Arena.
 * @param {Object} quiz Thông tin bộ đề thi
 * @param {Object|null} userResult Kết quả thi chính thức của thành viên (nếu có)
 * @param {Object} [options={}]
 * @returns {string} Chuỗi HTML
 */
export function renderMemberQuizView(quiz, userResult, options = {}) {
  const {
    sessionId = '',
    memberProfile = {},
    leaderboard = []
  } = options;

  if (!quiz) {
    return `
      <div class="bht-card p-8 sm:p-10 text-center bg-surface border border-dashed border-hairline space-y-3">
        <div class="w-14 h-14 rounded-2xl bg-accent-soft text-accent mx-auto flex items-center justify-center text-2xl shadow-sm">
          <i class="fa-solid fa-circle-question"></i>
        </div>
        <h3 class="bht-heading-serif text-lg font-bold text-ink">Chưa có đề trắc nghiệm cho buổi học này</h3>
        <p class="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
          Ban Học Thuật đang chuẩn bị bộ câu hỏi củng cố kiến thức cho chuyên đề này. Vui lòng quay lại sau!
        </p>
      </div>
    `.trim();
  }

  const qid = escapeHTML(quiz.QuizID || '');
  const sid = escapeHTML(sessionId || quiz.SessionID || '');
  const tieuDe = escapeHTML(quiz.TieuDe || 'Trắc nghiệm củng cố kiến thức');
  const moTa = escapeHTML(quiz.MoTa || '');
  const thoiGianPhut = Number(quiz.ThoiGianPhut) || 10;
  const questions = quiz.DanhSachCauHoi || [];
  const isOpen = quiz.TrangThai === 'Open';

  const streakDays = Number(memberProfile.StreakDays) || 0;
  const wrongIds = memberProfile.WrongQuestionIds || [];
  const bookmarkIds = memberProfile.BookmarkedQuestionIds || [];

  const hasOfficialResult = Boolean(userResult && userResult.IsOfficial !== false);

  // 1. Render Bảng Xếp Hạng Mini (Leaderboard)
  let leaderboardHtml = '';
  if (leaderboard && leaderboard.length > 0) {
    const topRows = leaderboard.slice(0, 5).map((r, idx) => {
      let rankBadge = '';
      if (idx === 0) rankBadge = '<span class="text-amber-500 font-bold">🥇 #1</span>';
      else if (idx === 1) rankBadge = '<span class="text-slate-400 font-bold">🥈 #2</span>';
      else if (idx === 2) rankBadge = '<span class="text-amber-700 dark:text-amber-600 font-bold">🥉 #3</span>';
      else rankBadge = `<span class="text-ink-muted font-mono">#${idx + 1}</span>`;

      const m = Math.floor((r.ThoiGianLamGiay || 0) / 60);
      const s = (r.ThoiGianLamGiay || 0) % 60;
      const timeStr = `${m}m ${s < 10 ? '0' : ''}${s}s`;

      return `
        <tr class="border-b border-hairline/60 hover:bg-subtle/40 transition-colors">
          <td class="py-2.5 px-3 text-center text-xs">${rankBadge}</td>
          <td class="py-2.5 px-3 text-xs font-semibold text-ink">${escapeHTML(r.HoTen || r.MSSV)}</td>
          <td class="py-2.5 px-3 text-xs text-ink-muted font-mono hidden sm:table-cell">${escapeHTML(r.MSSV)}</td>
          <td class="py-2.5 px-3 text-right font-mono font-bold text-accent text-sm">${r.DiemSo}</td>
          <td class="py-2.5 px-3 text-right text-[11px] text-ink-faint font-mono hidden sm:table-cell">${timeStr}</td>
        </tr>
      `;
    }).join('');

    leaderboardHtml = `
      <div class="bht-card p-5 bg-surface border border-hairline space-y-3">
        <div class="flex items-center justify-between pb-2 border-b border-hairline">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-trophy text-amber-500"></i>
            <h4 class="font-bold text-xs sm:text-sm text-ink uppercase tracking-wider">Bảng Xếp Hạng Buổi Sinh Hoạt</h4>
          </div>
          <span class="text-xs text-ink-muted font-mono">${leaderboard.length} thí sinh đã nộp</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[11px] text-ink-muted uppercase border-b border-hairline">
                <th class="py-2 px-3 text-center">Hạng</th>
                <th class="py-2 px-3">Họ Tên</th>
                <th class="py-2 px-3 hidden sm:table-cell">MSSV</th>
                <th class="py-2 px-3 text-right">Điểm</th>
                <th class="py-2 px-3 text-right hidden sm:table-cell">Thời Gian</th>
              </tr>
            </thead>
            <tbody>
              ${topRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return `
    <div class="space-y-4 sm:space-y-5 max-w-3xl mx-auto">
      <!-- 1. HEADER CARD: TỔNG QUAN ĐỀ THI & KẾT QUẢ CÁ NHÂN -->
      <div class="bht-card p-4 sm:p-6 md:p-7 bg-surface border border-hairline space-y-4 sm:space-y-5 relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              ${hasOfficialResult ? `
                <span class="bht-badge bht-badge-ok text-[11px] sm:text-xs">
                  <i class="fa-solid fa-circle-check mr-1"></i> <span class="hidden sm:inline">Đã hoàn thành bài thi chính thức</span><span class="sm:hidden">Đã hoàn thành bài thi</span>
                </span>
              ` : (
                isOpen ? `
                  <span class="bht-badge bht-badge-ok text-[11px] sm:text-xs">
                    <i class="fa-solid fa-bolt mr-1"></i> Đang mở thi
                  </span>
                ` : `
                  <span class="bht-badge bg-subtle text-ink-muted text-[11px] sm:text-xs">
                    <i class="fa-solid fa-lock mr-1"></i> Đề thi đang đóng
                  </span>
                `
              )}
              <span class="bht-badge bg-subtle text-ink font-mono text-[11px] sm:text-xs">${thoiGianPhut} Phút</span>
              <span class="bht-badge bg-subtle text-ink font-mono text-[11px] sm:text-xs">${questions.length} Câu</span>
            </div>
            <h3 class="bht-heading-serif text-lg sm:text-2xl font-bold text-ink leading-snug">${tieuDe}</h3>
            ${moTa ? `<p class="text-xs text-ink-muted leading-relaxed line-clamp-3 sm:line-clamp-none">${moTa}</p>` : ''}
          </div>

          <!-- Official Result Badge (if submitted) -->
          ${hasOfficialResult ? `
            <div class="flex items-center gap-3 shrink-0 sm:border-l sm:border-hairline sm:pl-6 text-center justify-center sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline">
              <div>
                <div class="text-3xl sm:text-4xl font-extrabold text-accent font-mono">${userResult.DiemSo}</div>
                <div class="text-[11px] text-ink-muted font-medium mt-0.5">Điểm chính thức (${userResult.SoCauDung}/${userResult.TongSoCau} câu)</div>
                <div class="text-[10px] text-ink-faint font-mono mt-0.5">Đã chốt xếp hạng</div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 2. STREAK & PERSONAL POOLS -->
        <div class="pt-3 sm:pt-4 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
          <div class="flex items-center gap-2">
            <span class="bht-badge bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs shrink-0">
              🔥 ${streakDays} Ngày Streak
            </span>
            <span class="text-ink-muted text-[11px] sm:text-xs">Giữ streak mỗi ngày để nâng hạng</span>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            ${wrongIds.length > 0 ? `
              <button 
                type="button" 
                data-action="switch-quiz-pool" 
                data-pool="wrong" 
                class="bht-btn bht-btn-secondary bht-btn-xs text-rose-500 hover:text-rose-600 font-mono"
                title="Ôn tập các câu bạn đã từng trả lời sai"
              >
                <i class="fa-solid fa-bullseye text-[10px]"></i>
                <span>${wrongIds.length} Câu sai</span>
              </button>
            ` : ''}
            ${bookmarkIds.length > 0 ? `
              <button 
                type="button" 
                data-action="switch-quiz-pool" 
                data-pool="bookmark" 
                class="bht-btn bht-btn-secondary bht-btn-xs text-amber-500 hover:text-amber-600 font-mono"
                title="Xem các câu đã đánh dấu sao"
              >
                <i class="fa-solid fa-star text-[10px]"></i>
                <span>${bookmarkIds.length} Đã lưu</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- 3. ACTION HUB: BẮT ĐẦU THI HOẶC VÀO PHÒNG ÔN LUYỆN -->
      <div class="bht-card p-5 sm:p-7 bg-surface border border-hairline space-y-3.5 sm:space-y-4 text-center">
        ${!hasOfficialResult ? `
          <!-- CHƯA THI CHÍNH THỨC -->
          <div class="max-w-md mx-auto space-y-1.5 sm:space-y-2">
            <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-accent-soft text-accent mx-auto flex items-center justify-center text-lg sm:text-xl">
              <i class="fa-solid fa-stopwatch"></i>
            </div>
            <h4 class="bht-heading-serif text-base sm:text-lg font-bold text-ink">Bài Thi Đánh Giá Cuối Buổi</h4>
            <p class="text-xs text-ink-muted leading-relaxed">
              Mỗi sinh viên chỉ được làm bài tính điểm trong thời gian ${thoiGianPhut} phút để xếp hạng cuối buổi. Sau khi nộp bài, bạn có thể vào phòng ôn luyện tự do.
            </p>
          </div>

          <div class="pt-1 sm:pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
            ${isOpen ? `
              <button 
                type="button"
                data-action="start-official-quiz"
                data-session-id="${sid}"
                data-quiz-id="${qid}"
                class="bht-btn bht-btn-primary bht-btn-md sm:bht-btn-lg font-semibold shadow-md px-6 sm:px-8 w-full sm:w-auto justify-center"
              >
                <i class="fa-solid fa-play text-xs mr-2"></i>
                <span>Bắt Đầu Làm Bài Thi</span>
              </button>
            ` : `
              <button 
                type="button"
                data-action="start-practice-quiz"
                data-session-id="${sid}"
                data-quiz-id="${qid}"
                class="bht-btn bht-btn-secondary bht-btn-md sm:bht-btn-lg font-semibold px-6 sm:px-8 w-full sm:w-auto justify-center"
              >
                <i class="fa-solid fa-bolt text-xs mr-2 text-accent"></i>
                <span>Vào Phòng Ôn Luyện Thử Sức</span>
              </button>
            `}
          </div>
        ` : `
          <!-- ĐÃ HOÀN THÀNH BÀI THI CHÍNH THỨC -->
          <div class="max-w-md mx-auto space-y-1.5 sm:space-y-2">
            <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center text-lg sm:text-xl">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <h4 class="bht-heading-serif text-base sm:text-lg font-bold text-ink">Phòng Ôn Luyện Toàn Màn Hình</h4>
            <p class="text-xs text-ink-muted leading-relaxed">
              Điểm thi của bạn đã được chốt. Hãy vào phòng ôn luyện toàn màn hình để làm lại vô hạn lần, đọc giải thích chi tiết và củng cố kiến thức!
            </p>
          </div>

          <div class="pt-1 sm:pt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <button 
              type="button"
              data-action="start-practice-quiz"
              data-session-id="${sid}"
              data-quiz-id="${qid}"
              class="bht-btn bht-btn-primary bht-btn-md font-semibold px-5 sm:px-6 w-full sm:w-auto justify-center"
            >
              <i class="fa-solid fa-expand text-xs mr-2"></i>
              <span class="hidden sm:inline">Vào Phòng Ôn Luyện Toàn Màn Hình</span>
              <span class="sm:hidden">Vào Phòng Ôn Luyện</span>
            </button>

            ${wrongIds.length > 0 ? `
              <button 
                type="button" 
                data-action="switch-quiz-pool" 
                data-pool="wrong" 
                class="bht-btn bht-btn-secondary bht-btn-md font-medium text-rose-500 hover:text-rose-600 w-full sm:w-auto justify-center"
              >
                <i class="fa-solid fa-bullseye text-xs mr-1.5"></i>
                <span>Ôn ${wrongIds.length} câu làm sai</span>
              </button>
            ` : ''}

            <button 
              type="button" 
              data-action="open-quiz-review-drawer" 
              class="bht-btn bht-btn-ghost bht-btn-md text-ink-muted hover:text-ink w-full sm:w-auto justify-center"
            >
              <i class="fa-solid fa-clipboard-check text-xs mr-1.5 text-accent"></i>
              <span>Xem Lời Giải Chi Tiết</span>
            </button>
          </div>
        `}
      </div>

      <!-- 4. LEADERBOARD BUỔI HỌC -->
      ${leaderboardHtml}

      <!-- 5. DANH SÁCH CHI TIẾT LỜI GIẢI (NẾU ĐÃ THI VÀ MUỐN XEM LẠI) -->
      ${hasOfficialResult ? `
        <div id="member-quiz-review-section" class="space-y-3 pt-2">
          <div class="flex items-center justify-between px-1">
            <h4 class="font-semibold text-xs text-ink uppercase tracking-wider">Chi Tiết Từng Câu & Giải Thích Học Thuật</h4>
            <span class="text-xs text-ink-muted font-mono">${questions.length} câu</span>
          </div>

          ${questions.map((q, idx) => {
            const userAns = (userResult.ChiTietTraLoi || {})[q.id];
            const isCorrect = Number(userAns) === Number(q.dapAnDung);
            const isBookmarked = bookmarkIds.includes(q.id);

            return `
              <div class="bht-card p-3.5 sm:p-5 bg-surface border border-hairline space-y-2.5 sm:space-y-3">
                <div class="flex items-start justify-between gap-2.5 sm:gap-3">
                  <h4 class="font-semibold text-xs sm:text-sm text-ink flex items-start gap-1.5 sm:gap-2 grow">
                    <span class="text-accent font-mono font-bold shrink-0">#${idx + 1}</span>
                    <span class="leading-snug">${escapeHTML(q.cauHoi)}</span>
                  </h4>
                  <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button 
                      type="button"
                      data-action="toggle-quiz-bookmark" 
                      data-question-id="${q.id}" 
                      class="text-xs ${isBookmarked ? 'text-amber-500' : 'text-ink-faint hover:text-amber-500'} p-1 active:scale-95"
                      title="${isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu sao'}"
                    >
                      <i class="fa-solid fa-star"></i>
                    </button>
                    <span class="${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'} font-semibold text-[11px] sm:text-xs flex items-center gap-1 shrink-0">
                      <i class="fa-solid ${isCorrect ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
                      <span class="hidden xs:inline">${isCorrect ? '+ Đúng' : 'Chưa đúng'}</span>
                    </span>
                  </div>
                </div>

                <div class="space-y-1.5 sm:space-y-2 pt-1">
                  ${(q.luaChon || []).map((optText, optIdx) => {
                    const isUserChoice = Number(userAns) === optIdx;
                    const isRightAnswer = Number(q.dapAnDung) === optIdx;

                    let optClass = 'border-hairline bg-surface text-ink-muted';
                    let badgeIcon = '';

                    if (isRightAnswer) {
                      optClass = 'border-teal-500/60 bg-teal-500/10 text-ink font-medium';
                      badgeIcon = '<span class="text-[11px] sm:text-xs text-accent font-semibold flex items-center gap-1 shrink-0"><i class="fa-solid fa-check"></i> Đáp án đúng</span>';
                    } else if (isUserChoice && !isCorrect) {
                      optClass = 'border-rose-500/60 bg-rose-500/10 text-ink font-medium';
                      badgeIcon = '<span class="text-[11px] sm:text-xs text-rose-500 font-semibold flex items-center gap-1 shrink-0"><i class="fa-solid fa-xmark"></i> Bạn chọn</span>';
                    }

                    return `
                      <div class="p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 ${optClass}">
                        <div class="flex items-start gap-2">
                          <span class="w-5 h-5 rounded-md bg-subtle text-ink font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                            ${String.fromCharCode(65 + optIdx)}
                          </span>
                          <span class="leading-relaxed">${escapeHTML(optText)}</span>
                        </div>
                        ${badgeIcon}
                      </div>
                    `;
                  }).join('')}
                </div>

                ${q.giaiThich ? `
                  <div class="p-3 rounded-xl bg-accent-soft/60 border border-hairline text-xs text-ink space-y-1">
                    <div class="font-semibold text-accent flex items-center gap-1.5">
                      <i class="fa-solid fa-lightbulb"></i>
                      <span>Giải thích học thuật:</span>
                    </div>
                    <p class="text-ink-muted leading-relaxed pl-4 text-[11px] sm:text-xs">${escapeHTML(q.giaiThich)}</p>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    </div>
  `.trim();
}

/**
 * Render bảng điều khiển Trắc nghiệm & Phân tích cho Quản Trị Viên (Admin Panel)
 * Tối ưu responsive: Bảng bài nộp co gọn các cột phụ trên mobile, card phân tích tỷ lệ đúng linh hoạt.
 * @param {Object|null} quiz Thông tin bộ đề
 * @param {Array} results Danh sách kết quả nộp bài của sinh viên
 * @param {Object|null} stats Thống kê câu hỏi & tỷ lệ đúng
 * @param {string} sessionId Mã buổi học
 * @returns {string} Chuỗi HTML
 */
export function renderAdminQuizPanel(quiz, results = [], stats = null, sessionId = '') {
  const sid = escapeHTML(sessionId || (quiz && quiz.SessionID) || '');

  // 1. Nếu chưa có đề trắc nghiệm cho buổi này
  if (!quiz) {
    return `
      <div class="bht-card p-6 sm:p-8 text-center bg-surface border border-dashed border-hairline space-y-3">
        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-accent-soft text-accent mx-auto flex items-center justify-center text-xl sm:text-2xl shadow-sm">
          <i class="fa-solid fa-circle-question"></i>
        </div>
        <h3 class="bht-heading-serif text-base sm:text-lg font-bold text-ink">Chưa khởi tạo đề trắc nghiệm cho buổi học này</h3>
        <p class="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
          Tạo ngân hàng câu hỏi trắc nghiệm kiểm tra nhanh 10 phút cuối buổi hoặc đề ôn tập củng cố kiến thức cho thành viên.
        </p>
        <div class="pt-2">
          <button 
            data-action="open-create-quiz-modal"
            data-session-id="${sid}"
            class="bht-btn bht-btn-primary bht-btn-sm"
          >
            <i class="fa-solid fa-plus text-xs mr-1"></i>
            <span>Soạn đề trắc nghiệm mới</span>
          </button>
        </div>
      </div>
    `.trim();
  }

  const qid = escapeHTML(quiz.QuizID || '');
  const tieuDe = escapeHTML(quiz.TieuDe || 'Đề trắc nghiệm');
  const moTa = escapeHTML(quiz.MoTa || '');
  const thoiGianPhut = Number(quiz.ThoiGianPhut) || 10;
  const questions = quiz.DanhSachCauHoi || [];
  const isOpen = quiz.TrangThai === 'Open';

  const totalSubs = results.length;
  const avgScore = stats ? stats.avgScore : (totalSubs ? Math.round(results.reduce((s, r) => s + Number(r.DiemSo || 0), 0) / totalSubs) : 0);
  const passSubs = results.filter(r => Number(r.DiemSo) >= 60).length;
  const passRate = totalSubs ? Math.round((passSubs / totalSubs) * 100) : 0;

  // Bảng phân tích tỷ lệ làm đúng từng câu
  const questionAnalyticsHtml = (stats && stats.questionStats ? stats.questionStats : questions.map(q => {
    const correctCount = results.filter(r => r.ChiTietTraLoi && Number(r.ChiTietTraLoi[q.id]) === Number(q.dapAnDung)).length;
    return {
      id: q.id,
      cauHoi: q.cauHoi,
      correctCount,
      totalCount: totalSubs,
      accuracyRate: totalSubs ? Math.round((correctCount / totalSubs) * 100) : 0
    };
  })).map((qs, idx) => {
    const qNum = idx + 1;
    const rate = qs.accuracyRate;
    let rateColor = 'bg-accent text-white';
    if (rate < 50) rateColor = 'bg-rose-500 text-white';
    else if (rate < 75) rateColor = 'bg-amber-500 text-white';

    return `
      <div class="p-2.5 sm:p-3 rounded-lg border border-hairline bg-surface space-y-1.5 sm:space-y-2">
        <div class="flex items-start justify-between gap-2.5 text-xs">
          <div class="font-medium text-ink flex items-start gap-1.5 grow">
            <span class="text-accent font-mono font-bold shrink-0">#${qNum}</span>
            <span class="line-clamp-2 sm:line-clamp-none">${escapeHTML(qs.cauHoi)}</span>
          </div>
          <span class="bht-badge ${rate >= 70 ? 'bht-badge-ok' : 'bht-badge-warn'} text-[10px] shrink-0 font-mono">
            ${qs.correctCount}/${qs.totalCount} đúng (${rate}%)
          </span>
        </div>
        <div class="w-full bg-subtle h-1.5 rounded-full overflow-hidden">
          <div class="${rateColor} h-full rounded-full transition-all duration-300" style="width: ${rate}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  // Bảng kết quả nộp bài của sinh viên (Ẩn cột ngày nộp trên màn hình nhỏ)
  const resultsTableRows = results.map((r, idx) => {
    const mssv = escapeHTML(r.MSSV || '');
    const hoTen = escapeHTML(r.HoTen || '');
    const diem = Number(r.DiemSo) || 0;
    const soDung = Number(r.SoCauDung) || 0;
    const tongCau = Number(r.TongSoCau) || questions.length || 1;
    const thoiGianNop = escapeHTML(r.ThoiGianNop || '');

    return `
      <tr class="hover:bg-subtle/40 border-b border-hairline transition-colors">
        <td class="p-2.5 sm:p-3 text-center text-xs font-mono font-bold text-ink-muted">#${idx + 1}</td>
        <td class="p-2.5 sm:p-3 font-mono text-xs font-semibold text-accent">${mssv}</td>
        <td class="p-2.5 sm:p-3 text-xs font-medium text-ink truncate max-w-[120px] sm:max-w-none">${hoTen}</td>
        <td class="p-2.5 sm:p-3 text-center">
          <span class="bht-badge ${diem >= 80 ? 'bht-badge-ok' : diem >= 60 ? 'bg-accent-soft text-accent' : 'bht-badge-err'} text-[11px] sm:text-xs font-mono font-bold">
            ${diem}/100
          </span>
        </td>
        <td class="p-2.5 sm:p-3 text-center text-xs font-mono text-ink-muted hidden md:table-cell">${soDung}/${tongCau}</td>
        <td class="p-2.5 sm:p-3 text-right text-xs font-mono text-ink-muted hidden lg:table-cell">${thoiGianNop}</td>
        <td class="p-2.5 sm:p-3 text-center">
          <button 
            type="button"
            data-action="reset-member-quiz-submission"
            data-session-id="${sid}"
            data-quiz-id="${qid}"
            data-mssv="${mssv}"
            class="bht-btn bht-btn-ghost bht-btn-xs text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 font-mono"
            title="Cho sinh viên ${mssv} thi lại"
          >
            <i class="fa-solid fa-rotate-left mr-1 text-[10px]"></i>
            <span class="hidden xs:inline">Thi lại</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="space-y-4">
      <!-- HEADER CONTROLS -->
      <div class="bht-card p-4 sm:p-5 bg-surface border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="bht-badge ${isOpen ? 'bht-badge-ok' : 'bg-subtle text-ink-faint'} text-[11px]">
              ${isOpen ? 'Đang mở cho làm bài' : 'Đang đóng'}
            </span>
            <span class="bht-badge bg-subtle text-ink font-mono text-[11px]">${questions.length} câu • ${thoiGianPhut} phút</span>
          </div>
          <h3 class="bht-heading-serif text-base sm:text-lg font-bold text-ink">${tieuDe}</h3>
          ${moTa ? `<p class="text-xs text-ink-muted line-clamp-2">${moTa}</p>` : ''}
        </div>

        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline">
          ${isOpen ? `
            <button 
              data-action="toggle-admin-quiz-status"
              data-session-id="${sid}"
              data-quiz-id="${qid}"
              data-status="Closed"
              class="bht-btn bht-btn-secondary text-amber-600 dark:text-amber-400 bht-btn-xs sm:bht-btn-sm"
              title="Kết thúc bài thi sớm hơn thời gian đếm ngược và chốt bảng điểm"
            >
              <i class="fa-solid fa-flag-checkered mr-1 text-xs"></i>
              <span>Khóa điểm</span>
            </button>
          ` : `
            <button 
              data-action="toggle-admin-quiz-status"
              data-session-id="${sid}"
              data-quiz-id="${qid}"
              data-status="Open"
              class="bht-btn bht-btn-primary bht-btn-xs sm:bht-btn-sm"
            >
              <i class="fa-solid fa-lock-open mr-1 text-xs"></i>
              <span>Mở đề</span>
            </button>
          `}

          ${totalSubs > 0 ? `
            <button 
              data-action="reset-all-quiz-submissions"
              data-session-id="${sid}"
              data-quiz-id="${qid}"
              class="bht-btn bht-btn-ghost text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 bht-btn-xs sm:bht-btn-sm font-medium"
              title="Reset toàn bộ kết quả để cho cả lớp thi lại từ đầu"
            >
              <i class="fa-solid fa-rotate mr-1 text-xs"></i>
              <span>Thi lại cả lớp</span>
            </button>
          ` : ''}

          <button 
            data-action="open-edit-quiz-modal"
            data-session-id="${sid}"
            data-quiz-id="${qid}"
            class="bht-btn bht-btn-secondary bht-btn-xs sm:bht-btn-sm"
          >
            <i class="fa-solid fa-pen-to-square mr-1 text-xs"></i>
            <span>Sửa đề</span>
          </button>
          <button 
            data-action="delete-admin-quiz"
            data-session-id="${sid}"
            data-quiz-id="${qid}"
            class="bht-btn bht-btn-danger bht-btn-xs sm:bht-btn-sm"
            title="Xóa đề trắc nghiệm này"
          >
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </div>

      <!-- ANALYTICS KPI CARDS -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div class="bht-card p-3.5 sm:p-4 bg-surface border border-hairline text-center">
          <div class="text-xs text-ink-muted mb-0.5">Số lượng đã làm bài</div>
          <div class="text-xl sm:text-2xl font-bold font-mono text-ink">${totalSubs} <span class="text-xs font-normal text-ink-muted">bài nộp</span></div>
        </div>
        <div class="bht-card p-3.5 sm:p-4 bg-surface border border-hairline text-center">
          <div class="text-xs text-ink-muted mb-0.5">Điểm trung bình lớp</div>
          <div class="text-xl sm:text-2xl font-bold font-mono text-accent">${avgScore}<span class="text-xs font-normal text-ink-muted">/100</span></div>
        </div>
        <div class="bht-card p-3.5 sm:p-4 bg-surface border border-hairline text-center">
          <div class="text-xs text-ink-muted mb-0.5">Tỷ lệ đạt (≥60đ)</div>
          <div class="text-xl sm:text-2xl font-bold font-mono ${passRate >= 70 ? 'text-accent' : 'text-amber-500'}">${passRate}%</div>
        </div>
      </div>

      <!-- TWO COLUMNS: QUESTION BREAKDOWN & LEADERBOARD -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
        <!-- Question Breakdown -->
        <div class="bht-card p-3.5 sm:p-5 bg-surface border border-hairline space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-hairline">
            <h4 class="font-semibold text-xs sm:text-sm text-ink flex items-center gap-1.5 sm:gap-2">
              <i class="fa-solid fa-chart-simple text-accent"></i>
              <span>Phân tích mức độ hiểu bài theo câu</span>
            </h4>
            <span class="text-[11px] text-ink-muted font-mono">${questions.length} câu</span>
          </div>
          <div class="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            ${questionAnalyticsHtml || '<p class="text-xs text-ink-muted text-center py-4">Chưa có dữ liệu bài nộp</p>'}
          </div>
        </div>

        <!-- Leaderboard Table -->
        <div class="bht-card p-3.5 sm:p-5 bg-surface border border-hairline space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-hairline">
            <h4 class="font-semibold text-xs sm:text-sm text-ink flex items-center gap-1.5 sm:gap-2">
              <i class="fa-solid fa-ranking-star text-accent"></i>
              <span>Bảng điểm bài nộp (${totalSubs})</span>
            </h4>
          </div>
          <div class="overflow-x-auto max-h-[360px] overflow-y-auto -mx-1 sm:mx-0">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-hairline text-[11px] uppercase tracking-wider text-ink-muted bg-subtle/50">
                  <th class="p-2 sm:p-2.5 text-center">Hạng</th>
                  <th class="p-2 sm:p-2.5">MSSV</th>
                  <th class="p-2 sm:p-2.5">Họ tên</th>
                  <th class="p-2 sm:p-2.5 text-center">Điểm</th>
                  <th class="p-2 sm:p-2.5 text-center hidden md:table-cell">Đúng</th>
                  <th class="p-2 sm:p-2.5 text-right hidden lg:table-cell">Thời gian</th>
                  <th class="p-2 sm:p-2.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                ${resultsTableRows || '<tr><td colspan="7" class="p-6 text-center text-xs text-ink-muted">Chưa có sinh viên nào nộp bài</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `.trim();
}
