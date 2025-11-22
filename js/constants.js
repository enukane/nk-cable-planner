export const CONSTANTS = {
  // 機器タイプ
  DEVICE_TYPES: {
    ROUTER: 'router',
    POE_SW: 'poe_sw',
    AP: 'ap',
    PC: 'pc'
  },

  // Device type display names
  DEVICE_TYPE_NAMES: {
    router: 'Router',
    poe_sw: 'PoE SW',
    ap: 'AP',
    pc: 'PC'
  },

  // 機器アイコンサイズ
  DEVICE_ICON_SIZE: 30,

  // 機器カラー（デフォルト）
  DEVICE_COLORS: {
    router: '#FF6B6B',
    poe_sw: '#4ECDC4',
    ap: '#95E1D3',
    pc: '#FFD93D'
  },

  // 配線デフォルトカラー
  CABLE_DEFAULT_COLOR: '#00AA00',
  CABLE_COLORS: ['#00AA00', '#333333', '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFA07A', '#9370DB'],

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
