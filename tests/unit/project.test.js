import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectManager } from '../../js/project.js';
import { DeviceManager } from '../../js/devices.js';
import { CableManager } from '../../js/cables.js';

describe('プロジェクト管理', () => {
  let projectManager;
  let deviceManager;
  let cableManager;

  beforeEach(() => {
    deviceManager = new DeviceManager();
    cableManager = new CableManager();
    projectManager = new ProjectManager(deviceManager, cableManager);
  });

  describe('プロジェクト初期化', () => {
    it('新規プロジェクトの初期状態が正しい', () => {
      expect(projectManager.version).toBe('1.0');
      expect(projectManager.image).toBeNull();
      expect(projectManager.scale).toBeNull();
      expect(projectManager.settings).toEqual({
        marginRate: 10,
        roundingMode: true,
        showLabels: true,
        showGrid: false
      });
    });
  });

  describe('画像設定', () => {
    it('画像データを設定できる', () => {
      projectManager.setImage('data:image/png;base64,abc123', 800, 600);

      expect(projectManager.image).toEqual({
        dataUrl: 'data:image/png;base64,abc123',
        width: 800,
        height: 600
      });
    });

    it('画像をクリアできる', () => {
      projectManager.setImage('data:image/png;base64,abc123', 800, 600);
      projectManager.clearImage();

      expect(projectManager.image).toBeNull();
    });
  });

  describe('スケール設定', () => {
    it('スケールを設定できる', () => {
      projectManager.setScale(0, 0, 100, 0, 10);

      expect(projectManager.scale).toEqual({
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        realLength: 10,
        pixelPerMeter: 10
      });
    });

    it('スケール比率が正しく計算される', () => {
      // 300px = 30m → 10px/m
      projectManager.setScale(0, 0, 300, 0, 30);
      expect(projectManager.scale.pixelPerMeter).toBe(10);

      // 500px = 10m → 50px/m
      projectManager.setScale(0, 0, 300, 400, 10);
      expect(projectManager.scale.pixelPerMeter).toBe(50);
    });

    it('スケールをクリアできる', () => {
      projectManager.setScale(0, 0, 100, 0, 10);
      projectManager.clearScale();

      expect(projectManager.scale).toBeNull();
    });

    it('スケールが設定されているか確認できる', () => {
      expect(projectManager.hasScale()).toBe(false);

      projectManager.setScale(0, 0, 100, 0, 10);
      expect(projectManager.hasScale()).toBe(true);
    });
  });

  describe('設定変更', () => {
    it('余裕率を変更できる', () => {
      projectManager.updateSettings({ marginRate: 20 });
      expect(projectManager.settings.marginRate).toBe(20);
    });

    it('丸めモードを変更できる', () => {
      projectManager.updateSettings({ roundingMode: false });
      expect(projectManager.settings.roundingMode).toBe(false);
    });

    it('ラベル表示を変更できる', () => {
      projectManager.updateSettings({ showLabels: false });
      expect(projectManager.settings.showLabels).toBe(false);
    });

    it('グリッド表示を変更できる', () => {
      projectManager.updateSettings({ showGrid: true });
      expect(projectManager.settings.showGrid).toBe(true);
    });

    it('設定変更がケーブルマネージャーに反映される', () => {
      const device1 = deviceManager.addDevice('router', 0, 0);
      const device2 = deviceManager.addDevice('poe_sw', 300, 0);
      const cable = cableManager.addSimpleCable(device1.id, device2.id, 10, 'C1', deviceManager);

      projectManager.updateSettings({ marginRate: 20, roundingMode: false });

      expect(cable.lengthWithMargin).toBe(12);
    });
  });

  describe('エクスポート', () => {
    it('プロジェクトデータを正しくエクスポートできる', () => {
      projectManager.setImage('data:image/png;base64,abc', 800, 600);
      projectManager.setScale(0, 0, 100, 0, 10);
      deviceManager.addDevice('router', 100, 200);
      projectManager.updateSettings({ marginRate: 15 });

      const data = projectManager.exportData();

      expect(data.version).toBe('1.0');
      expect(data.image).toBeDefined();
      expect(data.scale).toBeDefined();
      expect(data.devices).toHaveLength(1);
      expect(data.cables).toHaveLength(0);
      expect(data.settings.marginRate).toBe(15);
    });
  });

  describe('インポート', () => {
    it('プロジェクトデータを正しくインポートできる', () => {
      const data = {
        version: '1.0',
        image: {
          dataUrl: 'data:image/png;base64,xyz',
          width: 1000,
          height: 800
        },
        scale: {
          x1: 0,
          y1: 0,
          x2: 200,
          y2: 0,
          realLength: 20,
          pixelPerMeter: 10
        },
        devices: [
          {
            id: 'device-1',
            type: 'router',
            name: 'Router-1',
            x: 100,
            y: 200,
            color: '#FF6B6B'
          }
        ],
        cables: [],
        settings: {
          marginRate: 15,
          roundingMode: false,
          showLabels: true,
          showGrid: true
        }
      };

      projectManager.importData(data);

      expect(projectManager.image).toEqual(data.image);
      expect(projectManager.scale).toEqual(data.scale);
      expect(deviceManager.getAllDevices()).toHaveLength(1);
      expect(projectManager.settings.marginRate).toBe(15);
    });

    it('バージョンチェックが機能する', () => {
      const data = {
        version: '2.0',
        devices: [],
        cables: [],
        settings: {}
      };

      expect(() => projectManager.importData(data)).toThrow();
    });
  });

  describe('プロジェクトリセット', () => {
    it('全データをリセットできる', () => {
      projectManager.setImage('data:image/png;base64,abc', 800, 600);
      projectManager.setScale(0, 0, 100, 0, 10);
      deviceManager.addDevice('router', 100, 200);

      projectManager.reset();

      expect(projectManager.image).toBeNull();
      expect(projectManager.scale).toBeNull();
      expect(deviceManager.getAllDevices()).toHaveLength(0);
      expect(cableManager.getAllCables()).toHaveLength(0);
    });
  });
});
