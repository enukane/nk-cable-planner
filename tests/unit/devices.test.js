import { describe, it, expect, beforeEach } from 'vitest';
import { DeviceManager } from '../../js/devices.js';
import { CONSTANTS } from '../../js/constants.js';

describe('機器管理', () => {
  let deviceManager;

  beforeEach(() => {
    deviceManager = new DeviceManager();
  });

  describe('機器追加', () => {
    it('ルータを追加できる', () => {
      const device = deviceManager.addDevice('router', 100, 200);
      expect(device).toBeDefined();
      expect(device.type).toBe('router');
      expect(device.x).toBe(100);
      expect(device.y).toBe(200);
      expect(device.name).toBe('Router-1');
      expect(device.id).toBeDefined();
    });

    it('PoE SWを追加できる', () => {
      const device = deviceManager.addDevice('poe_sw', 150, 250);
      expect(device.type).toBe('poe_sw');
      expect(device.name).toBe('SW-1');
    });

    it('APを追加できる', () => {
      const device = deviceManager.addDevice('ap', 200, 300);
      expect(device.type).toBe('ap');
      expect(device.name).toBe('AP-1');
    });

    it('PCを追加できる', () => {
      const device = deviceManager.addDevice('pc', 250, 350);
      expect(device.type).toBe('pc');
      expect(device.name).toBe('PC-1');
    });

    it('カスタム名を指定できる', () => {
      const device = deviceManager.addDevice('router', 100, 200, 'MainRouter');
      expect(device.name).toBe('MainRouter');
    });

    it('デフォルトカラーが設定される', () => {
      const router = deviceManager.addDevice('router', 100, 200);
      expect(router.color).toBe(CONSTANTS.DEVICE_COLORS.router);

      const pc = deviceManager.addDevice('pc', 250, 350);
      expect(pc.color).toBe(CONSTANTS.DEVICE_COLORS.pc);
    });
  });

  describe('機器名自動生成', () => {
    it('Router-1, Router-2, ... と連番を生成する', () => {
      const r1 = deviceManager.addDevice('router', 100, 200);
      const r2 = deviceManager.addDevice('router', 150, 250);
      const r3 = deviceManager.addDevice('router', 200, 300);

      expect(r1.name).toBe('Router-1');
      expect(r2.name).toBe('Router-2');
      expect(r3.name).toBe('Router-3');
    });

    it('SW-1, SW-2, ... と連番を生成する', () => {
      const s1 = deviceManager.addDevice('poe_sw', 100, 200);
      const s2 = deviceManager.addDevice('poe_sw', 150, 250);

      expect(s1.name).toBe('SW-1');
      expect(s2.name).toBe('SW-2');
    });

    it('AP-1, AP-2, ... と連番を生成する', () => {
      const a1 = deviceManager.addDevice('ap', 100, 200);
      const a2 = deviceManager.addDevice('ap', 150, 250);

      expect(a1.name).toBe('AP-1');
      expect(a2.name).toBe('AP-2');
    });

    it('PC-1, PC-2, ... と連番を生成する', () => {
      const p1 = deviceManager.addDevice('pc', 100, 200);
      const p2 = deviceManager.addDevice('pc', 150, 250);

      expect(p1.name).toBe('PC-1');
      expect(p2.name).toBe('PC-2');
    });
  });

  describe('機器取得', () => {
    it('IDで機器を取得できる', () => {
      const device = deviceManager.addDevice('router', 100, 200);
      const found = deviceManager.getDeviceById(device.id);
      expect(found).toBe(device);
    });

    it('存在しないIDの場合はundefinedを返す', () => {
      const found = deviceManager.getDeviceById('invalid-id');
      expect(found).toBeUndefined();
    });

    it('全機器のリストを取得できる', () => {
      deviceManager.addDevice('router', 100, 200);
      deviceManager.addDevice('poe_sw', 150, 250);
      deviceManager.addDevice('pc', 200, 300);

      const devices = deviceManager.getAllDevices();
      expect(devices).toHaveLength(3);
    });
  });

  describe('機器削除', () => {
    it('IDで機器を削除できる', () => {
      const device = deviceManager.addDevice('router', 100, 200);
      const result = deviceManager.removeDevice(device.id);

      expect(result).toBe(true);
      expect(deviceManager.getDeviceById(device.id)).toBeUndefined();
    });

    it('存在しないIDの場合はfalseを返す', () => {
      const result = deviceManager.removeDevice('invalid-id');
      expect(result).toBe(false);
    });
  });

  describe('機器移動', () => {
    it('機器の座標を更新できる', () => {
      const device = deviceManager.addDevice('router', 100, 200);
      const result = deviceManager.moveDevice(device.id, 300, 400);

      expect(result).toBe(true);
      expect(device.x).toBe(300);
      expect(device.y).toBe(400);
    });

    it('存在しないIDの場合はfalseを返す', () => {
      const result = deviceManager.moveDevice('invalid-id', 300, 400);
      expect(result).toBe(false);
    });
  });

  describe('機器名更新', () => {
    it('機器名を更新できる', () => {
      const device = deviceManager.addDevice('router', 100, 200);
      const result = deviceManager.updateDeviceName(device.id, 'NewName');

      expect(result).toBe(true);
      expect(device.name).toBe('NewName');
    });
  });

  describe('座標による機器検索', () => {
    it('指定座標付近の機器を検出できる', () => {
      const device = deviceManager.addDevice('router', 100, 200);
      const found = deviceManager.getDeviceAtPosition(105, 205, 15);

      expect(found).toBe(device);
    });

    it('範囲外の場合はnullを返す', () => {
      deviceManager.addDevice('router', 100, 200);
      const found = deviceManager.getDeviceAtPosition(200, 300, 15);

      expect(found).toBeNull();
    });
  });
});
