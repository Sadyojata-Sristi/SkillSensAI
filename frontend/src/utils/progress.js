
/*
 * SkillSensAI — Progress System
 * Music progress, martial arts lessons, and daily streaks.
 */

const MUSIC_LESSONS_KEY = "skillsensai_music_lessons_completed";
const MUSIC_CHARACTER_KEY = "skillsensai_music_character";
const COMPLETED_LESSONS_KEY = "skillsensai_completed_lessons";
const MARTIAL_ACTIVITY_DATES_KEY = "skillsensai_martial_activity_dates";

function notifyProgressUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("skillsensai-progress-updated"));
  }
}

function readJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function localDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/* MUSIC LESSONS */

export function getLessonsLearned() {
  const number = Number(localStorage.getItem(MUSIC_LESSONS_KEY));
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(number, 0), 6);
}

export function setLessonsLearned(number) {
  const safeNumber = Math.min(Math.max(Number(number) || 0, 0), 6);
  localStorage.setItem(MUSIC_LESSONS_KEY, String(safeNumber));
  notifyProgressUpdated();
  return safeNumber;
}

export function completeNextLesson() {
  const current = getLessonsLearned();
  if (current >= 6) return 6;
  return setLessonsLearned(current + 1);
}

export function resetMusicProgress() {
  localStorage.setItem(MUSIC_LESSONS_KEY, "0");
  notifyProgressUpdated();
}

/* MUSIC CHARACTER */

export function getSelectedMusicCharacter() {
  return localStorage.getItem(MUSIC_CHARACTER_KEY) || "singer";
}

export function setSelectedMusicCharacter(characterId) {
  localStorage.setItem(MUSIC_CHARACTER_KEY, characterId);
  notifyProgressUpdated();
}

/* MARTIAL ARTS LESSON COMPLETION */

export function getCompletedLessons() {
  const parsed = readJSON(COMPLETED_LESSONS_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function isLessonCompleted(lessonId) {
  return getCompletedLessons().includes(lessonId);
}

export function completeLesson(lessonId) {
  const completed = getCompletedLessons();
  if (completed.includes(lessonId)) return false;

  completed.push(lessonId);
  localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(completed));
  notifyProgressUpdated();
  return true;
}

/* MARTIAL ARTS DAILY STREAK */

export function recordMartialTrainingActivity(date = new Date()) {
  const savedDates = readJSON(MARTIAL_ACTIVITY_DATES_KEY, []);
  const dates = Array.isArray(savedDates)
    ? savedDates.filter(value => typeof value === "string")
    : [];

  const day = localDayKey(date);
  if (!dates.includes(day)) dates.push(day);

  dates.sort();
  const recentDates = [...new Set(dates)].slice(-90);

  localStorage.setItem(MARTIAL_ACTIVITY_DATES_KEY, JSON.stringify(recentDates));
  notifyProgressUpdated();
  return recentDates;
}

export function getMartialTrainingStreak(date = new Date()) {
  const savedDates = readJSON(MARTIAL_ACTIVITY_DATES_KEY, []);
  const activeDays = new Set(
    Array.isArray(savedDates)
      ? savedDates.filter(value => typeof value === "string")
      : []
  );

  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const todayKey = localDayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = localDayKey(yesterday);

  if (!activeDays.has(todayKey) && !activeDays.has(yesterdayKey)) {
    return 0;
  }

  const cursor = activeDays.has(todayKey) ? today : yesterday;
  let streak = 0;

  while (activeDays.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/* RESET MARTIAL ARTS PROGRESS */

export function resetBoxingProgress() {
  localStorage.removeItem(COMPLETED_LESSONS_KEY);
  notifyProgressUpdated();
}

/* RESET MUSIC DATA */

export function resetMusicData() {
  localStorage.removeItem(MUSIC_LESSONS_KEY);
  localStorage.removeItem(MUSIC_CHARACTER_KEY);
  notifyProgressUpdated();
}
