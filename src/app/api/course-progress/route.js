// src/app/api/course-progress/route.js

import { NextResponse } from "next/server";
import { withAuth, withErrorHandling } from "@/lib/middleware";
import User from "@/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { checkCourseAccess } from "@/lib/planMiddleware";
import { XP_REWARDS, calculateLevel, checkBadges } from "@/lib/gamification";

async function handlePost(request) {
  const user = request.user;
  const { db } = await connectToDatabase();

  try {
    const body = await request.json();
    const { courseId, progress, completed, lessonId, title } = body;

    // === Plan Validation ===
    const access = await checkCourseAccess(db, user._id, courseId);

    if (!access.hasAccess) {
      return NextResponse.json(
        {
          error: "Access denied",
          message: access.reason,
          requiredTier: access.requiredTier,
          code: "INSUFFICIENT_PLAN"
        },
        { status: 403 }
      );
    }

    // === Input Validation ===
    if (!courseId || typeof courseId !== "string" || courseId.length < 12) {
      return NextResponse.json(
        { error: "Invalid or missing courseId", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: "Progress must be a number between 0 and 100", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Completed must be a boolean", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    // Atomic Update
    const result = await db.collection("users").updateOne(
      { _id: user._id, "courses.courseId": courseId },
      {
        $set: {
          "courses.$.progress": Math.round(progress),
          "courses.$.completed": completed,
          "courses.$.lastUpdated": new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $push: {
            courses: {
              courseId,
              title: title || null,
              progress: Math.round(progress),
              completed,
              startedAt: new Date(),
              lastUpdated: new Date(),
            },
          },
        }
      );
    } else if (title) {
      // Ensure title is set on existing enrollments
      await db.collection("users").updateOne(
        { _id: user._id, "courses.courseId": courseId, "courses.title": null },
        { $set: { "courses.$.title": title } }
      );
    }

    // If client provided a lessonId, also persist per-lesson completion
    if (lessonId && typeof lessonId === "string") {
      try {
        const courseObjId = new ObjectId(courseId);
        const isLessonDone = typeof body.isLessonCompleted === "boolean" ? body.isLessonCompleted : true;

        if (access.isOwner) {
          // 1. Update the lesson in library (if owner)
          const [modNum] = String(lessonId).split("-");
          const moduleId = parseInt(modNum, 10);
          
          if (!Number.isNaN(moduleId)) {
            await db.collection("library").updateOne(
              { _id: courseObjId, userId: user._id },
              {
                $set: {
                  "modules.$[m].lessons.$[l].completed": isLessonDone,
                  lastAccessed: new Date(),
                },
              },
              {
                arrayFilters: [{ "m.id": moduleId }, { "l.id": lessonId }],
              }
            );
          }
        }

        // 2. ALWAYS update user's specific progress (enrollee or owner)
        // We add/remove the lessonId from a 'completedLessons' array in the user's course list
        if (isLessonDone) {
          await db.collection("users").updateOne(
            { _id: user._id, "courses.courseId": courseId },
            { 
              $addToSet: { "courses.$.completedLessons": lessonId },
              $set: { "courses.$.lastUpdated": new Date() }
            }
          );

          // Update streak on lesson completion
          try {
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];
            
            const userDoc = await db.collection("users").findOne(
              { _id: user._id },
              { projection: { streak: 1 } }
            );
            
            const streak = userDoc?.streak || { current: 0, longest: 0, lastActiveDate: null, activeDates: [] };
            
            if (streak.lastActiveDate !== todayStr) {
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split("T")[0];
              
              let newCurrent = streak.current;
              if (streak.lastActiveDate === yesterdayStr) {
                newCurrent = streak.current + 1;
              } else {
                newCurrent = 1;
              }
              
              const longest = Math.max(newCurrent, streak.longest);
              const activeDates = [...new Set([...(streak.activeDates || []), todayStr])];
              const cutoff = new Date(today);
              cutoff.setFullYear(cutoff.getFullYear() - 1);
              const trimmedDates = activeDates.filter(d => d >= cutoff.toISOString().split("T")[0]);
              
              await db.collection("users").updateOne(
                { _id: user._id },
                { $set: { streak: { current: newCurrent, longest, lastActiveDate: todayStr, activeDates: trimmedDates } } }
              );
            }
          } catch (streakErr) {
            console.error("Streak update error:", streakErr);
          }

          // Award XP for lesson completion
          try {
            const xpAmount = XP_REWARDS.lesson_complete;
            const todayStr2 = new Date().toISOString().split("T")[0];
            const xpUser = await db.collection("users").findOne(
              { _id: user._id },
              { projection: { xp: 1, level: 1, achievements: 1, dailyXp: 1, dailyXpDate: 1, courses: 1 } }
            );
            const oldXp = xpUser?.xp || 0;
            const newXp = oldXp + xpAmount;
            const oldLevelInfo = calculateLevel(oldXp);
            const newLevelInfo = calculateLevel(newXp);
            const levelUp = newLevelInfo.level > oldLevelInfo.level;
            let newDailyXp = (xpUser?.dailyXpDate === todayStr2) ? (xpUser?.dailyXp || 0) : 0;
            newDailyXp += xpAmount;

            const updateOps = {
              $set: { xp: newXp, level: newLevelInfo.level, dailyXp: newDailyXp, dailyXpDate: todayStr2 },
            };

            const completedCoursesCount = (xpUser?.courses || []).filter(c => c.completed).length;
            const newBadges = checkBadges(
              { ...xpUser, xp: newXp, level: newLevelInfo.level, dailyXp: newDailyXp },
              { completedCourses: completedCoursesCount }
            );
            if (newBadges.length > 0) {
              updateOps.$push = { achievements: { $each: newBadges } };
            }

            await db.collection("users").updateOne({ _id: user._id }, updateOps);

            // Also check if course just completed (100%)
            if (isFinished && !xpUser?.courses?.find(c => c.courseId?.toString() === courseId)?.completed) {
              const courseXp = XP_REWARDS.course_complete;
              const finalXp = newXp + courseXp;
              const finalLevel = calculateLevel(finalXp);
              await db.collection("users").updateOne(
                { _id: user._id },
                { $set: { xp: finalXp, level: finalLevel.level } }
              );
            }
          } catch (xpErr) {
            console.error("XP award error:", xpErr);
          }
        } else {
          await db.collection("users").updateOne(
            { _id: user._id, "courses.courseId": courseId },
            { 
              $pull: { "courses.$.completedLessons": lessonId },
              $set: { "courses.$.lastUpdated": new Date() }
            }
          );
        }

        // 3. Recalculate total progress for the user's view
        const userDoc = await db.collection("users").findOne(
          { _id: user._id, "courses.courseId": courseId },
          { projection: { "courses.$": 1 } }
        );
        
        const userCourse = userDoc?.courses?.[0];
        if (userCourse) {
          const course = await db.collection("library").findOne({ _id: courseObjId });
          const totalLessons = course?.totalLessons || 0;
          const completedCount = userCourse.completedLessons?.length || 0;
          const newProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
          const isFinished = newProgress >= 100;

          await db.collection("users").updateOne(
            { _id: user._id, "courses.courseId": courseId },
            {
              $set: {
                "courses.$.progress": newProgress,
                "courses.$.completed": isFinished,
              }
            }
          );

          return NextResponse.json({
            success: true,
            message: "Progress updated",
            data: {
              courseId,
              progress: newProgress,
              completed: isFinished,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      } catch (e) {
        console.error("Lesson progress update error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Progress saved",
      data: {
        courseId,
        progress: Math.round(progress),
        completed,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Update course progress error:", error);
    throw error;
  }
}

// Apply middleware
export const POST = withErrorHandling(withAuth(handlePost));

