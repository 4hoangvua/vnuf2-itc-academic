// ====================================================================
// QUẢN LÝ STATE PHẢN ỨNG TẬP TRUNG (REACTIVE STORE MODULE)
// Ban Học Thuật - CLB Tin Học VNUF2
// ====================================================================
// 1. Kiến trúc Pub/Sub + ES6 Proxy theo dõi thay đổi trạng thái tự động.
// 2. Tự động thông báo tới các component / UI handlers khi dữ liệu thay đổi.
// 3. Đồng bộ hóa an toàn các giá trị cốt lõi (Token, User) vào Storage.
// ====================================================================

const INITIAL_STATE = {
  // Thông tin người dùng & xác thực
  user: null,                       // { mssv, hoTen, email, role, trangThai, ngayThamGia }
  token: (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') ? (localStorage.getItem('bht_token') || '') : '',
  authMode: 'LOGIN_MSSV',           // 'LOGIN_MSSV' | 'VERIFY_OTP' | 'FIRST_TIME_BIND'
  pendingMssv: '',
  otpTimer: null,

  // Dữ liệu ứng dụng
  tasks: [],
  submissions: [],
  attendance: [],
  docs: [],
  members: [],

  // Trạng thái điều hướng & bộ lọc
  memberActiveTab: 'sessions',      // 'sessions' | 'docs'
  adminActiveTab: 'submissions',    // 'submissions' | 'attendance' | 'members'
  memberSubTab: 'info',             // 'info' | 'checkin' | 'task' | 'quiz'
  adminSubTab: 'info',              // 'info' | 'pin' | 'task' | 'quiz'
  activeDetailSessionId: null,      // SessionID đang mở Master-Detail
  submissionFilter: 'ALL',          // 'ALL' | 'Pending' | 'Approved' | 'Rejected'
  memberSearchKeyword: '',
  submissionSearchKeyword: '',

  // Trạng thái khóa tác vụ UI (Chống click đúp / spam)
  uiLocks: {
    activeReviewSubIds: new Set(),
    activeTaskToggleIds: new Set(),
    activeResetEmailMssvs: new Set(),
    activeMemberToggleIds: new Set(),
    activeSessionToggleIds: new Set(),
    activeProjectorSessionId: null
  },

  // Trạng thái nạp dữ liệu toàn cục
  isGlobalLoading: false,
  loadingMessage: 'Đang tải dữ liệu...'
};

class ReactiveStore {
  constructor(initialState) {
    this._state = { ...initialState };
    this._listeners = new Map(); // key -> Set<callback>
    this._wildcardListeners = new Set(); // Toàn bộ state thay đổi

    // Tạo Proxy bao quanh _state để bắt mọi thao tác gán trực tiếp (Reactive Proxy)
    const self = this;
    this.proxyState = new Proxy(this._state, {
      set(target, prop, value) {
        const oldValue = target[prop];
        if (oldValue === value) return true;

        target[prop] = value;
        self._notify(prop, value, oldValue);
        return true;
      },
      get(target, prop) {
        return target[prop];
      }
    });
  }

  /**
   * Lấy giá trị hiện tại của một trường trong State hoặc toàn bộ State
   * @param {string} [key] Tên thuộc tính trong state
   */
  getState(key) {
    if (key !== undefined) {
      return this._state[key];
    }
    return { ...this._state };
  }

  /**
   * Cập nhật một hoặc nhiều thuộc tính trong State
   * Kích hoạt toàn bộ listener đăng ký theo dõi các thuộc tính tương ứng
   * @param {Object} partialState Đối tượng chứa các thuộc tính cần cập nhật
   */
  setState(partialState) {
    if (!partialState || typeof partialState !== 'object') return;

    const changedKeys = [];
    Object.keys(partialState).forEach(key => {
      const oldValue = this._state[key];
      const newValue = partialState[key];

      if (oldValue !== newValue) {
        this._state[key] = newValue;
        changedKeys.push({ key, newValue, oldValue });
      }
    });

    // Thông báo cho các listeners tương ứng
    changedKeys.forEach(({ key, newValue, oldValue }) => {
      this._notify(key, newValue, oldValue);

      // Tự động đồng bộ các giá trị nhạy cảm vào Storage
      try {
        if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
          if (key === 'token') {
            if (newValue) localStorage.setItem('bht_token', newValue);
            else localStorage.removeItem('bht_token');
          } else if (key === 'user') {
            if (newValue) {
              localStorage.setItem('bht_mssv', newValue.mssv || '');
              localStorage.setItem('bht_role', newValue.role || 'MEMBER');
            } else {
              localStorage.removeItem('bht_mssv');
              localStorage.removeItem('bht_role');
            }
          }
        }
        if (typeof sessionStorage !== 'undefined' && typeof sessionStorage.setItem === 'function') {
          if (key === 'user') {
            if (newValue) sessionStorage.setItem('bht_user', JSON.stringify(newValue));
            else sessionStorage.removeItem('bht_user');
          }
        }
      } catch (storageErr) {
        console.warn('[Store] Lỗi truy cập Web Storage:', storageErr);
      }
    });

    // Thông báo cho wildcard listeners nếu có thay đổi
    if (changedKeys.length > 0) {
      this._wildcardListeners.forEach(listener => {
        try {
          listener(this.getState(), changedKeys);
        } catch (err) {
          console.error('[Store] Lỗi trong wildcard listener:', err);
        }
      });
    }
  }

  /**
   * Đăng ký lắng nghe sự kiện thay đổi của một trường hoặc toàn bộ State
   * @param {string|Function} keyOrFn Tên trường cần theo dõi hoặc callback lắng nghe tất cả
   * @param {Function} [callback] Hàm thực thi khi trường đó thay đổi: (newVal, oldVal, key) => void
   * @returns {Function} Hàm hủy đăng ký lắng nghe (Unsubscribe)
   */
  subscribe(keyOrFn, callback) {
    if (typeof keyOrFn === 'function') {
      const listener = keyOrFn;
      this._wildcardListeners.add(listener);
      return () => this._wildcardListeners.delete(listener);
    }

    const key = keyOrFn;
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key).add(callback);

    // Trả về hàm hủy đăng ký
    return () => {
      const bucket = this._listeners.get(key);
      if (bucket) {
        bucket.delete(callback);
        if (bucket.size === 0) {
          this._listeners.delete(key);
        }
      }
    };
  }

  /**
   * Phát thông báo tới các listeners của một trường cụ thể
   */
  _notify(key, newValue, oldValue) {
    const bucket = this._listeners.get(key);
    if (bucket) {
      bucket.forEach(listener => {
        try {
          listener(newValue, oldValue, key);
        } catch (err) {
          console.error(`[Store] Lỗi khi thực thi listener cho "${key}":`, err);
        }
      });
    }
  }

  /**
   * Đặt lại State về trạng thái mặc định ban đầu
   * @param {boolean} keepAuth Giữ lại phiên đăng nhập hay xóa trắng
   */
  reset(keepAuth = false) {
    if (this._state.otpTimer) {
      clearInterval(this._state.otpTimer);
      this._state.otpTimer = null;
    }
    const fresh = { ...INITIAL_STATE };
    if (keepAuth) {
      fresh.user = this._state.user;
      fresh.token = this._state.token;
    }
    this.setState(fresh);
  }

  /**
   * Xóa sạch toàn bộ các listeners đã đăng ký
   */
  clearAllSubscriptions() {
    this._listeners.clear();
    this._wildcardListeners.clear();
  }
}


// Khởi tạo Singleton Store instance
export const store = new ReactiveStore(INITIAL_STATE);

// Xuất các helper rút gọn
export const getState = (key) => store.getState(key);
export const setState = (updates) => store.setState(updates);
export const subscribe = (key, callback) => store.subscribe(key, callback);

// Tương thích ngược: Proxy appState cho các module đang đọc/ghi appState.xxx
export const appState = store.proxyState;
