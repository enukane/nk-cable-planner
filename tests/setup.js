import { beforeAll, afterEach } from 'vitest';

// Canvas APIのモック
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect: () => {},
    strokeRect: () => {},
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    drawImage: () => {},
    fillText: () => {},
    strokeText: () => {},
    measureText: () => ({ width: 0 }),
    save: () => {},
    restore: () => {},
    scale: () => {},
    translate: () => {},
    rotate: () => {},
    setLineDash: () => {},
    getLineDash: () => [],
    createLinearGradient: () => ({
      addColorStop: () => {}
    }),
    createRadialGradient: () => ({
      addColorStop: () => {}
    })
  });

  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,fake';

  // Image のモック
  global.Image = class {
    constructor() {
      setTimeout(() => {
        this.onload && this.onload();
      }, 0);
    }
  };
});

// 各テスト後にクリーンアップ
afterEach(() => {
  // DOMが存在する場合のみクリーンアップ
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});
