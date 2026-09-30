import { onValue, ref, serverTimestamp, set } from 'firebase/database';
import { database } from './firebaseClient.js';

const RANKING_PATH = 'ranking/global';
const RANKING_LIMIT = 100;

/**
 * Publishes this user's chronometer study hours to the global ranking.
 * Only timer-recorded hours count (cheat-proof — cannot be manually edited).
 * @param {string} uid - Firebase user UID
 * @param {string} username - Display username
 * @param {number} totalHours - Hours recorded ONLY by the chronometer
 * @param {number} currentStreak - Current study streak in days
 * @param {number} studyDays - Total study days
 */
export async function publishRankingEntry(uid, username, totalHours, currentStreak, studyDays) {
  if (!uid || !username) return;
  const entryRef = ref(database, `${RANKING_PATH}/${uid}`);
  await set(entryRef, {
    username,
    totalHours,
    currentStreak,
    studyDays,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Subscribes to the global ranking, returning an unsubscribe function.
 * @param {(entries: RankingEntry[]) => void} onEntries
 * @returns {() => void} unsubscribe
 */
export function subscribeGlobalRanking(onEntries) {
  const rankingRef = ref(database, RANKING_PATH);
  const unsubscribe = onValue(
    rankingRef,
    snapshot => {
      const data = snapshot.val() || {};
      const entries = Object.entries(data)
        .map(([uid, entry]) => ({ 
          uid, 
          username: entry.username,
          totalHours: entry.totalHours || entry.timedHours || 0,
          currentStreak: entry.currentStreak || 0,
          studyDays: entry.studyDays || 0
        }))
        .filter(entry => entry.username)
        .sort((a, b) => b.totalHours - a.totalHours || b.currentStreak - a.currentStreak)
        .slice(0, RANKING_LIMIT);
      onEntries(entries);
    },
    () => onEntries([]),
  );
  return unsubscribe;
}
