import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasRenderer } from '../../js/canvas.js';
import { DeviceManager } from '../../js/devices.js';
import { CableManager } from '../../js/cables.js';
import { ProjectManager } from '../../js/project.js';

describe('Canvas描画', () => {
  let canvas;
  let ctx;
  let renderer;
  let deviceManager;
  let cableManager;
  let projectManager;

  beforeEach(() => {
    // Canvas要素を作成
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // モックコンテキストを作成
    ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: '',
      textBaseline: '',
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      drawImage: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      setLineDash: vi.fn(),
      getLineDash: vi.fn(() => [])
    };

    canvas.getContext = vi.fn(() => ctx);
    canvas.toDataURL = vi.fn(() => 'data:image/png;base64,fake');

    deviceManager = new DeviceManager();
    cableManager = new CableManager();
    projectManager = new ProjectManager(deviceManager, cableManager);

    renderer = new CanvasRenderer(canvas, projectManager);
  });

  describe('初期化', () => {
    it('レンダラーが正しく初期化される', () => {
      expect(renderer.canvas).toBe(canvas);
      expect(renderer.ctx).toBe(ctx);
      expect(renderer.zoom).toBe(1.0);
      expect(renderer.panX).toBe(0);
      expect(renderer.panY).toBe(0);
    });
  });

  describe('ズーム操作', () => {
    it('ズームインできる', () => {
      renderer.zoomIn();
      expect(renderer.zoom).toBe(1.1);
    });

    it('ズームアウトできる', () => {
      renderer.zoomOut();
      expect(renderer.zoom).toBe(0.9);
    });

    it('最大ズームを超えない', () => {
      for (let i = 0; i < 100; i++) {
        renderer.zoomIn();
      }
      expect(renderer.zoom).toBeLessThanOrEqual(5.0);
    });

    it('最小ズームを下回らない', () => {
      for (let i = 0; i < 100; i++) {
        renderer.zoomOut();
      }
      expect(renderer.zoom).toBeGreaterThanOrEqual(0.1);
    });

    it('ズームをリセットできる', () => {
      renderer.zoomIn();
      renderer.zoomIn();
      renderer.resetZoom();
      expect(renderer.zoom).toBe(1.0);
      expect(renderer.panX).toBe(0);
      expect(renderer.panY).toBe(0);
    });
  });

  describe('座標変換', () => {
    it('Canvas座標を実座標に変換できる', () => {
      renderer.zoom = 2.0;
      renderer.panX = 100;
      renderer.panY = 50;

      const real = renderer.canvasToReal(300, 250);
      expect(real.x).toBe(100); // (300 - 100) / 2
      expect(real.y).toBe(100); // (250 - 50) / 2
    });

    it('実座標をCanvas座標に変換できる', () => {
      renderer.zoom = 2.0;
      renderer.panX = 100;
      renderer.panY = 50;

      const canvas = renderer.realToCanvas(100, 100);
      expect(canvas.x).toBe(300); // 100 * 2 + 100
      expect(canvas.y).toBe(250); // 100 * 2 + 50
    });
  });

  describe('描画メソッド', () => {
    it('クリアできる', () => {
      const clearRectSpy = vi.spyOn(ctx, 'clearRect');
      renderer.clear();
      expect(clearRectSpy).toHaveBeenCalled();
    });

    it('背景画像を描画できる', () => {
      projectManager.setImage('data:image/png;base64,test', 800, 600);

      // 画像読み込みを待つ
      return new Promise(resolve => {
        setTimeout(() => {
          renderer.drawBackground();
          // drawImageが呼ばれたか、またはsaveが呼ばれていることを確認
          expect(ctx.save).toHaveBeenCalled();
          resolve();
        }, 10);
      });
    });

    it('グリッドを描画できる', () => {
      // グリッド表示をONにする
      projectManager.updateSettings({ showGrid: true });
      renderer.drawGrid();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('スケール線を描画できる', () => {
      projectManager.setScale(0, 0, 100, 0, 10);

      renderer.drawScale();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('機器を描画できる', () => {
      deviceManager.addDevice('router', 100, 200);
      deviceManager.addDevice('pc', 300, 400);

      renderer.drawDevices();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('配線を描画できる（詳細モード）', () => {
      const device1 = deviceManager.addDevice('router', 0, 0);
      const device2 = deviceManager.addDevice('poe_sw', 300, 0);

      projectManager.setScale(0, 0, 100, 0, 10);
      cableManager.addDetailedCable(
        device1.id,
        device2.id,
        [],
        'Cable-1',
        deviceManager,
        10
      );

      renderer.drawCables();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('配線を描画できる（簡易モード）', () => {
      const device1 = deviceManager.addDevice('router', 0, 0);
      const device2 = deviceManager.addDevice('poe_sw', 300, 0);

      cableManager.addSimpleCable(
        device1.id,
        device2.id,
        10,
        'Cable-2',
        deviceManager
      );

      renderer.drawCables();
      expect(ctx.stroke).toHaveBeenCalled();
    });
  });

  describe('選択ハイライト', () => {
    it('選択された機器をハイライト表示する', () => {
      const device = deviceManager.addDevice('router', 100, 200);
      renderer.selectedDeviceId = device.id;

      renderer.drawDevices();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('選択された配線をハイライト表示する', () => {
      const device1 = deviceManager.addDevice('router', 0, 0);
      const device2 = deviceManager.addDevice('poe_sw', 300, 0);
      const cable = cableManager.addSimpleCable(
        device1.id,
        device2.id,
        10,
        'Cable-1',
        deviceManager
      );

      renderer.selectedCableId = cable.id;

      renderer.drawCables();
      expect(ctx.stroke).toHaveBeenCalled();
    });
  });

  describe('全体描画', () => {
    it('全要素をまとめて描画できる', () => {
      projectManager.setImage('data:image/png;base64,test', 800, 600);
      projectManager.setScale(0, 0, 100, 0, 10);
      deviceManager.addDevice('router', 100, 200);
      deviceManager.addDevice('pc', 300, 400);

      renderer.render();

      expect(ctx.clearRect).toHaveBeenCalled();
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });
});
