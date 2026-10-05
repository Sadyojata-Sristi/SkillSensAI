/*
=========================================================
SKILLSENSAI — PROGRESS SYSTEM
=========================================================
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

  return safeNumber;
}

export function completeNextLesson() {
  const current = getLessonsLearned();

  if (current >= 6) {
    return 6;
  }

  const next = current + 1;

  setLessonsLearned(next);

  return next;
}

export function resetMusicProgress() {
  localStorage.setItem(
    MUSIC_LESSONS_KEY,
    "0"
  );
}

/*
---------------------------------------------------------
CHARACTER APPEARANCE
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
OPTIONAL COMPLETE MUSIC RESET
---------------------------------------------------------
*/

export function resetMusicData() {
  localStorage.removeItem(
    MUSIC_LESSONS_KEY
  );

  localStorage.removeItem(
    MUSIC_CHARACTER_KEY
  );
}
