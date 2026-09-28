import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLearningSummary,
  getLegacyHours,
  loadTimerSession,
  readStudyLog,
  recordStudyInterval,
  recoverTimerCheckpoint,
  splitStudyInterval,
  STUDY_LOG_KEY,
} from './studyData.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('splits a study session by its local calendar dates', () => {
  const startedAt = new Date(2026, 8, 27, 23, 50).getTime();
  const endedAt = new Date(2026, 8, 28, 0, 10).getTime();
  const segments = splitStudyInterval(startedAt, endedAt);

  assert.equal(segments.length, 2);
  assert.equal(segments[0].durationMs, 10 * 60 * 1000);
  assert.equal(segments[1].durationMs, 10 * 60 * 1000);
  assert.notEqual(segments[0].studyDate, segments[1].studyDate);
});

test('compacts adjacent checkpoints and ignores a replayed interval', () => {
  const storage = createStorage();
  recordStudyInterval(storage, { contestId: 'abin', subjectCode: 'P', focusId: 'focus-1', startedAt: 1000, endedAt: 6000 });
  recordStudyInterval(storage, { contestId: 'abin', subjectCode: 'P', focusId: 'focus-1', startedAt: 6000, endedAt: 11000 });
  recordStudyInterval(storage, { contestId: 'abin', subjectCode: 'P', focusId: 'focus-1', startedAt: 6000, endedAt: 11000 });
  const log = readStudyLog(storage);

  assert.equal(log.length, 1);
  assert.equal(log[0].durationMs, 10000);
});

test('reports a failed storage write instead of a successful checkpoint', () => {
  const storage = {
    getItem: () => null,
    setItem: () => { throw new Error('storage full'); },
  };
  const result = recordStudyInterval(storage, {
    contestId: 'abin',
    subjectCode: 'P',
    focusId: 'focus-1',
    startedAt: 1000,
    endedAt: 6000,
  });

  assert.equal(result, null);
});

test('pauses a stale timer at its last heartbeat instead of counting offline time', () => {
  const recovery = recoverTimerCheckpoint({
    startedAt: 10000,
    lastHeartbeatAt: 10000,
    elapsedMs: 9000,
    creditedMs: 9000,
    focusId: 'focus-1',
  }, 30000);

  assert.equal(recovery.timer.startedAt, null);
  assert.equal(recovery.timer.elapsedMs, 9000);
  assert.equal(recovery.interruptedInterval, null);
});

test('preserves old totals separately from timestamped timer data', () => {
  const now = new Date(2026, 8, 28, 12).getTime();
  const storage = createStorage({
    'painel-concursos:abin:disciplinas': JSON.stringify([{ cod: 'P', nome: 'Português', feitas: 2 }]),
    [STUDY_LOG_KEY]: JSON.stringify([{
      id: 'focus-1:2026-09-28:1',
      focusId: 'focus-1',
      contestId: 'abin',
      subjectCode: 'P',
      studyDate: '2026-09-28',
      durationMs: 30 * 60 * 1000,
      startedAt: now - 30 * 60 * 1000,
      endedAt: now,
    }]),
  });

  const summary = buildLearningSummary(storage, {
    abin: { titulo: 'ABIN', disciplinas: [{ cod: 'P', nome: 'Português', feitas: 0 }] },
  }, now);

  assert.equal(summary.totalHours, 2.5);
  assert.equal(summary.legacyHours, 2);
  assert.equal(summary.recordedHours, 0.5);
  assert.equal(summary.week[6].hours, 0.5);
  assert.equal(summary.contests[0].subjects[0].hours, 2.5);
});

test('migrates an old paused timer without resuming its offline clock', () => {
  const storage = createStorage({
    'painel-concursos:abin:disciplinas': JSON.stringify([{ cod: 'P', nome: 'Português', feitas: 1 }]),
    'painel-concursos:abin:timer': JSON.stringify({ cod: 'P', elapsedMs: 3600000, startedAt: 10000 }),
  });
  const initialDisciplines = [{ cod: 'P', nome: 'Português', feitas: 0 }];
  const timer = loadTimerSession(storage, { contestId: 'abin', subjectCode: 'P', initialDisciplines, now: 999999999 });

  assert.equal(timer.startedAt, null);
  assert.equal(timer.elapsedMs, 0);
  assert.equal(getLegacyHours(storage, 'abin', initialDisciplines).P, 2);
});