export function deriveCourseProgressSummary({ libraryDocs = [], userCourses = [] }) {
  const courseProgress = [];
  const courseMap = new Map((libraryDocs || []).map((doc) => [String(doc._id), doc]));
  const seenCourseIds = new Set();

  const addCourseProgress = (courseId, userCourse, libraryDoc) => {
    const key = String(courseId || "");
    if (!key || seenCourseIds.has(key)) return;
    seenCourseIds.add(key);

    const modules = Array.isArray(libraryDoc?.modules) ? libraryDoc.modules : [];
    const completedLessonIds = new Set((userCourse?.completedLessons || []).filter(Boolean));
    let totalLessons = 0;
    let completedLessons = 0;

    modules.forEach((module) => {
      const lessons = Array.isArray(module.lessons) ? module.lessons : [];
      totalLessons += lessons.length;
      lessons.forEach((lesson, lessonIndex) => {
        const lessonId = lesson.id || `${module.id || 0}-${lessonIndex + 1}`;
        const lessonCompleted = Boolean(lesson.completed);
        if (lessonCompleted || completedLessonIds.has(lessonId)) {
          completedLessons += 1;
        }
      });
    });

    const numericUserProgress = Number(userCourse?.progress);
    const hasNumericUserProgress = Number.isFinite(numericUserProgress) && numericUserProgress >= 0;
    const computedProgress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : (hasNumericUserProgress ? numericUserProgress : 0);
    const resolvedProgress = Number.isFinite(computedProgress) && computedProgress >= 0
      ? computedProgress
      : (hasNumericUserProgress ? numericUserProgress : 0);
    const progressValue = hasNumericUserProgress && (numericUserProgress > 0 || totalLessons === 0)
      ? numericUserProgress
      : resolvedProgress;

    courseProgress.push({
      id: key,
      title: libraryDoc?.title || libraryDoc?.topic || userCourse?.title || userCourse?.topic || "Course",
      progress: progressValue,
      completedLessons: completedLessons || userCourse?.completedLessons?.length || 0,
      totalLessons: totalLessons || libraryDoc?.totalLessons || 0,
      completed: Boolean(userCourse?.completed) || progressValue >= 100,
    });
  };

  (userCourses || []).forEach((userCourse) => {
    if (!userCourse?.courseId) return;
    addCourseProgress(userCourse.courseId, userCourse, courseMap.get(String(userCourse.courseId)));
  });

  (libraryDocs || []).forEach((libraryDoc) => {
    const courseId = String(libraryDoc._id || "");
    if (!courseId) return;
    if (seenCourseIds.has(courseId)) return;
    addCourseProgress(courseId, null, libraryDoc);
  });

  const completedCourses = courseProgress.filter((course) => course.completed).length;

  return {
    totalCourses: courseProgress.length,
    completedCourses,
    inProgressCourses: courseProgress.length - completedCourses,
    courseProgress: courseProgress.slice(0, 6),
  };
}
