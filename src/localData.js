export const APP_DATA_PREFIX = 'painel-concursos:';
export const SYNC_OWNER_KEY = `${APP_DATA_PREFIX}sync-owner:v1`;
const SYNC_REVISIONS_KEY = `${APP_DATA_PREFIX}sync-revisions:v1`;
const DEVICE_ID_KEY = `${APP_DATA_PREFIX}sync-device:v1`;
export const LOCAL_DATA_CHANGED_EVENT = 'panel-local-data-changed';

function isInternalSyncKey(key) {
  return key === SYNC_OWNER_KEY || key === SYNC_REVISIONS_KEY || key === DEVICE_ID_KEY;
}

export function writeAppLocalValue(storage, key, value) {
  storage.setItem(key, value);
  if (!key.startsWith(APP_DATA_PREFIX) || isInternalSyncKey(key) || typeof window === 'undefined' || storage !== window.localStorage) return;

  const revisions = readJson(storage, SYNC_REVISIONS_KEY, {});
  revisions[key] = { updatedAt: Date.now(), deviceId: getDeviceId(storage) };
  storage.setItem(SYNC_REVISIONS_KEY, JSON.stringify(revisions));
  window.dispatchEvent(new CustomEvent(LOCAL_DATA_CHANGED_EVENT));
}

export function getDeviceId(storage) {
  let deviceId = storage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    storage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function snapshotLocalData(storage) {
  const revisions = readJson(storage, SYNC_REVISIONS_KEY, {});
  const deviceId = getDeviceId(storage);
  const records = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(APP_DATA_PREFIX) || isInternalSyncKey(key)) continue;
    records[key] = {
      value: storage.getItem(key),
      updatedAt: Number(revisions[key]?.updatedAt) || 0,
      deviceId: revisions[key]?.deviceId || deviceId,
    };
  }
  return records;
}

export function mergeDataSnapshots(left = {}, right = {}) {
  const merged = {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    const local = left[key];
    const remote = right[key];
    if (!local) {
      merged[key] = remote;
    } else if (!remote) {
      merged[key] = local;
    } else if (key.endsWith(':study-days')) {
      const days = new Set([...parseArray(local.value), ...parseArray(remote.value)]);
      merged[key] = { ...newerRecord(local, remote), value: JSON.stringify([...days].sort()) };
    } else if (key === `${APP_DATA_PREFIX}study-log:v1`) {
      merged[key] = mergeStudyLogs(local, remote);
    } else {
      merged[key] = newerRecord(local, remote);
    }
  }
  return merged;
}

export function applyDataSnapshot(storage, snapshot, ownerUid) {
  const keysToRemove = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(APP_DATA_PREFIX) && !isInternalSyncKey(key) && !snapshot[key]) keysToRemove.push(key);
  }
  keysToRemove.forEach(key => storage.removeItem(key));

  const revisions = {};
  for (const [key, record] of Object.entries(snapshot)) {
    storage.setItem(key, record.value);
    revisions[key] = { updatedAt: Number(record.updatedAt) || 0, deviceId: record.deviceId || '' };
  }
  storage.setItem(SYNC_REVISIONS_KEY, JSON.stringify(revisions));
  storage.setItem(SYNC_OWNER_KEY, ownerUid);
}

export function snapshotsEqual(left = {}, right = {}) {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key, index) => key === rightKeys[index]
    && left[key].value === right[key].value
    && Number(left[key].updatedAt) === Number(right[key].updatedAt)
    && left[key].deviceId === right[key].deviceId);
}

function mergeStudyLogs(localRecord, remoteRecord) {
  const entries = new Map();
  for (const entry of [...parseArray(localRecord.value), ...parseArray(remoteRecord.value)]) {
    const previous = entries.get(entry.id);
    if (!previous || Number(entry.endedAt) > Number(previous.endedAt)) entries.set(entry.id, entry);
  }
  return {
    ...newerRecord(localRecord, remoteRecord),
    value: JSON.stringify([...entries.values()].sort((a, b) => a.startedAt - b.startedAt)),
  };
}

function newerRecord(left, right) {
  const leftRevision = Number(left.updatedAt) || 0;
  const rightRevision = Number(right.updatedAt) || 0;
  if (leftRevision !== rightRevision) return leftRevision > rightRevision ? left : right;
  return String(left.deviceId || '') >= String(right.deviceId || '') ? left : right;
}

function parseArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readJson(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}
