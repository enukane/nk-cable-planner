/**
 * UUIDを生成する
 * @returns {string} UUID文字列
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 2点間の距離を計算する
 * @param {Object} p1 - 始点 {x, y}
 * @param {Object} p2 - 終点 {x, y}
 * @returns {number} 距離
 */
export function calculateDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * ケーブル長を規定の単位に丸める
 * - 1m以下 → 1m
 * - 1m超〜2m以下 → 2m
 * - 2m超〜3m以下 → 3m
 * - 3m超 → 5m単位に切り上げ
 * @param {number} length - 長さ(m)
 * @returns {number} 丸めた長さ(m)
 */
export function applyRounding(length) {
  if (length <= 1) return 1;
  if (length <= 2) return 2;
  if (length <= 3) return 3;
  // 3m超過は5m単位に切り上げ
  return Math.ceil(length / 5) * 5;
}

/**
 * 日付をYYYYMMDD_HHMMSS形式でフォーマットする
 * @param {Date} date - 日付オブジェクト
 * @returns {string} フォーマットされた日付文字列
 */
export function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * ポイントを直交（縦横）に制約する
 * 最後のwaypointまたは始点から、現在位置までの縦横の差を比較し、
 * 大きい方向に沿ったポイントを返す
 * @param {Object} fromPoint - 始点 {x, y}
 * @param {Object} toPoint - 終点（マウス位置など） {x, y}
 * @returns {Object} 制約されたポイント {x, y}
 */
export function constrainToOrthogonal(fromPoint, toPoint) {
  const dx = Math.abs(toPoint.x - fromPoint.x);
  const dy = Math.abs(toPoint.y - fromPoint.y);

  if (dx > dy) {
    // 横方向の方が大きい場合、Y座標を固定
    return { x: toPoint.x, y: fromPoint.y };
  } else {
    // 縦方向の方が大きい場合、X座標を固定
    return { x: fromPoint.x, y: toPoint.y };
  }
}
