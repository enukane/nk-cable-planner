import { DeviceManager } from './devices.js';
import { CableManager } from './cables.js';
import { ProjectManager } from './project.js';
import { StorageManager } from './storage.js';
import { CanvasRenderer } from './canvas.js';
import { CONSTANTS, ERROR_MESSAGES } from './constants.js';
import { constrainToOrthogonal } from './utils.js';

/**
 * アプリケーションメインクラス
 */
class Application {
  constructor() {
    // マネージャー初期化
    this.deviceManager = new DeviceManager();
    this.cableManager = new CableManager();
    this.projectManager = new ProjectManager(this.deviceManager, this.cableManager);
    this.storageManager = new StorageManager();

    // Canvas初期化
    this.canvas = document.getElementById('main-canvas');
    this.renderer = new CanvasRenderer(this.canvas, this.projectManager);

    // アプリケーション状態
    this.state = {
      currentMode: CONSTANTS.MODES.VIEW,
      selectedDeviceType: 'router',
      isDragging: false,
      isSpacePressed: false,
      dragStartX: 0,
      dragStartY: 0,
      tempPoints: [],
      tempFromDevice: null,
      currentMousePos: null
    };

    // イベントハンドラをバインド
    this.bindEvents();

    // ローカルストレージから復元
    this.loadFromLocalStorage();

    // 初回描画
    this.render();
    this.updateUI();
  }

  /**
   * イベントハンドラをバインド
   */
  bindEvents() {
    // メニューボタン
    document.getElementById('btn-new').addEventListener('click', () => this.handleNew());
    document.getElementById('btn-export').addEventListener('click', () => this.handleExport());
    document.getElementById('btn-import').addEventListener('click', () => this.handleImport());
    document.getElementById('btn-screenshot').addEventListener('click', () => this.handleScreenshot());
    document.getElementById('btn-csv').addEventListener('click', () => this.handleCSV());

    // ツールボタン
    document.getElementById('btn-load-image').addEventListener('click', () => this.handleLoadImage());
    document.getElementById('btn-scale').addEventListener('click', () => this.setMode(CONSTANTS.MODES.SCALE));
    document.getElementById('btn-device').addEventListener('click', () => this.setMode(CONSTANTS.MODES.DEVICE));
    document.getElementById('btn-cable-detail').addEventListener('click', () => this.setMode(CONSTANTS.MODES.CABLE_DETAIL));
    document.getElementById('btn-cable-detail-ortho').addEventListener('click', () => this.setMode(CONSTANTS.MODES.CABLE_DETAIL_ORTHO));
    document.getElementById('btn-cable-simple').addEventListener('click', () => this.setMode(CONSTANTS.MODES.CABLE_SIMPLE));
    document.getElementById('btn-delete').addEventListener('click', () => this.setMode(CONSTANTS.MODES.DELETE));

    // 機器タイプ選択
    document.querySelectorAll('input[name="device-type"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.state.selectedDeviceType = e.target.value;
      });
    });

    // ズームコントロール
    document.getElementById('btn-zoom-in').addEventListener('click', () => this.handleZoomIn());
    document.getElementById('btn-zoom-out').addEventListener('click', () => this.handleZoomOut());
    document.getElementById('btn-zoom-reset').addEventListener('click', () => this.handleZoomReset());

    // 設定変更
    document.getElementById('margin-rate').addEventListener('change', (e) => this.handleSettingsChange());
    document.querySelectorAll('input[name="rounding"]').forEach(radio => {
      radio.addEventListener('change', () => this.handleSettingsChange());
    });
    document.getElementById('show-labels').addEventListener('change', () => this.handleSettingsChange());
    document.getElementById('show-grid').addEventListener('change', () => this.handleSettingsChange());

    // タブ切替
    document.getElementById('tab-devices').addEventListener('click', () => this.switchTab('devices'));
    document.getElementById('tab-cables').addEventListener('click', () => this.switchTab('cables'));
    document.getElementById('tab-summary').addEventListener('click', () => this.switchTab('summary'));

    // ファイル入力
    document.getElementById('image-file-input').addEventListener('change', (e) => this.handleImageFile(e));
    document.getElementById('project-file-input').addEventListener('change', (e) => this.handleProjectFile(e));

    // Canvas イベント
    this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
    this.canvas.addEventListener('dblclick', (e) => this.handleCanvasDoubleClick(e));

    // キーボードイベント
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  /**
   * モード切替
   */
  setMode(mode) {
    this.state.currentMode = mode;

    // ツールボタンのアクティブ状態を更新
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));

    const modeButtonMap = {
      [CONSTANTS.MODES.SCALE]: 'btn-scale',
      [CONSTANTS.MODES.DEVICE]: 'btn-device',
      [CONSTANTS.MODES.CABLE_DETAIL]: 'btn-cable-detail',
      [CONSTANTS.MODES.CABLE_DETAIL_ORTHO]: 'btn-cable-detail-ortho',
      [CONSTANTS.MODES.CABLE_SIMPLE]: 'btn-cable-simple',
      [CONSTANTS.MODES.DELETE]: 'btn-delete'
    };

    if (modeButtonMap[mode]) {
      document.getElementById(modeButtonMap[mode]).classList.add('active');
    }

    // 機器タイプセレクターの表示切替
    const deviceTypeSelector = document.getElementById('device-type-selector');
    deviceTypeSelector.style.display = mode === CONSTANTS.MODES.DEVICE ? 'flex' : 'none';

    // 配線作成をキャンセル
    this.state.tempPoints = [];
    this.state.tempFromDevice = null;

    this.render();
  }

  /**
   * 画像読込
   */
  handleLoadImage() {
    document.getElementById('image-file-input').click();
  }

  /**
   * 画像ファイル読込
   */
  async handleImageFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // ファイルサイズチェック
    if (file.size > 10 * 1024 * 1024) {
      alert(ERROR_MESSAGES.IMAGE_TOO_LARGE);
      return;
    }

    try {
      const imageData = await this.storageManager.readImageFile(file);
      this.projectManager.setImage(imageData.dataUrl, imageData.width, imageData.height);
      this.renderer.backgroundImage = null; // キャッシュクリア
      this.saveToLocalStorage();
      this.render();
    } catch (error) {
      alert(ERROR_MESSAGES.IMAGE_LOAD_FAILED);
      console.error(error);
    }

    // 入力をリセット
    event.target.value = '';
  }

  /**
   * Canvas マウスダウン
   */
  handleCanvasMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const realPos = this.renderer.canvasToReal(canvasX, canvasY);

    if (this.state.isSpacePressed || event.button === 1) {
      // パン開始
      this.state.isDragging = true;
      this.state.dragStartX = event.clientX - this.renderer.panX;
      this.state.dragStartY = event.clientY - this.renderer.panY;
      this.canvas.classList.add('panning');
      return;
    }

    if (this.state.currentMode === CONSTANTS.MODES.SCALE) {
      this.handleScaleClick(realPos);
    } else if (this.state.currentMode === CONSTANTS.MODES.DEVICE) {
      this.handleDeviceClick(realPos);
    } else if (this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL ||
               this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL_ORTHO ||
               this.state.currentMode === CONSTANTS.MODES.CABLE_SIMPLE) {
      this.handleCableClick(realPos);
    } else if (this.state.currentMode === CONSTANTS.MODES.DELETE) {
      this.handleDeleteClick(realPos);
    } else {
      // VIEW モード: 機器をドラッグ
      const device = this.deviceManager.getDeviceAtPosition(realPos.x, realPos.y);
      if (device) {
        this.state.isDragging = true;
        this.state.draggedDevice = device;
        this.renderer.selectedDeviceId = device.id;
        this.render();
        this.updateUI();
      }
    }
  }

  /**
   * Canvas マウス移動
   */
  handleCanvasMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const realPos = this.renderer.canvasToReal(canvasX, canvasY);

    this.state.currentMousePos = realPos;

    if (this.state.isDragging) {
      if (this.state.draggedDevice) {
        // 機器をドラッグ中
        this.deviceManager.moveDevice(this.state.draggedDevice.id, realPos.x, realPos.y);
        this.render();
      } else {
        // パン中
        this.renderer.panX = event.clientX - this.state.dragStartX;
        this.renderer.panY = event.clientY - this.state.dragStartY;
        this.render();
      }
    } else if ((this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL ||
                this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL_ORTHO) &&
               this.state.tempFromDevice) {
      // 配線作成中のプレビュー
      this.render();
      this.renderer.tempFromDevice = this.state.tempFromDevice;
      this.renderer.tempPoints = this.state.tempPoints;

      // 直交モードの場合は制約を適用
      let previewPos = realPos;
      if (this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL_ORTHO) {
        const lastPoint = this.state.tempPoints.length > 0
          ? this.state.tempPoints[this.state.tempPoints.length - 1]
          : this.state.tempFromDevice;
        previewPos = constrainToOrthogonal(lastPoint, realPos);
      }

      this.renderer.drawTempCable(previewPos);
    }
  }

  /**
   * Canvas マウスアップ
   */
  handleCanvasMouseUp(event) {
    if (this.state.isDragging && this.state.draggedDevice) {
      // 機器の移動完了
      this.saveToLocalStorage();
    }

    this.state.isDragging = false;
    this.state.draggedDevice = null;
    this.canvas.classList.remove('panning');
  }

  /**
   * Canvas ホイール（ズーム）
   */
  handleCanvasWheel(event) {
    event.preventDefault();

    if (event.deltaY < 0) {
      this.renderer.zoomIn();
    } else {
      this.renderer.zoomOut();
    }

    this.updateZoomDisplay();
    this.render();
  }

  /**
   * Canvas ダブルクリック
   */
  handleCanvasDoubleClick(event) {
    if ((this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL ||
         this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL_ORTHO) &&
        this.state.tempFromDevice) {
      // 詳細配線完了
      this.finishDetailedCable();
    }
  }

  /**
   * キーダウン
   */
  handleKeyDown(event) {
    if (event.key === ' ') {
      event.preventDefault();
      this.state.isSpacePressed = true;
      if (!this.state.isDragging) {
        this.canvas.style.cursor = 'grab';
      }
    } else if (event.key === 'Escape') {
      // 配線作成キャンセル
      this.state.tempPoints = [];
      this.state.tempFromDevice = null;
      this.render();
    } else if (event.key === 'Enter' && (this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL ||
                                          this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL_ORTHO)) {
      // 詳細配線完了
      this.finishDetailedCable();
    } else if (event.key === 'Delete' && this.renderer.selectedDeviceId) {
      // 選択機器を削除
      this.deleteDevice(this.renderer.selectedDeviceId);
    } else if (event.key === 'Delete' && this.renderer.selectedCableId) {
      // 選択配線を削除
      this.deleteCable(this.renderer.selectedCableId);
    }
  }

  /**
   * キーアップ
   */
  handleKeyUp(event) {
    if (event.key === ' ') {
      this.state.isSpacePressed = false;
      if (!this.state.isDragging) {
        this.canvas.style.cursor = 'crosshair';
      }
    }
  }

  /**
   * スケールクリック処理
   */
  handleScaleClick(pos) {
    if (!this.projectManager.scale) {
      // 始点設定
      this.projectManager.scale = { x1: pos.x, y1: pos.y };
    } else if (!this.projectManager.scale.x2) {
      // 終点設定＆実長入力
      this.projectManager.scale.x2 = pos.x;
      this.projectManager.scale.y2 = pos.y;
      this.showScaleDialog();
    }
  }

  /**
   * Show scale dialog
   */
  showScaleDialog() {
    const realLength = prompt('Enter the actual length in meters:');
    if (realLength && parseFloat(realLength) > 0) {
      const scale = this.projectManager.scale;
      this.projectManager.setScale(scale.x1, scale.y1, scale.x2, scale.y2, parseFloat(realLength));

      // Enable cable buttons
      document.getElementById('btn-cable-detail').disabled = false;
      document.getElementById('btn-cable-detail-ortho').disabled = false;
      document.getElementById('btn-cable-simple').disabled = false;

      this.saveToLocalStorage();
      this.render();
      this.updateUI();
    } else {
      this.projectManager.scale = null;
      alert(ERROR_MESSAGES.SCALE_INVALID);
    }
  }

  /**
   * Handle device placement click
   */
  handleDeviceClick(pos) {
    const name = prompt('Enter device name (leave empty for auto-generation):');
    if (name === null) return; // Cancel

    const device = this.deviceManager.addDevice(
      this.state.selectedDeviceType,
      pos.x,
      pos.y,
      name || undefined
    );

    this.renderer.selectedDeviceId = device.id;
    this.saveToLocalStorage();
    this.render();
    this.updateUI();
  }

  /**
   * 配線クリック処理
   */
  handleCableClick(pos) {
    if (!this.projectManager.hasScale()) {
      alert(ERROR_MESSAGES.SCALE_NOT_SET);
      return;
    }

    const device = this.deviceManager.getDeviceAtPosition(pos.x, pos.y);

    if (!device) {
      // 機器以外をクリック
      if ((this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL ||
           this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL_ORTHO) &&
          this.state.tempFromDevice) {
        // ウェイポイント追加
        let waypointPos = pos;

        // 直交モードの場合は制約を適用
        if (this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL_ORTHO) {
          const lastPoint = this.state.tempPoints.length > 0
            ? this.state.tempPoints[this.state.tempPoints.length - 1]
            : this.state.tempFromDevice;
          waypointPos = constrainToOrthogonal(lastPoint, pos);
        }

        this.state.tempPoints.push(waypointPos);
        this.render();
      }
      return;
    }

    if (!this.state.tempFromDevice) {
      // 始点設定
      this.state.tempFromDevice = device;
      this.renderer.selectedDeviceId = device.id;
      this.render();
    } else {
      // Set end device
      if (device.id === this.state.tempFromDevice.id) {
        alert('Cannot connect to the same device');
        return;
      }

      if (this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL ||
          this.state.currentMode === CONSTANTS.MODES.CABLE_DETAIL_ORTHO) {
        this.finishDetailedCable(device);
      } else {
        this.finishSimpleCable(device);
      }
    }
  }

  /**
   * Finish detailed cable
   */
  finishDetailedCable(toDevice = null) {
    if (!toDevice && this.state.currentMousePos) {
      toDevice = this.deviceManager.getDeviceAtPosition(
        this.state.currentMousePos.x,
        this.state.currentMousePos.y
      );
    }

    if (!toDevice || toDevice.id === this.state.tempFromDevice.id) {
      return;
    }

    // 自動生成された名前を使用
    this.cableManager.addDetailedCable(
      this.state.tempFromDevice.id,
      toDevice.id,
      this.state.tempPoints,
      null, // 自動生成
      this.deviceManager,
      this.projectManager.scale.pixelPerMeter
    );

    this.state.tempPoints = [];
    this.state.tempFromDevice = null;
    this.renderer.selectedDeviceId = null;

    this.saveToLocalStorage();
    this.render();
    this.updateUI();
  }

  /**
   * Finish simple cable
   */
  finishSimpleCable(toDevice) {
    const length = prompt('Enter cable length in meters:');
    if (!length || parseFloat(length) <= 0) {
      alert(ERROR_MESSAGES.INVALID_LENGTH);
      this.state.tempFromDevice = null;
      this.render();
      return;
    }

    // 自動生成された名前を使用
    this.cableManager.addSimpleCable(
      this.state.tempFromDevice.id,
      toDevice.id,
      parseFloat(length),
      null, // 自動生成
      this.deviceManager
    );

    this.state.tempFromDevice = null;
    this.renderer.selectedDeviceId = null;

    this.saveToLocalStorage();
    this.render();
    this.updateUI();
  }

  /**
   * 削除クリック処理
   */
  handleDeleteClick(pos) {
    const device = this.deviceManager.getDeviceAtPosition(pos.x, pos.y);
    if (device) {
      this.deleteDevice(device.id);
    }
  }

  /**
   * Delete device
   */
  deleteDevice(deviceId) {
    const device = this.deviceManager.getDeviceById(deviceId);
    if (!device) return;

    if (confirm(`Delete device "${device.name}"?\nRelated cables will also be deleted.`)) {
      this.cableManager.removeCablesByDevice(deviceId);
      this.deviceManager.removeDevice(deviceId);
      this.renderer.selectedDeviceId = null;

      this.saveToLocalStorage();
      this.render();
      this.updateUI();
    }
  }

  /**
   * Delete cable
   */
  deleteCable(cableId) {
    const cable = this.cableManager.getCableById(cableId);
    if (!cable) return;

    if (confirm(`Delete cable "${cable.name}"?`)) {
      this.cableManager.removeCable(cableId);
      this.renderer.selectedCableId = null;

      this.saveToLocalStorage();
      this.render();
      this.updateUI();
    }
  }

  /**
   * 設定変更
   */
  handleSettingsChange() {
    const marginRate = parseInt(document.getElementById('margin-rate').value);
    const roundingMode = document.querySelector('input[name="rounding"]:checked').value === 'on';
    const showLabels = document.getElementById('show-labels').checked;
    const showGrid = document.getElementById('show-grid').checked;

    this.projectManager.updateSettings({
      marginRate,
      roundingMode,
      showLabels,
      showGrid
    });

    this.saveToLocalStorage();
    this.render();
    this.updateUI();
  }

  /**
   * ズーム操作
   */
  handleZoomIn() {
    this.renderer.zoomIn();
    this.updateZoomDisplay();
    this.render();
  }

  handleZoomOut() {
    this.renderer.zoomOut();
    this.updateZoomDisplay();
    this.render();
  }

  handleZoomReset() {
    this.renderer.resetZoom();
    this.updateZoomDisplay();
    this.render();
  }

  updateZoomDisplay() {
    const percent = Math.round(this.renderer.zoom * 100);
    document.getElementById('zoom-level').textContent = `${percent}%`;
  }

  /**
   * New project
   */
  handleNew() {
    if (!confirm('Create a new project?\nUnsaved data will be lost.')) {
      return;
    }

    this.projectManager.reset();
    this.renderer.selectedDeviceId = null;
    this.renderer.selectedCableId = null;
    this.renderer.backgroundImage = null;
    this.state.tempPoints = [];
    this.state.tempFromDevice = null;

    document.getElementById('btn-cable-detail').disabled = true;
    document.getElementById('btn-cable-detail-ortho').disabled = true;
    document.getElementById('btn-cable-simple').disabled = true;

    this.storageManager.clearLocal();
    this.render();
    this.updateUI();
  }

  /**
   * エクスポート
   */
  handleExport() {
    const data = this.projectManager.exportData();
    const filename = this.storageManager.generateProjectFilename();
    this.storageManager.downloadJSON(data, filename);
  }

  /**
   * インポート
   */
  handleImport() {
    document.getElementById('project-file-input').click();
  }

  /**
   * プロジェクトファイル読込
   */
  async handleProjectFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const content = await this.storageManager.readFile(file);
      const data = JSON.parse(content);

      this.projectManager.importData(data);
      this.renderer.backgroundImage = null;
      this.renderer.selectedDeviceId = null;
      this.renderer.selectedCableId = null;

      // 配線ボタンの有効化
      if (this.projectManager.hasScale()) {
        document.getElementById('btn-cable-detail').disabled = false;
        document.getElementById('btn-cable-detail-ortho').disabled = false;
        document.getElementById('btn-cable-simple').disabled = false;
      }

      this.saveToLocalStorage();
      this.render();
      this.updateUI();
      this.updateSettingsUI();
    } catch (error) {
      alert(ERROR_MESSAGES.FILE_PARSE_ERROR);
      console.error(error);
    }

    event.target.value = '';
  }

  /**
   * スクリーンショット
   */
  handleScreenshot() {
    const dataUrl = this.renderer.captureScreenshot();
    const filename = this.storageManager.generateScreenshotFilename();
    this.storageManager.downloadScreenshot(dataUrl, filename);
  }

  /**
   * CSV出力
   */
  handleCSV() {
    const cables = this.cableManager.getAllCables();
    const devices = this.deviceManager.getAllDevices();
    const summary = this.cableManager.getSummary();
    const stats = this.cableManager.getCableStats();

    const csv = this.storageManager.generateFullCSV(cables, devices, summary, stats);
    const filename = this.storageManager.generateProjectFilename().replace('.json', '.csv');
    this.storageManager.downloadCSV(csv, filename);
  }

  /**
   * タブ切替
   */
  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    const content = document.getElementById('tab-content');

    if (tabName === 'devices') {
      this.renderDevicesTab(content);
    } else if (tabName === 'cables') {
      this.renderCablesTab(content);
    } else if (tabName === 'summary') {
      this.renderSummaryTab(content);
    }
  }

  /**
   * Render devices tab
   */
  renderDevicesTab(container) {
    const devices = this.deviceManager.getAllDevices();

    if (devices.length === 0) {
      container.innerHTML = '<div class="empty-state">No devices placed</div>';
      return;
    }

    container.innerHTML = devices.map(device => `
      <div class="device-item ${device.id === this.renderer.selectedDeviceId ? 'selected' : ''}" data-id="${device.id}">
        <div class="device-item-header">
          <div>
            <div class="device-name">
              <span class="color-indicator" style="background-color: ${device.color}"></span>
              ${device.name}
            </div>
            <div class="device-type">${CONSTANTS.DEVICE_TYPE_NAMES[device.type]}</div>
          </div>
          <div class="item-actions">
            <button class="btn-delete-device" data-id="${device.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('');

    // イベント追加
    container.querySelectorAll('.device-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-delete-device')) {
          this.renderer.selectedDeviceId = item.dataset.id;
          this.render();
          this.updateUI();
        }
      });
    });

    container.querySelectorAll('.btn-delete-device').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deleteDevice(btn.dataset.id);
      });
    });
  }

  /**
   * Render cables tab
   */
  renderCablesTab(container) {
    const cables = this.cableManager.getAllCables();

    if (cables.length === 0) {
      container.innerHTML = '<div class="empty-state">No cables</div>';
      return;
    }

    const roundingMode = this.projectManager.settings.roundingMode;

    container.innerHTML = cables.map(cable => {
      const fromDevice = this.deviceManager.getDeviceById(cable.fromDeviceId);
      const toDevice = this.deviceManager.getDeviceById(cable.toDeviceId);
      const length = roundingMode ? cable.roundedLength : cable.lengthWithMargin;
      const modeText = cable.mode === 'detailed' ? 'Detailed' : 'Simple';

      const offsetText = cable.offset > 0 ? ` (${cable.lengthM.toFixed(1)}m + ${cable.offset.toFixed(1)}m offset)` : '';

      return `
        <div class="cable-item ${cable.id === this.renderer.selectedCableId ? 'selected' : ''}" data-id="${cable.id}">
          <div class="cable-item-header">
            <div>
              <div class="cable-name">
                <span class="color-indicator" style="background-color: ${cable.color}"></span>
                <span class="cable-name-text" data-id="${cable.id}">${cable.name}</span>
                <button class="btn-edit-cable-name" data-id="${cable.id}" title="Edit name">✏️</button>
              </div>
              <div class="cable-mode">${modeText}: ${fromDevice?.name} → ${toDevice?.name}</div>
              <div class="cable-length">
                ${length.toFixed(1)}m${offsetText}
                <button class="btn-edit-offset" data-id="${cable.id}" title="Set offset">📏</button>
              </div>
            </div>
            <div class="item-actions">
              <button class="btn-delete-cable" data-id="${cable.id}">Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // イベント追加
    container.querySelectorAll('.cable-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-delete-cable') &&
            !e.target.classList.contains('btn-edit-cable-name') &&
            !e.target.classList.contains('btn-edit-offset')) {
          this.renderer.selectedCableId = item.dataset.id;
          this.render();
          this.updateUI();
        }
      });
    });

    container.querySelectorAll('.btn-delete-cable').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deleteCable(btn.dataset.id);
      });
    });

    container.querySelectorAll('.btn-edit-cable-name').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleRenameCable(btn.dataset.id);
      });
    });

    container.querySelectorAll('.btn-edit-offset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleSetCableOffset(btn.dataset.id);
      });
    });
  }

  /**
   * Handle cable rename
   */
  handleRenameCable(cableId) {
    const cable = this.cableManager.getCableById(cableId);
    if (!cable) return;

    const newName = prompt('Enter new cable name:', cable.name);
    if (!newName || newName === cable.name) {
      return;
    }

    if (this.cableManager.renameCable(cableId, newName)) {
      this.saveToLocalStorage();
      this.render();
      this.updateUI();
    } else {
      alert('Cable name already exists or is invalid.');
    }
  }

  /**
   * Handle cable offset setting
   */
  handleSetCableOffset(cableId) {
    const cable = this.cableManager.getCableById(cableId);
    if (!cable) return;

    const offsetStr = prompt(
      'Enter offset in meters (for height difference, etc.):\n' +
      `Current: ${cable.offset}m`,
      cable.offset
    );

    if (offsetStr === null) {
      return;
    }

    const offset = parseFloat(offsetStr);
    if (isNaN(offset) || offset < 0) {
      alert('Please enter a valid positive number.');
      return;
    }

    if (this.cableManager.setCableOffset(cableId, offset)) {
      this.saveToLocalStorage();
      this.render();
      this.updateUI();
    }
  }

  /**
   * Render summary tab
   */
  renderSummaryTab(container) {
    const summary = this.cableManager.getSummary();
    const stats = this.cableManager.getCableStats();
    const totalLength = this.cableManager.getTotalLength();

    const sorted = Object.entries(summary).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

    let html = '<table class="summary-table"><thead><tr><th>Cable Length</th><th>Quantity</th></tr></thead><tbody>';

    sorted.forEach(([length, count]) => {
      html += `<tr><td>${length}m</td><td>${count}</td></tr>`;
    });

    html += '</tbody></table>';

    html += `
      <div class="summary-stats">
        <div><strong>Total cables:</strong> ${stats.total}</div>
        <div><strong>Detailed:</strong> ${stats.detailed}</div>
        <div><strong>Simple:</strong> ${stats.simple}</div>
        <div><strong>Total length:</strong> ${totalLength.toFixed(1)}m</div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * UI更新
   */
  updateUI() {
    // 現在のタブを再描画
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
      const tabName = activeTab.id.replace('tab-', '');
      const content = document.getElementById('tab-content');
      if (tabName === 'devices') {
        this.renderDevicesTab(content);
      } else if (tabName === 'cables') {
        this.renderCablesTab(content);
      } else if (tabName === 'summary') {
        this.renderSummaryTab(content);
      }
    }
  }

  /**
   * 設定UIを更新
   */
  updateSettingsUI() {
    const settings = this.projectManager.settings;

    document.getElementById('margin-rate').value = settings.marginRate;
    document.querySelector(`input[name="rounding"][value="${settings.roundingMode ? 'on' : 'off'}"]`).checked = true;
    document.getElementById('show-labels').checked = settings.showLabels;
    document.getElementById('show-grid').checked = settings.showGrid;
  }

  /**
   * 描画
   */
  render() {
    this.renderer.render();
  }

  /**
   * ローカルストレージに保存
   */
  saveToLocalStorage() {
    try {
      const data = this.projectManager.exportData();
      this.storageManager.saveToLocal(data);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * ローカルストレージから読込
   */
  loadFromLocalStorage() {
    try {
      const data = this.storageManager.loadFromLocal();
      if (data) {
        this.projectManager.importData(data);
        this.renderer.backgroundImage = null;

        // 配線ボタンの有効化
        if (this.projectManager.hasScale()) {
          document.getElementById('btn-cable-detail').disabled = false;
          document.getElementById('btn-cable-detail-ortho').disabled = false;
          document.getElementById('btn-cable-simple').disabled = false;
        }

        this.updateSettingsUI();
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
  window.app = new Application();
});
