export const STUDY_LOG_KEY = 'painel-concursos:study-log:v1';
export const HEARTBEAT_INTERVAL_MS = 5000;
export const HEARTBEAT_STALE_MS = 15000;

const CONTESTS_WITH_VERSIONED_STORAGE = ['prf', 'atamf', 'civil', 'esfcex'];

export function getContestStorageScope(contestId) {
  const version = CONTESTS_WITH_VERSIONED_STORAGE.includes(contestId) ? ':v2' : '';
  return `painel-concursos:${contestId}${version}`;
}

export function getStudyDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function readStoredJson(storage, key, fallback) {
  try {
    const stored = storage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch {
    return fallback;
  }
}

export function getLegacyHours(storage, contestId, initialDisciplines) {
  const scope = getContestStorageScope(contestId);
  const key = `${scope}:legacy-hours:v1`;
  const existing = readStoredJson(storage, key, null);
  if (existing && typeof existing === 'object' && !Array.isArray(existing)) return existing;

  const baseline = readLegacyHours(storage, contestId, initialDisciplines);
  try {
    storage.setItem(key, JSON.stringify(baseline));
  } catch {
    return baseline;
  }
  return baseline;
}

export function readLegacyHours(storage, contestId, initialDisciplines) {
  const scope = getContestStorageScope(contestId);
  const existing = readStoredJson(storage, `${scope}:legacy-hours:v1`, null);
  if (existing && typeof existing === 'object' && !Array.isArray(existing)) return existing;

  const disciplines = readStoredJson(storage, `${scope}:disciplinas`, initialDisciplines);
  return Object.fromEntries(disciplines.map(discipline => [discipline.cod, Number(discipline.feitas) || 0]));
}

export function loadTimerSession(storage, { contestId, subjectCode, initialDisciplines, now = Date.now() }) {
  const scope = getContestStorageScope(contestId);
  const timerKey = `${scope}:timer`;
  const timer = readStoredJson(storage, timerKey, null);
  const emptySession = { cod: subjectCode, elapsedMs: 0, creditedMs: 0, startedAt: null, lastHeartbeatAt: null, focusId: null };
  if (!timer) return emptySession;

  if (!timer.focusId) {
    const knownElapsedMs = Math.max(0, Number(timer.elapsedMs) || 0);
    if (knownElapsedMs > 0) {
      const baseline = getLegacyHours(storage, contestId, initialDisciplines);
      baseline[timer.cod || subjectCode] = (Number(baseline[timer.cod || subjectCode]) || 0) + knownElapsedMs / 3600000;
      try {
        storage.setItem(`${scope}:legacy-hours:v1`, JSON.stringify(baseline));
      } catch {
        return emptySession;
      }
    }
    try {
      storage.setItem(timerKey, JSON.stringify(emptySession));
    } catch {
      return emptySession;
    }
    return emptySession;
  }

  const recovery = recoverTimerCheckpoint(timer, now);
  if (recovery.interruptedInterval) {
    const savedLog = recordStudyInterval(storage, {
      contestId,
      subjectCode: timer.cod || subjectCode,
      focusId: timer.focusId,
      ...recovery.interruptedInterval,
    });
    if (!savedLog) return timer;
    const dateKeys = splitStudyInterval(recovery.interruptedInterval.startedAt, recovery.interruptedInterval.endedAt)
      .map(segment => segment.studyDate);
    const days = readStoredJson(storage, `${scope}:study-days`, []);
    try {
      storage.setItem(`${scope}:study-days`, JSON.stringify([...new Set([...days, ...dateKeys])].sort()));
    } catch {
      return recovery.timer;
    }
  }
  try {
    storage.setItem(timerKey, JSON.stringify(recovery.timer));
  } catch {
    return recovery.timer;
  }
  return recovery.timer;
}

export function splitStudyInterval(startedAt, endedAt) {
  const start = Number(startedAt);
  const end = Number(endedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  const segments = [];
  let cursor = start;
  while (cursor < end) {
    const date = new Date(cursor);
    const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
    const segmentEnd = Math.min(end, nextDay);
    segments.push({
      studyDate: getStudyDateKey(date),
      startedAt: cursor,
      endedAt: segmentEnd,
      durationMs: segmentEnd - cursor,
    });
    cursor = segmentEnd;
  }
  return segments;
}

export function readStudyLog(storage) {
  const entries = readStoredJson(storage, STUDY_LOG_KEY, []);
  return Array.isArray(entries) ? entries : [];
}

export function recordStudyInterval(storage, { contestId, subjectCode, focusId, startedAt, endedAt }) {
  const segments = splitStudyInterval(startedAt, endedAt).map(segment => ({
    ...segment,
    id: `${focusId}:${segment.studyDate}:${segment.startedAt}`,
    contestId,
    subjectCode,
    focusId,
  }));
  if (!segments.length) return readStudyLog(storage);

  const log = readStudyLog(storage);
  const nextLog = log.map(entry => ({ ...entry }));
  for (const segment of segments) {
    const alreadyStored = nextLog.some(entry => entry.focusId === focusId
      && entry.studyDate === segment.studyDate
      && entry.subjectCode === subjectCode
      && entry.startedAt <= segment.startedAt
      && entry.endedAt >= segment.endedAt);
    if (alreadyStored) continue;

    let contiguousIndex = -1;
    for (let index = nextLog.length - 1; index >= 0; index -= 1) {
      const entry = nextLog[index];
      if (entry.focusId === focusId && entry.studyDate === segment.studyDate
        && entry.subjectCode === subjectCode && entry.endedAt === segment.startedAt) {
        contiguousIndex = index;
        break;
      }
    }

    if (contiguousIndex >= 0) {
      const previous = nextLog[contiguousIndex];
      nextLog[contiguousIndex] = {
        ...previous,
        endedAt: segment.endedAt,
        durationMs: previous.durationMs + segment.durationMs,
      };
    } else {
      nextLog.push(segment);
    }
  }
  nextLog.sort((a, b) => a.startedAt - b.startedAt);
  try {
    storage.setItem(STUDY_LOG_KEY, JSON.stringify(nextLog));
  } catch {
    return null;
  }
  return nextLog;
}

export function recoverTimerCheckpoint(timer, now = Date.now()) {
  if (!timer?.startedAt) return { timer, interruptedInterval: null };

  const checkpointAt = Number(timer.lastHeartbeatAt) || Number(timer.startedAt);
  if (now - checkpointAt <= HEARTBEAT_STALE_MS) {
    return {
      timer: { ...timer, lastHeartbeatAt: Number(timer.lastHeartbeatAt) || now },
      interruptedInterval: null,
    };
  }

  const endedAt = Math.max(Number(timer.startedAt), checkpointAt);
  const elapsedMs = Math.max(0, Number(timer.elapsedMs) || 0) + endedAt - Number(timer.startedAt);
  return {
    timer: { ...timer, elapsedMs, startedAt: null, lastHeartbeatAt: null },
    interruptedInterval: endedAt > Number(timer.startedAt)
      ? { startedAt: Number(timer.startedAt), endedAt }
      : null,
  };
}

export function buildLearningSummary(storage, contests, now = Date.now()) {
  const log = readStudyLog(storage);
  const nowDate = new Date(now);
  const todayKey = getStudyDateKey(nowDate);
  const dayMap = new Map();
  const activeEntries = [];
  const contestSummaries = Object.entries(contests).map(([contestId, contest]) => {
    const scope = getContestStorageScope(contestId);
    const baseline = readLegacyHours(storage, contestId, contest.disciplinas);
    let legacyHours = Object.values(baseline).reduce((total, hours) => total + (Number(hours) || 0), 0);
    let recordedHours = 0;
    const subjectMap = new Map(contest.disciplinas.map(discipline => [discipline.cod, {
      code: discipline.cod,
      name: discipline.nome,
      hours: Number(baseline[discipline.cod]) || 0,
    }]));
    const contestEntries = log.filter(entry => entry.contestId === contestId);
    const timer = readStoredJson(storage, `${scope}:timer`, null);
    const recovery = recoverTimerCheckpoint(timer, now);
    const extraIntervals = [];

    if (recovery.interruptedInterval) {
      extraIntervals.push(...splitStudyInterval(recovery.interruptedInterval.startedAt, recovery.interruptedInterval.endedAt)
        .map(segment => ({ ...segment, contestId, subjectCode: timer.cod, focusId: timer.focusId })));
    } else if (recovery.timer?.startedAt) {
      extraIntervals.push(...splitStudyInterval(recovery.timer.startedAt, now)
        .map(segment => ({ ...segment, contestId, subjectCode: recovery.timer.cod, focusId: recovery.timer.focusId })));
    }

    for (const entry of contestEntries) {
      const subject = subjectMap.get(entry.subjectCode) || { code: entry.subjectCode, name: entry.subjectCode, hours: 0 };
      subject.hours += entry.durationMs / 3600000;
      recordedHours += entry.durationMs / 3600000;
      subjectMap.set(entry.subjectCode, subject);
      addStudyDay(dayMap, entry.studyDate, entry.durationMs);
    }

    for (const interval of extraIntervals) {
      activeEntries.push({
        ...interval,
        id: `${timer.focusId}:${interval.studyDate}:${interval.startedAt}`,
        focusId: timer.focusId,
      });
      const subject = subjectMap.get(interval.subjectCode) || { code: interval.subjectCode, name: interval.subjectCode, hours: 0 };
      subject.hours += interval.durationMs / 3600000;
      recordedHours += interval.durationMs / 3600000;
      subjectMap.set(interval.subjectCode, subject);
      addStudyDay(dayMap, interval.studyDate, interval.durationMs);
    }

    const oldStudyDays = readStoredJson(storage, `${scope}:study-days`, []);
    if (Array.isArray(oldStudyDays)) oldStudyDays.forEach(day => addStudyDay(dayMap, day, 0));

    const uncreditedTimerMs = Math.max(0, (Number(recovery.timer?.elapsedMs) || 0) - (Number(recovery.timer?.creditedMs) || 0));
    if (uncreditedTimerMs > 0) {
      const subject = subjectMap.get(timer.cod) || { code: timer.cod, name: timer.cod, hours: 0 };
      subject.hours += uncreditedTimerMs / 3600000;
      legacyHours += uncreditedTimerMs / 3600000;
      subjectMap.set(timer.cod, subject);
    }

    const subjects = [...subjectMap.values()].filter(subject => subject.hours > 0).sort((a, b) => b.hours - a.hours);
    const hours = subjects.reduce((total, subject) => total + subject.hours, 0);
    const contestDays = new Set([
      ...(Array.isArray(oldStudyDays) ? oldStudyDays : []),
      ...contestEntries.map(entry => entry.studyDate),
      ...extraIntervals.map(interval => interval.studyDate),
    ]);
    const focusIds = new Set(contestEntries.map(entry => entry.focusId || entry.id));
    if (extraIntervals.length && timer?.focusId) focusIds.add(timer.focusId);

    return {
      id: contestId,
      title: contest.titulo,
      hours,
      legacyHours,
      recordedHours,
      days: contestDays.size,
      subjects,
      focusCount: focusIds.size,
    };
  });

  const week = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - 6 + offset);
    const dateKey = getStudyDateKey(date);
    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '');
    return {
      dateKey,
      label: weekday,
      day: date.getDate(),
      hours: (dayMap.get(dateKey)?.durationMs || 0) / 3600000,
      studied: dayMap.has(dateKey),
    };
  });

  const dayKeys = [...dayMap.keys()].filter(day => day <= todayKey).sort();
  const sessionMap = new Map();
  const contestNames = new Map(Object.entries(contests).map(([contestId, contest]) => [contestId, contest.titulo]));
  for (const entry of [...log, ...activeEntries]) {
    const sessionId = entry.focusId || entry.id;
    const session = sessionMap.get(sessionId) || {
      id: sessionId,
      contestId: entry.contestId,
      contestTitle: contestNames.get(entry.contestId) || entry.contestId,
      subjectCode: entry.subjectCode,
      studyDate: entry.studyDate,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      durationMs: 0,
    };
    session.startedAt = Math.min(session.startedAt, entry.startedAt);
    session.endedAt = Math.max(session.endedAt, entry.endedAt);
    session.durationMs += entry.durationMs;
    sessionMap.set(sessionId, session);
  }
  const recentSessions = [...sessionMap.values()].sort((a, b) => b.endedAt - a.endedAt).slice(0, 8);
  const streakDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  if (!dayMap.has(todayKey)) streakDate.setDate(streakDate.getDate() - 1);
  let currentStreak = 0;
  while (dayMap.has(getStudyDateKey(streakDate))) {
    currentStreak += 1;
    streakDate.setDate(streakDate.getDate() - 1);
  }

  return {
    totalHours: contestSummaries.reduce((total, contest) => total + contest.hours, 0),
    recordedHours: contestSummaries.reduce((total, contest) => total + contest.recordedHours, 0),
    legacyHours: contestSummaries.reduce((total, contest) => total + contest.legacyHours, 0),
    studyDays: dayKeys.length,
    studyDaysThisWeek: week.filter(day => dayMap.has(day.dateKey)).length,
    currentStreak,
    focusCount: new Set([...log, ...activeEntries].map(entry => entry.focusId || entry.id)).size,
    recentSessions,
    week,
    contests: contestSummaries.sort((a, b) => b.hours - a.hours),
  };
}

function addStudyDay(dayMap, studyDate, durationMs) {
  if (typeof studyDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(studyDate)) return;
  const current = dayMap.get(studyDate) || { durationMs: 0 };
  current.durationMs += Math.max(0, Number(durationMs) || 0);
  dayMap.set(studyDate, current);
}
