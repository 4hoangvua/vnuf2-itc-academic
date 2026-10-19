/**
 * MODULE TRẮC NGHIỆM & ÔN TẬP THÀNH VIÊN (MEMBER QUIZ & ZEN ARENA)
 * Tách từ frontend/modules/member.js để tinh giản kích thước và module hóa hệ thống.
 * 
 * Phụ trách:
 * 1. State máy trạng thái phòng thi / ôn luyện (Zen Focus Arena)
 * 2. Timer đếm ngược, bàn phím tắt (Keyboard shortcuts 1-4, Z, X, S, M)
 * 3. Tự động chuyển câu 1.2s, bookmark câu hỏi, lọc câu sai
 * 4. Chấm điểm & ghi danh Leaderboard thời gian thực
 */

import { callApi } from '../../services/api.js';
import { 
  showToast, 
  showGlobalLoading, 
  hideGlobalLoading 
} from '../ui.js';
import { 
  renderMemberQuizView, 
  renderQuizQuestionGridContent, 
  renderZenQuestionCard, 
  renderZenFooterDock 
} from '../templates/quizTemplates.js';
import { 
  getCurrentMemberUser, 
  switchMemberSessionSubTab, 
  getCurrentMemberDetailSessionId, 
  setCurrentMemberDetailSessionId 
} from '../member.js';

// State Quản lý Trắc nghiệm Ôn tập cho Member (Single-Question Focus & Gamification)
export let currentMemberQuiz = null;
export let currentMemberQuizResult = null;
export let currentQuizLeaderboard = [];
export let isTakingMemberQuiz = false;
export let currentQuizPool = [];
export let quizCurrentIndex = 0;
export let quizMode = 'practice'; // 'practice' (Instant Feedback) | 'exam' (Bấm giờ)
export let quizPoolType = 'session'; // 'session' | 'wrong' | 'bookmark'
export let quizAutoNext = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function'
  ? (localStorage.getItem('bht_quiz_autonext') !== '0')
  : true;
export let memberQuizAnswers = {};
export let memberQuizAnswerResults = {}; // { [qId]: { isCorrect, correctIndex, explanation } }
export let memberQuizProfile = { StreakDays: 0, WrongQuestionIds: [], BookmarkedQuestionIds: [] };
export let memberQuizRemainingSeconds = null;
export let memberQuizTimerInterval = null;
export let memberQuizStartTime = null;
export let quizAutoNextTimeout = null;
export let isQuizKeydownBound = false;

/**
 * Cập nhật giao diện trong Zen Focus Arena (Phòng thi & Ôn luyện cao toàn màn hình)
 */
export function renderActiveZenQuizView() {
  const modal = document.getElementById('modal-quiz-zen-arena');
  if (!modal) return;

  modal.classList.remove('hidden');

  const totalCount = currentQuizPool.length;
  const safeIndex = Math.max(0, Math.min(quizCurrentIndex, totalCount - 1));
  const currentQ = currentQuizPool[safeIndex];
  if (!currentQ) return;

  const answeredCount = Object.keys(memberQuizAnswers).length;
  const progressPercent = totalCount ? Math.round(((safeIndex + 1) / totalCount) * 100) : 0;
  const isPractice = (quizMode === 'practice');
  const isBookmarked = (memberQuizProfile.BookmarkedQuestionIds || []).includes(currentQ.id);

  // 1. Header Badges & Title
  const modeBadge = document.getElementById('zen-quiz-mode-badge');
  if (modeBadge) {
    if (isPractice) {
      modeBadge.className = 'bht-badge bg-accent-soft text-accent text-xs font-semibold';
      modeBadge.textContent = 'Phòng Ôn Luyện Tự Do';
    } else {
      modeBadge.className = 'bht-badge bht-badge-warn text-xs font-semibold';
      modeBadge.textContent = 'Bài Thi Chính Thức';
    }
  }

  const poolBadge = document.getElementById('zen-quiz-pool-badge');
  if (poolBadge) {
    if (quizPoolType === 'wrong') {
      poolBadge.classList.remove('hidden');
      poolBadge.className = 'bht-badge bht-badge-err text-[10px] font-mono';
      poolBadge.textContent = 'Đang ôn câu sai';
    } else if (quizPoolType === 'bookmark') {
      poolBadge.classList.remove('hidden');
      poolBadge.className = 'bht-badge bg-amber-500/10 text-amber-500 text-[10px] font-mono';
      poolBadge.textContent = 'Đang ôn câu đã lưu';
    } else {
      poolBadge.classList.add('hidden');
    }
  }

  const headerTitle = document.getElementById('zen-quiz-header-title');
  if (headerTitle) {
    headerTitle.textContent = currentMemberQuiz ? (currentMemberQuiz.TieuDe || 'Đề trắc nghiệm') : 'Ôn luyện câu hỏi';
  }

  // 2. Timer Container
  const timerContainer = document.getElementById('zen-quiz-timer-container');
  if (timerContainer) {
    if (!isPractice && memberQuizRemainingSeconds !== null) {
      timerContainer.classList.remove('hidden');
      timerContainer.classList.add('flex');
      const m = Math.floor(memberQuizRemainingSeconds / 60);
      const s = memberQuizRemainingSeconds % 60;
      const timerEl = document.getElementById('zen-quiz-countdown-timer');
      if (timerEl) timerEl.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    } else {
      timerContainer.classList.add('hidden');
      timerContainer.classList.remove('flex');
    }
  }

  // 3. Bookmark Button
  const btnBookmark = document.getElementById('zen-btn-bookmark');
  if (btnBookmark) {
    btnBookmark.dataset.questionId = currentQ.id;
    if (isBookmarked) {
      btnBookmark.className = 'bht-btn bht-btn-ghost bht-btn-sm text-amber-500 p-2';
      btnBookmark.title = 'Bỏ đánh dấu sao (Phím S)';
    } else {
      btnBookmark.className = 'bht-btn bht-btn-ghost bht-btn-sm text-ink-muted hover:text-amber-500 p-2';
      btnBookmark.title = 'Đánh dấu sao câu này (Phím S)';
    }
  }

  // 4. Counter & Progress Bar
  const counterEl = document.getElementById('zen-quiz-counter');
  if (counterEl) counterEl.textContent = `${safeIndex + 1}/${totalCount}`;

  const progressBar = document.getElementById('zen-quiz-progress-bar');
  if (progressBar) progressBar.style.width = `${progressPercent}%`;

  // 5. Render Question Card
  const questionContainer = document.getElementById('zen-quiz-question-container');
  if (questionContainer) {
    questionContainer.innerHTML = renderZenQuestionCard(
      currentQ,
      safeIndex,
      totalCount,
      memberQuizAnswers[currentQ.id],
      memberQuizAnswerResults[currentQ.id],
      isPractice,
      isBookmarked,
      quizAutoNext
    );
  }

  // 6. Render Footer Navigation Dock
  const footerDock = document.getElementById('zen-quiz-footer-dock');
  if (footerDock) {
    footerDock.innerHTML = renderZenFooterDock(
      safeIndex,
      totalCount,
      answeredCount,
      isPractice,
      getCurrentMemberDetailSessionId(),
      currentMemberQuiz ? currentMemberQuiz.QuizID : ''
    );
  }
}

/**
 * Đăng ký lắng nghe phím tắt toàn cục cho màn hình Trắc nghiệm (1 lần duy nhất)
 */
export function bindQuizKeyboardShortcuts() {
  if (isQuizKeydownBound) return;
  isQuizKeydownBound = true;

  window.addEventListener('keydown', (e) => {
    if (!isTakingMemberQuiz || !currentQuizPool || !currentQuizPool.length) return;

    const targetTag = (e.target && e.target.tagName) || '';
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') return;

    const currentQ = currentQuizPool[quizCurrentIndex];
    if (!currentQ) return;

    const optionMap = {
      '1': 0, 'a': 0, 'A': 0,
      '2': 1, 'b': 1, 'B': 1,
      '3': 2, 'c': 2, 'C': 2,
      '4': 3, 'd': 3, 'D': 3
    };

    if (optionMap[e.key] !== undefined) {
      const optIdx = optionMap[e.key];
      if (currentQ.luaChon && currentQ.luaChon[optIdx] !== undefined) {
        if (quizMode === 'exam' || !memberQuizAnswerResults[currentQ.id]) {
          handleSelectQuizOption(currentQ.id, optIdx);
        }
      }
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'z' || e.key === 'Z') {
      handlePrevQuizQuestion();
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'x' || e.key === 'X') {
      handleNextQuizQuestion();
      return;
    }

    if (e.key === 's' || e.key === 'S') {
      handleToggleQuizBookmark(currentQ.id);
      return;
    }

    if (e.key === 'm' || e.key === 'M' || e.key === 'g' || e.key === 'G') {
      handleOpenQuizGridModal();
      return;
    }

    if (e.key === 'Escape') {
      handleCloseQuizGridModal();
      return;
    }
  });
}

/**
 * Tải và hiển thị Dashboard Quản lý Trắc nghiệm của buổi học cho Thành viên
 * @param {string} sessionId
 */
export async function loadMemberQuiz(sessionId) {
  const container = document.getElementById('member-subtab-quiz-content');
  if (!container || !sessionId) return;

  const currentUser = getCurrentMemberUser();
  const currentMssv = currentUser.mssv || (typeof localStorage !== 'undefined' ? localStorage.getItem('bht_mssv') : '') || '';

  bindQuizKeyboardShortcuts();

  try {
    const res = await callApi('getQuizBySession', {
      sessionId,
      mssv: currentMssv,
      isAdmin: false
    });

    try {
      const profRes = await callApi('getMemberQuizProfile', { mssv: currentMssv });
      if (profRes.success && profRes.data) {
        memberQuizProfile = profRes.data;
      }
    } catch (e) {
      console.warn('Không thể tải profile trắc nghiệm:', e);
    }

    if (res.success && res.data) {
      currentMemberQuiz = res.data.quiz;
      currentMemberQuizResult = res.data.userResult;
      currentQuizLeaderboard = res.data.leaderboard || [];
      if (!isTakingMemberQuiz) {
        memberQuizAnswers = {};
        memberQuizAnswerResults = {};
        quizCurrentIndex = 0;
        quizPoolType = 'session';
        currentQuizPool = currentMemberQuiz ? (currentMemberQuiz.DanhSachCauHoi || []) : [];

        if (memberQuizTimerInterval) {
          clearInterval(memberQuizTimerInterval);
          memberQuizTimerInterval = null;
        }

        // Đảm bảo đóng Zen Arena nếu đang mở
        const zenModal = document.getElementById('modal-quiz-zen-arena');
        if (zenModal) zenModal.classList.add('hidden');
      }

      container.innerHTML = renderMemberQuizView(currentMemberQuiz, currentMemberQuizResult, {
        sessionId,
        memberProfile: memberQuizProfile,
        leaderboard: currentQuizLeaderboard
      });
    } else {
      container.innerHTML = renderMemberQuizView(null, null, { sessionId, memberProfile: memberQuizProfile });
    }
  } catch (err) {
    console.error('Lỗi khi tải đề trắc nghiệm:', err);
    container.innerHTML = `
      <div class="bht-card p-6 text-center text-xs text-ink-muted">
        <i class="fa-solid fa-triangle-exclamation text-amber-500 text-lg mb-2"></i>
        <p>Không thể tải đề trắc nghiệm. Vui lòng thử lại sau.</p>
      </div>
    `;
  }
}

/**
 * Bắt đầu làm Bài Thi Chính Thức (Tính giờ đếm ngược, nộp 1 lần duy nhất cho xếp hạng)
 * @param {string} sessionId
 * @param {string} quizId
 */
export async function handleStartOfficialQuiz(sessionId, quizId) {
  if (sessionId) setCurrentMemberDetailSessionId(sessionId);
  if (!currentMemberQuiz) return;

  // Nếu sinh viên đã có kết quả thi chính thức rồi -> Không cho thi lại để ghi đè điểm
  if (currentMemberQuizResult && currentMemberQuizResult.IsOfficial !== false) {
    showToast('Bạn đã hoàn thành bài thi chính thức! Đang mở phòng ôn luyện...', 'info');
    handleStartPracticeQuiz(sessionId, quizId);
    return;
  }

  if (currentMemberQuiz.TrangThai !== 'Open') {
    showToast('Đề thi tính giờ hiện đang đóng, không thể làm bài thi chính thức!', 'warning');
    return;
  }

  quizMode = 'exam';
  quizPoolType = 'session';
  isTakingMemberQuiz = true;
  const examLimit = Number(currentMemberQuiz.SoCauThi) || (currentMemberQuiz.DanhSachCauHoi || []).length;
  currentQuizPool = (currentMemberQuiz.DanhSachCauHoi || []).slice(0, examLimit);
  quizCurrentIndex = 0;
  memberQuizAnswers = {};
  memberQuizAnswerResults = {};
  memberQuizStartTime = Date.now();

  if (memberQuizTimerInterval) {
    clearInterval(memberQuizTimerInterval);
    memberQuizTimerInterval = null;
  }

  const durationMinutes = Number(currentMemberQuiz.ThoiGianPhut) || 10;
  memberQuizRemainingSeconds = durationMinutes * 60;

  memberQuizTimerInterval = setInterval(() => {
    memberQuizRemainingSeconds--;
    const timerEl = document.getElementById('zen-quiz-countdown-timer');
    if (timerEl) {
      const m = Math.floor(memberQuizRemainingSeconds / 60);
      const s = memberQuizRemainingSeconds % 60;
      timerEl.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    if (memberQuizRemainingSeconds <= 0) {
      clearInterval(memberQuizTimerInterval);
      memberQuizTimerInterval = null;
      showToast('Đã hết thời gian làm bài! Hệ thống đang tự động nộp bài...', 'info');
      handleSubmitMemberQuiz(sessionId, quizId);
    }
  }, 1000);

  renderActiveZenQuizView();
}

/**
 * Vào Phòng Ôn Luyện Toàn Màn Hình (Làm lại vô hạn lần, có giải thích tức thì & auto-next 1.2s)
 * @param {string} sessionId
 * @param {string} quizId
 * @param {string} [customPool] 'session' | 'wrong' | 'bookmark'
 */
export async function handleStartPracticeQuiz(sessionId, quizId, customPool) {
  if (sessionId) setCurrentMemberDetailSessionId(sessionId);
  quizMode = 'practice';
  quizPoolType = customPool || 'session';
  isTakingMemberQuiz = true;

  if (memberQuizTimerInterval) {
    clearInterval(memberQuizTimerInterval);
    memberQuizTimerInterval = null;
  }

  if (quizPoolType === 'wrong') {
    try {
      const res = await callApi('getPersonalQuizPool', { poolType: 'wrong' });
      if (res.success && res.data && res.data.questions && res.data.questions.length) {
        currentQuizPool = res.data.questions;
      } else {
        showToast('Bạn hiện không có câu hỏi nào trong danh sách sai!', 'info');
        quizPoolType = 'session';
        currentQuizPool = currentMemberQuiz ? (currentMemberQuiz.DanhSachCauHoi || []) : [];
      }
    } catch (e) {
      console.warn('Lỗi tải pool câu sai:', e);
      currentQuizPool = currentMemberQuiz ? (currentMemberQuiz.DanhSachCauHoi || []) : [];
    }
  } else if (quizPoolType === 'bookmark') {
    try {
      const res = await callApi('getPersonalQuizPool', { poolType: 'bookmark' });
      if (res.success && res.data && res.data.questions && res.data.questions.length) {
        currentQuizPool = res.data.questions;
      } else {
        showToast('Bạn chưa đánh dấu sao câu hỏi nào!', 'info');
        quizPoolType = 'session';
        currentQuizPool = currentMemberQuiz ? (currentMemberQuiz.DanhSachCauHoi || []) : [];
      }
    } catch (e) {
      console.warn('Lỗi tải pool bookmark:', e);
      currentQuizPool = currentMemberQuiz ? (currentMemberQuiz.DanhSachCauHoi || []) : [];
    }
  } else {
    currentQuizPool = currentMemberQuiz ? (currentMemberQuiz.DanhSachCauHoi || []) : [];
  }

  if (!currentQuizPool.length) {
    showToast('Không có câu hỏi nào để bắt đầu ôn tập!', 'warning');
    return;
  }

  quizCurrentIndex = 0;
  memberQuizAnswers = {};
  memberQuizAnswerResults = {};
  memberQuizStartTime = Date.now();
  memberQuizRemainingSeconds = null;

  renderActiveZenQuizView();
}

/**
 * Hàm wrapper tương thích ngược cho start-member-quiz
 */
export function handleStartMemberQuiz(sessionId, quizId, customMode) {
  if (customMode === 'exam') {
    handleStartOfficialQuiz(sessionId, quizId);
  } else {
    handleStartPracticeQuiz(sessionId, quizId);
  }
}

/**
 * Chọn phương án trắc nghiệm trong Zen Arena
 * @param {number|string} questionId
 * @param {number|string} optionIndex
 */
export async function handleSelectQuizOption(questionId, optionIndex) {
  if (!isTakingMemberQuiz) return;
  const optIdx = Number(optionIndex);
  memberQuizAnswers[questionId] = optIdx;

  if (quizMode === 'practice') {
    if (memberQuizAnswerResults[questionId]) return;

    // 1. Chấm điểm tại chỗ tức thì (Local-First: 0ms latency, 0 API call, bảo toàn quota GAS 100%)
    const currentQ = currentQuizPool[quizCurrentIndex] || currentQuizPool.find(q => String(q.id) === String(questionId));
    const hasAnswerKey = currentQ && currentQ.dapAnDung !== undefined;
    const isCorrect = hasAnswerKey ? (optIdx === Number(currentQ.dapAnDung)) : false;

    memberQuizAnswerResults[questionId] = {
      isCorrect: isCorrect,
      correctIndex: hasAnswerKey ? Number(currentQ.dapAnDung) : optIdx,
      explanation: (currentQ && currentQ.giaiThich) || ''
    };

    // 2. Cập nhật hồ sơ học tập & kho câu sai cục bộ
    memberQuizProfile.TotalQuestionsAnswered = (memberQuizProfile.TotalQuestionsAnswered || 0) + 1;
    const qGlobalKey = currentMemberQuiz ? `${currentMemberQuiz.QuizID}_${questionId}` : String(questionId);

    if (isCorrect) {
      memberQuizProfile.TotalCorrect = (memberQuizProfile.TotalCorrect || 0) + 1;
      memberQuizProfile.WrongQuestionIds = (memberQuizProfile.WrongQuestionIds || []).filter(
        id => id !== questionId && id !== qGlobalKey
      );
    } else {
      if (!memberQuizProfile.WrongQuestionIds) memberQuizProfile.WrongQuestionIds = [];
      if (!memberQuizProfile.WrongQuestionIds.includes(questionId) && !memberQuizProfile.WrongQuestionIds.includes(qGlobalKey)) {
        memberQuizProfile.WrongQuestionIds.push(questionId);
      }
    }

    // 3. Tự động lưu kho câu sai vào localStorage
    try {
      if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        const mssv = (getCurrentMemberUser() && getCurrentMemberUser().mssv) || 'GUEST';
        localStorage.setItem(`bht_quiz_wrong_ids_${mssv}`, JSON.stringify(memberQuizProfile.WrongQuestionIds));
      }
    } catch (storageErr) {}

    renderActiveZenQuizView();

    // Tự động chuyển câu sau 1.2s nếu chọn đúng
    if (quizAutoNext && memberQuizAnswerResults[questionId]?.isCorrect) {
      if (quizAutoNextTimeout) clearTimeout(quizAutoNextTimeout);
      quizAutoNextTimeout = setTimeout(() => {
        if (isTakingMemberQuiz && quizCurrentIndex < currentQuizPool.length - 1) {
          handleNextQuizQuestion();
        }
      }, 1200);
    }
  } else {
    // Exam mode
    renderActiveZenQuizView();
  }
}

/**
 * Chuyển sang câu hỏi tiếp theo
 */
export function handleNextQuizQuestion() {
  if (!isTakingMemberQuiz || !currentQuizPool.length) return;
  if (quizCurrentIndex < currentQuizPool.length - 1) {
    quizCurrentIndex++;
    renderActiveZenQuizView();
  }
}

/**
 * Lùi về câu hỏi trước đó
 */
export function handlePrevQuizQuestion() {
  if (!isTakingMemberQuiz || !currentQuizPool.length) return;
  if (quizCurrentIndex > 0) {
    quizCurrentIndex--;
    renderActiveZenQuizView();
  }
}

/**
 * Nhảy trực tiếp đến câu hỏi chỉ định (từ Modal Ma trận câu hỏi)
 * @param {number|string} index
 */
export function handleJumpQuizQuestion(index) {
  const idx = Number(index);
  if (!currentQuizPool.length || isNaN(idx)) return;
  quizCurrentIndex = Math.max(0, Math.min(idx, currentQuizPool.length - 1));
  handleCloseQuizGridModal();
  renderActiveZenQuizView();
}

/**
 * Bật/tắt tùy chọn tự động chuyển câu (1.2s)
 * @param {Event} e
 */
export function handleToggleQuizAutoNext(e) {
  const isChecked = e && e.target ? !!e.target.checked : !quizAutoNext;
  quizAutoNext = isChecked;
  if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
    localStorage.setItem('bht_quiz_autonext', isChecked ? '1' : '0');
  }
  showToast(isChecked ? 'Đã bật tự động chuyển câu sau 1.2s' : 'Đã tắt tự động chuyển câu', 'info');
}

/**
 * Đánh dấu sao câu hỏi để ôn tập lại sau
 * @param {number|string} questionId
 */
export async function handleToggleQuizBookmark(questionId) {
  if (!questionId) return;
  try {
    const res = await callApi('toggleQuestionBookmark', { questionId });
    if (res && res.success) {
      const isBookmarked = res.data && res.data.bookmarked;
      if (isBookmarked) {
        if (!memberQuizProfile.BookmarkedQuestionIds.includes(questionId)) {
          memberQuizProfile.BookmarkedQuestionIds.push(questionId);
        }
        showToast('Đã đánh dấu sao câu hỏi này!', 'success');
      } else {
        memberQuizProfile.BookmarkedQuestionIds = memberQuizProfile.BookmarkedQuestionIds.filter(id => id !== questionId);
        showToast('Đã bỏ đánh dấu sao câu hỏi!', 'info');
      }

      if (isTakingMemberQuiz) {
        renderActiveZenQuizView();
      } else {
        loadMemberQuiz(getCurrentMemberDetailSessionId());
      }
    }
  } catch (e) {
    console.error('Lỗi khi đánh dấu câu hỏi:', e);
  }
}

/**
 * Chuyển đổi nguồn câu hỏi ôn tập (Đề thi, Câu làm sai, hoặc Câu đã đánh dấu sao)
 * @param {string} pool 'session' | 'wrong' | 'bookmark'
 */
export async function handleSwitchQuizPool(pool) {
  quizPoolType = pool || 'session';
  if (pool === 'wrong') {
    showToast('Đang mở phòng ôn luyện các câu làm sai...', 'info');
  } else if (pool === 'bookmark') {
    showToast('Đang mở phòng ôn luyện các câu đã đánh dấu sao...', 'info');
  }
  await handleStartPracticeQuiz(getCurrentMemberDetailSessionId(), currentMemberQuiz ? currentMemberQuiz.QuizID : '', pool);
}

/**
 * Mở Modal ma trận câu hỏi (Question Grid)
 */
export function handleOpenQuizGridModal() {
  const modal = document.getElementById('modal-quiz-question-grid');
  const container = document.getElementById('modal-quiz-grid-container');
  if (!modal || !container) return;

  container.innerHTML = renderQuizQuestionGridContent(
    currentQuizPool,
    memberQuizAnswers,
    memberQuizAnswerResults,
    quizCurrentIndex,
    memberQuizProfile.BookmarkedQuestionIds || []
  );

  modal.classList.remove('hidden');
}

/**
 * Đóng Modal ma trận câu hỏi
 */
export function handleCloseQuizGridModal() {
  const modal = document.getElementById('modal-quiz-question-grid');
  if (modal) modal.classList.add('hidden');
}

/**
 * Thoát khỏi Zen Focus Arena quay lại Dashboard
 */
export async function handleExitTakingQuiz() {
  const currentSid = getCurrentMemberDetailSessionId();
  if (quizMode === 'exam') {
    const isConfirmed = confirm('Bạn đang trong bài thi tính giờ chính thức. Nếu thoát ra, hệ thống sẽ tự động nộp kết quả theo các câu bạn đã chọn. Bạn có chắc chắn muốn nộp bài và thoát?');
    if (!isConfirmed) return;
    await handleSubmitMemberQuiz(currentSid, currentMemberQuiz ? currentMemberQuiz.QuizID : '');
    return;
  }

  // Chế độ ôn luyện -> Thoát ngay lập tức
  if (memberQuizTimerInterval) {
    clearInterval(memberQuizTimerInterval);
    memberQuizTimerInterval = null;
  }
  isTakingMemberQuiz = false;
  const zenModal = document.getElementById('modal-quiz-zen-arena');
  if (zenModal) zenModal.classList.add('hidden');

  switchMemberSessionSubTab('quiz');
  loadMemberQuiz(currentSid);
  const quizSubtabBtn = document.getElementById('btn-member-subtab-quiz');
  if (quizSubtabBtn) quizSubtabBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Cuộn tới phần xem lại chi tiết bài thi
 */
export function handleOpenQuizReviewDrawer() {
  const el = document.getElementById('member-quiz-review-section');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    showToast('Chưa có chi tiết bài làm để xem lại.', 'info');
  }
}

/**
 * Nộp bài trắc nghiệm
 * @param {string} sessionId
 * @param {string} quizId
 */
export async function handleSubmitMemberQuiz(sessionId, quizId) {
  const currentUser = getCurrentMemberUser();
  const mssv = currentUser.mssv || (typeof localStorage !== 'undefined' ? localStorage.getItem('bht_mssv') : '') || '';
  const hoTen = currentUser.hoTen || '';
  const currentSid = sessionId || getCurrentMemberDetailSessionId();

  if (memberQuizTimerInterval) {
    clearInterval(memberQuizTimerInterval);
    memberQuizTimerInterval = null;
  }

  const timeSpentSec = memberQuizStartTime ? Math.round((Date.now() - memberQuizStartTime) / 1000) : 0;
  const isPractice = (quizMode === 'practice');

  showGlobalLoading(isPractice ? 'Đang tổng kết bài ôn luyện...' : 'Đang chấm điểm bài thi chính thức...');
  try {
    const res = await callApi('submitQuiz', {
      quizId: quizId || (currentMemberQuiz ? currentMemberQuiz.QuizID : 'CUSTOM_POOL'),
      sessionId: currentSid,
      mssv,
      hoTen,
      chiTietTraLoi: memberQuizAnswers,
      thoiGianLamGiay: timeSpentSec,
      isPractice
    });

    hideGlobalLoading();

    // Đóng Zen Arena và đưa người dùng về Sub-tab Trắc Nghiệm để xem kết quả & xếp hạng
    const zenModal = document.getElementById('modal-quiz-zen-arena');
    if (zenModal) zenModal.classList.add('hidden');
    isTakingMemberQuiz = false;

    switchMemberSessionSubTab('quiz');
    const quizSubtabBtn = document.getElementById('btn-member-subtab-quiz');
    if (quizSubtabBtn) quizSubtabBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (res.success && res.data) {
      if (!isPractice) {
        currentMemberQuizResult = res.data.result;
      }
      if (res.data.quiz) currentMemberQuiz = res.data.quiz;

      showToast(isPractice 
        ? `Hoàn thành ôn luyện! Bạn đạt ${res.data.result.DiemSo}/100 điểm.` 
        : `Nộp bài thi thành công! Bạn đạt ${res.data.result.DiemSo}/100 điểm và đã được ghi danh trên Bảng Xếp Hạng.`, 
        'success'
      );

      // Tải lại Dashboard để cập nhật Leaderboard và Thẻ điểm
      await loadMemberQuiz(currentSid);
    } else {
      showToast(res.message || 'Không thể nộp bài trắc nghiệm!', 'error');
      await loadMemberQuiz(currentSid);
    }
  } catch (err) {
    hideGlobalLoading();
    console.error('Lỗi khi nộp bài trắc nghiệm:', err);
    showToast('Đã xảy ra lỗi khi nộp bài. Vui lòng thử lại!', 'error');
    const zenModal = document.getElementById('modal-quiz-zen-arena');
    if (zenModal) zenModal.classList.add('hidden');
    isTakingMemberQuiz = false;
    switchMemberSessionSubTab('quiz');
    const quizSubtabBtn = document.getElementById('btn-member-subtab-quiz');
    if (quizSubtabBtn) quizSubtabBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    loadMemberQuiz(currentSid);
  }
}

/**
 * Làm lại bài trắc nghiệm (vào thẳng phòng ôn luyện)
 * @param {string} sessionId
 * @param {string} quizId
 */
export function handleRetakeMemberQuiz(sessionId, quizId) {
  handleStartPracticeQuiz(sessionId, quizId, 'session');
}
