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
  renderAdminTaskItem
} from './frontend/modules/templates.js';
import { calculateDrlProgress } from './frontend/modules/member.js';
import { mockCallApi, getLocalMockState } from './frontend/services/mockData.js';

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

const spotlightOpen = renderMemberSpotlightCard({
  SessionID: 'MEET_SPOTLIGHT_01',
  TenBuoiHop: 'Chuyên đề Tối ưu hóa Luận văn Word',
  NgayDienRa: '22/10/2026',
  PhongHoc: 'Phòng Lab 03 - Nhà A3',
  TrangThai: 'Open',
  TagChuyenDe: 'WORD_DO_AN'
}, false);
assert('renderMemberSpotlightCard renders live session with quick pin button when not attended', spotlightOpen.includes('data-action="open-quick-pin-modal"') && spotlightOpen.includes('Phòng Lab 03 - Nhà A3') && spotlightOpen.includes('ĐANG DIỄN RA'));

const spotlightAttended = renderMemberSpotlightCard({
  SessionID: 'MEET_SPOTLIGHT_01',
  TenBuoiHop: 'Chuyên đề Tối ưu hóa Luận văn Word',
  NgayDienRa: '22/10/2026',
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
assert('All 10 project forms were found and validated for novalidate', totalFormsFound === 10);

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

if (failed > 0) {
  console.error('\nFAILED TESTS:', failed);
  process.exit(1);
} else {
  console.log(`\nALL ${passed} CORE ARCHITECTURE & UI COMPONENT TESTS PASSED! (0 failures)\n`);
}


