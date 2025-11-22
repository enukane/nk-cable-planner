import { describe, it, expect, beforeEach } from 'vitest';
import { CableManager } from '../../js/cables.js';
import { DeviceManager } from '../../js/devices.js';
import { CONSTANTS } from '../../js/constants.js';

describe('配線管理', () => {
  let cableManager;
  let deviceManager;
  let device1, device2, device3;

  beforeEach(() => {
    cableManager = new CableManager();
    deviceManager = new DeviceManager();

    // テスト用機器を配置（座標は3-4-5の直角三角形）
    device1 = deviceManager.addDevice('router', 0, 0);
    device2 = deviceManager.addDevice('poe_sw', 300, 0);
    device3 = deviceManager.addDevice('ap', 300, 400);
  });

  describe('詳細配線作成', () => {
    it('waypoint無しの直線配線を作成できる', () => {
      const cable = cableManager.addDetailedCable(
        device1.id,
        device2.id,
        [],
        'Cable-1',
        deviceManager,
        10 // pixelPerMeter
      );

      expect(cable).toBeDefined();
      expect(cable.mode).toBe('detailed');
      expect(cable.fromDeviceId).toBe(device1.id);
      expect(cable.toDeviceId).toBe(device2.id);
      expect(cable.waypoints).toEqual([]);
      expect(cable.name).toBe('Cable-1');
      expect(cable.lengthPx).toBe(300);
      expect(cable.lengthM).toBe(30); // 300px / 10px/m
    });

    it('waypointありの配線を作成できる', () => {
      const waypoints = [
        { x: 150, y: 0 },
        { x: 150, y: 200 }
      ];

      const cable = cableManager.addDetailedCable(
        device1.id,
        device2.id,
        waypoints,
        'Cable-2',
        deviceManager,
        10
      );

      expect(cable.waypoints).toEqual(waypoints);
      // 距離: 0→(150,0)=150, (150,0)→(150,200)=200, (150,200)→(300,0)=250
      expect(cable.lengthPx).toBe(600);
      expect(cable.lengthM).toBe(60);
    });

    it('デフォルトカラーが設定される', () => {
      const cable = cableManager.addDetailedCable(
        device1.id,
        device2.id,
        [],
        'Cable-1',
        deviceManager,
        10
      );

      expect(cable.color).toBe(CONSTANTS.CABLE_DEFAULT_COLOR);
      expect(cable.lineStyle).toBe(CONSTANTS.LINE_STYLE.SOLID);
    });

    it('余裕率を適用できる', () => {
      const cable = cableManager.addDetailedCable(
        device1.id,
        device2.id,
        [],
        'Cable-1',
        deviceManager,
        10
      );

      cableManager.applySettings({ marginRate: 10 });

      expect(cable.lengthWithMargin).toBe(33); // 30 * 1.1
    });

    it('丸め処理を適用できる', () => {
      const cable = cableManager.addDetailedCable(
        device1.id,
        device2.id,
        [],
        'Cable-1',
        deviceManager,
        10
      );

      cableManager.applySettings({ marginRate: 10, roundingMode: true });

      expect(cable.roundedLength).toBe(35); // 33m → 35m（5m刻み）
    });
  });

  describe('簡易配線作成', () => {
    it('長さ指定で配線を作成できる', () => {
      const cable = cableManager.addSimpleCable(
        device1.id,
        device2.id,
        15.5,
        'Cable-3',
        deviceManager
      );

      expect(cable.mode).toBe('simple');
      expect(cable.manualLength).toBe(15.5);
      expect(cable.lengthM).toBe(15.5);
      expect(cable.lineStyle).toBe(CONSTANTS.LINE_STYLE.DASHED);
    });

    it('余裕率と丸めを適用できる', () => {
      const cable = cableManager.addSimpleCable(
        device1.id,
        device2.id,
        15.5,
        'Cable-3',
        deviceManager
      );

      cableManager.applySettings({ marginRate: 10, roundingMode: true });

      expect(cable.lengthWithMargin).toBeCloseTo(17.05, 1); // 15.5 * 1.1
      expect(cable.roundedLength).toBe(20); // 17.05 → 20m（5m刻み）
    });
  });

  describe('配線削除', () => {
    it('IDで配線を削除できる', () => {
      const cable = cableManager.addDetailedCable(
        device1.id,
        device2.id,
        [],
        'Cable-1',
        deviceManager,
        10
      );

      const result = cableManager.removeCable(cable.id);
      expect(result).toBe(true);
      expect(cableManager.getCableById(cable.id)).toBeUndefined();
    });

    it('存在しないIDの場合はfalseを返す', () => {
      const result = cableManager.removeCable('invalid-id');
      expect(result).toBe(false);
    });
  });

  describe('機器に関連する配線削除', () => {
    it('指定機器に接続された配線を全て削除できる', () => {
      cableManager.addDetailedCable(device1.id, device2.id, [], 'Cable-1', deviceManager, 10);
      cableManager.addDetailedCable(device1.id, device3.id, [], 'Cable-2', deviceManager, 10);
      cableManager.addDetailedCable(device2.id, device3.id, [], 'Cable-3', deviceManager, 10);

      const removed = cableManager.removeCablesByDevice(device1.id);
      expect(removed).toBe(2);
      expect(cableManager.getAllCables()).toHaveLength(1);
    });
  });

  describe('集計', () => {
    it('ケーブル長別の本数を集計できる', () => {
      // 丸めなし
      cableManager.addSimpleCable(device1.id, device2.id, 5, 'C1', deviceManager);
      cableManager.addSimpleCable(device1.id, device3.id, 5, 'C2', deviceManager);
      cableManager.addSimpleCable(device2.id, device3.id, 10, 'C3', deviceManager);

      cableManager.applySettings({ marginRate: 0, roundingMode: false });

      const summary = cableManager.getSummary();

      expect(summary['5']).toBe(2);
      expect(summary['10']).toBe(1);
    });

    it('丸めありの場合は丸め後の長さで集計する', () => {
      cableManager.addSimpleCable(device1.id, device2.id, 1.5, 'C1', deviceManager);
      cableManager.addSimpleCable(device1.id, device3.id, 2.5, 'C2', deviceManager);
      cableManager.addSimpleCable(device2.id, device3.id, 7, 'C3', deviceManager);

      cableManager.applySettings({ marginRate: 0, roundingMode: true });

      const summary = cableManager.getSummary();

      expect(summary['2']).toBe(1); // 1.5 → 2
      expect(summary['3']).toBe(1); // 2.5 → 3
      expect(summary['10']).toBe(1); // 7 → 10
    });
  });

  describe('設定変更時の再計算', () => {
    it('余裕率変更時に全配線を再計算する', () => {
      const cable = cableManager.addSimpleCable(device1.id, device2.id, 10, 'C1', deviceManager);

      cableManager.applySettings({ marginRate: 20, roundingMode: false });
      expect(cable.lengthWithMargin).toBe(12); // 10 * 1.2
    });

    it('丸めモード変更時に全配線を再計算する', () => {
      const cable = cableManager.addSimpleCable(device1.id, device2.id, 7.5, 'C1', deviceManager);

      cableManager.applySettings({ marginRate: 0, roundingMode: false });
      expect(cable.roundedLength).toBeUndefined();

      cableManager.applySettings({ marginRate: 0, roundingMode: true });
      expect(cable.roundedLength).toBe(10);
    });
  });

  describe('配線取得', () => {
    it('全配線を取得できる', () => {
      cableManager.addDetailedCable(device1.id, device2.id, [], 'C1', deviceManager, 10);
      cableManager.addSimpleCable(device2.id, device3.id, 5, 'C2', deviceManager);

      const cables = cableManager.getAllCables();
      expect(cables).toHaveLength(2);
    });

    it('モード別の配線数を取得できる', () => {
      cableManager.addDetailedCable(device1.id, device2.id, [], 'C1', deviceManager, 10);
      cableManager.addDetailedCable(device1.id, device3.id, [], 'C2', deviceManager, 10);
      cableManager.addSimpleCable(device2.id, device3.id, 5, 'C3', deviceManager);

      const stats = cableManager.getCableStats();
      expect(stats.detailed).toBe(2);
      expect(stats.simple).toBe(1);
      expect(stats.total).toBe(3);
    });
  });
});
