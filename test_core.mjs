const memStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (memStore.has(k) ? memStore.get(k) : null),
  setItem: (k, v) => memStore.set(k, String(v)),
  removeItem: (k) => memStore.delete(k),
  clear: () => memStore.clear()
};

import fs from 'fs';
import { store, getState, setState, subscribe } from './frontend/modules/store.js';
import { escapeHTML, showFormError, clearFormError } from './frontend/utils/dom.js';
import { getToken, setToken, clearToken, MUTATION_INVALIDATION_MAP } from './frontend/services/api.js';
import {
  memberSessionCardTemplate,
  memberDocCardTemplate,
  adminSessionCardTemplate,
  adminSubmissionRowTemplate,
  adminMemberRowTemplate,
  emptyStateTemplate,
  uiButton,
  uiStatusBadge,
  uiMonoBadge,
  uiEmptyState,
  renderSubmissionRow,
  renderAttendeeRow,
  renderMemberDrlWidget,
  renderDocCard,
  uiTopicTagBadge,
  renderMemberSpotlightCard,
  renderMemberAttendanceAuditTable,
  renderAdminTaskItem,
  renderSpotlightSkeleton,
  renderDrlWidgetSkeleton,
  renderAuditTableSkeleton,
  renderCardSkeleton,
  renderStatSkeleton,
  renderAdminTableSkeleton,
  getSessionRemainingTime,
  formatSessionDateVN
} from './frontend/modules/templates.js';
import { calculateDrlProgress, getMemberSubmissionsForTask } from './frontend/modules/member.js';
import { getLatestSubmissionsPerMember } from './frontend/modules/admin.js';
import { mockCallApi, getLocalMockState, INITIAL_MOCK_DATA } from './frontend/services/mockData.js';

let failed = 0;
let passed = 0;
function assert(desc, condition) {
  if (condition) {
    console.log('  ✓', desc);
    passed++;
  } else {
    console.error('  ✗ FAIL:', desc);
    failed++;
  }
}

console.log('=== TEST SUITE: CORE ARCHITECTURE & LOGIC ===');

// 1. escapeHTML tests
console.log('\n--- 1. Testing escapeHTML ---');
assert('Escapes &', escapeHTML('A & B') === 'A &amp; B');
assert('Escapes < and >', escapeHTML('<script>') === '&lt;script&gt;');
assert('Escapes double and single quotes', escapeHTML('"hello" \'world\'') === '&quot;hello&quot; &#039;world&#039;');
assert('Handles null and undefined', escapeHTML(null) === '' && escapeHTML(undefined) === '');
assert('Handles numbers', escapeHTML(12345) === '12345');

// 2. Reactive Store tests
console.log('\n--- 2. Testing Reactive Store ---');
let notifiedValue = null;
const unsub = subscribe('memberActiveTab', (newVal) => {
  notifiedValue = newVal;
});
setState({ memberActiveTab: 'docs' });
assert('Subscribed listener notified on setState', notifiedValue === 'docs');
assert('getState retrieves updated value', getState('memberActiveTab') === 'docs');
unsub();
setState({ memberActiveTab: 'sessions' });
assert('Unsubscribe works (no notification after unsub)', notifiedValue === 'docs');

// 3. Token management tests
console.log('\n--- 3. Testing Token API Management ---');
setToken('TEST_TOKEN_12345');
assert('setToken and getToken work', getToken() === 'TEST_TOKEN_12345');
clearToken();
assert('clearToken removes token', getToken() === '');

// 4. Templates tests (Check data-action and absence of onclick)
console.log('\n--- 4. Testing HTML Templates ---');
const sampleSession = {
  SessionID: 'MEET_20261016_190000',
  TenBuoiHop: '<script>alert(1)</script> Sinh hoạt',
  NgayDienRa: '16/10/2026',
  MaPin: '123456'
};

const memberCard = memberSessionCardTemplate(sampleSession, { isOpen: true, hasAttended: false });
assert('memberSessionCardTemplate includes data-action', memberCard.includes('data-action="open-member-session-detail"'));
assert('memberSessionCardTemplate escapes title', !memberCard.includes('<script>') && memberCard.includes('&lt;script&gt;'));
assert('memberSessionCardTemplate contains NO inline onclick', !memberCard.includes('onclick='));

const adminCard = adminSessionCardTemplate(sampleSession, { isOpen: true, attendeeCount: 15 });
assert('adminSessionCardTemplate includes data-action', adminCard.includes('data-action="open-admin-session-detail"'));
assert('adminSessionCardTemplate contains NO inline onclick', !adminCard.includes('onclick='));

const subRow = adminSubmissionRowTemplate({
  SubID: 'SUB_001',
  HoTen: '<b>Test</b>',
  MSSV: '2251120001',
  TaskID: 'TASK_001',
  TenFile: 'code.zip',
  Feedback: 'Good'
});
assert('adminSubmissionRowTemplate escapes name', !subRow.includes('<b>Test</b>') && subRow.includes('&lt;b&gt;Test&lt;/b&gt;'));
assert('adminSubmissionRowTemplate includes review data-actions', subRow.includes('data-action="review-submission"'));
assert('adminSubmissionRowTemplate contains NO inline onclick', !subRow.includes('onclick='));

const memberRow = adminMemberRowTemplate({
  MSSV: '2251120001',
  HoTen: 'Nguyễn Văn A',
  Email: 'a@gmail.com',
  Role: 'MEMBER',
  TrangThai: 'Active'
});
assert('adminMemberRowTemplate includes member data-actions', memberRow.includes('data-action="toggle-member-status"') && memberRow.includes('data-action="reset-member-email"'));
assert('adminMemberRowTemplate contains NO inline onclick', !memberRow.includes('onclick='));

// New UI Components library tests
const btnHtml = uiButton({ label: 'Lưu thay đổi', icon: 'fa-floppy-disk', action: 'save-session', dataset: { id: 'S1' } });
assert('uiButton generates bht-btn with data-action and data-id', btnHtml.includes('bht-btn') && btnHtml.includes('data-action="save-session"') && btnHtml.includes('data-id="S1"'));

const badgeOpen = uiStatusBadge('Open');
const badgeApproved = uiStatusBadge('Approved');
assert('uiStatusBadge maps Open to bht-badge-ok', badgeOpen.includes('bht-badge-ok') && badgeOpen.includes('Đang mở'));
assert('uiStatusBadge maps Approved to bht-badge-ok', badgeApproved.includes('bht-badge-ok') && badgeApproved.includes('Đạt'));

const mono = uiMonoBadge('2351120015');
assert('uiMonoBadge renders font-mono badge', mono.includes('bht-badge-mono') && mono.includes('2351120015'));

const emptyTable = uiEmptyState({ isTableRow: true, colspan: 5, title: 'Trống' });
assert('uiEmptyState renders table row when isTableRow=true', emptyTable.includes('<tr') && emptyTable.includes('colspan="5"') && emptyTable.includes('Trống'));

const detailSubRow = renderSubmissionRow({
  SubID: 'SUB_999',
  MSSV: '2251120002',
  TenFile: 'report.pdf',
  TrangThaiDuyet: 'Approved'
}, { showTaskColumn: false, memberName: 'Trần Văn B' });
assert('renderSubmissionRow supports 5-col detail mode without task column', detailSubRow.includes('2251120002') && detailSubRow.includes('Trần Văn B') && !detailSubRow.includes('TASK_'));

const attendeeRow = renderAttendeeRow({ MSSV: '2251120003', HoTen: 'Lê Văn C', Email: 'c@gmail.com' }, '16/10/2026');
assert('renderAttendeeRow renders attendee row with MSSV and name', attendeeRow.includes('2251120003') && attendeeRow.includes('Lê Văn C') && attendeeRow.includes('Có mặt'));

// 5. Mutation map check
console.log('\n--- 5. Testing Mutation Invalidation Map ---');
assert('checkInAttendance invalidates getAttendanceSessions', MUTATION_INVALIDATION_MAP.checkInAttendance.includes('getAttendanceSessions'));
assert('submitTaskAssignment invalidates submissions and tasks', MUTATION_INVALIDATION_MAP.submitTaskAssignment.includes('getAllSubmissions'));

// 6. Member DRL Progress & Widget tests
console.log('\n--- 6. Testing Member DRL Tracker Logic & Widget ---');
const drlEx = calculateDrlProgress(4, 5, 2, 2);
assert('calculateDrlProgress evaluates >=80% as EXCELLENT (+15 ĐRL)', drlEx.drlTier === 'EXCELLENT' && drlEx.drlPointsText === '+15 ĐRL' && drlEx.attendanceRate === 80);

const drlGood = calculateDrlProgress(3, 5, 1, 2);
assert('calculateDrlProgress evaluates 50-79% as GOOD (+10 ĐRL)', drlGood.drlTier === 'GOOD' && drlGood.drlPointsText === '+10 ĐRL' && drlGood.attendanceRate === 60);
assert('calculateDrlProgress provides tip on remaining sessions for GOOD', drlGood.nextMilestoneTip.includes('buổi sinh hoạt để nâng mức lên Xuất sắc'));

const drlLow = calculateDrlProgress(1, 5, 0, 2);
assert('calculateDrlProgress evaluates <50% as NEEDS_WORK (+0 ĐRL)', drlLow.drlTier === 'NEEDS_WORK' && drlLow.drlPointsText === '+0 ĐRL' && drlLow.attendanceRate === 20);

const drlZero = calculateDrlProgress(0, 0, 0, 0);
assert('calculateDrlProgress safely handles 0 total sessions without NaN', !isNaN(drlZero.attendanceRate) && drlZero.totalSessions === 0);

const drlWidgetHtml = renderMemberDrlWidget(drlEx);
assert('renderMemberDrlWidget generates .bht-drl-card container', drlWidgetHtml.includes('bht-drl-card'));
assert('renderMemberDrlWidget sets progress fill width correctly', drlWidgetHtml.includes('width: 80%'));
assert('renderMemberDrlWidget includes donut chart and locked state', drlWidgetHtml.includes('<svg') && drlWidgetHtml.includes('Chờ công bố cuối kỳ') && drlWidgetHtml.includes('fa-lock'));

// 7. Rich Academic Documents categorization tests
console.log('\n--- 7. Testing Document Categorization & Rich Badges ---');
const docMos = renderDocCard({
  DocID: 'DOC_MOS_001',
  TenTaiLieu: 'Bộ đề thi Chuẩn đầu ra MOS Excel 2019',
  PhanLoai: 'Chuẩn đầu ra (MOS/IC3)',
  LinkDrive: 'https://drive.google.com/mos'
});
assert('renderDocCard identifies Chuẩn đầu ra MOS/IC3 with teal badge and certificate icon', docMos.includes('Chuẩn đầu ra MOS/IC3') && docMos.includes('fa-certificate'));

const docWord = renderDocCard({
  DocID: 'DOC_WORD_001',
  TenTaiLieu: 'Template Word Luận văn Thạc sĩ & Đồ án tốt nghiệp VNUF2',
  PhanLoai: 'Word & Khóa luận',
  LinkDrive: 'https://drive.google.com/word'
});
assert('renderDocCard identifies Word & Đồ án with word icon and escaped text', docWord.includes('Word &amp; Đồ án') && docWord.includes('fa-file-word'));

const docAi = renderDocCard({
  DocID: 'DOC_AI_001',
  TenTaiLieu: 'Prompt AI nghiên cứu khoa học cho sinh viên',
  PhanLoai: 'Prompt AI & Tools',
  LinkDrive: 'https://drive.google.com/ai'
});
assert('renderDocCard identifies Prompt AI & Tools with wand icon and escaped text', docAi.includes('Prompt AI &amp; Tools') && docAi.includes('fa-wand-magic-sparkles'));

// 8. Topic Tag Badges & Member Spotlight & Attendance Audit Table
console.log('\n--- 8. Testing Topic Tags, Spotlight & Attendance Audit Table ---');

const tagM = uiTopicTagBadge('CHUAN_DAU_RA');
assert('uiTopicTagBadge renders MOS/IC3 tag correctly', tagM.includes('Chuẩn đầu ra MOS/IC3') && tagM.includes('fa-certificate'));

const tagW = uiTopicTagBadge('WORD_DO_AN');
assert('uiTopicTagBadge renders Word & Đồ án tag correctly', tagW.includes('Đồ án &amp; Luận văn Word') && tagW.includes('fa-file-lines'));

const tagE = uiTopicTagBadge('EXCEL_DATA');
assert('uiTopicTagBadge renders Excel & Dữ liệu tag correctly', tagE.includes('Excel &amp; Xử lý số liệu') && tagE.includes('fa-table-cells'));

const tagA = uiTopicTagBadge('AI_TOOLS');
assert('uiTopicTagBadge renders Prompt AI tag correctly', tagA.includes('Kỹ năng AI thực chiến') && tagA.includes('fa-brain'));

const tagCustom = uiTopicTagBadge('Lập trình Python & AI');
assert('uiTopicTagBadge renders custom topic tag correctly', tagCustom.includes('Lập trình Python &amp; AI') && tagCustom.includes('fa-bookmark'));

const spotlightOpen = renderMemberSpotlightCard({
  SessionID: 'MEET_SPOTLIGHT_01',
  TenBuoiHop: 'Chuyên đề Tối ưu hóa Luận văn Word',
  NgayDienRa: null,
  PhongHoc: 'Phòng Lab 03 - Nhà A3',
  TrangThai: 'Open',
  TagChuyenDe: 'WORD_DO_AN'
}, false);
assert('renderMemberSpotlightCard renders live session with quick pin button when not attended', spotlightOpen.includes('data-action="open-quick-pin-modal"') && spotlightOpen.includes('Phòng Lab 03 - Nhà A3') && spotlightOpen.includes('ĐANG DIỄN RA'));

const spotlightAttended = renderMemberSpotlightCard({
  SessionID: 'MEET_SPOTLIGHT_01',
  TenBuoiHop: 'Chuyên đề Tối ưu hóa Luận văn Word',
  NgayDienRa: null,
  PhongHoc: 'Phòng Lab 03 - Nhà A3',
  TrangThai: 'Open',
  TagChuyenDe: 'WORD_DO_AN'
}, true);
assert('renderMemberSpotlightCard renders attended state without quick pin button', spotlightAttended.includes('Bạn đã điểm danh có mặt') && !spotlightAttended.includes('data-action="open-quick-pin-modal"'));

const auditTable = renderMemberAttendanceAuditTable([
  {
    SessionID: 'MEET_AUDIT_01',
    TenBuoiHop: 'Học tập MOS Excel Chuyên Sâu',
    NgayDienRa: '15/10/2026',
    PhongHoc: 'Lab CNTT',
    TagChuyenDe: 'EXCEL_DATA',
    TrangThai: 'Closed',
    DS_CoMat: '["2251120001"]'
  }
], '2251120001');
assert('renderMemberAttendanceAuditTable renders attended row with date and room', auditTable.includes('Học tập MOS Excel Chuyên Sâu') && auditTable.includes('Có mặt') && auditTable.includes('Lab CNTT'));

const adminTask = renderAdminTaskItem({
  TaskID: 'TASK_TEST_01',
  TieuDe: 'Bài tập thực hành MOS',
  Deadline: '2026-10-25T23:59',
  TrangThai: 'Open',
  MoTa: 'Làm đề thi mẫu'
});
assert('renderAdminTaskItem includes edit and delete data-action buttons', adminTask.includes('data-action="open-edit-task-modal"') && adminTask.includes('data-action="delete-task"'));

const adminDoc = renderDocCard({
  DocID: 'DOC_TEST_01',
  TenTaiLieu: 'Giáo trình Word 2019',
  PhanLoai: 'Word & Khóa luận',
  LinkDrive: 'https://drive.google.com/test'
}, { isAdmin: true });
assert('renderDocCard includes edit and delete buttons for admin', adminDoc.includes('data-action="open-edit-doc-modal"') && adminDoc.includes('data-action="delete-doc"'));

// 8b. Testing Skeleton Engine & Countdown Logic
console.log('\n--- 8b. Testing Skeleton Engine & Countdown Logic ---');
const spotlightSkel = renderSpotlightSkeleton();
assert('renderSpotlightSkeleton generates animated shimmer container with bht-skeleton classes', spotlightSkel.includes('bht-skeleton') && spotlightSkel.includes('animate-pulse') && spotlightSkel.includes('min-h-[260px]'));

const drlSkel = renderDrlWidgetSkeleton();
assert('renderDrlWidgetSkeleton generates 3 KPI card skeletons', drlSkel.includes('Chỉ số chuyên cần') || (drlSkel.includes('bht-skeleton') && drlSkel.includes('h-full')));

const auditSkel = renderAuditTableSkeleton(3);
assert('renderAuditTableSkeleton generates exact number of table rows', (auditSkel.match(/<tr/g) || []).length === 3);

const cardSkel = renderCardSkeleton(4);
assert('renderCardSkeleton generates exact count of card skeletons', (cardSkel.match(/bht-card/g) || []).length === 4);

const statSkel = renderStatSkeleton();
assert('renderStatSkeleton generates inline skeleton element', statSkel.includes('bht-skeleton'));

const adminTableSkel = renderAdminTableSkeleton(3, 4);
assert('renderAdminTableSkeleton generates requested rows and columns', (adminTableSkel.match(/<tr/g) || []).length === 3 && (adminTableSkel.match(/<td/g) || []).length === 12);

// Countdown calculation tests
const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 mins in future
const dateStr30m = `${String(futureDate.getDate()).padStart(2, '0')}/${String(futureDate.getMonth() + 1).padStart(2, '0')}/${futureDate.getFullYear()} ${String(futureDate.getHours()).padStart(2, '0')}:${String(futureDate.getMinutes()).padStart(2, '0')}`;
const rem30m = getSessionRemainingTime(dateStr30m);
assert('getSessionRemainingTime identifies imminent session within 60 mins', rem30m && rem30m.isImminent && rem30m.text.includes('Bắt đầu sau'));

const future2Days = new Date(Date.now() + 2 * 24 * 3600 * 1000 + 3 * 3600 * 1000);
const dateStr2d = `${String(future2Days.getDate()).padStart(2, '0')}/${String(future2Days.getMonth() + 1).padStart(2, '0')}/${future2Days.getFullYear()} ${String(future2Days.getHours()).padStart(2, '0')}:${String(future2Days.getMinutes()).padStart(2, '0')}`;
const rem2d = getSessionRemainingTime(dateStr2d);
assert('getSessionRemainingTime formats remaining days correctly', rem2d && !rem2d.isImminent && rem2d.text.includes('Còn 2 ngày'));

const imminentSpotlight = renderMemberSpotlightCard({
  SessionID: 'MEET_COUNTDOWN_TEST',
  TenBuoiHop: 'Chuyên đề Word Đồ án Sắp Diễn Ra',
  NgayDienRa: dateStr30m,
  PhongHoc: 'Lab 03 - A3',
  TrangThai: 'Pending'
}, false);
assert('renderMemberSpotlightCard highlights imminent session with amber countdown and pulse badge', imminentSpotlight.includes('SẮP BẮT ĐẦU:') && imminentSpotlight.includes('border-amber-500'));

// 9. Mutation Invalidation Map for CRUD actions
console.log('\n--- 9. Testing CRUD Mutations Invalidation Map ---');
assert('updateAttendanceSession invalidates getAttendanceSessions', MUTATION_INVALIDATION_MAP.updateAttendanceSession.includes('getAttendanceSessions'));
assert('deleteAttendanceSession invalidates getAttendanceSessions', MUTATION_INVALIDATION_MAP.deleteAttendanceSession.includes('getAttendanceSessions'));
assert('updateTask invalidates getAllTasks', MUTATION_INVALIDATION_MAP.updateTask.includes('getAllTasks'));
assert('deleteTask invalidates getAllTasks', MUTATION_INVALIDATION_MAP.deleteTask.includes('getAllTasks'));
assert('updateDocument invalidates getAllDocuments', MUTATION_INVALIDATION_MAP.updateDocument.includes('getAllDocuments'));
assert('deleteDocument invalidates getAllDocuments', MUTATION_INVALIDATION_MAP.deleteDocument.includes('getAllDocuments'));

// 10. Mock API CRUD operations
console.log('\n--- 10. Testing Mock Data CRUD Operations ---');
// Mock update session
const updateRes = await mockCallApi('updateAttendanceSession', {
  sessionId: 'MEET_20261015_190000',
  tenBuoiHop: 'Chuyên đề Word Đồ án Nâng cao',
  ngayDienRa: '16/10/2026 19:30',
  linkTaiLieu: 'https://drive.google.com/updated',
  noiDungChuyenDe: 'Nội dung cập nhật',
  tagChuyenDe: 'WORD_DO_AN',
  phongHoc: 'Phòng Lab 05 - Nhà A3'
});
assert('mockCallApi updateAttendanceSession succeeds', updateRes.success === true);
const updatedSession = getLocalMockState().attendance.find(s => s.SessionID === 'MEET_20261015_190000');
assert('mockCallApi updateAttendanceSession updates Tag and Room', updatedSession.TagChuyenDe === 'WORD_DO_AN' && updatedSession.PhongHoc === 'Phòng Lab 05 - Nhà A3');

// Mock update task
const updateTaskRes = await mockCallApi('updateTask', {
  taskId: 'TASK_20261015_001',
  tieuDe: 'Thực hành Word Nâng Cao',
  deadline: '2026-10-22T23:59',
  nguoiNhan: 'ALL',
  moTa: 'Tạo mục lục tự động',
  trangThai: 'Open'
});
assert('mockCallApi updateTask succeeds', updateTaskRes.success === true);
const updatedTask = getLocalMockState().tasks.find(t => t.TaskID === 'TASK_20261015_001');
assert('mockCallApi updateTask updates task title and description', updatedTask.TieuDe === 'Thực hành Word Nâng Cao' && updatedTask.MoTa === 'Tạo mục lục tự động');

// Mock create & delete document
const addDocRes = await mockCallApi('createDocument', {
  tenTaiLieu: 'Tài liệu Thử nghiệm CRUD',
  phanLoai: 'Chuẩn đầu ra (MOS/IC3)',
  linkDrive: 'https://drive.google.com/test-doc',
  moTa: 'Tài liệu test'
});
assert('mockCallApi createDocument succeeds', addDocRes.success === true);
const createdDocId = addDocRes.data.DocID;
const delDocRes = await mockCallApi('deleteDocument', { docId: createdDocId });
assert('mockCallApi deleteDocument succeeds', delDocRes.success === true);
assert('deleted document no longer in mock store', !getLocalMockState().documents.find(d => d.DocID === createdDocId));

// 11. Testing Form Error Validation & Custom Error Display (No Browser Default Tooltips)
console.log('\n--- 11. Testing Form Validation & Custom Error Notification ---');

const viewFiles = [
  './frontend/views/admin.html',
  './frontend/views/auth.html',
  './frontend/views/member.html'
];

let totalFormsFound = 0;
viewFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match all <form ...> tags
  const formTags = content.match(/<form[^>]+>/g) || [];
  totalFormsFound += formTags.length;

  formTags.forEach(tag => {
    const idMatch = tag.match(/id="([^"]+)"/);
    const formId = idMatch ? idMatch[1] : 'unknown-form';
    assert(`Form #${formId} in ${file} has novalidate attribute (no native tooltips)`, tag.includes('novalidate'));
  });
});
assert('All project forms were found and validated for novalidate', totalFormsFound === 11);

// Test mock element behavior for showFormError and clearFormError
function createMockClassList() {
  const classes = new Set();
  return {
    add: (...c) => c.forEach(x => classes.add(x)),
    remove: (...c) => c.forEach(x => classes.delete(x)),
    contains: (c) => classes.has(c),
    get size() { return classes.size; }
  };
}

function createMockElement(id = '', tag = 'div') {
  const listeners = new Map();
  const children = [];
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: createMockClassList(),
    textContent: '',
    children,
    querySelector: (sel) => {
      if (sel.includes('.js-error-msg') || sel.includes('error-msg')) {
        return children.find(c => c.id.includes('error-msg') || c.id.includes('msg')) || children[0] || null;
      }
      if (sel.includes('.js-form-error') || sel.includes('error-alert') || sel.includes('error')) {
        return children.find(c => c.id.includes('error') || c.id.includes('alert')) || null;
      }
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel.includes('.has-error')) {
        return children.filter(c => c.classList.contains('has-error'));
      }
      if (sel.includes('.js-form-error') || sel.includes('error')) {
        return children.filter(c => c.id.includes('error'));
      }
      return [];
    },
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener: (type, fn) => {
      if (!listeners.has(type)) return;
      const arr = listeners.get(type).filter(f => f !== fn);
      listeners.set(type, arr);
    },
    dispatchEvent: (type) => {
      const arr = listeners.get(type) || [];
      arr.forEach(fn => fn());
    },
    focus: () => {}
  };
}

const mockForm = createMockElement('form-test', 'form');
const mockErrBox = createMockElement('test-error-alert');
mockErrBox.classList.add('hidden');
const mockErrMsg = createMockElement('test-error-msg', 'span');
mockErrBox.children.push(mockErrMsg);
mockForm.children.push(mockErrBox);

const mockInput = createMockElement('test-input', 'input');
mockForm.children.push(mockInput);

showFormError(mockForm, 'Mã PIN điểm danh phải gồm đúng 6 chữ số!', mockInput);
assert('showFormError unhides error alert box', !mockErrBox.classList.contains('hidden'));
assert('showFormError sets error message text', mockErrMsg.textContent === 'Mã PIN điểm danh phải gồm đúng 6 chữ số!');
assert('showFormError marks invalid input with has-error class', mockInput.classList.contains('has-error'));

// Test typing event auto-clears error
mockInput.dispatchEvent('input');
assert('User input event auto-clears has-error class', !mockInput.classList.contains('has-error'));
assert('User input event hides form error alert', mockErrBox.classList.contains('hidden'));

// Test clearFormError explicitly
showFormError(mockForm, 'Lỗi khác', mockInput);
clearFormError(mockForm);
assert('clearFormError hides error alert box', mockErrBox.classList.contains('hidden'));
assert('clearFormError removes has-error from inputs', !mockInput.classList.contains('has-error'));

// 12. Testing API & Mock Contract Sync (Zero Discrepancy)
console.log('\n--- 12. Testing API & Mock Contract Sync (Zero Discrepancy) ---');

// Test addDocument returns docId
const testAddDoc = await mockCallApi('addDocument', {
  tenTaiLieu: 'Tài liệu Thử nghiệm Sync Contract',
  phanLoai: 'Chuẩn đầu ra (MOS/IC3)',
  linkDrive: 'https://drive.google.com/test-sync',
  moTa: 'Tài liệu sync contract'
});
assert('addDocument returns res.docId matching data.DocID', testAddDoc.success === true && Boolean(testAddDoc.docId) && testAddDoc.docId === testAddDoc.data.DocID);

// Test createTask returns folderId
const testCreateTask = await mockCallApi('createTask', {
  tieuDe: 'Task Sync Contract Test',
  deadline: '2026-11-01T23:59',
  nguoiNhan: 'ALL',
  moTa: 'Thử nghiệm folderId',
  sessionId: 'MEET_20261015_190000'
});
assert('createTask returns res.folderId and res.taskId', testCreateTask.success === true && Boolean(testCreateTask.taskId) && Boolean(testCreateTask.folderId));

// Test submitTaskAssignment returns fileUrl and submitTime
const testSubmitTask = await mockCallApi('submitTaskAssignment', {
  taskId: testCreateTask.taskId,
  mssv: '2351120015',
  hoTen: 'Lê Hoàng Minh',
  email: 'minhlh.k68@gmail.com',
  fileName: 'test_sync.zip'
});
assert('submitTaskAssignment returns fileUrl and submitTime', testSubmitTask.success === true && Boolean(testSubmitTask.subId) && Boolean(testSubmitTask.fileUrl) && Boolean(testSubmitTask.submitTime));

// Test checkInAttendance returns sessionId
const testCheckin = await mockCallApi('checkInAttendance', {
  pinCode: '839201',
  mssv: '2451120033'
});
assert('checkInAttendance returns res.sessionId', testCheckin.success === true && testCheckin.sessionId === 'MEET_20261015_190000');

// Test getAuthStatus security: no token -> PROMPT_MSSV (not auto-authenticated)
localStorage.removeItem('bht_token');
const unauthStatus = await mockCallApi('getAuthStatus', { cachedMssv: '2351120015' });
assert('getAuthStatus without token prompts for OTP (PROMPT_MSSV)', unauthStatus.status === 'PROMPT_MSSV' && unauthStatus.suggestedMssv === '2351120015');

// Test getAuthStatus with valid MOCK_TOKEN -> AUTHENTICATED
localStorage.setItem('bht_token', 'MOCK_TOKEN_2351120015');
const authStatus = await mockCallApi('getAuthStatus', {});
assert('getAuthStatus with MOCK_TOKEN returns AUTHENTICATED', authStatus.status === 'AUTHENTICATED' && authStatus.user.mssv === '2351120015');

// Test getAuthStatus with inactive user -> BLOCKED
localStorage.setItem('bht_token', 'MOCK_TOKEN_2251120099');
const blockedStatus = await mockCallApi('getAuthStatus', {});
assert('getAuthStatus with Inactive user returns BLOCKED', blockedStatus.status === 'BLOCKED');

// Clean up
localStorage.removeItem('bht_token');
await mockCallApi('deleteDocument', { docId: testAddDoc.docId });
await mockCallApi('deleteTask', { taskId: testCreateTask.taskId });

console.log('\n--- 13. Testing Date Formatting, Hero Countdown & Admin Docs ---');
// 13.1 Format ngày giờ VN chuẩn 'HH:mm • DD/MM/YYYY'
const isoFormatted = formatSessionDateVN('2026-10-19T18:30');
assert('formatSessionDateVN formats ISO 2026-10-19T18:30 to 18:30 • 19/10/2026', isoFormatted === '18:30 • 19/10/2026');

const dateOnlyFormatted = formatSessionDateVN('2026-10-19');
assert('formatSessionDateVN formats date-only to 19/10/2026', dateOnlyFormatted === '19/10/2026');

const vnFormatted = formatSessionDateVN('19/10/2026 18:30');
assert('formatSessionDateVN handles VN date string correctly', vnFormatted === '18:30 • 19/10/2026');

// 13.2 Buổi học ngày mai (tương lai) KHÔNG ĐƯỢC hiển thị 'ĐANG DIỄN RA'
const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
const tomorrowIso = tomorrow.toISOString().slice(0, 16);
const futureSession = {
  SessionID: 'MEET_FUTURE',
  TenBuoiHop: 'Chuyên đề Tương Lai',
  NgayDienRa: tomorrowIso,
  PhongHoc: 'Lab 01',
  TrangThai: 'Open',
  TagChuyenDe: 'MOS_IC3'
};
const futureCardHtml = renderMemberSpotlightCard(futureSession, false);
assert('Future session is NOT marked as ĐANG DIỄN RA even if TrangThai=Open', !futureCardHtml.includes('ĐANG DIỄN RA'));
assert('Future session renders Hero Countdown Box with countdown text', futureCardHtml.includes('Thời gian đếm ngược bắt đầu'));
assert('Future session displays formatted VN date', futureCardHtml.includes(formatSessionDateVN(tomorrowIso)));

// 13.3 Custom topic tag badge
const customTagHtml = uiTopicTagBadge('Trí tuệ nhân tạo Deep Learning');
assert('uiTopicTagBadge renders custom topic tag text accurately', customTagHtml.includes('Trí tuệ nhân tạo Deep Learning'));
assert('uiTopicTagBadge applies bookmark icon for custom tags', customTagHtml.includes('fa-bookmark'));

// 13.4 Admin HTML contains docs management section and forms
const adminHtmlContent = fs.readFileSync('./frontend/views/admin.html', 'utf-8');
assert('admin.html has #admin-tab-docs section', adminHtmlContent.includes('id="admin-tab-docs"'));
assert('admin.html has #modal-edit-doc modal', adminHtmlContent.includes('id="modal-edit-doc"'));
assert('admin.html has #admin-tab-btn-docs sidebar tab', adminHtmlContent.includes('id="admin-tab-btn-docs"'));
assert('admin.html has #att-custom-tag-container for custom topics', adminHtmlContent.includes('id="att-custom-tag-container"'));
assert('admin.html has #edit-doc-custom-category-container for custom doc categories', adminHtmlContent.includes('id="edit-doc-custom-category-container"'));
assert('admin.html has #admin-search-attendance input', adminHtmlContent.includes('id="admin-search-attendance"'));
assert('admin.html has #admin-attendance-category-filters container', adminHtmlContent.includes('id="admin-attendance-category-filters"'));

// 13.5 Member HTML contains sessions search bar and category filter pills
const memberHtmlContent = fs.readFileSync('./frontend/views/member.html', 'utf-8');
assert('member.html has #input-search-sessions input', memberHtmlContent.includes('id="input-search-sessions"'));
assert('member.html has #member-sessions-categories container', memberHtmlContent.includes('id="member-sessions-categories"'));

// 13.6 CSS contains scrollbar-none and mobile touch pill optimization
const stylesCssContent = fs.readFileSync('./frontend/css/styles.css', 'utf-8');
assert('styles.css defines .scrollbar-none and .scrollbar-hide', stylesCssContent.includes('.scrollbar-none') && stylesCssContent.includes('.scrollbar-hide'));
assert('styles.css optimizes .bht-category-pill with touch-action and flex-shrink', stylesCssContent.includes('flex-shrink: 0') && stylesCssContent.includes('touch-action: manipulation'));

// 13.7 Central App Dispatcher contains session filter actions
const appJsContent = fs.readFileSync('./frontend/app.js', 'utf-8');
assert('app.js registers filter-sessions-category action', appJsContent.includes("'filter-sessions-category'"));
assert('app.js registers filter-admin-attendance action', appJsContent.includes("'filter-admin-attendance'"));

// 13.8 Custom Document Category Card Rendering
const customDocCard = renderDocCard({
  DocID: 'DOC_CUSTOM_01',
  TenTaiLieu: 'Giáo trình Lập trình Rust cơ bản',
  PhanLoai: 'Lập trình Hệ thống Rust',
  LinkDrive: 'https://drive.google.com/rust',
  MoTa: 'Nhập môn ngôn ngữ lập trình hệ thống an toàn bộ nhớ'
});
assert('renderDocCard displays custom category label accurately', customDocCard.includes('Lập trình Hệ thống Rust'));
assert('renderDocCard applies folder icon for custom categories', customDocCard.includes('fa-folder-open'));
assert('renderDocCard applies accent badge style for custom categories', customDocCard.includes('bg-accent-soft'));

// 13.9 Admin View-as-Member Role Switching & Preview Banner
assert('admin.html has switch-to-member-view action', adminHtmlContent.includes('data-action="switch-to-member-view"'));
assert('member.html has #admin-preview-mode-banner', memberHtmlContent.includes('id="admin-preview-mode-banner"'));
assert('member.html has #sidebar-return-admin-container', memberHtmlContent.includes('id="sidebar-return-admin-container"'));
assert('member.html has #mobile-return-admin-btn', memberHtmlContent.includes('id="mobile-return-admin-btn"'));
assert('member.html has return-to-admin-view action', memberHtmlContent.includes('data-action="return-to-admin-view"'));
assert('app.js registers switch-to-member-view action', appJsContent.includes("'switch-to-member-view'"));
assert('app.js registers return-to-admin-view action', appJsContent.includes("'return-to-admin-view'"));
assert('app.js registers view-as-member action', appJsContent.includes("'view-as-member'"));

// --------------------------------------------------------------------
// 14. Testing Frontend Improvement Plan Implementations
// --------------------------------------------------------------------
console.log('\n--- 14. Testing Frontend Plan Architecture & Hardening ---');

// 14.1 View Lifecycle & Cleanup Registry
const { registerViewCleanup, runViewCleanup } = await import('./frontend/services/viewLoader.js');
let cleanupRan = false;
registerViewCleanup(() => { cleanupRan = true; });
runViewCleanup();
assert('runViewCleanup executes registered cleanup handlers', cleanupRan === true);

let unregisterRan = false;
const unregisterFn = registerViewCleanup(() => { unregisterRan = true; });
unregisterFn(); // Unregister manually
runViewCleanup();
assert('unregisterViewCleanup removes handler prior to execution', unregisterRan === false);

// 14.2 Store reset clears timer and subscriptions
store.setState({ otpTimer: 999 });
assert('store has otpTimer set before reset', store.getState('otpTimer') === 999);
store.reset();
assert('store.reset clears otpTimer state', store.getState('otpTimer') === null);

// 14.3 Keyed templates have data-key attributes
const sessionCardSample = adminSessionCardTemplate({
  SessionID: 'MEET_SAMPLE_KEY',
  TenBuoiHop: 'Kiểm thử Keyed Diff Card',
  NgayDienRa: '2026-10-25'
});
assert('adminSessionCardTemplate includes data-key attribute', sessionCardSample.includes('data-key="MEET_SAMPLE_KEY"'));

const memberRowSample = adminMemberRowTemplate({
  MSSV: '2351120099',
  HoTen: 'Nguyễn Văn Key'
});
assert('adminMemberRowTemplate includes data-key attribute', memberRowSample.includes('data-key="2351120099"'));

const subRowSample = adminSubmissionRowTemplate({
  SubID: 'SUB_KEY_01',
  TaskID: 'TASK_01',
  MSSV: '2351120015',
  TenFile: 'BaoCao.docx'
});
assert('adminSubmissionRowTemplate includes data-key attribute', subRowSample.includes('data-key="SUB_KEY_01"'));

const docCardSample = renderDocCard({
  DocID: 'DOC_KEY_01',
  TenTaiLieu: 'TaiLieu.pdf',
  PhanLoai: 'Slide'
});
assert('renderDocCard includes data-key attribute', docCardSample.includes('data-key="DOC_KEY_01"'));

const taskItemSample = renderAdminTaskItem({
  TaskID: 'TASK_KEY_01',
  TieuDe: 'Nhiệm vụ Keyed'
});
assert('renderAdminTaskItem includes data-key attribute', taskItemSample.includes('data-key="TASK_KEY_01"'));

// 14.4 XSS filter escaping in renderMemberAttendanceAuditTable
const xssPayload = '<script>alert(1)</script>';
const auditXssResult = renderMemberAttendanceAuditTable([{ SessionID: 'MEET_01', TrangThai: 'Closed' }], '2351120015', xssPayload);
assert('renderMemberAttendanceAuditTable escapes XSS filter string', auditXssResult.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && !auditXssResult.includes('<script>'));

// 14.5 Central JSDoc types definition file
const typesContent = fs.readFileSync('frontend/types.js', 'utf8');
assert('frontend/types.js exists and exports AttendanceSession typedef', typesContent.includes('@typedef {Object} AttendanceSession'));
assert('frontend/types.js exports Member typedef', typesContent.includes('@typedef {Object} Member'));
assert('frontend/types.js exports Task typedef', typesContent.includes('@typedef {Object} Task'));
assert('frontend/types.js exports Submission typedef', typesContent.includes('@typedef {Object} Submission'));
assert('frontend/types.js exports AcademicDocument typedef', typesContent.includes('@typedef {Object} AcademicDocument'));

// 14.6 CDN Resilience & Preconnect in index.html
const frontendIndexHtml = fs.readFileSync('frontend/index.html', 'utf8');
assert('frontend/index.html has dns-prefetch for cdnjs', frontendIndexHtml.includes('<link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">'));
assert('frontend/index.html has FontAwesome CDN fallback onerror', frontendIndexHtml.includes('onerror="this.onerror=null;this.href=\'https://cdn.jsdelivr.net'));

// 15. Testing 3-Submission Limit, Single Active Latest Submission & Drive Folder
console.log('\n--- 15. Testing 3-Submission Limit, Single Active Latest Submission & Drive Folder ---');

// 15.1 Giới hạn 3 lần nộp bài
const testTaskId = 'TASK_LIMIT_TEST_' + Date.now();
const testMssv = '2351120999';

const sub1 = await mockCallApi('submitTaskAssignment', {
  taskId: testTaskId,
  mssv: testMssv,
  hoTen: 'Sinh Viên Test',
  fileName: 'BaiTap_Lan1.zip'
});
assert('First submission succeeds (turn 1)', sub1.success && sub1.turn === 1);

const sub2 = await mockCallApi('submitTaskAssignment', {
  taskId: testTaskId,
  mssv: testMssv,
  hoTen: 'Sinh Viên Test',
  fileName: 'BaiTap_Lan2.zip'
});
assert('Second submission succeeds (turn 2)', sub2.success && sub2.turn === 2);

const sub3 = await mockCallApi('submitTaskAssignment', {
  taskId: testTaskId,
  mssv: testMssv,
  hoTen: 'Sinh Viên Test',
  fileName: 'BaiTap_Lan3.zip'
});
assert('Third submission succeeds (turn 3)', sub3.success && sub3.turn === 3);

const sub4 = await mockCallApi('submitTaskAssignment', {
  taskId: testTaskId,
  mssv: testMssv,
  hoTen: 'Sinh Viên Test',
  fileName: 'BaiTap_Lan4.zip'
});
assert('Fourth submission is BLOCKED with SUBMISSION_LIMIT_EXCEEDED', !sub4.success && sub4.errorCode === 'SUBMISSION_LIMIT_EXCEEDED');

// 15.2 Single Active Latest Submission in Admin Table
const rawSubs = [
  { SubID: 'SUB_01', TaskID: 'T1', MSSV: '2351120001', ThoiGianNop: '10/10/2026 10:00:00', TenFile: 'Lan1.zip' },
  { SubID: 'SUB_02', TaskID: 'T1', MSSV: '2351120001', ThoiGianNop: '10/10/2026 11:00:00', TenFile: 'Lan2.zip' },
  { SubID: 'SUB_03', TaskID: 'T1', MSSV: '2351120001', ThoiGianNop: '10/10/2026 12:00:00', TenFile: 'Lan3.zip' },
  { SubID: 'SUB_04', TaskID: 'T1', MSSV: '2351120002', ThoiGianNop: '10/10/2026 09:00:00', TenFile: 'Lan1_B.zip' }
];

const latestSubs = getLatestSubmissionsPerMember(rawSubs);
assert('getLatestSubmissionsPerMember returns exactly 1 item per (TaskID, MSSV)', latestSubs.length === 2);

const student1Sub = latestSubs.find(s => s.MSSV === '2351120001');
assert('Latest submission for student 1 is the most recent (SUB_03)', student1Sub && student1Sub.SubID === 'SUB_03');
assert('Latest submission correctly tracks total turn count (3)', student1Sub && student1Sub._submissionTurn === 3);

// 15.3 Member submission ordering (newest first)
const memberOrderedSubs = getMemberSubmissionsForTask(rawSubs, 'T1');
assert('getMemberSubmissionsForTask places latest submission at index 0', memberOrderedSubs[0].SubID === 'SUB_03');

// 15.4 Update Drive Folder ID in updateTask
const updateFolderRes = await mockCallApi('updateTask', {
  taskId: 'TASK_20261015_001',
  folderId: 'https://drive.google.com/drive/folders/1abcXYZ_FOLDER_ID_1234567890?usp=sharing'
});
assert('updateTask accepts full Drive URL and extracts FolderID regex', updateFolderRes.success && updateFolderRes.folderId === '1abcXYZ_FOLDER_ID_1234567890');

// 15.5 Render turn badge in renderSubmissionRow
const rowHtmlWithTurn = renderSubmissionRow(student1Sub, { showTaskColumn: true });
assert('renderSubmissionRow renders [Lần 3/3] badge', rowHtmlWithTurn.includes('Lần 3/3'));

// 15.6 Render Drive button in renderAdminTaskItem
const taskWithDrive = renderAdminTaskItem({
  TaskID: 'T_DRIVE',
  TieuDe: 'Bài tập Drive',
  FolderID: 'FOLDER_ID_SAMPLE_1234567890'
});
assert('renderAdminTaskItem renders Drive link button when FolderID is present', taskWithDrive.includes('https://drive.google.com/drive/folders/FOLDER_ID_SAMPLE_1234567890'));

// 15.7 diffRenderList cleans up unkeyed skeleton/placeholder elements
let skeletonRemoved = false;
const mockSkeletonChild = {
  getAttribute: () => null,
  remove: () => { skeletonRemoved = true; }
};
const mockExistingChild = {
  getAttribute: (attr) => attr === 'data-key' ? 'DOC_EXISTING' : null,
  outerHTML: '<div data-key="DOC_EXISTING">Old</div>',
  replaceWith: () => {}
};
const mockContainer = {
  children: [mockSkeletonChild, mockExistingChild],
  insertBefore: () => {}
};
import { diffRenderList } from './frontend/utils/dom.js';
diffRenderList(mockContainer, [{ DocID: 'DOC_EXISTING' }], 'DocID', () => '<div data-key="DOC_EXISTING">New</div>');
assert('diffRenderList automatically removes unkeyed skeleton elements', skeletonRemoved === true);

// ====================================================================
// 16. TESTING QUIZ & PRACTICE MODULE MOCK DATA (ZERO DISCREPANCY)
// ====================================================================
console.log('\n--- 16. Testing Quiz & Practice Module Mock Data ---');

// 16.1 Invalidation Map
assert('MUTATION_INVALIDATION_MAP contains saveQuiz', MUTATION_INVALIDATION_MAP.saveQuiz && MUTATION_INVALIDATION_MAP.saveQuiz.includes('getQuizBySession'));
assert('MUTATION_INVALIDATION_MAP contains toggleQuizStatus', MUTATION_INVALIDATION_MAP.toggleQuizStatus && MUTATION_INVALIDATION_MAP.toggleQuizStatus.includes('getQuizBySession'));
assert('MUTATION_INVALIDATION_MAP contains submitQuiz', MUTATION_INVALIDATION_MAP.submitQuiz && MUTATION_INVALIDATION_MAP.submitQuiz.includes('getQuizBySession'));
assert('MUTATION_INVALIDATION_MAP contains deleteQuiz', MUTATION_INVALIDATION_MAP.deleteQuiz && MUTATION_INVALIDATION_MAP.deleteQuiz.includes('getQuizBySession'));
assert('MUTATION_INVALIDATION_MAP contains resetQuizSubmission', MUTATION_INVALIDATION_MAP.resetQuizSubmission && MUTATION_INVALIDATION_MAP.resetQuizSubmission.includes('getQuizResultsBySession'));
assert('MUTATION_INVALIDATION_MAP contains resetAllQuizSubmissions', MUTATION_INVALIDATION_MAP.resetAllQuizSubmissions && MUTATION_INVALIDATION_MAP.resetAllQuizSubmissions.includes('getQuizResultsBySession'));

// 16.2 getQuizBySession for student who has NOT submitted (anti-cheat: hide dapAnDung)
const newStudentRes = await mockCallApi('getQuizBySession', {
  sessionId: 'MEET_20261015_190000',
  mssv: '2451120099', // Chưa làm bài
  isAdmin: false
});
assert('getQuizBySession returns quiz data', newStudentRes.success && newStudentRes.data.quiz !== null);
assert('getQuizBySession for unsubmitted student hides dapAnDung', newStudentRes.data.quiz.DanhSachCauHoi[0].dapAnDung === undefined);
assert('getQuizBySession for unsubmitted student keeps question choices', newStudentRes.data.quiz.DanhSachCauHoi[0].luaChon.length === 4);

// 16.3 getQuizBySession for ADMIN returns full answers and explanations
const adminQuizRes = await mockCallApi('getQuizBySession', {
  sessionId: 'MEET_20261015_190000',
  isAdmin: true
});
assert('getQuizBySession for Admin preserves dapAnDung', adminQuizRes.data.quiz.DanhSachCauHoi[0].dapAnDung !== undefined);
assert('getQuizBySession for Admin preserves giaiThich', !!adminQuizRes.data.quiz.DanhSachCauHoi[0].giaiThich);

// 16.4 submitQuiz calculates exact score & correct answers
const submitRes = await mockCallApi('submitQuiz', {
  sessionId: 'MEET_20261015_190000',
  quizId: 'QUIZ_20261015_01',
  mssv: '2451120099',
  hoTen: 'Sinh Viên Test',
  chiTietTraLoi: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 1 }, // Đúng cả 5 câu (100 điểm)
  thoiGianLamGiay: 180
});
assert('submitQuiz succeeds', submitRes.success === true);
assert('submitQuiz calculates 100/100 score for all correct answers', submitRes.data.result.DiemSo === 100 && submitRes.data.result.SoCauDung === 5);
assert('submitQuiz returns explanations for student review', !!submitRes.data.quiz.DanhSachCauHoi[0].giaiThich);

// 16.5 toggleQuizStatus and deleteQuiz
const toggleRes = await mockCallApi('toggleQuizStatus', {
  sessionId: 'MEET_20261015_190000',
  trangThai: 'Closed'
});
assert('toggleQuizStatus sets status to Closed', toggleRes.success && toggleRes.trangThai === 'Closed');

// 16.6 submitQuiz is blocked when quiz is Closed
const blockedSubmit = await mockCallApi('submitQuiz', {
  sessionId: 'MEET_20261015_190000',
  quizId: 'QUIZ_20261015_01',
  mssv: '2451120088',
  chiTietTraLoi: {}
});
assert('submitQuiz blocked when quiz status is Closed', blockedSubmit.success === false);

// Re-open for subsequent tests
await mockCallApi('toggleQuizStatus', {
  sessionId: 'MEET_20261015_190000',
  trangThai: 'Open'
});

// 16.7 OOP C++ Quiz Bank from tracnhiem.html
const oopQuizRes = await mockCallApi('getQuizBySession', {
  sessionId: 'MEET_20261008_190000',
  isAdmin: true
});
assert('QUIZ_OOP_CPP_01 exists in mock bank', oopQuizRes.success && oopQuizRes.data.quiz !== null && oopQuizRes.data.quiz.QuizID === 'QUIZ_OOP_CPP_01');
assert('QUIZ_OOP_CPP_01 has 8 core OOP questions with explanations', oopQuizRes.data.quiz.DanhSachCauHoi.length === 8 && Boolean(oopQuizRes.data.quiz.DanhSachCauHoi[0].giaiThich));

// 16.8 getMemberQuizProfile returns streak and pools
const profileRes = await mockCallApi('getMemberQuizProfile', { mssv: '2351120015' });
assert('getMemberQuizProfile returns member streak and badging info', profileRes.success && profileRes.data.StreakDays >= 1 && Array.isArray(profileRes.data.Badges));
assert('getMemberQuizProfile includes Wrong and Bookmark pools', Array.isArray(profileRes.data.WrongQuestionIds) && Array.isArray(profileRes.data.BookmarkedQuestionIds));

// 16.9 recordQuizAnswer: Instant Feedback & Wrong Pool auto-management
const answerWrongRes = await mockCallApi('recordQuizAnswer', {
  quizId: 'QUIZ_OOP_CPP_01',
  questionId: 1,
  selectedIndex: 0, // Sai (chọn 0 thay vì 1)
  mssv: '2351120015'
});
assert('recordQuizAnswer correctly identifies wrong answer', answerWrongRes.success && answerWrongRes.data.isCorrect === false);
assert('recordQuizAnswer returns correct answer index and explanation', answerWrongRes.data.correctAnswer === 1 && Boolean(answerWrongRes.data.explanation));

// Now answer correctly -> auto-removes from wrong pool
const answerCorrectRes = await mockCallApi('recordQuizAnswer', {
  quizId: 'QUIZ_OOP_CPP_01',
  questionId: 1,
  selectedIndex: 1, // Đúng
  mssv: '2351120015'
});
assert('recordQuizAnswer correctly identifies right answer', answerCorrectRes.success && answerCorrectRes.data.isCorrect === true);

// 16.10 toggleQuestionBookmark
const toggleBmRes = await mockCallApi('toggleQuestionBookmark', {
  quizId: 'QUIZ_OOP_CPP_01',
  questionId: 3,
  mssv: '2351120015'
});
assert('toggleQuestionBookmark toggles state to bookmarked', toggleBmRes.success && typeof toggleBmRes.data.isBookmarked === 'boolean');

// 16.11 getPersonalQuizPool returns extracted questions
const poolRes = await mockCallApi('getPersonalQuizPool', {
  mssv: '2351120015',
  poolType: 'bookmark'
});
assert('getPersonalQuizPool returns bookmarked questions list', poolRes.success && Array.isArray(poolRes.data.questions));

// 16.12 clearWrongHistory resets wrong list
const clearWrongRes = await mockCallApi('clearWrongHistory', { mssv: '2351120015' });
assert('clearWrongHistory succeeds', clearWrongRes.success === true);
const profileAfterClear = await mockCallApi('getMemberQuizProfile', { mssv: '2351120015' });
assert('WrongQuestionIds is empty after clearWrongHistory', profileAfterClear.data.WrongQuestionIds.length === 0);

// 16.13 resetQuizSubmission allows student to retake 10-minute quiz
const resetSingleRes = await mockCallApi('resetQuizSubmission', {
  quizId: 'QUIZ_20261015_01',
  sessionId: 'MEET_20261015_190000',
  mssv: '2451120099'
});
assert('resetQuizSubmission succeeds', resetSingleRes.success === true);

// 16.14 resetAllQuizSubmissions resets class submissions and reopens quiz
const resetAllRes = await mockCallApi('resetAllQuizSubmissions', {
  quizId: 'QUIZ_20261015_01',
  sessionId: 'MEET_20261015_190000'
});
assert('resetAllQuizSubmissions succeeds', resetAllRes.success === true);

// --------------------------------------------------------------------
// 17. Testing Single-Question Focus UI & Gamification Trắc Nghiệm
// --------------------------------------------------------------------
console.log('\n--- 17. Testing Single-Question Focus UI & Gamification Trắc Nghiệm ---');

const {
  renderQuizQuestionGridContent,
  renderMemberQuizView,
  renderZenQuestionCard,
  renderZenFooterDock
} = await import('./frontend/modules/templates.js');

// 17.1 renderQuizQuestionGridContent Matrix
const sampleQuestions = [
  { id: 1, cauHoi: 'Tính chất nào ẩn chi tiết cài đặt?', luaChon: ['Kế thừa', 'Đóng gói', 'Đa hình', 'Trừu tượng'], dapAnDung: 1 },
  { id: 2, cauHoi: 'Từ khóa tạo kế thừa trong C++?', luaChon: ['extends', ':', 'inherits', 'implements'], dapAnDung: 1 },
  { id: 3, cauHoi: 'Hàm ảo thuần ảo kết thúc bằng gì?', luaChon: ['= 0', 'virtual', 'abstract', '= null'], dapAnDung: 0 }
];

const gridHtml = renderQuizQuestionGridContent(
  sampleQuestions,
  { 1: 1, 2: 0 }, // currentAnswers
  { 1: { isCorrect: true, correctAnswer: 1 }, 2: { isCorrect: false, correctAnswer: 1 } }, // answerResults
  1, // currentIndex (đang ở câu 2)
  [3] // bookmarkedIds (câu 3 được bookmark)
);

assert('renderQuizQuestionGridContent renders question 1 with emerald (correct) style', gridHtml.includes('border-emerald-500'));
assert('renderQuizQuestionGridContent renders question 2 with rose (wrong) style', gridHtml.includes('border-rose-500'));
assert('renderQuizQuestionGridContent highlights current question with ring indicator', gridHtml.includes('ring-accent'));
assert('renderQuizQuestionGridContent shows star icon for bookmarked question', gridHtml.includes('fa-star') && gridHtml.includes('text-amber-500'));
assert('renderQuizQuestionGridContent assigns jump-quiz-question data-action to buttons', gridHtml.includes('data-action="jump-quiz-question"'));

// 17.2 Zen Focus Arena UI Components (Modal làm bài tập trung toàn màn hình)
const zenQuestionHtml = renderZenQuestionCard(
  sampleQuestions[0],
  0, // safeIndex 0 (câu 1)
  3, // totalCount 3
  1, // selectedOpt
  { isCorrect: true, correctIndex: 1, explanation: 'Đóng gói giúp ẩn thông tin cài đặt' },
  true, // isPractice = true (kích hoạt Instant Feedback & auto-next checkbox)
  false, // isBookmarked
  true // autoNext
);

assert('renderZenQuestionCard renders #1 question counter', zenQuestionHtml.includes('#1'));
assert('renderZenQuestionCard renders keyboard shortcuts hint', zenQuestionHtml.includes('Phím tắt:') && zenQuestionHtml.includes('A-D'));
assert('renderZenQuestionCard renders Instant Explanation for correct answer', zenQuestionHtml.includes('Chính xác tuyệt đối!') && zenQuestionHtml.includes('Đóng gói giúp ẩn thông tin cài đặt'));
assert('renderZenQuestionCard renders choices with select-quiz-option action', zenQuestionHtml.includes('data-action="select-quiz-option"'));
assert('renderZenQuestionCard includes 1.2s auto-next checkbox', zenQuestionHtml.includes('id="chk-quiz-auto-next"') && zenQuestionHtml.includes('1.2s'));

const zenFooterHtml = renderZenFooterDock(0, 3, 1, true, 'MEET_20261019_TEST', 'QUIZ_TEST');
assert('renderZenFooterDock includes Prev and Next navigation buttons', zenFooterHtml.includes('data-action="prev-quiz-question"') && zenFooterHtml.includes('data-action="next-quiz-question"'));
assert('renderZenFooterDock includes Question Grid drawer trigger', zenFooterHtml.includes('data-action="open-quiz-grid-modal"'));

const zenFooterLastHtml = renderZenFooterDock(2, 3, 3, true, 'MEET_20261019_TEST', 'QUIZ_TEST');
assert('renderZenFooterDock on last question includes Submit button', zenFooterLastHtml.includes('data-action="submit-member-quiz"'));

// 17.3 Member Quiz View as Dashboard & Leaderboard (Hiển thị tiến trình & kết quả trong sub-view)
const sampleQuiz = {
  QuizID: 'QUIZ_TEST_DASHBOARD',
  SessionID: 'MEET_20261019_TEST',
  TieuDe: 'Kiểm thử Dashboard & Leaderboard',
  ThoiGianPhut: 15,
  TrangThai: 'Open',
  DanhSachCauHoi: sampleQuestions
};

const dashboardUnsubmittedHtml = renderMemberQuizView(sampleQuiz, null, {
  memberProfile: { StreakDays: 5, WrongQuestionIds: [2], BookmarkedQuestionIds: [3] },
  leaderboard: [
    { MSSV: '2251120001', HoTen: 'Lê Văn Admin', DiemSo: 100, SoCauDung: 3, TongSoCau: 3, ThoiGianLamGiay: 45 }
  ],
  sessionId: 'MEET_20261019_TEST'
});

assert('renderMemberQuizView Dashboard renders Leaderboard section', dashboardUnsubmittedHtml.includes('Bảng Xếp Hạng Buổi Sinh Hoạt'));
assert('renderMemberQuizView Dashboard renders top 1 member in leaderboard', dashboardUnsubmittedHtml.includes('Lê Văn Admin') && dashboardUnsubmittedHtml.includes('100'));
assert('renderMemberQuizView Dashboard displays Start Official Exam button', dashboardUnsubmittedHtml.includes('data-action="start-official-quiz"'));

const sampleExistingResult = {
  ResultID: 'RES_OFFICIAL_01',
  QuizID: 'QUIZ_TEST_DASHBOARD',
  MSSV: '2351120015',
  DiemSo: 100,
  SoCauDung: 3,
  TongSoCau: 3,
  IsOfficial: true
};

const dashboardSubmittedHtml = renderMemberQuizView(sampleQuiz, sampleExistingResult, {
  memberProfile: { StreakDays: 5, WrongQuestionIds: [], BookmarkedQuestionIds: [1] },
  leaderboard: [
    { MSSV: '2351120015', HoTen: 'Nguyễn Văn Member', DiemSo: 100, SoCauDung: 3, TongSoCau: 3, ThoiGianLamGiay: 60 }
  ],
  sessionId: 'MEET_20261019_TEST'
});

assert('renderMemberQuizView displays Official Score Card when submitted', dashboardSubmittedHtml.includes('Đã hoàn thành bài thi chính thức'));
assert('renderMemberQuizView submitted state offers Practice Arena button', dashboardSubmittedHtml.includes('Vào Phòng Ôn Luyện Toàn Màn Hình'));
assert('renderMemberQuizView submitted state allows opening Review Drawer', dashboardSubmittedHtml.includes('data-action="open-quiz-review-drawer"'));

// 17.4 Strict Official vs Practice Submission in Mock Backend
const officialRes1 = await mockCallApi('submitQuiz', {
  quizId: 'QUIZ_OOP_CPP_01',
  answers: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 1, 6: 2, 7: 1, 8: 1 },
  durationSeconds: 120,
  isPractice: false
});
assert('First official exam submission succeeds', officialRes1.success === true);

const officialRes2 = await mockCallApi('submitQuiz', {
  quizId: 'QUIZ_OOP_CPP_01',
  answers: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 1, 6: 2, 7: 1, 8: 1 },
  durationSeconds: 90,
  isPractice: false
});
assert('Second official exam submission is BLOCKED with ALREADY_SUBMITTED', officialRes2.success === false && officialRes2.errorCode === 'ALREADY_SUBMITTED');

const practiceRes = await mockCallApi('submitQuiz', {
  quizId: 'QUIZ_OOP_CPP_01',
  answers: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 1, 6: 2, 7: 1, 8: 1 },
  durationSeconds: 80,
  isPractice: true
});
assert('Practice submission is allowed even after official exam submission', practiceRes.success === true);

// 17.5 Zen Arena Modal Presence & Registered Actions in app.js
assert('member.html has #modal-quiz-zen-arena modal', memberHtmlContent.includes('id="modal-quiz-zen-arena"'));
assert('member.html has #modal-quiz-question-grid modal', memberHtmlContent.includes('id="modal-quiz-question-grid"'));
assert('app.js registers start-official-quiz action', appJsContent.includes("'start-official-quiz'"));
assert('app.js registers start-practice-quiz action', appJsContent.includes("'start-practice-quiz'"));
assert('app.js registers open-quiz-review-drawer action', appJsContent.includes("'open-quiz-review-drawer'"));
assert('app.js registers prev-quiz-question action', appJsContent.includes("'prev-quiz-question'"));
assert('app.js registers next-quiz-question action', appJsContent.includes("'next-quiz-question'"));
assert('app.js registers jump-quiz-question action', appJsContent.includes("'jump-quiz-question'"));
assert('app.js registers toggle-quiz-auto-next action', appJsContent.includes("'toggle-quiz-auto-next'"));
assert('app.js registers toggle-quiz-bookmark action', appJsContent.includes("'toggle-quiz-bookmark'"));
assert('app.js registers switch-quiz-pool action', appJsContent.includes("'switch-quiz-pool'"));
assert('app.js registers open-quiz-grid-modal action', appJsContent.includes("'open-quiz-grid-modal'"));
assert('app.js registers close-quiz-grid-modal action', appJsContent.includes("'close-quiz-grid-modal'"));
assert('app.js registers exit-taking-quiz action', appJsContent.includes("'exit-taking-quiz'"));
assert('app.js registers reset-member-quiz-submission action', appJsContent.includes("'reset-member-quiz-submission'"));
assert('app.js registers reset-all-quiz-submissions action', appJsContent.includes("'reset-all-quiz-submissions'"));

// --------------------------------------------------------------------
// 18. Testing GAS Backend Quiz API & Router Contract (Zero Discrepancy)
// --------------------------------------------------------------------
console.log('\n--- 18. Testing GAS Backend Quiz API & Router Contract ---');

const gasConfigContent = fs.readFileSync('./gas-backend/Config.js', 'utf8');
const gasRouterContent = fs.readFileSync('./gas-backend/Router.js', 'utf8');
const gasQuizServiceContent = fs.readFileSync('./gas-backend/Service_Quiz.js', 'utf8');

// 18.1 Config.js Sheet Names and Schema Headers
assert('Config.js defines TRAC_NGHIEM sheet name', gasConfigContent.includes("TRAC_NGHIEM: 'TracNghiem'"));
assert('Config.js defines KET_QUA_TRAC_NGHIEM sheet name', gasConfigContent.includes("KET_QUA_TRAC_NGHIEM: 'KetQuaTracNghiem'"));
assert('Config.js defines HO_SO_TRAC_NGHIEM sheet name', gasConfigContent.includes("HO_SO_TRAC_NGHIEM: 'HoSoTracNghiem'"));

assert('Config.js defines TracNghiem schema headers', gasConfigContent.includes("TracNghiem: ['QuizID', 'SessionID', 'TieuDe', 'MoTa', 'ThoiGianPhut', 'TrangThai', 'NgayTao', 'DanhSachCauHoi', 'SoCauThi']"));
assert('Config.js defines KetQuaTracNghiem schema headers', gasConfigContent.includes("KetQuaTracNghiem: ['ResultID', 'QuizID', 'SessionID', 'MSSV', 'HoTen', 'DiemSo', 'SoCauDung', 'TongSoCau', 'ChiTietTraLoi', 'ThoiGianNop', 'ThoiGianLamGiay', 'IsOfficial']"));
assert('Config.js defines HoSoTracNghiem schema headers', gasConfigContent.includes("HoSoTracNghiem: ['MSSV', 'StreakDays', 'LastActiveDate', 'TotalQuestionsAnswered', 'TotalCorrect', 'Badges', 'WrongQuestionIds', 'BookmarkedQuestionIds']"));

// 18.2 Router.js routing for Quiz actions
assert('Router.js routes saveQuiz', gasRouterContent.includes("case 'saveQuiz':") && gasRouterContent.includes("return saveQuiz(data);"));
assert('Router.js routes toggleQuizStatus', gasRouterContent.includes("case 'toggleQuizStatus':") && gasRouterContent.includes("return toggleQuizStatus(data);"));
assert('Router.js routes deleteQuiz', gasRouterContent.includes("case 'deleteQuiz':") && gasRouterContent.includes("return deleteQuiz("));
assert('Router.js routes resetQuizSubmission', gasRouterContent.includes("case 'resetQuizSubmission':") && gasRouterContent.includes("return resetQuizSubmission(data);"));
assert('Router.js routes resetAllQuizSubmissions', gasRouterContent.includes("case 'resetAllQuizSubmissions':") && gasRouterContent.includes("return resetAllQuizSubmissions(data);"));
assert('Router.js routes getQuizResultsBySession', gasRouterContent.includes("case 'getQuizResultsBySession':") && gasRouterContent.includes("return getQuizResultsBySession("));

// 18.3 Router.js Identity injection on Member actions (Zero Trust Client MSSV)
assert('Router.js injects currentUser.mssv for submitQuiz', gasRouterContent.includes("case 'submitQuiz':") && gasRouterContent.includes("data.mssv = currentUser.mssv;"));
assert('Router.js injects currentUser.mssv for recordQuizAnswer', gasRouterContent.includes("case 'recordQuizAnswer':") && gasRouterContent.includes("data.mssv = currentUser.mssv;"));
assert('Router.js injects currentUser.mssv for toggleQuestionBookmark', gasRouterContent.includes("case 'toggleQuestionBookmark':") && gasRouterContent.includes("data.mssv = currentUser.mssv;"));
assert('Router.js injects currentUser.mssv for clearWrongHistory', gasRouterContent.includes("case 'clearWrongHistory':") && gasRouterContent.includes("clearWrongHistory(currentUser.mssv)"));

// 18.4 Router.js Query routes
assert('Router.js routes getQuizBySession with admin check', gasRouterContent.includes("case 'getQuizBySession':") && gasRouterContent.includes("currentUser.role === CONFIG.ROLES.ADMIN"));
assert('Router.js routes getMemberQuizProfile', gasRouterContent.includes("case 'getMemberQuizProfile':") && gasRouterContent.includes("getMemberQuizProfile("));
assert('Router.js routes getPersonalQuizPool', gasRouterContent.includes("case 'getPersonalQuizPool':") && gasRouterContent.includes("getPersonalQuizPool(currentUser.mssv"));

// 18.5 Service_Quiz.js implementation verification
assert('Service_Quiz.js defines getQuizBySession', gasQuizServiceContent.includes('function getQuizBySession('));
assert('Service_Quiz.js defines saveQuiz', gasQuizServiceContent.includes('function saveQuiz('));
assert('Service_Quiz.js defines toggleQuizStatus', gasQuizServiceContent.includes('function toggleQuizStatus('));
assert('Service_Quiz.js defines deleteQuiz', gasQuizServiceContent.includes('function deleteQuiz('));
assert('Service_Quiz.js defines resetQuizSubmission', gasQuizServiceContent.includes('function resetQuizSubmission('));
assert('Service_Quiz.js defines resetAllQuizSubmissions', gasQuizServiceContent.includes('function resetAllQuizSubmissions('));
assert('Service_Quiz.js defines getQuizResultsBySession', gasQuizServiceContent.includes('function getQuizResultsBySession('));
assert('Service_Quiz.js defines submitQuiz', gasQuizServiceContent.includes('function submitQuiz('));
assert('Service_Quiz.js defines getMemberQuizProfile', gasQuizServiceContent.includes('function getMemberQuizProfile('));
assert('Service_Quiz.js defines recordQuizAnswer', gasQuizServiceContent.includes('function recordQuizAnswer('));
assert('Service_Quiz.js defines toggleQuestionBookmark', gasQuizServiceContent.includes('function toggleQuestionBookmark('));
assert('Service_Quiz.js defines getPersonalQuizPool', gasQuizServiceContent.includes('function getPersonalQuizPool('));
assert('Service_Quiz.js defines clearWrongHistory', gasQuizServiceContent.includes('function clearWrongHistory('));

// 18.6 ScriptLock & Invalidation safety in Service_Quiz.js
assert('Service_Quiz.js uses withScriptLock for race protection', gasQuizServiceContent.includes('withScriptLock('));
assert('Service_Quiz.js invalidates TRAC_NGHIEM cache on write', gasQuizServiceContent.includes('invalidateSheetCache(CONFIG.SHEET_NAMES.TRAC_NGHIEM)'));
assert('Service_Quiz.js invalidates KET_QUA_TRAC_NGHIEM cache on write', gasQuizServiceContent.includes('invalidateSheetCache(CONFIG.SHEET_NAMES.KET_QUA_TRAC_NGHIEM)'));
assert('Service_Quiz.js invalidates HO_SO_TRAC_NGHIEM cache on write', gasQuizServiceContent.includes('invalidateSheetCache(CONFIG.SHEET_NAMES.HO_SO_TRAC_NGHIEM)'));

// 18.7 Admin Exam Question Count (SoCauThi) & Local-First Practice
const adminHtmlContentLocal = fs.readFileSync('./frontend/views/admin.html', 'utf8');
const adminQuizJsContentLocal = fs.readFileSync('./frontend/modules/admin/adminQuiz.js', 'utf8');
const memberQuizJsContentLocal = fs.readFileSync('./frontend/modules/member/memberQuiz.js', 'utf8');

assert('admin.html has #edit-quiz-exam-questions-count input', adminHtmlContentLocal.includes('id="edit-quiz-exam-questions-count"'));
assert('adminQuiz.js passes soCauThi in saveQuiz', adminQuizJsContentLocal.includes('soCauThi'));
assert('Service_Quiz.js limits unsubmitted exam pool to SoCauThi', gasQuizServiceContent.includes('Number(quizObj.SoCauThi)'));
assert('memberQuiz.js implements Local-First instant evaluation in practice mode', memberQuizJsContentLocal.includes('Chấm điểm tại chỗ tức thì (Local-First: 0ms latency'));

// --- 19. Testing 20/10 Academic Easter Egg & Deterministic Gift Module ---
console.log('\n--- 19. Testing 20/10 Academic Easter Egg & Deterministic Gift Module ---');

const { 
  ACADEMIC_GIFTS_2010, 
  hashString, 
  isFemaleMember, 
  getDeterministicGiftForUser, 
  getClaimedGift, 
  renderGift2010Banner, 
  renderGift2010ModalContent,
  renderGift2010UnboxingStage,
  startGiftCardShuffleAnimation,
  stopGiftCardShuffleAnimation
} = await import('./frontend/modules/gift2010.js');

const { renderMemberRow } = await import('./frontend/modules/templates.js');

// 19.1 Mutation Map & Types
assert('MUTATION_INVALIDATION_MAP contains saveMemberGift', Array.isArray(MUTATION_INVALIDATION_MAP.saveMemberGift) && MUTATION_INVALIDATION_MAP.saveMemberGift.includes('getAllMembers'));

const mockMembers = INITIAL_MOCK_DATA.members;
const thuTrang = mockMembers.find(m => m.MSSV === '2251120002');
const phuongAnh = mockMembers.find(m => m.MSSV === '2351120028');
const dinhHoang = mockMembers.find(m => m.MSSV === '257480104007');

assert('INITIAL_MOCK_DATA defines Sex: female for Thu Trang', thuTrang && thuTrang.Sex === 'female');
assert('INITIAL_MOCK_DATA defines Sex: female for Phuong Anh', phuongAnh && phuongAnh.Sex === 'female');
assert('INITIAL_MOCK_DATA defines Sex: male for Dinh Hoang', dinhHoang && dinhHoang.Sex === 'male');
assert('INITIAL_MOCK_DATA members have gift2010 field initialized', mockMembers.every(m => 'gift2010' in m));

// 19.2 Gender Identification Logic (isFemaleMember)
assert('isFemaleMember returns true for female members', isFemaleMember(thuTrang) === true && isFemaleMember(phuongAnh) === true);
assert('isFemaleMember returns false for male members', isFemaleMember(dinhHoang) === false);
assert('isFemaleMember returns true only when Sex is female', isFemaleMember({ Sex: 'female' }) === true && isFemaleMember({ Sex: 'male' }) === false);

// 19.3 Deterministic Gift Algorithm
assert('ACADEMIC_GIFTS_2010 defines 3 academic gift types', ACADEMIC_GIFTS_2010.length === 3);
const giftTypes = ['DEADLINE_24H', 'BONUS_10PT', 'VIP_DEBUG'];
assert('ACADEMIC_GIFTS_2010 includes all specified gift IDs', giftTypes.every(id => ACADEMIC_GIFTS_2010.some(g => g.id === id)));

const giftCall1 = getDeterministicGiftForUser(phuongAnh);
const giftCall2 = getDeterministicGiftForUser(phuongAnh);
assert('getDeterministicGiftForUser is deterministic across multiple calls', giftCall1.giftId === giftCall2.giftId && giftCall1.claimCode === giftCall2.claimCode);
assert('Deterministic claimCode format matches ITC2010-XXXXX-YYY', /^ITC2010-\d{5}-\d{3}$/.test(giftCall1.claimCode));

// 19.4 Mock Action saveMemberGift & Persistence
const testGiftData = {
  giftId: giftCall1.giftId,
  giftTitle: giftCall1.giftTitle,
  claimCode: giftCall1.claimCode,
  claimedAt: new Date().toISOString(),
  used: false
};
const saveGiftRes = await mockCallApi('saveMemberGift', { userId: '2351120028', giftData: testGiftData });
assert('mockCallApi saveMemberGift succeeds', saveGiftRes && saveGiftRes.success === true);

const updatedMembersRes = await mockCallApi('getAllMembers');
const savedMember = (updatedMembersRes.data || []).find(m => m.MSSV === '2351120028');
assert('saveMemberGift updates member gift2010 in mock state', savedMember && savedMember.gift2010 && savedMember.gift2010.claimCode === giftCall1.claimCode);

// 19.5 Task Submission with Gift Code Attached
const subWithGiftRes = await mockCallApi('submitTaskAssignment', {
  taskId: 'TASK_20261015_001',
  mssv: '2351120028',
  hoTen: 'Phạm Phương Anh',
  email: 'phuonganh.cntt@gmail.com',
  fileName: 'BaoCaoTuan1.pdf',
  giftCode: giftCall1.claimCode
});
assert('submitTaskAssignment accepts giftCode', subWithGiftRes && subWithGiftRes.success === true);
const allSubsRes = await mockCallApi('getAllSubmissions');
const attachedSub = (allSubsRes.data || []).find(s => s.SubID === subWithGiftRes.subId);
assert('Attached submission records 20/10 gift tag', attachedSub && (attachedSub.Feedback.includes(giftCall1.claimCode) || attachedSub.TenFile.includes(giftCall1.claimCode)));

// 19.6 UI Banner & Admin Table Badge Rendering
const femaleBannerHtml = renderGift2010Banner(phuongAnh);
assert('renderGift2010Banner for female contains 20/10 celebration', femaleBannerHtml.includes('20/10 • Ngày Phụ Nữ Việt Nam') && femaleBannerHtml.includes('open-gift-modal'));

const claimedFemaleBannerHtml = renderGift2010Banner({
  ...phuongAnh,
  gift2010: giftCall1
});
assert('renderGift2010Banner for claimed female displays reward pill', claimedFemaleBannerHtml.includes('🎁 Đã sở hữu:') && claimedFemaleBannerHtml.includes(giftCall1.claimCode));

const maleBannerHtml = renderGift2010Banner(dinhHoang);
assert('renderGift2010Banner for male contains warm reminder and IT wish button', maleBannerHtml.includes('Anh em CLB Tin học VNUF2 đừng quên') && !maleBannerHtml.includes('open-gift-modal') && maleBannerHtml.includes('random-male-wish'));

const memberRowHtml = renderMemberRow(savedMember);
assert('renderMemberRow renders gift badge with claimCode for member with gift2010', memberRowHtml.includes(giftCall1.claimCode) && memberRowHtml.includes('🎁'));

// 19.7 DOM Template & App Action Wiring
const memberHtmlStr = fs.readFileSync('./frontend/views/member.html', 'utf8');
const appJsStr = fs.readFileSync('./frontend/app.js', 'utf8');

assert('member.html contains #member-oct20-banner-container', memberHtmlStr.includes('id="member-oct20-banner-container"'));
assert('member.html contains #modal-gift-2010', memberHtmlStr.includes('id="modal-gift-2010"'));
assert('member.html contains #submit-gift-2010-checkbox', memberHtmlStr.includes('id="submit-gift-2010-checkbox"'));
assert('member.html includes .bht-oct20-corner-flower on logo', memberHtmlStr.includes('bht-oct20-corner-flower'));
assert('app.js registers open-gift-modal action', appJsStr.includes("'open-gift-modal':"));
assert('app.js registers close-gift-modal action', appJsStr.includes("'close-gift-modal':"));
assert('app.js registers copy-gift-code action', appJsStr.includes("'copy-gift-code':"));
assert('app.js registers reset-gift-2010 action', appJsStr.includes("'reset-gift-2010':"));
assert('app.js registers preview-gift-2010 action', appJsStr.includes("'preview-gift-2010':"));
assert('app.js registers apply-quiz-bonus-voucher action', appJsStr.includes("'apply-quiz-bonus-voucher':"));
assert('app.js registers random-male-wish action', appJsStr.includes("'random-male-wish':"));
assert('app.js registers shuffle-2010-wish action', appJsStr.includes("'shuffle-2010-wish':"));
assert('app.js registers replay-gift-unboxing action', appJsStr.includes("'replay-gift-unboxing':"));
assert('app.js registers skip-gift-shuffle action', appJsStr.includes("'skip-gift-shuffle':"));
assert('member.html modal-gift-2010 has enlarged layout', memberHtmlStr.includes('max-w-2xl sm:max-w-3xl lg:max-w-4xl'));
assert('renderGift2010UnboxingStage renders 3D shuffle arena and cards', typeof renderGift2010UnboxingStage === 'function' && renderGift2010UnboxingStage().includes('bht-shuffle-arena'));
assert('startGiftCardShuffleAnimation is a valid callable function', typeof startGiftCardShuffleAnimation === 'function');
assert('stopGiftCardShuffleAnimation is a valid callable function', typeof stopGiftCardShuffleAnimation === 'function');

// 19.8 Testing applyQuizBonusVoucher API
await mockCallApi('submitQuiz', {
  sessionId: 'MEET_20261008_190000',
  mssv: '2351120015',
  hoTen: 'Vũ Hoàng Long',
  answers: { 1: 1, 2: 1, 3: 0, 4: 1, 5: 1, 6: 2, 7: 1, 8: 1 },
  durationSeconds: 95,
  isPractice: false
});

const bonusRes = await mockCallApi('applyQuizBonusVoucher', {
  sessionId: 'MEET_20261008_190000',
  mssv: '2351120015',
  giftCode: 'ITC2010-88888-999'
});
assert('mockCallApi applyQuizBonusVoucher succeeds', bonusRes && bonusRes.success === true && bonusRes.data.appliedGift2010 === true);

// --------------------------------------------------------------------
// 20. Testing Universal Event & Academic Privilege Campaigns System
// --------------------------------------------------------------------
console.log('\n--- 20. Testing Universal Event & Academic Privilege Campaigns System ---');

const {
  CAMPAIGNS_CATALOG,
  getActiveCampaign,
  getActiveCampaignId,
  renderAdminCampaignSelector
} = await import('./frontend/modules/gift2010.js');

assert('CAMPAIGNS_CATALOG contains OCT20 campaign', !!CAMPAIGNS_CATALOG.OCT20);
assert('CAMPAIGNS_CATALOG contains TET campaign', !!CAMPAIGNS_CATALOG.TET);
assert('CAMPAIGNS_CATALOG contains MARCH8 campaign', !!CAMPAIGNS_CATALOG.MARCH8);
assert('CAMPAIGNS_CATALOG contains ANNIVERSARY campaign', !!CAMPAIGNS_CATALOG.ANNIVERSARY);

// 20.1 Test getAllCampaigns
const allCampsRes = await mockCallApi('getAllCampaigns', {});
assert('getAllCampaigns returns list of campaigns and activeCampaignId', allCampsRes.success && Array.isArray(allCampsRes.data.campaigns));

// 20.2 Test setActiveCampaign (Chuyển sang TET)
const setTetRes = await mockCallApi('setActiveCampaign', { campaignId: 'TET' });
assert('setActiveCampaign sets active campaign to TET', setTetRes.success && setTetRes.activeCampaignId === 'TET');

const activeTet = await mockCallApi('getActiveCampaign', {});
assert('getActiveCampaign reflects TET campaign', activeTet.success && activeTet.data && activeTet.data.id === 'TET');

// 20.3 Test redeemPrivilegeVoucher on Submission
const redeemSubRes = await mockCallApi('redeemPrivilegeVoucher', {
  voucherCode: 'ITC-TET-2027-GOLD',
  targetType: 'SUBMISSION',
  targetId: 'SUB_20261016_120000',
  mssv: '2351120028',
  effectType: 'EXTEND_DEADLINE',
  effectValue: 48
});
assert('redeemPrivilegeVoucher applies deadline extension to submission', redeemSubRes.success && redeemSubRes.data.Feedback.includes('+48H'));

// 20.4 Test renderAdminCampaignSelector
const selectorHtml = renderAdminCampaignSelector('TET');
assert('renderAdminCampaignSelector renders TET and OCT20 buttons', selectorHtml.includes('data-campaign-id="TET"') && selectorHtml.includes('data-campaign-id="OCT20"'));

// Đưa về OCT20 để giữ trạng thái chuẩn
await mockCallApi('setActiveCampaign', { campaignId: 'OCT20' });

const adminHtmlStr = fs.readFileSync('./frontend/views/admin.html', 'utf8');
assert('admin.html contains #admin-campaign-selector-card', adminHtmlStr.includes('id="admin-campaign-selector-card"'));
assert('app.js registers switch-admin-campaign action', appJsStr.includes("'switch-admin-campaign':"));

// --------------------------------------------------------------------
// 21. Testing Clean Gift Tools & Student Quiz Ranking Spotlight
// --------------------------------------------------------------------
console.log('\n--- 21. Testing Clean Gift Tools & Student Quiz Ranking Spotlight ---');

// 21.1 Admin Sidebar & Header has NO open-gift-modal
assert('admin.html has NO open-gift-modal in sidebar or header', !adminHtmlStr.includes('data-action="open-gift-modal"'));

// 21.2 Member Gift modal has NO dev testing/reset buttons
const modalGiftHtml = renderGift2010ModalContent({
  giftId: 'BONUS_10PT',
  giftTitle: 'Voucher +10 Điểm Trắc Nghiệm',
  claimCode: 'ITC2010-12345-678'
}, { hoTen: 'Nguyễn Thu Trang' });
assert('renderGift2010ModalContent has NO reset-gift-2010 button', !modalGiftHtml.includes('reset-gift-2010'));
assert('renderGift2010ModalContent has NO preview-gift-2010 button', !modalGiftHtml.includes('preview-gift-2010'));
assert('renderGift2010ModalContent renders Personalized Greeting Box', modalGiftHtml.includes('Thân tặng bông hồng công nghệ:') && modalGiftHtml.includes('shuffle-2010-wish'));
assert('renderGift2010ModalContent renders Coupon Ticket with cutouts and stamp', modalGiftHtml.includes('bht-ticket-cutout-left') && modalGiftHtml.includes('VERIFIED • BAN HỌC THUẬT ITC'));
assert('renderGift2010ModalContent copy button has data-full-share attribute', modalGiftHtml.includes('data-full-share=') && modalGiftHtml.includes('gift-2010-code-text'));

// 21.3 renderMemberQuizView shows student rank in top 5
const mockLeaderboardTop5 = [
  { MSSV: '2351120015', HoTen: 'Vũ Hoàng Long', DiemSo: 100, ThoiGianLamGiay: 90 },
  { MSSV: '2351120028', HoTen: 'Nguyễn Thu Trang', DiemSo: 90, ThoiGianLamGiay: 85 }
];
const top5ViewHtml = renderMemberQuizView({
  QuizID: 'QUIZ_01',
  SessionID: 'MEET_01',
  TieuDe: 'Trắc nghiệm OOP C++',
  DanhSachCauHoi: [{ id: 1, cauHoi: 'Q1' }],
  TrangThai: 'Open'
}, {
  MSSV: '2351120015',
  DiemSo: 100,
  SoCauDung: 1,
  TongSoCau: 1,
  IsOfficial: true
}, {
  sessionId: 'MEET_01',
  leaderboard: mockLeaderboardTop5,
  currentMssv: '2351120015'
});
assert('renderMemberQuizView displays student rank in spotlight', top5ViewHtml.includes('Hạng #1'));
assert('renderMemberQuizView highlights student row with Bạn badge', top5ViewHtml.includes('Bạn</span>'));

// 21.4 renderMemberQuizView displays student rank even when outside top 5
const mockLeaderboardLong = [
  { MSSV: 'SV01', HoTen: 'SV 1', DiemSo: 100, ThoiGianLamGiay: 50 },
  { MSSV: 'SV02', HoTen: 'SV 2', DiemSo: 95, ThoiGianLamGiay: 55 },
  { MSSV: 'SV03', HoTen: 'SV 3', DiemSo: 90, ThoiGianLamGiay: 60 },
  { MSSV: 'SV04', HoTen: 'SV 4', DiemSo: 85, ThoiGianLamGiay: 65 },
  { MSSV: 'SV05', HoTen: 'SV 5', DiemSo: 80, ThoiGianLamGiay: 70 },
  { MSSV: 'SV06', HoTen: 'SV 6', DiemSo: 75, ThoiGianLamGiay: 75 },
  { MSSV: '2351120099', HoTen: 'Lê Văn Tám', DiemSo: 70, ThoiGianLamGiay: 80 }
];
const outOfTop5Html = renderMemberQuizView({
  QuizID: 'QUIZ_01',
  SessionID: 'MEET_01',
  TieuDe: 'Trắc nghiệm OOP C++',
  DanhSachCauHoi: [{ id: 1, cauHoi: 'Q1' }],
  TrangThai: 'Open'
}, {
  MSSV: '2351120099',
  DiemSo: 70,
  SoCauDung: 7,
  TongSoCau: 10,
  IsOfficial: true
}, {
  sessionId: 'MEET_01',
  leaderboard: mockLeaderboardLong,
  currentMssv: '2351120099'
});
assert('renderMemberQuizView displays rank #7 in spotlight', outOfTop5Html.includes('Hạng #7'));
assert('renderMemberQuizView displays separator dots for out-of-top-5', outOfTop5Html.includes('• • •'));
assert('renderMemberQuizView pins out-of-top-5 student row with Bạn badge', outOfTop5Html.includes('Lê Văn Tám') && outOfTop5Html.includes('Bạn</span>'));

// --------------------------------------------------------------------
// 22. Testing Event & Email Automation Management Tab (Campaigns Studio)
// --------------------------------------------------------------------
console.log('\n--- 22. Testing Event & Email Automation Management Tab (Campaigns Studio) ---');

const gasConfigContentLocal = fs.readFileSync('./gas-backend/Config.js', 'utf8');
const gasRouterContent2 = fs.readFileSync('./gas-backend/Router.js', 'utf8');
const adminHtmlContent2 = fs.readFileSync('./frontend/views/admin.html', 'utf8');
const appJsContent2 = fs.readFileSync('./frontend/app.js', 'utf8');

// 22.1 Config & Router Contracts
assert('Config.js registers saveCampaignConfig in ADMIN_ACTIONS', gasConfigContentLocal.includes("'saveCampaignConfig'"));
assert('Config.js registers sendEventBulkEmail in ADMIN_ACTIONS', gasConfigContentLocal.includes("'sendEventBulkEmail'"));
assert('Config.js registers getAllCampaigns in QUERY_ACTIONS', gasConfigContentLocal.includes("'getAllCampaigns'"));
assert('Config.js registers getActiveCampaign in QUERY_ACTIONS', gasConfigContentLocal.includes("'getActiveCampaign'"));
assert('Router.js routes saveCampaignConfig', gasRouterContent2.includes("case 'saveCampaignConfig':"));
assert('Router.js routes sendEventBulkEmail', gasRouterContent2.includes("case 'sendEventBulkEmail':"));
assert('MUTATION_INVALIDATION_MAP contains saveCampaignConfig', MUTATION_INVALIDATION_MAP.saveCampaignConfig && MUTATION_INVALIDATION_MAP.saveCampaignConfig.includes('getActiveCampaign'));

// 22.2 Admin Tab Navigation & Section Wiring
assert('admin.html has #admin-tab-btn-campaigns sidebar button', adminHtmlContent2.includes('id="admin-tab-btn-campaigns"'));
assert('admin.html has #admin-tab-campaigns section', adminHtmlContent2.includes('id="admin-tab-campaigns"'));
assert('app.js registers select-admin-campaign action', appJsContent2.includes("'select-admin-campaign':"));
assert('app.js registers save-campaign-schedule action', appJsContent2.includes("'save-campaign-schedule':"));
assert('app.js registers insert-campaign-email-tag action', appJsContent2.includes("'insert-campaign-email-tag':"));
assert('app.js registers update-campaign-email-preview action', appJsContent2.includes("'update-campaign-email-preview':"));
assert('app.js registers dispatch-campaign-bulk-email action', appJsContent2.includes("'dispatch-campaign-bulk-email':"));

// 22.3 Mock saveCampaignConfig Action
const saveConfigRes = await mockCallApi('saveCampaignConfig', {
  campaignId: 'OCT20',
  startDate: '2026-10-20T00:00',
  endDate: '2026-10-21T23:59',
  emailSubject: '[VNUF2-ITC] Thân chúc bạn 20/10 tuyệt vời {HoTen}',
  emailTemplate: 'Chào {HoTen}, hộp quà bí ẩn chờ bạn tại {LinkWeb}',
  webLink: 'https://vnuf2-itc.edu.vn/app',
  targetAudience: 'female',
  setActive: true
});
assert('saveCampaignConfig succeeds', saveConfigRes && saveConfigRes.success === true);
assert('saveCampaignConfig updates subject, date and webLink', saveConfigRes.data && saveConfigRes.data.emailSubject.includes('{HoTen}') && saveConfigRes.data.webLink === 'https://vnuf2-itc.edu.vn/app');

// 22.4 Mock sendEventBulkEmail Action
const bulkEmailRes = await mockCallApi('sendEventBulkEmail', {
  campaignId: 'OCT20',
  targetFilter: 'female',
  subject: '[VNUF2-ITC] Thân chúc mừng bạn',
  template: 'Thân gửi {HoTen}, mở quà tại: {LinkWeb}',
  webLink: 'https://vnuf2-itc.edu.vn/app'
});
assert('sendEventBulkEmail succeeds', bulkEmailRes && bulkEmailRes.success === true);
assert('sendEventBulkEmail returns sent count and logs', bulkEmailRes.data && bulkEmailRes.data.sentCount > 0 && Array.isArray(bulkEmailRes.data.logs));

// 22.5 Template Rendering (renderAdminCampaignTabContent)
const { renderAdminCampaignTabContent } = await import('./frontend/modules/templates/campaignTemplates.js');
const sampleAllCampaigns = await mockCallApi('getAllCampaigns', {});
const campaignTabHtml = renderAdminCampaignTabContent({
  campaigns: sampleAllCampaigns.data.campaigns,
  activeCampaignId: 'OCT20',
  selectedCampaignId: 'OCT20',
  members: INITIAL_MOCK_DATA.members,
  lastDispatch: bulkEmailRes.data
});
assert('renderAdminCampaignTabContent renders Auto Scheduler inputs', campaignTabHtml.includes('id="admin-campaign-start-time"') && campaignTabHtml.includes('id="admin-campaign-end-time"'));
assert('renderAdminCampaignTabContent renders Configurable WebLink input', campaignTabHtml.includes('id="admin-campaign-web-link"'));
assert('renderAdminCampaignTabContent renders Email Editor & Toolbar tags', campaignTabHtml.includes('id="admin-campaign-email-body"') && campaignTabHtml.includes('{LinkWeb}'));
assert('renderAdminCampaignTabContent renders Email Live Mockup preview', campaignTabHtml.includes('id="email-preview-subject"') && campaignTabHtml.includes('id="email-preview-body"') && campaignTabHtml.includes('id="email-preview-cta-btn"'));
// 22.5.1 Test Filtering Email by selectedMssvs
const filteredEmailRes = await mockCallApi('sendEventBulkEmail', {
  campaignId: 'OCT20',
  targetFilter: 'female',
  selectedMssvs: ['2251120002'] // Chỉ gửi riêng cho 1 người
});
assert('sendEventBulkEmail filters by selectedMssvs', filteredEmailRes.success && filteredEmailRes.data.sentCount === 1);
assert('sendEventBulkEmail records selected member MSSV', filteredEmailRes.data.logs[0].mssv === '2251120002');

// 22.5.2 Test Campaign Recipient Selection UI & Actions
assert('app.js registers toggle-campaign-recipient-checkbox action', appJsStr.includes("'toggle-campaign-recipient-checkbox':"));
assert('app.js registers toggle-campaign-select-all action', appJsStr.includes("'toggle-campaign-select-all':"));
assert('app.js registers campaign-select-all-recipients action', appJsStr.includes("'campaign-select-all-recipients':"));
assert('app.js registers campaign-deselect-all-recipients action', appJsStr.includes("'campaign-deselect-all-recipients':"));

assert('renderAdminCampaignTabContent renders recipient checkboxes', campaignTabHtml.includes('js-campaign-recipient-cb') && campaignTabHtml.includes('data-action="toggle-campaign-recipient-checkbox"'));
assert('renderAdminCampaignTabContent renders selection toolbar', campaignTabHtml.includes('data-action="campaign-select-all-recipients"') && campaignTabHtml.includes('data-action="campaign-deselect-all-recipients"'));
assert('renderAdminCampaignTabContent renders selected count badge', campaignTabHtml.includes('id="campaign-selected-count-badge"'));

// 22.5.3 Test Correct Placement of Campaign Selector (Not in members tab, present in campaigns tab)
const membersTabSection = adminHtmlStr.split('id="admin-tab-members"')[1]?.split('id="admin-tab-docs"')[0] || '';
const campaignsTabSection = adminHtmlStr.split('id="admin-tab-campaigns"')[1]?.split('</main>')[0] || '';
assert('admin-tab-members does NOT contain #admin-campaign-selector-card', !membersTabSection.includes('id="admin-campaign-selector-card"'));
assert('admin-tab-campaigns contains #admin-campaign-selector-card', campaignsTabSection.includes('id="admin-campaign-selector-card"'));

// 22.6 GAS Backend Service_Campaign.js & Event Privilege Integration
const serviceCampaignContent = fs.readFileSync('./gas-backend/Service_Campaign.js', 'utf8');
const serviceSubmitContent = fs.readFileSync('./gas-backend/Service_Submit.js', 'utf8');
const serviceQuizContent = fs.readFileSync('./gas-backend/Service_Quiz.js', 'utf8');

assert('Service_Campaign.js defines getAllCampaigns', serviceCampaignContent.includes('function getAllCampaigns('));
assert('Service_Campaign.js defines getActiveCampaign', serviceCampaignContent.includes('function getActiveCampaign('));
assert('Service_Campaign.js defines setActiveCampaign', serviceCampaignContent.includes('function setActiveCampaign('));
assert('Service_Campaign.js defines saveCampaignConfig', serviceCampaignContent.includes('function saveCampaignConfig('));
assert('Service_Campaign.js defines sendEventBulkEmail', serviceCampaignContent.includes('function sendEventBulkEmail('));
assert('Service_Campaign.js supports selectedMssvs in sendEventBulkEmail', serviceCampaignContent.includes('data.selectedMssvs'));
assert('Service_Campaign.js defines redeemPrivilegeVoucher', serviceCampaignContent.includes('function redeemPrivilegeVoucher('));
assert('Service_Campaign.js defines markMemberGiftUsedInSheet', serviceCampaignContent.includes('function markMemberGiftUsedInSheet('));
assert('Service_Campaign.js keeps MailApp outside withScriptLock', !serviceCampaignContent.includes('withScriptLock(function() { MailApp'));
assert('Service_Submit.js records attached giftCode', serviceSubmitContent.includes('payload.giftCode') && serviceSubmitContent.includes('markMemberGiftUsedInSheet'));
assert('Service_Quiz.js marks gift voucher as used', serviceQuizContent.includes('markMemberGiftUsedInSheet(currentMssv, giftCode)'));

// --------------------------------------------------------------------
// 23. Testing Mobile Zalo In-App Browser Helper (Android Intent & iOS Safari Guide)
// --------------------------------------------------------------------
console.log('\n--- 23. Testing Mobile Zalo In-App Browser Helper ---');
const zaloHelperModule = await import('./frontend/modules/zaloHelper.js');
const indexHtmlContent = fs.readFileSync('./frontend/index.html', 'utf8');

assert('zaloHelper.js exports detectZaloEnvironment', typeof zaloHelperModule.detectZaloEnvironment === 'function');
assert('zaloHelper.js exports buildAndroidChromeIntent', typeof zaloHelperModule.buildAndroidChromeIntent === 'function');
assert('zaloHelper.js exports initZaloInAppNotice', typeof zaloHelperModule.initZaloInAppNotice === 'function');
assert('zaloHelper.js exports handleCopyZaloLink', typeof zaloHelperModule.handleCopyZaloLink === 'function');
assert('zaloHelper.js exports handleDismissZaloBanner', typeof zaloHelperModule.handleDismissZaloBanner === 'function');

const testIntent = zaloHelperModule.buildAndroidChromeIntent('https://bht-itc.vnuf2.edu.vn/');
assert('buildAndroidChromeIntent formats intent URL properly', testIntent.startsWith('intent://bht-itc.vnuf2.edu.vn/') && testIntent.includes('package=com.android.chrome'));

assert('index.html contains Fast Android Zalo Intent script in head', indexHtmlContent.includes('Fast Android Zalo Intent') && indexHtmlContent.includes('package=com.android.chrome'));
assert('app.js registers copy-zalo-link action', appJsContent2.includes("'copy-zalo-link':"));
assert('app.js registers dismiss-zalo-banner action', appJsContent2.includes("'dismiss-zalo-banner':"));
assert('app.js calls initZaloInAppNotice', appJsContent2.includes('initZaloInAppNotice();'));

// --------------------------------------------------------------------
// 24. Testing Single-Request Bootstrap & API Bundling Optimization
// --------------------------------------------------------------------
console.log('\n--- 24. Testing Single-Request Bootstrap & API Bundling Optimization ---');
const serviceAuthContent = fs.readFileSync('./gas-backend/Service_Auth.js', 'utf8');
const configGasContent = fs.readFileSync('./gas-backend/Config.js', 'utf8');
const routerGasContent = fs.readFileSync('./gas-backend/Router.js', 'utf8');
const apiJsModule = await import('./frontend/services/api.js');
const mockDataModule = await import('./frontend/services/mockData.js');
const memberModule = await import('./frontend/modules/member.js');
const adminModule = await import('./frontend/modules/admin.js');

assert('Config.js registers getAppInitData in QUERY_ACTIONS', configGasContent.includes("'getAppInitData'"));
assert('Router.js routes getAppInitData', routerGasContent.includes("case 'getAppInitData':"));
assert('Router.js passes includeBootstrap to getAuthStatus', routerGasContent.includes("data.includeBootstrap === true || data.bootstrap === true"));
assert('Service_Auth.js defines getAppInitData', serviceAuthContent.includes('function getAppInitData(currentUser)'));
assert('Service_Auth.js supports includeBootstrap in getAuthStatus', serviceAuthContent.includes('function getAuthStatus(token, cachedMssv, includeBootstrap)'));
assert('api.js exports hydrateAppFromBootstrap', typeof apiJsModule.hydrateAppFromBootstrap === 'function');
assert('api.js exports getAppInitData', typeof apiJsModule.getAppInitData === 'function');
assert('API_CONFIG.CACHEABLE_ACTIONS includes getAppInitData', apiJsModule.API_CONFIG.CACHEABLE_ACTIONS.includes('getAppInitData'));

const mockAuthRes = await mockDataModule.handleMockAction('getAuthStatus', {
  token: 'MOCK_TOKEN_2351120015',
  includeBootstrap: true
});
assert('mock getAuthStatus with includeBootstrap returns bootstrapData', mockAuthRes && mockAuthRes.status === 'AUTHENTICATED' && mockAuthRes.bootstrapData !== null && Array.isArray(mockAuthRes.bootstrapData.tasks));

const mockInitRes = await mockDataModule.handleMockAction('getAppInitData', {
  mssv: '2351120015',
  role: 'MEMBER'
});
assert('mock getAppInitData returns success and bundle structure', mockInitRes && mockInitRes.success === true && Array.isArray(mockInitRes.data.attendance) && Array.isArray(mockInitRes.data.docs));

const hydrated = apiJsModule.hydrateAppFromBootstrap(mockInitRes.data, 'MEMBER', '2351120015');
assert('hydrateAppFromBootstrap executes successfully', hydrated === true);

const taskCacheRaw = localStorage.getItem('bht_cache_getAllTasks_{}');
assert('hydrateAppFromBootstrap populates getAllTasks cache', taskCacheRaw && taskCacheRaw.includes('TASK_'));

const attCacheRaw = localStorage.getItem('bht_cache_getAttendanceSessions_{}');
assert('hydrateAppFromBootstrap populates getAttendanceSessions cache', attCacheRaw && attCacheRaw.includes('MEET_'));

assert('member.js initMemberView accepts fetchApi parameter', memberModule.initMemberView.toString().includes('fetchApi'));
assert('admin.js initAdminView accepts fetchApi parameter', adminModule.initAdminView.toString().includes('fetchApi'));

if (failed > 0) {
  console.error('\nFAILED TESTS:', failed);
  process.exit(1);
} else {
  console.log(`\nALL ${passed} CORE ARCHITECTURE & UI COMPONENT TESTS PASSED! (0 failures)\n`);
}



