// =========================================
// SKILLSENSAI — LESSON PROGRESS SYSTEM
// =========================================

const STORAGE_KEY = "skillsensai_completed_lessons";

/**
 * Get all completed lesson IDs
 */
export function getCompletedLessons() {
  try {
    const savedProgress = localStorage.getItem(STORAGE_KEY);

    if (!savedProgress) {
      return [];
    }

    const parsedProgress = JSON.parse(savedProgress);

    if (!Array.isArray(parsedProgress)) {
      return [];
    }

    return parsedProgress;
  } catch (error) {
    console.error(
      "SkillSensAI: Unable to load lesson progress.",
      error
    );

    return [];
  }
}

/**
 * Check whether a specific lesson is completed
 */
export function isLessonCompleted(lessonId) {
  if (!lessonId) {
    return false;
  }

  const completedLessons = getCompletedLessons();

  return completedLessons.includes(lessonId);
}

/**
 * Mark a lesson as completed
 */
export function completeLesson(lessonId) {
  if (!lessonId) {
    return false;
  }

  const completedLessons = getCompletedLessons();

  // Don't add the same lesson twice
  if (completedLessons.includes(lessonId)) {
    return false;
  }

  const updatedLessons = [
    ...completedLessons,
    lessonId,
  ];

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedLessons)
    );

    // Tell other pages/components that progress changed
    window.dispatchEvent(
      new Event("skillsensai-progress-updated")
    );

    return true;
  } catch (error) {
    console.error(
      "SkillSensAI: Unable to save lesson progress.",
      error
    );

    return false;
  }
}

/**
 * Remove a specific completed lesson
 */
export function uncompleteLesson(lessonId) {
  if (!lessonId) {
    return false;
  }

  const completedLessons = getCompletedLessons();

  const updatedLessons = completedLessons.filter(
    (id) => id !== lessonId
  );

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedLessons)
    );

    window.dispatchEvent(
      new Event("skillsensai-progress-updated")
    );

    return true;
  } catch (error) {
    console.error(
      "SkillSensAI: Unable to update lesson progress.",
      error
    );

    return false;
  }
}

/**
 * Get the total number of completed lessons
 */
export function getCompletedLessonCount() {
  return getCompletedLessons().length;
}

/**
 * Reset ALL lesson progress
 */
export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);

    window.dispatchEvent(
      new Event("skillsensai-progress-updated")
    );

    return true;
  } catch (error) {
    console.error(
      "SkillSensAI: Unable to reset lesson progress.",
      error
    );

    return false;
  }
}

/**
 * Get progress percentage
 *
 * Example:
 * getProgressPercentage(5)
 * If 3 of 5 lessons are completed → 60
 */
export function getProgressPercentage(totalLessons) {
  if (!totalLessons || totalLessons <= 0) {
    return 0;
  }

  const completedCount = getCompletedLessonCount();

  return Math.min(
    100,
    Math.round((completedCount / totalLessons) * 100)
  );
}

/**
 * Check whether ALL lessons are completed
 */
export function areAllLessonsCompleted(lessonIds = []) {
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    return false;
  }

  const completedLessons = getCompletedLessons();

  return lessonIds.every((lessonId) =>
    completedLessons.includes(lessonId)
  );
}
