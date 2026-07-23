import { redirect, notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { ensureMarketplaceSeedCourses, slugifyCourseTitle } from "@/lib/courseCommerce";

export default async function PremiumCourseRedirectPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { db } = await connectToDatabase();
  await ensureMarketplaceSeedCourses(db);

  const requestedSlug = slugifyCourseTitle(resolvedParams?.slug || "");
  const requestedCourseId = resolvedSearchParams?.courseId;
  let exactCourse = null;

  if (requestedCourseId && ObjectId.isValid(requestedCourseId)) {
    exactCourse = await db.collection("courses").findOne({
      _id: new ObjectId(requestedCourseId),
      isGlobal: true,
      isPublished: true,
      isPremium: true,
    });
  }

  if (!exactCourse && requestedSlug) {
    exactCourse = await db.collection("courses").findOne({
      isGlobal: true,
      isPublished: true,
      isPremium: true,
      slug: requestedSlug,
    });
  }

  let course = exactCourse;

  if (!course && requestedSlug) {
    const seededCourses = await db
      .collection("courses")
      .find({
        isGlobal: true,
        isPublished: true,
        isPremium: true,
      })
      .project({ title: 1, slug: 1 })
      .toArray();

    course =
      seededCourses.find(
        (candidate) => slugifyCourseTitle(candidate.slug || candidate.title) === requestedSlug
      ) || null;
  }

  if (!course) {
    notFound();
  }

  const callbackUrl = `/dashboard/premium-courses?courseSlug=${encodeURIComponent(
    course.slug || slugifyCourseTitle(course.title)
  )}&courseTitle=${encodeURIComponent(course.title)}&authFlow=shared-course`;

  redirect(callbackUrl);
}
