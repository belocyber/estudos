import { onValue, ref, serverTimestamp, set, update } from 'firebase/database';
import { database } from './firebaseClient.js';
import {
  applyDataSnapshot,
  LOCAL_DATA_CHANGED_EVENT,
  mergeDataSnapshots,
  snapshotLocalData,
  snapshotsEqual,
  SYNC_OWNER_KEY,
} from './localData.js';

const APP_DATA_CHILD = 'appData';
const SAVE_DEBOUNCE_MS = 400;

export function subscribeAccountSync(user, username, onStatus, onUsername) {
  const appDataRef = ref(database, `users/${user.uid}/${APP_DATA_CHILD}`);
  const profileRef = ref(database, `users/${user.uid}/profile`);
  let initialized = false;
  let disposed = false;
  let cloudSnapshot = {};
  let saveTimer = null;

  const updateStatus = status => {
    if (!disposed) onStatus(status);
  };

  const flushLocalChanges = () => {
    if (!initialized || disposed) return;
    const localSnapshot = snapshotLocalData(window.localStorage);
    const merged = mergeDataSnapshots(cloudSnapshot, localSnapshot);
    if (snapshotsEqual(merged, cloudSnapshot)) return;
    cloudSnapshot = merged;
    updateStatus('saving');
    set(appDataRef, merged)
      .then(() => updateStatus('synced'))
      .catch(() => updateStatus('error'));
  };

  const queueLocalSave = () => {
    if (!initialized || disposed) return;
    window.clearTimeout(saveTimer);
    updateStatus('saving');
    saveTimer = window.setTimeout(flushLocalChanges, SAVE_DEBOUNCE_MS);
  };

  updateStatus('connecting');
  const unsubscribeData = onValue(appDataRef, snapshot => {
    if (disposed) return;
    const remoteSnapshot = snapshot.val() || {};
    if (!initialized) {
      const previousOwner = window.localStorage.getItem(SYNC_OWNER_KEY);
      const sameLocalOwner = previousOwner === user.uid;
      const localSnapshot = sameLocalOwner || !previousOwner ? snapshotLocalData(window.localStorage) : {};
      cloudSnapshot = mergeDataSnapshots(remoteSnapshot, localSnapshot);
      applyDataSnapshot(window.localStorage, cloudSnapshot, user.uid);
      initialized = true;
      if (!snapshotsEqual(cloudSnapshot, remoteSnapshot)) {
        updateStatus('saving');
        set(appDataRef, cloudSnapshot)
          .then(() => updateStatus('synced'))
          .catch(() => updateStatus('error'));
      } else {
        updateStatus('synced');
      }
      return;
    }

    const localSnapshot = snapshotLocalData(window.localStorage);
    const merged = mergeDataSnapshots(remoteSnapshot, localSnapshot);
    cloudSnapshot = merged;
    if (!snapshotsEqual(localSnapshot, merged)) applyDataSnapshot(window.localStorage, merged, user.uid);
    if (!snapshotsEqual(remoteSnapshot, merged)) {
      updateStatus('saving');
      set(appDataRef, merged)
        .then(() => updateStatus('synced'))
        .catch(() => updateStatus('error'));
    } else {
      updateStatus('synced');
    }
  }, () => updateStatus('offline'));

  const unsubscribeProfile = onValue(profileRef, snapshot => {
    const profile = snapshot.val();
    if (profile?.username) onUsername(profile.username);
    if (!profile?.username && username) {
      update(profileRef, { username, updatedAt: serverTimestamp() }).catch(() => updateStatus('error'));
    }
  }, () => updateStatus('offline'));

  window.addEventListener(LOCAL_DATA_CHANGED_EVENT, queueLocalSave);
  const handleStorageEvent = event => {
    if (event.key?.startsWith('painel-concursos:')) queueLocalSave();
  };
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    disposed = true;
    window.clearTimeout(saveTimer);
    unsubscribeData();
    unsubscribeProfile();
    window.removeEventListener(LOCAL_DATA_CHANGED_EVENT, queueLocalSave);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
