import { describe, expect, it } from "vitest";
import { deriveCourseProgressSummary } from "@/lib/analyticsOverview";

describe("deriveCourseProgressSummary", () => {
  it("counts real course progress from library modules and user course records", () => {
    const summary = deriveCourseProgressSummary({
      libraryDocs: [
        {
          _id: "course-1",
          title: "Python Basics",
          modules: [
            { id: 1, lessons: [{ id: "1-1", completed: true }, { id: "1-2", completed: false }] },
          ],
        },
        {
          _id: "course-2",
          title: "React Essentials",
          modules: [
            { id: 1, lessons: [{ id: "2-1", completed: true }, { id: "2-2", completed: true }] },
          ],
        },
      ],
      userCourses: [
        { courseId: "course-1", progress: 50, completed: false, completedLessons: ["1-1"] },
        { courseId: "course-2", progress: 100, completed: true, completedLessons: ["2-1", "2-2"] },
      ],
    });

    expect(summary.totalCourses).toBe(2);
    expect(summary.completedCourses).toBe(1);
    expect(summary.courseProgress[0]).toMatchObject({ title: "Python Basics", progress: 50 });
    expect(summary.courseProgress[1]).toMatchObject({ title: "React Essentials", progress: 100 });
  });

  it("falls back to completed lesson counts when progress is missing", () => {
    const summary = deriveCourseProgressSummary({
      libraryDocs: [
        {
          _id: "course-3",
          title: "Biology",
          modules: [
            { id: 1, lessons: [{ id: "3-1", completed: true }, { id: "3-2", completed: false }] },
          ],
        },
      ],
      userCourses: [],
    });

    expect(summary.totalCourses).toBe(1);
    expect(summary.completedCourses).toBe(0);
    expect(summary.courseProgress[0].progress).toBe(50);
  });
});
