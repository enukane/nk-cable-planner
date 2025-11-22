import { generateUUID, calculateDistance } from './utils.js';
import { CONSTANTS } from './constants.js';

/**
 * 機器管理クラス
 */
export class DeviceManager {
  constructor() {
    this.devices = [];
    this.counters = {
      router: 0,
      poe_sw: 0,
      ap: 0,
      pc: 0
    };
  }

  /**
   * 機器を追加
   * @param {string} type - 機器タイプ
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {string} name - 機器名（省略時は自動生成）
   * @returns {Object} 追加した機器オブジェクト
   */
  addDevice(type, x, y, name = null) {
    const id = generateUUID();
    const deviceName = name || this._generateDeviceName(type);
    const color = CONSTANTS.DEVICE_COLORS[type];

    const device = {
      id,
      type,
      name: deviceName,
      x,
      y,
      color
    };

    this.devices.push(device);

    // カスタム名でない場合はカウンターをインクリメント
    if (!name) {
      this.counters[type]++;
    }

    return device;
  }

  /**
   * 機器名を自動生成
   * @param {string} type - 機器タイプ
   * @returns {string} 生成された機器名
   */
  _generateDeviceName(type) {
    const nextNumber = this.counters[type] + 1;

    switch (type) {
      case 'router':
        return `Router-${nextNumber}`;
      case 'poe_sw':
        return `SW-${nextNumber}`;
      case 'ap':
        return `AP-${nextNumber}`;
      case 'pc':
        return `PC-${nextNumber}`;
      default:
        return `Device-${nextNumber}`;
    }
  }

  /**
   * IDで機器を取得
   * @param {string} id - 機器ID
   * @returns {Object|undefined} 機器オブジェクト
   */
  getDeviceById(id) {
    return this.devices.find(device => device.id === id);
  }

  /**
   * 全機器を取得
   * @returns {Array} 機器リスト
   */
  getAllDevices() {
    return this.devices;
  }

  /**
   * 機器を削除
   * @param {string} id - 機器ID
   * @returns {boolean} 削除成功したかどうか
   */
  removeDevice(id) {
    const index = this.devices.findIndex(device => device.id === id);
    if (index === -1) {
      return false;
    }

    this.devices.splice(index, 1);
    return true;
  }

  /**
   * 機器を移動
   * @param {string} id - 機器ID
   * @param {number} x - 新しいX座標
   * @param {number} y - 新しいY座標
   * @returns {boolean} 移動成功したかどうか
   */
  moveDevice(id, x, y) {
    const device = this.getDeviceById(id);
    if (!device) {
      return false;
    }

    device.x = x;
    device.y = y;
    return true;
  }

  /**
   * 機器名を更新
   * @param {string} id - 機器ID
   * @param {string} name - 新しい機器名
   * @returns {boolean} 更新成功したかどうか
   */
  updateDeviceName(id, name) {
    const device = this.getDeviceById(id);
    if (!device) {
      return false;
    }

    device.name = name;
    return true;
  }

  /**
   * 指定座標付近の機器を検出
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} threshold - 検出範囲（px）
   * @returns {Object|null} 機器オブジェクト
   */
  getDeviceAtPosition(x, y, threshold = CONSTANTS.SNAP_DISTANCE) {
    const point = { x, y };

    for (const device of this.devices) {
      const devicePoint = { x: device.x, y: device.y };
      const distance = calculateDistance(point, devicePoint);

      if (distance <= threshold) {
        return device;
      }
    }

    return null;
  }

  /**
   * データをエクスポート
   * @returns {Array} 機器データの配列
   */
  exportData() {
    return this.devices.map(device => ({ ...device }));
  }

  /**
   * データをインポート
   * @param {Array} devicesData - 機器データの配列
   */
  importData(devicesData) {
    this.devices = devicesData.map(device => ({ ...device }));

    // カウンターを再計算
    this.counters = {
      router: 0,
      poe_sw: 0,
      ap: 0,
      pc: 0
    };

    // 各タイプの最大番号を見つける
    for (const device of this.devices) {
      const match = device.name.match(/-(\d+)$/);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > this.counters[device.type]) {
          this.counters[device.type] = number;
        }
      }
    }
  }

  /**
   * 全機器をクリア
   */
  clear() {
    this.devices = [];
    this.counters = {
      router: 0,
      poe_sw: 0,
      ap: 0,
      pc: 0
    };
  }
}
