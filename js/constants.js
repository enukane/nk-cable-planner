export const CONSTANTS = {
  // 機器タイプ
  DEVICE_TYPES: {
    ROUTER: 'router',
    POE_SW: 'poe_sw',
    AP: 'ap',
    PC: 'pc',
    POWER_OUTLET: 'power_outlet',
    LAN_PATCH: 'lan_patch'
  },

  // Device type display names
  DEVICE_TYPE_NAMES: {
    router: 'Router',
    poe_sw: 'PoE SW',
    ap: 'AP',
    pc: 'PC',
    power_outlet: 'Power Outlet',
    lan_patch: 'LAN Patch'
  },

  // 機器アイコンサイズ
  DEVICE_ICON_SIZE: 8,

  // 機器カラー（デフォルト）
  DEVICE_COLORS: {
    router: '#FF6B6B',
    poe_sw: '#2E7D32',
    ap: '#81C784',
    pc: '#616161',
    power_outlet: '#FF0000',
    lan_patch: '#00AA00'
  },

  // 配線デフォルトカラー
  CABLE_DEFAULT_COLOR: '#00AA00',
  CABLE_COLORS: {
    LAN: '#00AA00',      // LANケーブル（緑）
    POWER: '#FF0000',    // 電源ケーブル（赤）
    OTHER: '#616161'     // その他ケーブル（濃い灰色）
  },
  CABLE_COLOR_NAMES: {
    '#00AA00': 'LAN',
    '#FF0000': 'Power',
    '#616161': 'Other'
  },

  // 線の太さ
  LINE_WIDTH: 2,
  SELECTED_LINE_WIDTH: 4,
  SCALE_LINE_WIDTH: 3,

  // 線スタイル
  LINE_STYLE: {
    SOLID: 'solid',
    DASHED: 'dashed'
  },

  // グリッドサイズ
  GRID_SIZE: 20,

  // スナップ距離（px）
  SNAP_DISTANCE: 15,

  // ズーム範囲
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5.0,
  ZOOM_STEP: 0.1,

  // デフォルト設定
  DEFAULT_MARGIN_RATE: 10,
  DEFAULT_ROUNDING_MODE: true,
  DEFAULT_SHOW_LABELS: true,
  DEFAULT_SHOW_GRID: false,

  // ローカルストレージキー
  STORAGE_KEY: 'cableProjectData',

  // ファイル名プレフィックス
  PROJECT_FILE_PREFIX: 'project',
  SCREENSHOT_FILE_PREFIX: 'cable_layout',

  // 操作モード
  MODES: {
    VIEW: 'view',
    SCALE: 'scale',
    DEVICE: 'device',
    CABLE_DETAIL: 'cable-detail',
    CABLE_DETAIL_ORTHO: 'cable-detail-ortho',
    CABLE_SIMPLE: 'cable-simple',
    DELETE: 'delete'
  },

  // 配線モード
  CABLE_MODES: {
    DETAILED: 'detailed',
    SIMPLE: 'simple'
  }
};

export const ERROR_MESSAGES = {
  IMAGE_LOAD_FAILED: 'Failed to load image',
  IMAGE_TOO_LARGE: 'Image size is too large (max 10MB)',
  SCALE_NOT_SET: 'Please set the scale first',
  SCALE_INVALID: 'Scale length must be greater than 0',
  NO_DEVICES: 'Please place at least 2 devices',
  INVALID_LENGTH: 'Length must be greater than 0',
  INVALID_MARGIN_RATE: 'Margin rate must be between 0 and 100',
  STORAGE_FULL: 'Storage capacity is full',
  FILE_PARSE_ERROR: 'Failed to parse file',
  INVALID_PROJECT_DATA: 'Invalid project data',
  VERSION_MISMATCH: 'Project version mismatch',
  DEVICE_NAME_EMPTY: 'Please enter a device name',
  CABLE_NAME_EMPTY: 'Please enter a cable name'
};
