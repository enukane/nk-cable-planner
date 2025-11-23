import { generateUUID, calculateDistance, applyRounding } from './utils.js';
import { CONSTANTS } from './constants.js';

/**
 * 配線管理クラス
 */
export class CableManager {
  constructor() {
    this.cables = [];
    this.settings = {
      marginRate: CONSTANTS.DEFAULT_MARGIN_RATE,
      roundingMode: CONSTANTS.DEFAULT_ROUNDING_MODE
    };
    this.cableCounter = 1;
  }

  /**
   * 自動生成されたケーブル名を取得
   * @returns {string} ケーブル名
   */
  generateCableName() {
    let name;
    do {
      name = `cable-${this.cableCounter}`;
      this.cableCounter++;
    } while (this.cables.some(cable => cable.name === name));
    return name;
  }

  /**
   * 詳細配線を追加
   * @param {string} fromDeviceId - 始点機器ID
   * @param {string} toDeviceId - 終点機器ID
   * @param {Array} waypoints - 中間点の配列 [{x, y}, ...]
   * @param {string} name - ケーブル名（省略時は自動生成）
   * @param {DeviceManager} deviceManager - 機器マネージャー
   * @param {number} pixelPerMeter - px/m換算比率
   * @param {string} color - 線の色
   * @returns {Object} 追加したケーブルオブジェクト
   */
  addDetailedCable(
    fromDeviceId,
    toDeviceId,
    waypoints,
    name = null,
    deviceManager,
    pixelPerMeter,
    color = CONSTANTS.CABLE_DEFAULT_COLOR
  ) {
    const fromDevice = deviceManager.getDeviceById(fromDeviceId);
    const toDevice = deviceManager.getDeviceById(toDeviceId);

    if (!fromDevice || !toDevice) {
      throw new Error('Invalid device ID');
    }

    const id = generateUUID();
    const cableName = name || this.generateCableName();

    // 経路の全座標を計算
    const points = [
      { x: fromDevice.x, y: fromDevice.y },
      ...waypoints,
      { x: toDevice.x, y: toDevice.y }
    ];

    // 総延長を計算（ピクセル）
    let lengthPx = 0;
    for (let i = 0; i < points.length - 1; i++) {
      lengthPx += calculateDistance(points[i], points[i + 1]);
    }

    // 実長に変換
    const lengthM = lengthPx / pixelPerMeter;

    const cable = {
      id,
      name: cableName,
      fromDeviceId,
      toDeviceId,
      mode: CONSTANTS.CABLE_MODES.DETAILED,
      waypoints: [...waypoints],
      color,
      lineStyle: CONSTANTS.LINE_STYLE.SOLID,
      lengthPx,
      lengthM,
      offset: 0,
      lengthWithMargin: 0,
      roundedLength: 0
    };

    this.cables.push(cable);
    this._recalculateCable(cable);

    return cable;
  }

  /**
   * 簡易配線を追加
   * @param {string} fromDeviceId - 始点機器ID
   * @param {string} toDeviceId - 終点機器ID
   * @param {number} manualLength - 手動入力の長さ(m)
   * @param {string} name - ケーブル名（省略時は自動生成）
   * @param {DeviceManager} deviceManager - 機器マネージャー
   * @param {string} color - 線の色
   * @returns {Object} 追加したケーブルオブジェクト
   */
  addSimpleCable(
    fromDeviceId,
    toDeviceId,
    manualLength,
    name = null,
    deviceManager,
    color = CONSTANTS.CABLE_DEFAULT_COLOR
  ) {
    const fromDevice = deviceManager.getDeviceById(fromDeviceId);
    const toDevice = deviceManager.getDeviceById(toDeviceId);

    if (!fromDevice || !toDevice) {
      throw new Error('Invalid device ID');
    }

    const id = generateUUID();
    const cableName = name || this.generateCableName();

    const cable = {
      id,
      name: cableName,
      fromDeviceId,
      toDeviceId,
      mode: CONSTANTS.CABLE_MODES.SIMPLE,
      manualLength,
      color,
      lineStyle: CONSTANTS.LINE_STYLE.DASHED,
      lengthM: manualLength,
      offset: 0,
      lengthWithMargin: 0,
      roundedLength: 0
    };

    this.cables.push(cable);
    this._recalculateCable(cable);

    return cable;
  }

  /**
   * 配線を削除
   * @param {string} id - ケーブルID
   * @returns {boolean} 削除成功したかどうか
   */
  removeCable(id) {
    const index = this.cables.findIndex(cable => cable.id === id);
    if (index === -1) {
      return false;
    }

    this.cables.splice(index, 1);
    return true;
  }

  /**
   * 機器に接続された配線を全て削除
   * @param {string} deviceId - 機器ID
   * @returns {number} 削除した配線数
   */
  removeCablesByDevice(deviceId) {
    const initialLength = this.cables.length;

    this.cables = this.cables.filter(
      cable => cable.fromDeviceId !== deviceId && cable.toDeviceId !== deviceId
    );

    return initialLength - this.cables.length;
  }

  /**
   * IDでケーブルを取得
   * @param {string} id - ケーブルID
   * @returns {Object|undefined} ケーブルオブジェクト
   */
  getCableById(id) {
    return this.cables.find(cable => cable.id === id);
  }

  /**
   * 全ケーブルを取得
   * @returns {Array} ケーブルリスト
   */
  getAllCables() {
    return this.cables;
  }

  /**
   * 設定を適用し、全配線を再計算
   * @param {Object} settings - 設定オブジェクト
   */
  applySettings(settings) {
    if (settings.marginRate !== undefined) {
      this.settings.marginRate = settings.marginRate;
    }
    if (settings.roundingMode !== undefined) {
      this.settings.roundingMode = settings.roundingMode;
    }

    // 全配線を再計算
    this.cables.forEach(cable => this._recalculateCable(cable));
  }

  /**
   * 個別配線の長さを再計算
   * @param {Object} cable - ケーブルオブジェクト
   */
  _recalculateCable(cable) {
    // オフセットを加算
    const lengthWithOffset = cable.lengthM + (cable.offset || 0);

    // 余裕率適用
    cable.lengthWithMargin = lengthWithOffset * (1 + this.settings.marginRate / 100);

    // 丸め処理
    if (this.settings.roundingMode) {
      cable.roundedLength = applyRounding(cable.lengthWithMargin);
    } else {
      delete cable.roundedLength;
    }
  }

  /**
   * 集計データを取得（LANケーブルのみ）
   * @returns {Object} 長さ別の本数マップ
   */
  getSummary() {
    const summary = {};

    // LANケーブル（緑色）のみを集計
    this.cables.forEach(cable => {
      if (cable.color !== CONSTANTS.CABLE_COLORS.LAN) {
        return;
      }

      const length = this.settings.roundingMode
        ? cable.roundedLength
        : parseFloat(cable.lengthWithMargin.toFixed(1));

      const key = String(length);
      summary[key] = (summary[key] || 0) + 1;
    });

    return summary;
  }

  /**
   * 配線統計を取得
   * @returns {Object} 統計情報
   */
  getCableStats() {
    const detailed = this.cables.filter(c => c.mode === CONSTANTS.CABLE_MODES.DETAILED).length;
    const simple = this.cables.filter(c => c.mode === CONSTANTS.CABLE_MODES.SIMPLE).length;

    return {
      total: this.cables.length,
      detailed,
      simple
    };
  }

  /**
   * 総延長を取得（LANケーブルのみ）
   * @returns {number} 総延長(m)
   */
  getTotalLength() {
    return this.cables.reduce((sum, cable) => {
      // LANケーブル（緑色）のみを集計
      if (cable.color !== CONSTANTS.CABLE_COLORS.LAN) {
        return sum;
      }

      const length = this.settings.roundingMode
        ? cable.roundedLength
        : cable.lengthWithMargin;
      return sum + length;
    }, 0);
  }

  /**
   * データをエクスポート
   * @returns {Array} ケーブルデータの配列
   */
  exportData() {
    return this.cables.map(cable => ({ ...cable }));
  }

  /**
   * ケーブル名を変更
   * @param {string} id - ケーブルID
   * @param {string} newName - 新しいケーブル名
   * @returns {boolean} 変更成功したかどうか
   */
  renameCable(id, newName) {
    const cable = this.getCableById(id);
    if (!cable) {
      return false;
    }

    // 名前の重複チェック
    if (this.cables.some(c => c.id !== id && c.name === newName)) {
      return false;
    }

    cable.name = newName;
    return true;
  }

  /**
   * ケーブルのオフセットを設定
   * @param {string} id - ケーブルID
   * @param {number} offset - オフセット値(m)
   * @returns {boolean} 変更成功したかどうか
   */
  setCableOffset(id, offset) {
    const cable = this.getCableById(id);
    if (!cable) {
      return false;
    }

    cable.offset = offset;
    this._recalculateCable(cable);
    return true;
  }

  /**
   * ケーブルの色を変更
   * @param {string} id - ケーブルID
   * @param {string} color - 新しい色
   * @returns {boolean} 変更成功したかどうか
   */
  setCableColor(id, color) {
    const cable = this.getCableById(id);
    if (!cable) {
      return false;
    }

    cable.color = color;
    return true;
  }

  /**
   * データをインポート
   * @param {Array} cablesData - ケーブルデータの配列
   */
  importData(cablesData) {
    this.cables = cablesData.map(cable => ({ ...cable }));

    // カウンターを最大値+1に設定
    const maxCounter = this.cables.reduce((max, cable) => {
      const match = cable.name.match(/^cable-(\d+)$/);
      if (match) {
        return Math.max(max, parseInt(match[1]));
      }
      return max;
    }, 0);
    this.cableCounter = maxCounter + 1;
  }

  /**
   * 全配線をクリア
   */
  clear() {
    this.cables = [];
  }

  /**
   * 配線を再計算（スケール変更時など）
   * @param {DeviceManager} deviceManager - 機器マネージャー
   * @param {number} pixelPerMeter - px/m換算比率
   */
  recalculateDetailedCables(deviceManager, pixelPerMeter) {
    this.cables.forEach(cable => {
      if (cable.mode === CONSTANTS.CABLE_MODES.DETAILED) {
        const fromDevice = deviceManager.getDeviceById(cable.fromDeviceId);
        const toDevice = deviceManager.getDeviceById(cable.toDeviceId);

        if (fromDevice && toDevice) {
          const points = [
            { x: fromDevice.x, y: fromDevice.y },
            ...cable.waypoints,
            { x: toDevice.x, y: toDevice.y }
          ];

          let lengthPx = 0;
          for (let i = 0; i < points.length - 1; i++) {
            lengthPx += calculateDistance(points[i], points[i + 1]);
          }

          cable.lengthPx = lengthPx;
          cable.lengthM = lengthPx / pixelPerMeter;

          this._recalculateCable(cable);
        }
      }
    });
  }
}
