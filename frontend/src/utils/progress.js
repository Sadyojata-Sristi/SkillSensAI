/* =========================================================
   SKILLSENSAI — CENTRAL PROGRESS SYSTEM
   ========================================================= */

const STORAGE_KEY = "skillsensai_progress";
const MUSIC_LESSONS_KEY = "skillsensai_music_lessons";

const EMPTY_PROGRESS = {
  completedLessons: [],
  lessonsLearned: [],
};

/* ---------------------------------------------------------
   SAFE LOCAL STORAGE READ
--------------------------------------------------------- */

const readProgress = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return {
        ...EMPTY_PROGRESS,
        completedLessons: readLegacyMusicLessons(),
        lessonsLearned: readLegacyMusicLessons(),
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
      ...EMPTY_PROGRESS,
      completedLessons: readLegacyMusicLessons(),
      lessonsLearned: readLegacyMusicLessons(),
    };
  }
};

/* ---------------------------------------------------------
   READ OLD MUSIC PROGRESS
--------------------------------------------------------- */

const readLegacyMusicLessons = () => {
  try {
    const saved = localStorage.getItem(MUSIC_LESSONS_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(
      "Unable to read legacy music progress:",
      error
    );

    return [];
  }
};

/* ---------------------------------------------------------
   SAVE CENTRAL PROGRESS
--------------------------------------------------------- */

const saveProgress = (progress) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completedLessons: [
          ...new Set(progress.completedLessons),
        ],

        lessonsLearned: [
          ...new Set(progress.lessonsLearned),
        ],
      })
    );

    /*
      Keep the existing Music page compatible with the
      central progress system.
    */

    localStorage.setItem(
      MUSIC_LESSONS_KEY,
      JSON.stringify([
        ...new Set(progress.completedLessons),
      ])
    );

    window.dispatchEvent(
      new CustomEvent(
        "skillsensai-progress-updated"
      )
    );
  } catch (error) {
    console.error(
      "SkillSensAI progress could not be saved:",
      error
    );
  }
};

/* =========================================================
   COMPLETED LESSONS
========================================================= */

export const getCompletedLessons = () => {
  const progress = readProgress();

  /*
    If central progress is empty but the old Music progress
    exists, automatically migrate it.
  */

  if (
    progress.completedLessons.length === 0
  ) {
    const legacy = readLegacyMusicLessons();

    if (legacy.length > 0) {
      const migrated = {
        completedLessons: legacy,
        lessonsLearned:
          progress.lessonsLearned.length > 0
            ? progress.lessonsLearned
            : legacy,
      };

      saveProgress(migrated);

      return legacy;
    }
  }

  return progress.completedLessons;
};

export const isLessonCompleted = (lessonId) => {
  return getCompletedLessons().includes(
    lessonId
  );
};

export const completeLesson = (lessonId) => {
  const progress = readProgress();

  /*
    Also include old Music progress so we don't lose
    existing completed lessons.
  */

  const legacy = readLegacyMusicLessons();

  const completedLessons = [
    ...new Set([
      ...progress.completedLessons,
      ...legacy,
    ]),
  ];

  if (completedLessons.includes(lessonId)) {
    return false;
  }

  completedLessons.push(lessonId);

  const lessonsLearned = [
    ...new Set([
      ...progress.lessonsLearned,
      lessonId,
    ]),
  ];

  saveProgress({
    completedLessons,
    lessonsLearned,
  });

  return true;
};

/* =========================================================
   LESSONS LEARNED
========================================================= */

export const getLessonsLearned = () => {
  const progress = readProgress();

  if (progress.lessonsLearned.length > 0) {
    return progress.lessonsLearned;
  }

  /*
    Backward compatibility:
    Existing Music completions count as learned lessons.
  */

  const legacy = readLegacyMusicLessons();

  return legacy;
};

export const isLessonLearned = (lessonId) => {
  return getLessonsLearned().includes(
    lessonId
  );
};

export const markLessonLearned = (lessonId) => {
  const progress = readProgress();

  if (
    progress.lessonsLearned.includes(
      lessonId
    )
  ) {
    return false;
  }

  progress.lessonsLearned = [
    ...progress.lessonsLearned,
    lessonId,
  ];

  /*
    A learned lesson is also considered completed.
  */

  if (
    !progress.completedLessons.includes(
      lessonId
    )
  ) {
    progress.completedLessons = [
      ...progress.completedLessons,
      lessonId,
    ];
  }

  saveProgress(progress);

  return true;
};

/* =========================================================
   GENERAL PROGRESS
========================================================= */

export const getProgress = () => {
  return {
    completedLessons:
      getCompletedLessons(),

    lessonsLearned:
      getLessonsLearned(),
  };
};

export const getLessonProgress = () => {
  return getCompletedLessons();
};

/* =========================================================
   RESET
========================================================= */

export const resetProgress = () => {
  try {
    localStorage.removeItem(
      STORAGE_KEY
    );

    localStorage.removeItem(
      MUSIC_LESSONS_KEY
    );

    localStorage.removeItem(
      "skillsensai_music_xp"
    );

    localStorage.removeItem(
      "skillsensai_music_notes"
    );

    window.dispatchEvent(
      new CustomEvent(
        "skillsensai-progress-updated"
      )
    );
  } catch (error) {
    console.error(
      "Unable to reset SkillSensAI progress:",
      error
    );
  }
};
