import { describe, it, expect, beforeEach } from 'vitest';
import { DeviceManager } from '../../js/devices.js';
import { CableManager } from '../../js/cables.js';
import { ProjectManager } from '../../js/project.js';
import { StorageManager } from '../../js/storage.js';

describe('統合ワークフロー', () => {
  let deviceManager;
  let cableManager;
  let projectManager;
  let storageManager;

  beforeEach(() => {
    deviceManager = new DeviceManager();
    cableManager = new CableManager();
    projectManager = new ProjectManager(deviceManager, cableManager);
    storageManager = new StorageManager();
  });

  describe('基本ワークフロー', () => {
    it('画像読込 → スケール設定 → 機器配置 → 配線作成 → 集計', () => {
      // 1. 画像読込
      projectManager.setImage('data:image/png;base64,test', 1000, 800);
      expect(projectManager.image).toBeDefined();

      // 2. スケール設定（100px = 10m → 10px/m）
      projectManager.setScale(0, 0, 100, 0, 10);
      expect(projectManager.scale.pixelPerMeter).toBe(10);

      // 3. 機器配置（Router、PoE SW、AP、PC）
      const router = deviceManager.addDevice('router', 100, 100);
      const sw = deviceManager.addDevice('poe_sw', 400, 100);
      const ap1 = deviceManager.addDevice('ap', 400, 300);
      const pc1 = deviceManager.addDevice('pc', 600, 300);

      expect(deviceManager.getAllDevices()).toHaveLength(4);

      // 4. 詳細配線作成（Router → SW: 300px = 30m）
      const cable1 = cableManager.addDetailedCable(
        router.id,
        sw.id,
        [],
        'Main-1',
        deviceManager,
        10
      );
      expect(cable1.lengthM).toBe(30);
      expect(cable1.lengthWithMargin).toBe(33); // 30 * 1.1

      // 5. 簡易配線作成（SW → AP）
      const cable2 = cableManager.addSimpleCable(
        sw.id,
        ap1.id,
        15,
        'AP-Link-1',
        deviceManager
      );
      expect(cable2.lengthM).toBe(15);

      // 6. 簡易配線作成（AP → PC）
      const cable3 = cableManager.addSimpleCable(
        ap1.id,
        pc1.id,
        5,
        'PC-Link-1',
        deviceManager
      );
      expect(cable3.lengthM).toBe(5);

      // 7. 集計
      const summary = cableManager.getSummary();
      const stats = cableManager.getCableStats();

      expect(stats.total).toBe(3);
      expect(stats.detailed).toBe(1);
      expect(stats.simple).toBe(2);

      // 丸めあり:
      // cable1: 30m * 1.1 = 33m → 35m
      // cable2: 15m * 1.1 = 16.5m → 20m
      // cable3: 5m * 1.1 = 5.5m → 10m
      expect(summary['35']).toBe(1);
      expect(summary['20']).toBe(1);
      expect(summary['10']).toBe(1);
    });

    it('機器削除時に関連配線も削除される', () => {
      // 機器配置
      const router = deviceManager.addDevice('router', 100, 100);
      const sw = deviceManager.addDevice('poe_sw', 400, 100);
      const ap = deviceManager.addDevice('ap', 400, 300);

      projectManager.setScale(0, 0, 100, 0, 10);

      // 配線作成
      cableManager.addDetailedCable(router.id, sw.id, [], 'C1', deviceManager, 10);
      cableManager.addDetailedCable(sw.id, ap.id, [], 'C2', deviceManager, 10);

      expect(cableManager.getAllCables()).toHaveLength(2);

      // SW削除
      const removed = cableManager.removeCablesByDevice(sw.id);
      deviceManager.removeDevice(sw.id);

      expect(removed).toBe(2);
      expect(cableManager.getAllCables()).toHaveLength(0);
    });
  });

  describe('設定変更', () => {
    it('余裕率変更が全配線に反映される', () => {
      projectManager.setScale(0, 0, 100, 0, 10);

      const router = deviceManager.addDevice('router', 0, 0);
      const sw = deviceManager.addDevice('poe_sw', 100, 0);

      const cable = cableManager.addDetailedCable(
        router.id,
        sw.id,
        [],
        'C1',
        deviceManager,
        10
      );

      expect(cable.lengthWithMargin).toBe(11); // 10 * 1.1

      // 余裕率を20%に変更
      projectManager.updateSettings({ marginRate: 20 });

      expect(cable.lengthWithMargin).toBe(12); // 10 * 1.2
    });

    it('丸めモード切替が集計に反映される', () => {
      projectManager.setScale(0, 0, 100, 0, 10);

      const router = deviceManager.addDevice('router', 0, 0);
      const sw = deviceManager.addDevice('poe_sw', 70, 0);

      cableManager.addDetailedCable(router.id, sw.id, [], 'C1', deviceManager, 10);

      // 丸めあり（デフォルト）
      let summary = cableManager.getSummary();
      expect(summary['10']).toBe(1); // 7.7 → 10

      // 丸めなし
      projectManager.updateSettings({ marginRate: 10, roundingMode: false });
      summary = cableManager.getSummary();
      const key = Object.keys(summary)[0]; // 浮動小数点を文字列として取得
      expect(parseFloat(key)).toBeCloseTo(7.7, 1);
    });
  });

  describe('エクスポート/インポート', () => {
    it('プロジェクトを完全にエクスポート/インポートできる', () => {
      // プロジェクト作成
      projectManager.setImage('data:image/png;base64,abc', 800, 600);
      projectManager.setScale(0, 0, 100, 0, 10);
      projectManager.updateSettings({ marginRate: 15, roundingMode: false });

      const router = deviceManager.addDevice('router', 100, 200);
      const sw = deviceManager.addDevice('poe_sw', 300, 200);
      const pc = deviceManager.addDevice('pc', 500, 200);

      cableManager.addDetailedCable(router.id, sw.id, [], 'C1', deviceManager, 10);
      cableManager.addSimpleCable(sw.id, pc.id, 5, 'C2', deviceManager);

      // エクスポート
      const data = projectManager.exportData();

      expect(data.version).toBe('1.0');
      expect(data.image).toBeDefined();
      expect(data.scale).toBeDefined();
      expect(data.devices).toHaveLength(3);
      expect(data.cables).toHaveLength(2);
      expect(data.settings.marginRate).toBe(15);

      // 新しいプロジェクトでインポート
      const newDeviceManager = new DeviceManager();
      const newCableManager = new CableManager();
      const newProjectManager = new ProjectManager(newDeviceManager, newCableManager);

      newProjectManager.importData(data);

      expect(newProjectManager.image).toEqual(projectManager.image);
      expect(newProjectManager.scale).toEqual(projectManager.scale);
      expect(newDeviceManager.getAllDevices()).toHaveLength(3);
      expect(newCableManager.getAllCables()).toHaveLength(2);
      expect(newProjectManager.settings.marginRate).toBe(15);
    });

    it('バージョン不一致でエラーになる', () => {
      const data = {
        version: '2.0',
        devices: [],
        cables: [],
        settings: {}
      };

      expect(() => projectManager.importData(data)).toThrow();
    });
  });

  describe('ローカルストレージ', () => {
    it('自動保存・復元が正常に動作する', () => {
      projectManager.setImage('data:image/png;base64,test', 800, 600);

      const router = deviceManager.addDevice('router', 100, 100);
      const sw = deviceManager.addDevice('poe_sw', 300, 100);

      // 保存
      const data = projectManager.exportData();
      storageManager.saveToLocal(data);

      // 読込
      const loaded = storageManager.loadFromLocal();

      expect(loaded).toBeDefined();
      expect(loaded.devices).toHaveLength(2);
      expect(loaded.image).toBeDefined();
    });
  });

  describe('CSV出力', () => {
    it('完全なCSVを生成できる', () => {
      projectManager.setScale(0, 0, 100, 0, 10);

      const router = deviceManager.addDevice('router', 0, 0);
      const sw = deviceManager.addDevice('poe_sw', 100, 0);
      const pc = deviceManager.addDevice('pc', 200, 0);

      cableManager.addDetailedCable(router.id, sw.id, [], 'Main', deviceManager, 10);
      cableManager.addSimpleCable(sw.id, pc.id, 5, 'PC-1', deviceManager);

      const summary = cableManager.getSummary();
      const stats = cableManager.getCableStats();
      const cables = cableManager.getAllCables();
      const devices = deviceManager.getAllDevices();

      const csv = storageManager.generateFullCSV(cables, devices, summary, stats);

      expect(csv).toContain('Cable List');
      expect(csv).toContain('Summary');
      expect(csv).toContain('Main');
      expect(csv).toContain('PC-1');
    });
  });

  describe('複雑なシナリオ', () => {
    it('複数PC配置と配線（PC機能確認）', () => {
      projectManager.setScale(0, 0, 100, 0, 10);

      const router = deviceManager.addDevice('router', 100, 100);
      const sw = deviceManager.addDevice('poe_sw', 300, 100);
      const pc1 = deviceManager.addDevice('pc', 500, 100);
      const pc2 = deviceManager.addDevice('pc', 500, 200);
      const pc3 = deviceManager.addDevice('pc', 500, 300);

      expect(pc1.name).toBe('PC-1');
      expect(pc2.name).toBe('PC-2');
      expect(pc3.name).toBe('PC-3');

      cableManager.addSimpleCable(sw.id, pc1.id, 5, 'PC1-Link', deviceManager);
      cableManager.addSimpleCable(sw.id, pc2.id, 7, 'PC2-Link', deviceManager);
      cableManager.addSimpleCable(sw.id, pc3.id, 10, 'PC3-Link', deviceManager);

      const cables = cableManager.getAllCables();
      expect(cables).toHaveLength(3);

      const stats = cableManager.getCableStats();
      expect(stats.simple).toBe(3);
    });

    it('waypoint経由の詳細配線', () => {
      projectManager.setScale(0, 0, 100, 0, 10);

      const router = deviceManager.addDevice('router', 0, 0);
      const sw = deviceManager.addDevice('poe_sw', 300, 400);

      const waypoints = [
        { x: 0, y: 200 },
        { x: 150, y: 200 },
        { x: 150, y: 400 }
      ];

      const cable = cableManager.addDetailedCable(
        router.id,
        sw.id,
        waypoints,
        'Complex',
        deviceManager,
        10
      );

      // 距離: 0→(0,200)=200, (0,200)→(150,200)=150, (150,200)→(150,400)=200, (150,400)→(300,400)=150
      // 合計: 700px = 70m
      expect(cable.lengthM).toBe(70);
      expect(cable.waypoints).toHaveLength(3);
    });
  });
});
