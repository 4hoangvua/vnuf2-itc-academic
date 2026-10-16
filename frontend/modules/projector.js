// ====================================================================
// MODULE MÁY CHIẾU BUỔI SINH HOẠT (PROJECTOR MODE CONTROLLER)
// ====================================================================

import { callApi } from '../services/api.js';
import { appState, uiActionLocks, showToast } from './ui.js';

/**
 * Mở giao diện máy chiếu toàn màn hình
 */
export function openProjectorMode(sessionId) {
  const sessions = appState.attendance || [];
  const session = sessions.find(s => s.SessionID === sessionId);
  if (!session) return;

  uiActionLocks.activeProjectorSessionId = sessionId;

  const titleEl = document.getElementById('projector-title');
  const pinEl = document.getElementById('projector-pin');
  const countEl = document.getElementById('projector-attendee-count');

  if (titleEl) titleEl.textContent = session.TenBuoiHop || 'Chuyên đề sinh hoạt';
  if (pinEl) pinEl.textContent = session.MaPin || '------';

  let count = 0;
  try {
    count = JSON.parse(session.DS_CoMat || '[]').length;
  } catch (e) {
    count = session.DS_CoMat ? session.DS_CoMat.split(',').filter(Boolean).length : 0;
  }
  if (countEl) countEl.textContent = count;

  const modal = document.getElementById('modal-projector-mode');
  if (modal) modal.classList.remove('hidden');
}

/**
 * Đóng giao diện máy chiếu
 */
export function closeProjectorMode() {
  const modal = document.getElementById('modal-projector-mode');
  if (modal) modal.classList.add('hidden');
  uiActionLocks.activeProjectorSessionId = null;
}

/**
 * Làm mới sĩ số điểm danh thời gian thực trên màn hình máy chiếu
 */
export async function refreshProjectorCount() {
  if (!uiActionLocks.activeProjectorSessionId) return;

  showToast('Đang cập nhật số lượng điểm danh...', 'info');

  try {
    const res = await callApi('getAttendanceSessions', {}, { skipCache: true });
    if (res && res.success) {
      appState.attendance = res.data || [];
      const session = appState.attendance.find(s => s.SessionID === uiActionLocks.activeProjectorSessionId);

      if (session) {
        let count = 0;
        try {
          count = JSON.parse(session.DS_CoMat || '[]').length;
        } catch (e) {
          count = session.DS_CoMat ? session.DS_CoMat.split(',').filter(Boolean).length : 0;
        }

        const countEl = document.getElementById('projector-attendee-count');
        if (countEl) countEl.textContent = count;
        showToast(`Hiện có ${count} thành viên đã điểm danh thành công!`, 'success');
      }
    }
  } catch (err) {
    showToast('Lỗi cập nhật sĩ số: ' + (err.message || err.toString()), 'error');
  }
}
