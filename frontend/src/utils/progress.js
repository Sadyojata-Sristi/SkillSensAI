/* =========================================================
   SKILLSENSAI — PROGRESS UTILITY
   ========================================================= */

const STORAGE_KEY = "skillsensai_progress";

/* ---------------------------------------------------------
   INTERNAL HELPERS
--------------------------------------------------------- */

const readProgress = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return {
        completedLessons: [],
        lessonsLearned: [],
      };
    }

    const parsed = JSON.parse(saved);

    return {
      completedLessons: Array.isArray(parsed.completedLessons)
        ? parsed.completedLessons
        : [],

      lessonsLearned: Array.isArray(parsed.lessonsLearned)
        ? parsed.lessonsLearned
        : [],
    };
  } catch (error) {
    console.error(
      "SkillSensAI progress could not be loaded:",
      error
    );

    return {
      completedLessons: [],
      lessonsLearned: [],
    };
  }
};

const saveProgress = (progress) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress)
    );

    window.dispatchEvent(
      new CustomEvent("skillsensai-progress-updated")
    );
  } catch (error) {
    console.error(
      "SkillSensAI progress could not be saved:",
      error
    );
  }
};

/* ---------------------------------------------------------
   COMPLETED LESSONS
--------------------------------------------------------- */

export const getCompletedLessons = () => {
  return readProgress().completedLessons;
};

export const isLessonCompleted = (lessonId) => {
  return getCompletedLessons().includes(lessonId);
};

export const completeLesson = (lessonId) => {
  const progress = readProgress();

  if (progress.completedLessons.includes(lessonId)) {
    return false;
  }

  progress.completedLessons = [
    ...progress.completedLessons,
    lessonId,
  ];

  /* Keep both progress systems synchronized */
  if (!progress.lessonsLearned.includes(lessonId)) {
    progress.lessonsLearned = [
      ...progress.lessonsLearned,
      lessonId,
    ];
  }

  saveProgress(progress);

  return true;
};

/* ---------------------------------------------------------
   LESSONS LEARNED
--------------------------------------------------------- */

/*
   This function fixes the recent Home.jsx build error:

   getLessonsLearned is not exported by progress.js
*/

export const getLessonsLearned = () => {
  return readProgress().lessonsLearned;
};

export const isLessonLearned = (lessonId) => {
  return getLessonsLearned().includes(lessonId);
};

export const markLessonLearned = (lessonId) => {
  const progress = readProgress();

  if (progress.lessonsLearned.includes(lessonId)) {
    return false;
  }

  progress.lessonsLearned = [
    ...progress.lessonsLearned,
    lessonId,
  ];

  saveProgress(progress);

  return true;
};

/* ---------------------------------------------------------
   RESET
--------------------------------------------------------- */

export const resetProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);

    /* Also clear old SkillSensAI progress keys */
    localStorage.removeItem(
      "skillsensai_music_lessons"
    );

    localStorage.removeItem(
      "skillsensensai_music_lessons"
    );

    localStorage.removeItem(
      "skillsensai_music_xp"
    );

    localStorage.removeItem(
      "skillsensai_music_notes"
    );

    window.dispatchEvent(
      new CustomEvent("skillsensai-progress-updated")
    );
  } catch (error) {
    console.error(
      "Unable to reset SkillSensAI progress:",
      error
    );
  }
};

/* ---------------------------------------------------------
   OPTIONAL ALIASES
--------------------------------------------------------- */

export const getProgress = () => {
  return readProgress();
};

export const getLessonProgress = () => {
  return getCompletedLessons();
};
