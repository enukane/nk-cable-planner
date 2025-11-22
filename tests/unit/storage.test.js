import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '../../js/storage.js';

describe('ストレージ管理', () => {
  let storageManager;

  beforeEach(() => {
    storageManager = new StorageManager();
    localStorage.clear();
  });

  describe('ローカルストレージ保存', () => {
    it('データを保存できる', () => {
      const data = {
        version: '1.0',
        devices: [],
        cables: [],
        settings: {}
      };

      storageManager.saveToLocal(data);

      const saved = localStorage.getItem('cableProjectData');
      expect(saved).toBeDefined();
      expect(JSON.parse(saved)).toEqual(data);
    });

    it('上書き保存できる', () => {
      const data1 = { version: '1.0', devices: [] };
      const data2 = { version: '1.0', devices: [{ id: '1' }] };

      storageManager.saveToLocal(data1);
      storageManager.saveToLocal(data2);

      const saved = localStorage.getItem('cableProjectData');
      expect(JSON.parse(saved)).toEqual(data2);
    });
  });

  describe('ローカルストレージ読込', () => {
    it('保存したデータを読み込める', () => {
      const data = {
        version: '1.0',
        devices: [{ id: '1', type: 'router' }],
        cables: []
      };

      localStorage.setItem('cableProjectData', JSON.stringify(data));

      const loaded = storageManager.loadFromLocal();
      expect(loaded).toEqual(data);
    });

    it('データがない場合はnullを返す', () => {
      const loaded = storageManager.loadFromLocal();
      expect(loaded).toBeNull();
    });

    it('不正なJSONの場合はnullを返す', () => {
      localStorage.setItem('cableProjectData', 'invalid json');

      const loaded = storageManager.loadFromLocal();
      expect(loaded).toBeNull();
    });
  });

  describe('ローカルストレージクリア', () => {
    it('保存したデータをクリアできる', () => {
      const data = { version: '1.0' };
      storageManager.saveToLocal(data);

      storageManager.clearLocal();

      const loaded = storageManager.loadFromLocal();
      expect(loaded).toBeNull();
    });
  });

  describe('ファイル名生成', () => {
    it('プロジェクトファイル名を生成できる', () => {
      const date = new Date('2025-01-15T14:30:45');
      const filename = storageManager.generateProjectFilename(date);

      expect(filename).toBe('project_20250115_143045.json');
    });

    it('スクリーンショットファイル名を生成できる', () => {
      const date = new Date('2025-01-15T14:30:45');
      const filename = storageManager.generateScreenshotFilename(date);

      expect(filename).toBe('cable_layout_20250115_143045.png');
    });

    it('日付を省略すると現在時刻を使用する', () => {
      const filename = storageManager.generateProjectFilename();

      expect(filename).toMatch(/^project_\d{8}_\d{6}\.json$/);
    });
  });

  describe('JSONエクスポート', () => {
    it('JSONデータをBlobに変換できる', () => {
      const data = { version: '1.0', devices: [] };
      const blob = storageManager.createJsonBlob(data);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });
  });

  describe('CSVエクスポート', () => {
    it('配線リストCSVを生成できる', () => {
      const cables = [
        {
          name: 'Cable-1',
          mode: 'detailed',
          fromDeviceId: 'd1',
          toDeviceId: 'd2',
          lengthM: 5.2,
          lengthWithMargin: 5.7,
          roundedLength: 10
        },
        {
          name: 'Cable-2',
          mode: 'simple',
          fromDeviceId: 'd2',
          toDeviceId: 'd3',
          lengthM: 3.0,
          lengthWithMargin: 3.3,
          roundedLength: 5
        }
      ];

      const devices = [
        { id: 'd1', name: 'Router-1' },
        { id: 'd2', name: 'SW-1' },
        { id: 'd3', name: 'PC-1' }
      ];

      const csv = storageManager.generateCablesCSV(cables, devices);

      expect(csv).toContain('Cable Name,Mode,From,To,Actual Length(m),With Margin(m),Rounded(m)');
      expect(csv).toContain('Cable-1,Detailed,Router-1,SW-1,5.2,5.7,10');
      expect(csv).toContain('Cable-2,Simple,SW-1,PC-1,3.0,3.3,5');
    });

    it('集計CSVを生成できる', () => {
      const summary = {
        '5': 3,
        '10': 2,
        '15': 1
      };

      const stats = {
        detailed: 4,
        simple: 2
      };

      const csv = storageManager.generateSummaryCSV(summary, stats);

      expect(csv).toContain('Summary');
      expect(csv).toContain('Cable Length,Quantity,Detailed,Simple');
      expect(csv).toContain('5m,3');
      expect(csv).toContain('10m,2');
      expect(csv).toContain('15m,1');
    });

    it('完全なCSVを生成できる', () => {
      const cables = [
        {
          name: 'C1',
          mode: 'detailed',
          fromDeviceId: 'd1',
          toDeviceId: 'd2',
          lengthM: 5,
          lengthWithMargin: 5.5,
          roundedLength: 10
        }
      ];

      const devices = [
        { id: 'd1', name: 'R1' },
        { id: 'd2', name: 'S1' }
      ];

      const summary = { '10': 1 };
      const stats = { detailed: 1, simple: 0 };

      const csv = storageManager.generateFullCSV(cables, devices, summary, stats);

      expect(csv).toContain('Cable List');
      expect(csv).toContain('Summary');
    });
  });

  describe('データURL生成', () => {
    it('BlobからオブジェクトURLを生成できる', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      // createObjectURLのモック
      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-id');

      const url = storageManager.createObjectURL(blob);

      expect(url).toBe('blob:http://localhost/test-id');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
    });
  });
});
