// =========================================
// SKILLSENSAI - REAL LESSON PROGRESS SYSTEM
// =========================================

const STORAGE_KEY = "skillsensai_completed_lessons";

// Get all completed lesson IDs
export function getCompletedLessons() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const lessons = JSON.parse(saved);

    return Array.isArray(lessons) ? lessons : [];
  } catch (error) {
    console.error("Unable to read lesson progress:", error);
    return [];
  }
}

// Check whether a specific lesson is completed
export function isLessonCompleted(lessonId) {
  const completedLessons = getCompletedLessons();

  return completedLessons.includes(lessonId);
}

// Mark a lesson as completed
// Returns true only when the lesson was newly completed
export function completeLesson(lessonId) {
  if (!lessonId) {
    return false;
  }

  const completedLessons = getCompletedLessons();

  // Don't count the same lesson twice
  if (completedLessons.includes(lessonId)) {
    return false;
  }

  completedLessons.push(lessonId);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(completedLessons)
  );

  // Notify the Home page immediately
  window.dispatchEvent(
    new CustomEvent("skillsensai-progress-updated")
  );

  return true;
}

// Get number of completed lessons
export function getLessonsLearned() {
  return getCompletedLessons().length;
}

// Reset progress
// Useful during testing
export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);

  window.dispatchEvent(
    new CustomEvent("skillsensai-progress-updated")
  );
}
