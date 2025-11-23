import { CONSTANTS } from './constants.js';

/**
 * Canvas描画クラス
 */
export class CanvasRenderer {
  constructor(canvas, projectManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.projectManager = projectManager;

    // 変換パラメータ
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;

    // 選択状態
    this.selectedDeviceId = null;
    this.selectedCableId = null;

    // 一時描画用
    this.tempPoints = [];
    this.tempFromDevice = null;

    // 背景画像キャッシュ
    this.backgroundImage = null;
  }

  /**
   * Canvas座標を実座標に変換
   * @param {number} canvasX - Canvas X座標
   * @param {number} canvasY - Canvas Y座標
   * @returns {Object} 実座標 {x, y}
   */
  canvasToReal(canvasX, canvasY) {
    return {
      x: (canvasX - this.panX) / this.zoom,
      y: (canvasY - this.panY) / this.zoom
    };
  }

  /**
   * 実座標をCanvas座標に変換
   * @param {number} realX - 実 X座標
   * @param {number} realY - 実 Y座標
   * @returns {Object} Canvas座標 {x, y}
   */
  realToCanvas(realX, realY) {
    return {
      x: realX * this.zoom + this.panX,
      y: realY * this.zoom + this.panY
    };
  }

  /**
   * ズームイン
   */
  zoomIn() {
    this.zoom = Math.min(this.zoom + CONSTANTS.ZOOM_STEP, CONSTANTS.MAX_ZOOM);
  }

  /**
   * ズームアウト
   */
  zoomOut() {
    this.zoom = Math.max(this.zoom - CONSTANTS.ZOOM_STEP, CONSTANTS.MIN_ZOOM);
  }

  /**
   * ズームをリセット
   */
  resetZoom() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
  }

  /**
   * Canvasをクリア
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 背景画像を描画
   */
  drawBackground() {
    if (!this.projectManager.image) {
      return;
    }

    if (!this.backgroundImage) {
      this.backgroundImage = new Image();
      this.backgroundImage.src = this.projectManager.image.dataUrl;
    }

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    if (this.backgroundImage.complete) {
      this.ctx.drawImage(
        this.backgroundImage,
        0,
        0,
        this.projectManager.image.width,
        this.projectManager.image.height
      );
    }

    this.ctx.restore();
  }

  /**
   * グリッドを描画
   */
  drawGrid() {
    if (!this.projectManager.settings.showGrid) {
      return;
    }

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    this.ctx.strokeStyle = '#DDDDDD';
    this.ctx.lineWidth = 1 / this.zoom;

    const gridSize = CONSTANTS.GRID_SIZE;
    const startX = Math.floor(-this.panX / this.zoom / gridSize) * gridSize;
    const startY = Math.floor(-this.panY / this.zoom / gridSize) * gridSize;
    const endX = startX + this.canvas.width / this.zoom + gridSize;
    const endY = startY + this.canvas.height / this.zoom + gridSize;

    this.ctx.beginPath();
    for (let x = startX; x < endX; x += gridSize) {
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += gridSize) {
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
    }
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * スケール基準線を描画
   */
  drawScale() {
    if (!this.projectManager.scale) {
      return;
    }

    const scale = this.projectManager.scale;

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    this.ctx.strokeStyle = '#FF0000';
    this.ctx.lineWidth = CONSTANTS.SCALE_LINE_WIDTH / this.zoom;

    this.ctx.beginPath();
    this.ctx.moveTo(scale.x1, scale.y1);
    this.ctx.lineTo(scale.x2, scale.y2);
    this.ctx.stroke();

    // スケール情報を表示
    const midX = (scale.x1 + scale.x2) / 2;
    const midY = (scale.y1 + scale.y2) / 2;

    this.ctx.fillStyle = '#FF0000';
    this.ctx.font = `${14 / this.zoom}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${scale.realLength}m`, midX, midY - 10 / this.zoom);

    this.ctx.restore();
  }

  /**
   * 機器を描画
   */
  drawDevices() {
    const devices = this.projectManager.deviceManager.getAllDevices();

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    devices.forEach(device => {
      const isSelected = device.id === this.selectedDeviceId;
      const size = CONSTANTS.DEVICE_ICON_SIZE;

      if (device.type === 'power_outlet' || device.type === 'lan_patch') {
        // 電源アウトレットとLANパッチは四角で描画
        const halfSize = size / 2;
        this.ctx.fillStyle = device.color;
        this.ctx.fillRect(device.x - halfSize, device.y - halfSize, size, size);

        // 枠線
        this.ctx.strokeStyle = isSelected ? '#FF0000' : '#000000';
        this.ctx.lineWidth = (isSelected ? 3 : 2) / this.zoom;
        this.ctx.strokeRect(device.x - halfSize, device.y - halfSize, size, size);
      } else {
        // 他の機器は円で描画
        const radius = size / 2;
        this.ctx.beginPath();
        this.ctx.arc(device.x, device.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = device.color;
        this.ctx.fill();

        // 枠線
        this.ctx.strokeStyle = isSelected ? '#FF0000' : '#000000';
        this.ctx.lineWidth = (isSelected ? 3 : 2) / this.zoom;
        this.ctx.stroke();
      }
    });

    this.ctx.restore();
  }

  /**
   * 配線を描画
   */
  drawCables() {
    const cables = this.projectManager.cableManager.getAllCables();
    const devices = this.projectManager.deviceManager;

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    cables.forEach(cable => {
      const fromDevice = devices.getDeviceById(cable.fromDeviceId);
      const toDevice = devices.getDeviceById(cable.toDeviceId);

      if (!fromDevice || !toDevice) {
        return;
      }

      const isSelected = cable.id === this.selectedCableId;

      this.ctx.strokeStyle = cable.color;
      this.ctx.lineWidth = (isSelected ? CONSTANTS.SELECTED_LINE_WIDTH : CONSTANTS.LINE_WIDTH) / this.zoom;

      // 線スタイル設定
      if (cable.lineStyle === CONSTANTS.LINE_STYLE.DASHED) {
        this.ctx.setLineDash([10 / this.zoom, 5 / this.zoom]);
      } else {
        this.ctx.setLineDash([]);
      }

      // 配線を描画
      this.ctx.beginPath();
      this.ctx.moveTo(fromDevice.x, fromDevice.y);

      if (cable.mode === 'detailed' && cable.waypoints) {
        cable.waypoints.forEach(point => {
          this.ctx.lineTo(point.x, point.y);
        });
      }

      this.ctx.lineTo(toDevice.x, toDevice.y);
      this.ctx.stroke();

      // ラベル表示
      if (this.projectManager.settings.showLabels) {
        this.drawCableLabel(cable, fromDevice, toDevice);
      }
    });

    this.ctx.restore();
  }

  /**
   * 配線ラベルを描画
   * @param {Object} cable - ケーブルオブジェクト
   * @param {Object} fromDevice - 始点機器
   * @param {Object} toDevice - 終点機器
   */
  drawCableLabel(cable, fromDevice, toDevice) {
    // ラベル位置（中間点）
    const midX = (fromDevice.x + toDevice.x) / 2;
    const midY = (fromDevice.y + toDevice.y) / 2;

    const length = this.projectManager.settings.roundingMode
      ? cable.roundedLength
      : cable.lengthWithMargin;

    const modeText = cable.mode === 'detailed' ? '' : '[Simple] ';
    const offsetText = cable.offset > 0 ? ` (+${cable.offset.toFixed(1)}m)` : '';
    const label = `${modeText}${cable.name}\n${length.toFixed(1)}m${offsetText}`;

    this.ctx.fillStyle = '#000000';
    this.ctx.font = `${10 / this.zoom}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // 背景サイズを調整
    const bgWidth = offsetText ? 80 / this.zoom : 60 / this.zoom;
    const bgHeight = 30 / this.zoom;

    // 背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillRect(midX - bgWidth / 2, midY - bgHeight / 2, bgWidth, bgHeight);

    // テキスト
    this.ctx.fillStyle = '#000000';
    const lines = label.split('\n');
    lines.forEach((line, index) => {
      this.ctx.fillText(line, midX, midY + (index - 0.5) * 12 / this.zoom);
    });
  }

  /**
   * 一時配線を描画（配線作成中）
   * @param {Object} currentPoint - 現在のマウス座標 {x, y}
   */
  drawTempCable(currentPoint) {
    if (!this.tempFromDevice || this.tempPoints.length === 0) {
      return;
    }

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    this.ctx.strokeStyle = '#999999';
    this.ctx.lineWidth = CONSTANTS.LINE_WIDTH / this.zoom;
    this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);

    this.ctx.beginPath();
    this.ctx.moveTo(this.tempFromDevice.x, this.tempFromDevice.y);

    this.tempPoints.forEach(point => {
      this.ctx.lineTo(point.x, point.y);
    });

    if (currentPoint) {
      this.ctx.lineTo(currentPoint.x, currentPoint.y);
    }

    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * 機器名を描画（最前面）
   */
  drawDeviceLabels() {
    // showLabels設定がオフの場合は表示しない
    if (!this.projectManager.settings.showLabels) {
      return;
    }

    const devices = this.projectManager.deviceManager.getAllDevices();

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.zoom, this.zoom);

    devices.forEach(device => {
      // 電源アウトレットとLANパッチは名前を表示しない
      if (device.type === 'power_outlet' || device.type === 'lan_patch' || !device.name) {
        return;
      }

      const radius = CONSTANTS.DEVICE_ICON_SIZE / 2;
      const textY = device.y + radius + 5 / this.zoom;

      // テキストサイズを測定
      this.ctx.font = `${12 / this.zoom}px sans-serif`;
      const textMetrics = this.ctx.measureText(device.name);
      const textWidth = textMetrics.width;
      const textHeight = 14 / this.zoom;
      const padding = 4 / this.zoom;

      // 白背景を描画
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(
        device.x - textWidth / 2 - padding,
        textY - padding,
        textWidth + padding * 2,
        textHeight + padding * 2
      );

      // 枠線を描画
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1 / this.zoom;
      this.ctx.strokeRect(
        device.x - textWidth / 2 - padding,
        textY - padding,
        textWidth + padding * 2,
        textHeight + padding * 2
      );

      // 機器名を表示
      this.ctx.fillStyle = '#000000';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(device.name, device.x, textY);
    });

    this.ctx.restore();
  }

  /**
   * 全体を描画
   */
  render() {
    this.clear();
    this.drawBackground();
    this.drawGrid();
    this.drawScale();
    this.drawCables();
    this.drawDevices();
    this.drawDeviceLabels();
  }

  /**
   * スクリーンショットを取得
   * @returns {string} Data URL
   */
  captureScreenshot() {
    return this.canvas.toDataURL('image/png');
  }
}
