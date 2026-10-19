/**
 * MODULE QUẢN LÝ TRẮC NGHIỆM DÀNH CHO ADMIN (ADMIN QUIZ CONTROLLER)
 * Tách từ frontend/modules/admin.js để tinh giản kích thước và module hóa hệ thống.
 * 
 * Phụ trách:
 * 1. Tải ngân hàng câu hỏi, thống kê tỷ lệ đúng và bảng điểm thi của lớp
 * 2. Đóng/mở đề thi trắc nghiệm (tính giờ 10 phút)
 * 3. Cho phép 1 sinh viên thi lại hoặc reset toàn bộ cho cả lớp thi lại
 * 4. Modal soạn/chỉnh sửa câu hỏi JSON có kiểm tra cú pháp
 * 5. Xóa bộ đề thi
 */

import { callApi } from '../../services/api.js';
import { 
  showToast, 
  showGlobalLoading, 
  hideGlobalLoading, 
  clearFormError, 
  showFormError, 
  setButtonLoading 
} from '../ui.js';
import { renderAdminQuizPanel } from '../templates/quizTemplates.js';
import { 
  getCurrentAdminActiveSessionId, 
  setCurrentAdminActiveSessionId 
} from '../admin.js';

// State Quản lý Trắc nghiệm Admin
export let currentAdminQuiz = null;
export let currentAdminQuizResults = [];
export let currentAdminQuizStats = null;

/**
 * Tải thông tin đề trắc nghiệm và thống kê kết quả bài nộp của Admin
 * @param {string} sessionId
 */
export async function loadAdminQuiz(sessionId) {
  const container = document.getElementById('admin-subtab-quiz-content');
  if (!container || !sessionId) return;

  try {
    const res = await callApi('getQuizResultsBySession', { sessionId });
    if (res.success && res.data) {
      currentAdminQuiz = res.data.quiz;
      currentAdminQuizResults = res.data.results || [];
      currentAdminQuizStats = res.data.stats || null;

      container.innerHTML = renderAdminQuizPanel(
        currentAdminQuiz,
        currentAdminQuizResults,
        currentAdminQuizStats,
        sessionId
      );
    } else {
      container.innerHTML = renderAdminQuizPanel(null, [], null, sessionId);
    }
  } catch (err) {
    console.error('Lỗi khi tải bảng trắc nghiệm của Admin:', err);
    container.innerHTML = `
      <div class="bht-card p-6 text-center text-xs text-ink-muted">
        <i class="fa-solid fa-triangle-exclamation text-amber-500 text-lg mb-2"></i>
        <p>Không thể tải dữ liệu trắc nghiệm. Vui lòng thử lại sau.</p>
      </div>
    `;
  }
}

/**
 * Đóng hoặc mở đề thi trắc nghiệm cho sinh viên
 * @param {string} sessionId
 * @param {string} quizId
 * @param {'Open'|'Closed'} targetStatus
 */
export async function handleToggleAdminQuizStatus(sessionId, quizId, targetStatus) {
  const sid = sessionId || getCurrentAdminActiveSessionId();
  showGlobalLoading(`Đang ${targetStatus === 'Open' ? 'mở' : 'đóng'} đề trắc nghiệm...`);
  try {
    const res = await callApi('toggleQuizStatus', {
      sessionId: sid,
      quizId,
      trangThai: targetStatus
    });

    hideGlobalLoading();
    if (res.success) {
      showToast(res.message || 'Đã cập nhật trạng thái đề thi!', 'success');
      loadAdminQuiz(sid);
    } else {
      showToast(res.message || 'Không thể cập nhật trạng thái đề thi!', 'error');
    }
  } catch (err) {
    hideGlobalLoading();
    console.error('Lỗi khi toggle trạng thái quiz:', err);
    showToast('Lỗi mạng hoặc server. Vui lòng thử lại!', 'error');
  }
}

/**
 * Cho phép một sinh viên làm lại bài thi 10 phút (Hủy kết quả cũ)
 * @param {string} sessionId
 * @param {string} quizId
 * @param {string} mssv
 */
export async function handleResetMemberQuizSubmission(sessionId, quizId, mssv) {
  const sid = sessionId || getCurrentAdminActiveSessionId();
  const isConfirmed = confirm(`Bạn có chắc chắn muốn hủy kết quả thi của sinh viên ${mssv} để sinh viên này làm lại bài thi 10 phút?`);
  if (!isConfirmed) return;

  showGlobalLoading(`Đang reset lượt thi cho sinh viên ${mssv}...`);
  try {
    const res = await callApi('resetQuizSubmission', {
      sessionId: sid,
      quizId,
      mssv
    });
    hideGlobalLoading();
    if (res.success) {
      showToast(res.message || `Đã cho phép sinh viên ${mssv} làm lại bài thi!`, 'success');
      loadAdminQuiz(sid);
    } else {
      showToast(res.message || 'Không thể reset lượt thi!', 'error');
    }
  } catch (err) {
    hideGlobalLoading();
    console.error('Lỗi khi reset lượt thi:', err);
    showToast('Lỗi mạng hoặc server. Vui lòng thử lại!', 'error');
  }
}

/**
 * Cho cả lớp làm lại bài thi 10 phút (Reset toàn bộ kết quả của buổi thi)
 * @param {string} sessionId
 * @param {string} quizId
 */
export async function handleResetAllQuizSubmissions(sessionId, quizId) {
  const sid = sessionId || getCurrentAdminActiveSessionId();
  const isConfirmed = confirm('Bạn có chắc chắn muốn xóa toàn bộ kết quả thi của buổi học này để tổ chức thi lại cho cả lớp từ đầu?');
  if (!isConfirmed) return;

  showGlobalLoading('Đang reset toàn bộ kết quả thi...');
  try {
    const res = await callApi('resetAllQuizSubmissions', {
      sessionId: sid,
      quizId
    });
    hideGlobalLoading();
    if (res.success) {
      showToast(res.message || 'Đã reset toàn bộ kết quả thi! Đề thi đã được mở lại cho cả lớp.', 'success');
      loadAdminQuiz(sid);
    } else {
      showToast(res.message || 'Không thể reset kết quả thi!', 'error');
    }
  } catch (err) {
    hideGlobalLoading();
    console.error('Lỗi khi reset toàn bộ kết quả thi:', err);
    showToast('Lỗi mạng hoặc server. Vui lòng thử lại!', 'error');
  }
}

/**
 * Mở modal tạo đề trắc nghiệm mới
 * @param {string} sessionId
 */
export function handleOpenCreateQuizModal(sessionId) {
  const sid = sessionId || getCurrentAdminActiveSessionId();
  const modal = document.getElementById('modal-edit-quiz');
  const form = document.getElementById('form-edit-quiz');
  if (!modal || !form) return;

  clearFormError(form);
  document.getElementById('edit-quiz-id').value = '';
  document.getElementById('edit-quiz-session-id').value = sid;
  document.getElementById('edit-quiz-title').value = '';
  document.getElementById('edit-quiz-duration').value = 10;
  const countEl = document.getElementById('edit-quiz-exam-questions-count');
  if (countEl) countEl.value = 10;
  document.getElementById('edit-quiz-status').value = 'Open';
  document.getElementById('edit-quiz-desc').value = '';
  document.getElementById('edit-quiz-questions-json').value = '';
  document.getElementById('modal-edit-quiz-title').textContent = 'Soạn Đề Trắc Nghiệm Mới';

  modal.classList.remove('hidden');
}

/**
 * Mở modal chỉnh sửa câu hỏi của đề trắc nghiệm hiện tại
 * @param {string} sessionId
 * @param {string} quizId
 */
export function handleOpenEditQuizModal(sessionId, quizId) {
  const modal = document.getElementById('modal-edit-quiz');
  const form = document.getElementById('form-edit-quiz');
  if (!modal || !form || !currentAdminQuiz) return;

  clearFormError(form);
  document.getElementById('edit-quiz-id').value = currentAdminQuiz.QuizID || '';
  document.getElementById('edit-quiz-session-id').value = sessionId || currentAdminQuiz.SessionID || getCurrentAdminActiveSessionId();
  document.getElementById('edit-quiz-title').value = currentAdminQuiz.TieuDe || '';
  document.getElementById('edit-quiz-duration').value = currentAdminQuiz.ThoiGianPhut || 10;
  const countEl = document.getElementById('edit-quiz-exam-questions-count');
  if (countEl) countEl.value = currentAdminQuiz.SoCauThi || 10;
  document.getElementById('edit-quiz-status').value = currentAdminQuiz.TrangThai || 'Open';
  document.getElementById('edit-quiz-desc').value = currentAdminQuiz.MoTa || '';
  document.getElementById('edit-quiz-questions-json').value = JSON.stringify(currentAdminQuiz.DanhSachCauHoi || [], null, 2);
  document.getElementById('modal-edit-quiz-title').textContent = 'Chỉnh Sửa Bộ Câu Hỏi Trắc Nghiệm';

  modal.classList.remove('hidden');
}

/**
 * Đóng modal soạn đề trắc nghiệm
 */
export function handleCloseEditQuizModal() {
  const modal = document.getElementById('modal-edit-quiz');
  if (modal) modal.classList.add('hidden');
}

/**
 * Chèn dữ liệu mẫu 2 câu hỏi JSON vào textarea
 */
export function handleInsertQuizTemplateSample() {
  const textarea = document.getElementById('edit-quiz-questions-json');
  if (!textarea) return;

  const sample = [
    {
      id: 1,
      cauHoi: "Ví dụ câu hỏi 1: Lệnh nào dùng để khởi tạo git repository?",
      luaChon: ["git start", "git init", "git new", "git create"],
      dapAnDung: 1,
      giaiThich: "Lệnh git init dùng để tạo một repository mới tại thư mục hiện hành."
    },
    {
      id: 2,
      cauHoi: "Ví dụ câu hỏi 2: Cổng Quản Lý Ban Học Thuật sử dụng kiến trúc nào?",
      luaChon: ["Monolithic PHP", "Headless Static Web + Google Apps Script API", "Ruby on Rails", "Django MVC"],
      dapAnDung: 1,
      giaiThich: "Hệ thống sử dụng kiến trúc Headless tách biệt Frontend GitHub Pages và Backend Google Apps Script."
    }
  ];

  textarea.value = JSON.stringify(sample, null, 2);
  textarea.focus();
}

/**
 * Xử lý submit form tạo/sửa đề thi trắc nghiệm
 * @param {Event} e
 */
export async function handleSubmitEditQuizForm(e) {
  if (e) e.preventDefault();
  const form = document.getElementById('form-edit-quiz');
  if (!form) return;

  clearFormError(form);

  const quizId = document.getElementById('edit-quiz-id').value.trim();
  const sessionId = document.getElementById('edit-quiz-session-id').value.trim();
  const tieuDe = document.getElementById('edit-quiz-title').value.trim();
  const thoiGianPhut = Number(document.getElementById('edit-quiz-duration').value) || 10;
  const countInput = document.getElementById('edit-quiz-exam-questions-count');
  const soCauThi = Number(countInput ? countInput.value : 10) || 10;
  const trangThai = document.getElementById('edit-quiz-status').value.trim();
  const moTa = document.getElementById('edit-quiz-desc').value.trim();
  const jsonRaw = document.getElementById('edit-quiz-questions-json').value.trim();

  if (!tieuDe) {
    showFormError(form, 'Vui lòng nhập tiêu đề cho bài trắc nghiệm!', 'edit-quiz-title');
    return;
  }

  let danhSachCauHoi = [];
  try {
    danhSachCauHoi = JSON.parse(jsonRaw);
    if (!Array.isArray(danhSachCauHoi) || danhSachCauHoi.length === 0) {
      showFormError(form, 'Danh sách câu hỏi phải là một mảng JSON chứa ít nhất 1 câu hỏi!', 'edit-quiz-questions-json');
      return;
    }
  } catch (parseErr) {
    showFormError(form, 'Cú pháp JSON của danh sách câu hỏi chưa hợp lệ! Vui lòng kiểm tra lại dấu ngoặc và dấu phẩy.', 'edit-quiz-questions-json');
    return;
  }

  const submitBtn = document.getElementById('btn-submit-edit-quiz');
  setButtonLoading(submitBtn, true, 'Đang lưu đề...');

  try {
    const res = await callApi('saveQuiz', {
      quizId,
      sessionId,
      tieuDe,
      thoiGianPhut,
      soCauThi,
      trangThai,
      moTa,
      danhSachCauHoi
    });

    setButtonLoading(submitBtn, false);

    if (res.success) {
      showToast(res.message || 'Đã lưu đề trắc nghiệm thành công!', 'success');
      handleCloseEditQuizModal();
      loadAdminQuiz(sessionId || getCurrentAdminActiveSessionId());
    } else {
      showFormError(form, res.message || 'Không thể lưu đề trắc nghiệm!');
    }
  } catch (err) {
    setButtonLoading(submitBtn, false);
    console.error('Lỗi khi lưu đề trắc nghiệm:', err);
    showFormError(form, 'Đã xảy ra lỗi mạng hoặc máy chủ. Vui lòng thử lại!');
  }
}

/**
 * Xóa đề thi trắc nghiệm của buổi học
 * @param {string} sessionId
 * @param {string} quizId
 */
export async function handleDeleteAdminQuiz(sessionId, quizId) {
  const sid = sessionId || getCurrentAdminActiveSessionId();
  const qid = quizId || (currentAdminQuiz && currentAdminQuiz.QuizID);
  if (!qid) return;

  const isConfirmed = window.confirm('Bạn có chắc chắn muốn xóa bộ đề trắc nghiệm này cùng toàn bộ kết quả nộp bài của sinh viên?');
  if (!isConfirmed) return;

  showGlobalLoading('Đang xóa bộ đề trắc nghiệm...');
  try {
    const res = await callApi('deleteQuiz', { quizId: qid });
    hideGlobalLoading();
    if (res.success) {
      showToast(res.message || 'Đã xóa bộ đề trắc nghiệm thành công!', 'success');
      loadAdminQuiz(sid);
    } else {
      showToast(res.message || 'Không thể xóa đề trắc nghiệm!', 'error');
    }
  } catch (err) {
    hideGlobalLoading();
    console.error('Lỗi khi xóa đề trắc nghiệm:', err);
    showToast('Lỗi mạng hoặc server. Vui lòng thử lại!', 'error');
  }
}
