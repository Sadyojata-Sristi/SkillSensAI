const STORAGE_KEY = "skillsensai_completed_lessons";

export function getCompletedLessons() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not load lesson progress:", error);
    return [];
  }
}

export function isLessonCompleted(lessonId) {
  return getCompletedLessons().includes(lessonId);
}

export function completeLesson(lessonId) {
  const completed = getCompletedLessons();

  if (completed.includes(lessonId)) {
    return false;
  }

  const updated = [...completed, lessonId];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );

  return true;
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);

  window.dispatchEvent(
    new Event("skillsensai-progress-updated")
  );
}
