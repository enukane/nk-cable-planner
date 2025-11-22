import { formatDateTime } from './utils.js';
import { CONSTANTS } from './constants.js';

/**
 * ストレージ管理クラス
 */
export class StorageManager {
  constructor() {
    this.storageKey = CONSTANTS.STORAGE_KEY;
  }

  /**
   * ローカルストレージに保存
   * @param {Object} data - 保存するデータ
   */
  saveToLocal(data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(this.storageKey, json);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  }

  /**
   * ローカルストレージから読込
   * @returns {Object|null} 読み込んだデータ
   */
  loadFromLocal() {
    try {
      const json = localStorage.getItem(this.storageKey);
      if (!json) {
        return null;
      }
      return JSON.parse(json);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * ローカルストレージをクリア
   */
  clearLocal() {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * プロジェクトファイル名を生成
   * @param {Date} date - 日付（省略時は現在時刻）
   * @returns {string} ファイル名
   */
  generateProjectFilename(date = new Date()) {
    const timestamp = formatDateTime(date);
    return `${CONSTANTS.PROJECT_FILE_PREFIX}_${timestamp}.json`;
  }

  /**
   * スクリーンショットファイル名を生成
   * @param {Date} date - 日付（省略時は現在時刻）
   * @returns {string} ファイル名
   */
  generateScreenshotFilename(date = new Date()) {
    const timestamp = formatDateTime(date);
    return `${CONSTANTS.SCREENSHOT_FILE_PREFIX}_${timestamp}.png`;
  }

  /**
   * JSONデータをBlobに変換
   * @param {Object} data - データ
   * @returns {Blob} Blobオブジェクト
   */
  createJsonBlob(data) {
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * オブジェクトURLを生成
   * @param {Blob} blob - Blobオブジェクト
   * @returns {string} オブジェクトURL
   */
  createObjectURL(blob) {
    return URL.createObjectURL(blob);
  }

  /**
   * Generate cables list CSV
   * @param {Array} cables - Cable list
   * @param {Array} devices - Device list
   * @returns {string} CSV string
   */
  generateCablesCSV(cables, devices) {
    const lines = [];
    lines.push('Cable List');
    lines.push('Cable Name,Mode,From,To,Actual Length(m),With Margin(m),Rounded(m)');

    const deviceMap = {};
    devices.forEach(device => {
      deviceMap[device.id] = device.name;
    });

    cables.forEach(cable => {
      const mode = cable.mode === 'detailed' ? 'Detailed' : 'Simple';
      const from = deviceMap[cable.fromDeviceId] || cable.fromDeviceId;
      const to = deviceMap[cable.toDeviceId] || cable.toDeviceId;
      const lengthM = cable.lengthM.toFixed(1);
      const lengthWithMargin = cable.lengthWithMargin.toFixed(1);
      const roundedLength = cable.roundedLength ? cable.roundedLength : cable.lengthWithMargin.toFixed(1);

      lines.push(`${cable.name},${mode},${from},${to},${lengthM},${lengthWithMargin},${roundedLength}`);
    });

    return lines.join('\n');
  }

  /**
   * Generate summary CSV
   * @param {Object} summary - Summary data
   * @param {Object} stats - Statistics data
   * @returns {string} CSV string
   */
  generateSummaryCSV(summary, stats) {
    const lines = [];
    lines.push('');
    lines.push('Summary');
    lines.push('Cable Length,Quantity,Detailed,Simple');

    // Sort (ascending)
    const sorted = Object.entries(summary).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

    sorted.forEach(([length, count]) => {
      lines.push(`${length}m,${count}`);
    });

    lines.push('');
    lines.push(`Total,${stats.detailed + stats.simple},${stats.detailed},${stats.simple}`);

    return lines.join('\n');
  }

  /**
   * 完全なCSVを生成
   * @param {Array} cables - ケーブルリスト
   * @param {Array} devices - 機器リスト
   * @param {Object} summary - 集計データ
   * @param {Object} stats - 統計データ
   * @returns {string} CSV文字列
   */
  generateFullCSV(cables, devices, summary, stats) {
    const cablesCSV = this.generateCablesCSV(cables, devices);
    const summaryCSV = this.generateSummaryCSV(summary, stats);

    return cablesCSV + '\n' + summaryCSV;
  }

  /**
   * CSVファイルをダウンロード
   * @param {string} csv - CSV文字列
   * @param {string} filename - ファイル名
   */
  downloadCSV(csv, filename) {
    // BOM付きUTF-8でエンコード（Excel対応）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = this.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * JSONファイルをダウンロード
   * @param {Object} data - データ
   * @param {string} filename - ファイル名
   */
  downloadJSON(data, filename) {
    const blob = this.createJsonBlob(data);
    const url = this.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * スクリーンショットをダウンロード
   * @param {string} dataUrl - Data URL
   * @param {string} filename - ファイル名
   */
  downloadScreenshot(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  /**
   * ファイルを読み込む
   * @param {File} file - ファイルオブジェクト
   * @returns {Promise<string>} ファイル内容
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        resolve(event.target.result);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsText(file);
    });
  }

  /**
   * 画像ファイルを読み込む
   * @param {File} file - 画像ファイル
   * @returns {Promise<{dataUrl: string, width: number, height: number}>} 画像データ
   */
  readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const img = new Image();

        img.onload = () => {
          resolve({
            dataUrl,
            width: img.width,
            height: img.height
          });
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = dataUrl;
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  }
}
