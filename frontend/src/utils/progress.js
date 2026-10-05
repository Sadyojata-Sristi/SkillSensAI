/*
=========================================================
SKILLSENSAI — PROGRESS SYSTEM
=========================================================
*/

/*
---------------------------------------------------------
MUSIC PROGRESS
---------------------------------------------------------
*/

const MUSIC_LESSONS_KEY =
  "skillsensai_music_lessons_completed";

const MUSIC_CHARACTER_KEY =
  "skillsensai_music_character";

/*
---------------------------------------------------------
MUSIC LESSONS
---------------------------------------------------------
*/

export function getLessonsLearned() {
  const saved = localStorage.getItem(
    MUSIC_LESSONS_KEY
  );

  if (saved === null) {
    return 0;
  }

  const number = Number(saved);

  if (Number.isNaN(number)) {
    return 0;
  }

  return Math.min(
    Math.max(number, 0),
    6
  );
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
  const current =
    getLessonsLearned();

  if (current >= 6) {
    return 6;
  }

  const next =
    current + 1;

  setLessonsLearned(next);

  return next;
}


export function resetMusicProgress() {
  localStorage.setItem(
    MUSIC_LESSONS_KEY,
    "0"
  );

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );
}


/*
---------------------------------------------------------
MUSIC CHARACTER APPEARANCE
---------------------------------------------------------
*/

export function getSelectedMusicCharacter() {
  return (
    localStorage.getItem(
      MUSIC_CHARACTER_KEY
    ) || "singer"
  );
}


export function setSelectedMusicCharacter(
  characterId
) {
  localStorage.setItem(
    MUSIC_CHARACTER_KEY,
    characterId
  );
}


/*
---------------------------------------------------------
BOXING PROGRESS
---------------------------------------------------------
*/

const COMPLETED_LESSONS_KEY =
  "skillsensai_completed_lessons";


export function getCompletedLessons() {
  const saved =
    localStorage.getItem(
      COMPLETED_LESSONS_KEY
    );

  if (!saved) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(
      "Unable to read completed lessons:",
      error
    );

    return [];
  }
}


export function isLessonCompleted(
  lessonId
) {
  return getCompletedLessons().includes(
    lessonId
  );
}


export function completeLesson(
  lessonId
) {
  const completedLessons =
    getCompletedLessons();

  if (
    completedLessons.includes(
      lessonId
    )
  ) {
    return false;
  }

  const updatedLessons = [
    ...completedLessons,
    lessonId,
  ];

  localStorage.setItem(
    COMPLETED_LESSONS_KEY,
    JSON.stringify(
      updatedLessons
    )
  );

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );

  return true;
}


/*
---------------------------------------------------------
RESET BOXING PROGRESS
---------------------------------------------------------
*/

export function resetBoxingProgress() {
  localStorage.removeItem(
    COMPLETED_LESSONS_KEY
  );

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );
}


/*
---------------------------------------------------------
COMPLETE MUSIC DATA RESET
---------------------------------------------------------
*/

export function resetMusicData() {
  localStorage.removeItem(
    MUSIC_LESSONS_KEY
  );

  localStorage.removeItem(
    MUSIC_CHARACTER_KEY
  );

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );
}
