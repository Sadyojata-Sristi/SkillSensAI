
/*
=========================================================
SKILLSENSAI — SHARED PROGRESS SYSTEM
Music + Martial Arts
=========================================================
*/

const MUSIC_LESSONS_KEY =
  "skillsensai_music_lessons_completed";

const MUSIC_CHARACTER_KEY =
  "skillsensai_music_character";

const COMPLETED_LESSONS_KEY =
  "skillsensai_completed_lessons";

const MARTIAL_XP_KEY =
  "skillsensai_martial_xp";

const MARTIAL_ACTIVITY_DATES_KEY =
  "skillsensai_martial_activity_dates";

const localDayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/*
=========================================================
MUSIC PROGRESS
=========================================================
*/

export function getLessonsLearned() {
  const saved = localStorage.getItem(
    MUSIC_LESSONS_KEY
  );

  if (saved === null) return 0;

  const number = Number(saved);

  if (!Number.isFinite(number)) return 0;

  return Math.min(Math.max(number, 0), 6);
}

export function setLessonsLearned(number) {
  const safeNumber = Math.min(
    Math.max(Number(number) || 0, 0),
    6
  );

  localStorage.setItem(
    MUSIC_LESSONS_KEY,
    String(safeNumber)
  );

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );

  return safeNumber;
}

export function completeNextLesson() {
  const current = getLessonsLearned();

  if (current >= 6) return 6;

  return setLessonsLearned(current + 1);
}

export function resetMusicProgress() {
  localStorage.setItem(MUSIC_LESSONS_KEY, "0");

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );
}

/*
=========================================================
MUSIC CHARACTER
=========================================================
*/

export function getSelectedMusicCharacter() {
  return (
    localStorage.getItem(MUSIC_CHARACTER_KEY) ||
    "singer"
  );
}

export function setSelectedMusicCharacter(characterId) {
  localStorage.setItem(
    MUSIC_CHARACTER_KEY,
    characterId
  );
}

/*
=========================================================
MARTIAL ARTS LESSON COMPLETION
=========================================================
*/

export function getCompletedLessons() {
  const saved = localStorage.getItem(
    COMPLETED_LESSONS_KEY
  );

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(
      "Unable to read completed lessons:",
      error
    );

    return [];
  }
}

export function isLessonCompleted(lessonId) {
  return getCompletedLessons().includes(lessonId);
}

/*
Returns true only when a lesson is newly completed.
This prevents duplicate lesson-completion rewards.
*/

export function completeLesson(lessonId) {
  if (!lessonId) return false;

  const completedLessons = getCompletedLessons();

  if (completedLessons.includes(lessonId)) {
    return false;
  }

  const updatedLessons = [
    ...completedLessons,
    lessonId,
  ];

  localStorage.setItem(
    COMPLETED_LESSONS_KEY,
    JSON.stringify(updatedLessons)
  );

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );

  return true;
}

/*
=========================================================
MARTIAL ARTS XP
=========================================================
*/

export function getMartialXP() {
  const saved = Number(
    localStorage.getItem(MARTIAL_XP_KEY) || 0
  );

  if (!Number.isFinite(saved)) return 0;

  return Math.max(0, Math.floor(saved));
}

export function addMartialXP(amount) {
  const points = Number(amount);

  if (!Number.isFinite(points) || points <= 0) {
    return getMartialXP();
  }

  const updatedXP =
    getMartialXP() + Math.floor(points);

  localStorage.setItem(
    MARTIAL_XP_KEY,
    String(updatedXP)
  );

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );

  return updatedXP;
}

/*
=========================================================
MARTIAL ARTS DAILY STREAK
=========================================================
*/

export function recordMartialTrainingActivity(
  date = new Date()
) {
  const day = localDayKey(date);

  let dates = [];

  try {
    const saved = JSON.parse(
      localStorage.getItem(
        MARTIAL_ACTIVITY_DATES_KEY
      ) || "[]"
    );

    if (Array.isArray(saved)) {
      dates = saved.filter(
        (value) => typeof value === "string"
      );
    }
  } catch {
    dates = [];
  }

  if (!dates.includes(day)) {
    dates.push(day);
  }

  dates = [...new Set(dates)]
    .sort()
    .slice(-90);

  localStorage.setItem(
    MARTIAL_ACTIVITY_DATES_KEY,
    JSON.stringify(dates)
  );

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );

  return dates;
}

export function getMartialTrainingStreak(
  date = new Date()
) {
  let dates = [];

  try {
    const saved = JSON.parse(
      localStorage.getItem(
        MARTIAL_ACTIVITY_DATES_KEY
      ) || "[]"
    );

    if (Array.isArray(saved)) {
      dates = saved.filter(
        (value) => typeof value === "string"
      );
    }
  } catch {
    dates = [];
  }

  const activeDays = new Set(dates);

  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const todayKey = localDayKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayKey = localDayKey(yesterday);

  // A streak remains active if training happened
  // today or yesterday.
  if (
    !activeDays.has(todayKey) &&
    !activeDays.has(yesterdayKey)
  ) {
    return 0;
  }

  let cursor = activeDays.has(todayKey)
    ? today
    : yesterday;

  let streak = 0;

  while (activeDays.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/*
=========================================================
RESET MARTIAL ARTS PROGRESS
=========================================================
*/

export function resetBoxingProgress() {
  localStorage.removeItem(COMPLETED_LESSONS_KEY);

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );
}

/*
=========================================================
RESET MUSIC DATA
=========================================================
*/

export function resetMusicData() {
  localStorage.removeItem(MUSIC_LESSONS_KEY);
  localStorage.removeItem(MUSIC_CHARACTER_KEY);

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );
}
