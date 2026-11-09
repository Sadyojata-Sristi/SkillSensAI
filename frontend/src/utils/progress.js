
const MUSIC_LESSONS_KEY = "skillsensai_music_lessons_completed";
const MUSIC_CHARACTER_KEY = "skillsensai_music_character";
const COMPLETED_LESSONS_KEY = "skillsensai_completed_lessons";
const MARTIAL_ACTIVITY_DATES_KEY = "skillsensai_martial_activity_dates";
const MARTIAL_XP_KEY = "skillsensai_martial_xp";

function notifyProgressUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("skillsensai-progress-updated"));
  }
}

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

// MUSIC PROGRESS

export function getLessonsLearned() {
  const value = Number(localStorage.getItem(MUSIC_LESSONS_KEY));
  return Number.isFinite(value) ? Math.max(0, Math.min(6, value)) : 0;
}

export function setLessonsLearned(value) {
  const count = Math.max(0, Math.min(6, Number(value) || 0));
  localStorage.setItem(MUSIC_LESSONS_KEY, String(count));
  notifyProgressUpdated();
  return count;
}

export function completeNextLesson() {
  return setLessonsLearned(getLessonsLearned() + 1);
}

export function resetMusicProgress() {
  localStorage.setItem(MUSIC_LESSONS_KEY, "0");
  notifyProgressUpdated();
}

export function getSelectedMusicCharacter() {
  return localStorage.getItem(MUSIC_CHARACTER_KEY) || "singer";
}

export function setSelectedMusicCharacter(characterId) {
  localStorage.setItem(MUSIC_CHARACTER_KEY, characterId);
  notifyProgressUpdated();
}

// MARTIAL ARTS LESSONS

export function getCompletedLessons() {
  const lessons = readJSON(COMPLETED_LESSONS_KEY, []);
  return Array.isArray(lessons) ? lessons : [];
}

export function isLessonCompleted(lessonId) {
  return getCompletedLessons().includes(lessonId);
}

export function completeLesson(lessonId) {
  const completed = getCompletedLessons();

  if (completed.includes(lessonId)) {
    return false;
  }

  completed.push(lessonId);
  localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(completed));
  notifyProgressUpdated();
  return true;
}

// MARTIAL ARTS XP

export function getMartialXP() {
  const xp = Number(localStorage.getItem(MARTIAL_XP_KEY));
  return Number.isFinite(xp) ? Math.max(0, xp) : 0;
}

export function addMartialXP(amount) {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const total = getMartialXP() + safeAmount;

  localStorage.setItem(MARTIAL_XP_KEY, String(total));
  notifyProgressUpdated();

  return total;
}

// DAILY TRAINING STREAK

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function recordMartialTrainingActivity(date = new Date()) {
  const dates = readJSON(MARTIAL_ACTIVITY_DATES_KEY, []);
  const validDates = Array.isArray(dates) ? dates : [];
  const key = dayKey(date);

  if (!validDates.includes(key)) {
    validDates.push(key);
  }

  validDates.sort();
  localStorage.setItem(
    MARTIAL_ACTIVITY_DATES_KEY,
    JSON.stringify(validDates.slice(-365))
  );

  notifyProgressUpdated();
  return validDates;
}

export function getMartialTrainingStreak(date = new Date()) {
  const dates = new Set(readJSON(MARTIAL_ACTIVITY_DATES_KEY, []));
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const todayKey = dayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!dates.has(todayKey) && !dates.has(dayKey(yesterday))) {
    return 0;
  }

  const cursor = dates.has(todayKey) ? today : yesterday;
  let streak = 0;

  while (dates.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// RESET HELPERS

export function resetBoxingProgress() {
  localStorage.removeItem(COMPLETED_LESSONS_KEY);
  localStorage.removeItem(MARTIAL_XP_KEY);
  localStorage.removeItem(MARTIAL_ACTIVITY_DATES_KEY);
  notifyProgressUpdated();
}

export function resetMusicData() {
  localStorage.removeItem(MUSIC_LESSONS_KEY);
  localStorage.removeItem(MUSIC_CHARACTER_KEY);
  notifyProgressUpdated();
}
