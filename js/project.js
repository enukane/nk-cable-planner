import { calculateDistance } from './utils.js';
import { CONSTANTS } from './constants.js';

/**
 * プロジェクト管理クラス
 */
export class ProjectManager {
  constructor(deviceManager, cableManager) {
    this.version = '1.0';
    this.deviceManager = deviceManager;
    this.cableManager = cableManager;
    this.image = null;
    this.scale = null;
    this.settings = {
      marginRate: CONSTANTS.DEFAULT_MARGIN_RATE,
      roundingMode: CONSTANTS.DEFAULT_ROUNDING_MODE,
      showLabels: CONSTANTS.DEFAULT_SHOW_LABELS,
      showGrid: CONSTANTS.DEFAULT_SHOW_GRID
    };
  }

  /**
   * 画像を設定
   * @param {string} dataUrl - Base64画像データ
   * @param {number} width - 画像幅
   * @param {number} height - 画像高さ
   */
  setImage(dataUrl, width, height) {
    this.image = {
      dataUrl,
      width,
      height
    };
  }

  /**
   * 画像をクリア
   */
  clearImage() {
    this.image = null;
  }

  /**
   * スケールを設定
   * @param {number} x1 - 基準線始点X
   * @param {number} y1 - 基準線始点Y
   * @param {number} x2 - 基準線終点X
   * @param {number} y2 - 基準線終点Y
   * @param {number} realLength - 実際の長さ(m)
   */
  setScale(x1, y1, x2, y2, realLength) {
    const p1 = { x: x1, y: y1 };
    const p2 = { x: x2, y: y2 };
    const distancePx = calculateDistance(p1, p2);
    const pixelPerMeter = distancePx / realLength;

    this.scale = {
      x1,
      y1,
      x2,
      y2,
      realLength,
      pixelPerMeter
    };
  }

  /**
   * スケールをクリア
   */
  clearScale() {
    this.scale = null;
  }

  /**
   * スケールが設定されているか確認
   * @returns {boolean}
   */
  hasScale() {
    return this.scale !== null;
  }

  /**
   * 設定を更新
   * @param {Object} newSettings - 新しい設定
   */
  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings);

    // ケーブルマネージャーに設定を反映
    this.cableManager.applySettings({
      marginRate: this.settings.marginRate,
      roundingMode: this.settings.roundingMode
    });
  }

  /**
   * プロジェクトデータをエクスポート
   * @returns {Object} プロジェクトデータ
   */
  exportData() {
    return {
      version: this.version,
      image: this.image,
      scale: this.scale,
      devices: this.deviceManager.exportData(),
      cables: this.cableManager.exportData(),
      settings: { ...this.settings }
    };
  }

  /**
   * プロジェクトデータをインポート
   * @param {Object} data - プロジェクトデータ
   */
  importData(data) {
    // バージョンチェック
    if (data.version !== this.version) {
      throw new Error(`Version mismatch: expected ${this.version}, got ${data.version}`);
    }

    this.image = data.image;
    this.scale = data.scale;

    if (data.devices) {
      this.deviceManager.importData(data.devices);
    }

    if (data.cables) {
      this.cableManager.importData(data.cables);
    }

    if (data.settings) {
      this.settings = { ...data.settings };
      this.cableManager.applySettings({
        marginRate: this.settings.marginRate,
        roundingMode: this.settings.roundingMode
      });
    }
  }

  /**
   * プロジェクトをリセット
   */
  reset() {
    this.image = null;
    this.scale = null;
    this.deviceManager.clear();
    this.cableManager.clear();
    this.settings = {
      marginRate: CONSTANTS.DEFAULT_MARGIN_RATE,
      roundingMode: CONSTANTS.DEFAULT_ROUNDING_MODE,
      showLabels: CONSTANTS.DEFAULT_SHOW_LABELS,
      showGrid: CONSTANTS.DEFAULT_SHOW_GRID
    };
  }

  /**
   * プロジェクトが空かどうか確認
   * @returns {boolean}
   */
  isEmpty() {
    return (
      this.image === null &&
      this.scale === null &&
      this.deviceManager.getAllDevices().length === 0 &&
      this.cableManager.getAllCables().length === 0
    );
  }
}
