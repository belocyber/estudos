import assert from 'node:assert/strict';
import test from 'node:test';
import {
  APP_DATA_PREFIX,
  mergeDataSnapshots,
  snapshotLocalData,
  SYNC_OWNER_KEY,
} from './localData.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    getItem: key => values.has(key) ? values.get(key) : null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test('cloud snapshot contains app state but excludes owner and sync metadata', () => {
  const storage = createStorage({
    [`${APP_DATA_PREFIX}abin:timer`]: JSON.stringify({ elapsedMs: 1000 }),
    [SYNC_OWNER_KEY]: 'user-1',
    [`${APP_DATA_PREFIX}sync-device:v1`]: 'device-1',
  });
  const snapshot = snapshotLocalData(storage);

  assert.deepEqual(Object.keys(snapshot), [`${APP_DATA_PREFIX}abin:timer`]);
  assert.equal(snapshot[`${APP_DATA_PREFIX}abin:timer`].value, JSON.stringify({ elapsedMs: 1000 }));
});

test('merges study days and session IDs across devices without duplicating data', () => {
  const key = `${APP_DATA_PREFIX}study-log:v1`;
+  const daysKey = `${APP_DATA_PREFIX}abin:study-days`;
+  const left = {
+    [daysKey]: { value: '["2026-09-27"]', updatedAt: 5, deviceId: 'a' },
+    [key]: { value: JSON.stringify([{ id: 'session-a', startedAt: 1, endedAt: 10, durationMs: 9 }]), updatedAt: 5, deviceId: 'a' },
+  };
+  const right = {
+    [daysKey]: { value: '["2026-09-28"]', updatedAt: 6, deviceId: 'b' },
+    [key]: { value: JSON.stringify([{ id: 'session-a', startedAt: 1, endedAt: 20, durationMs: 19 }, { id: 'session-b', startedAt: 21, endedAt: 30, durationMs: 9 }]), updatedAt: 6, deviceId: 'b' },
+  };
+
+  const merged = mergeDataSnapshots(left, right);
+  const sessions = JSON.parse(merged[key].value);
+  const days = JSON.parse(merged[daysKey].value);
+
+  assert.deepEqual(days, ['2026-09-27', '2026-09-28']);
+  assert.equal(sessions.length, 2);
+  assert.equal(sessions.find(session => session.id === 'session-a').durationMs, 19);
+});
+
+test('uses the newest device revision for ordinary preferences', () => {
+  const key = `${APP_DATA_PREFIX}abin:cargo`;
+  const merged = mergeDataSnapshots(
+    { [key]: { value: '"cargo-antigo"', updatedAt: 100, deviceId: 'device-a' } },
+    { [key]: { value: '"cargo-novo"', updatedAt: 200, deviceId: 'device-b' } },
+  );
+
+  assert.equal(merged[key].value, '"cargo-novo"');
+});
