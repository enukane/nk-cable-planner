import { describe, it, expect } from 'vitest';
import {
  generateUUID,
  calculateDistance,
  applyRounding,
  formatDateTime
} from '../../js/utils.js';

describe('ユーティリティ関数', () => {
  describe('generateUUID', () => {
    it('UUID形式の文字列を生成する', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('毎回異なるUUIDを生成する', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('calculateDistance', () => {
    it('2点間の距離を正しく計算する（水平）', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 0 };
      expect(calculateDistance(p1, p2)).toBe(3);
    });

    it('2点間の距離を正しく計算する（垂直）', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 0, y: 4 };
      expect(calculateDistance(p1, p2)).toBe(4);
    });

    it('2点間の距離を正しく計算する（斜め）', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      expect(calculateDistance(p1, p2)).toBe(5);
    });

    it('同じ点の場合は0を返す', () => {
      const p1 = { x: 5, y: 5 };
      const p2 = { x: 5, y: 5 };
      expect(calculateDistance(p1, p2)).toBe(0);
    });
  });

  describe('applyRounding', () => {
    it('1m以下は1mに丸める', () => {
      expect(applyRounding(0.5)).toBe(1);
      expect(applyRounding(0.9)).toBe(1);
      expect(applyRounding(1.0)).toBe(1);
    });

    it('1m超〜2m以下は2mに丸める', () => {
      expect(applyRounding(1.1)).toBe(2);
      expect(applyRounding(1.5)).toBe(2);
      expect(applyRounding(2.0)).toBe(2);
    });

    it('2m超〜3m以下は3mに丸める', () => {
      expect(applyRounding(2.1)).toBe(3);
      expect(applyRounding(2.5)).toBe(3);
      expect(applyRounding(3.0)).toBe(3);
    });

    it('3m超は5m単位に切り上げる', () => {
      expect(applyRounding(3.1)).toBe(5);
      expect(applyRounding(3.5)).toBe(5);
      expect(applyRounding(5.0)).toBe(5);
      expect(applyRounding(5.1)).toBe(10);
      expect(applyRounding(7.3)).toBe(10);
      expect(applyRounding(10.0)).toBe(10);
      expect(applyRounding(12.1)).toBe(15);
    });
  });

  describe('formatDateTime', () => {
    it('日付を YYYYMMDD_HHMMSS 形式でフォーマットする', () => {
      const date = new Date('2025-01-15T14:30:45');
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/^\d{8}_\d{6}$/);
      expect(formatted).toBe('20250115_143045');
    });

    it('1桁の月日時分秒を0埋めする', () => {
      const date = new Date('2025-01-05T09:05:03');
      const formatted = formatDateTime(date);
      expect(formatted).toBe('20250105_090503');
    });
  });
});
