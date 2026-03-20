import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { TIERS } from "@/lib/planMiddleware";

// GET /api/library/share?shareId=...
// Publicly fetch a shared course
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get("shareId");

  if (!shareId) {
    return NextResponse.json({ error: "shareId is required" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Search through all documents where any shareConfig has this shareId
    const course = await db.collection("library").findOne({ 
      $or: [
        { shareId: shareId, isShared: true }, // Legacy support
        { [`shareConfigs.${shareId}`]: { $exists: true } }, // Future-proof if we used shareId as key (checking both just in case)
        { "shareConfigs": { $elemMatch: { shareId: shareId, isActive: true } } } // If we use array (let's stick to Map for easier lookup by userId, but search by shareId requires a different query)
      ]
    });

    // Actually, let's use a more robust query for the Map structure
    // Since Mongo doesn't easily search values in a map without knowing keys, 
    // we'll search for the legacy field OR use a $where or just find the item if we know the structure.
    // Better: let's ensure shareConfigs is an ARRAY of objects for easier searching by shareId.
    // OR we can keep it as a Map and just use the legacy field as a fallback.
    
    // DECISION: Let's use an ARRAY for shareConfigs instead of a Map to make search by shareId efficient.
    // [{ userId, shareId, tier, isActive, createdAt }]
    
    // First, find the course to see if it even exists
    const item = await db.collection("library").findOne({ 
      $or: [
        { shareId: shareId },
        { "shareConfigs.shareId": shareId }
      ]
    });
    
    if (!item) {
      return NextResponse.json({ error: "Shared course not found" }, { status: 404 });
    }

    // Now check if the specific share is active
    let isActive = false;
    let config = null;

    if (item.shareId === shareId && item.isShared) {
      isActive = true;
    } else if (item.shareConfigs) {
      config = item.shareConfigs.find(c => c.shareId === shareId);
      if (config?.isActive) isActive = true;
    }

    if (!isActive) {
      return NextResponse.json({ 
        error: "This share link has been disabled by the sharer.",
        isDisabled: true 
      }, { status: 403 });
    }

    // Determine access tier from the SPECIFIC share config used
    let sharerTier = item.sharePlan || TIERS.FREE;
    if (item.shareConfigs) {
      const config = item.shareConfigs.find(c => c.shareId === shareId);
      if (config) {
        sharerTier = config.tier;
      }
    }
    
    const publicCourse = {
      _id: item._id,
      title: item.title,
      topic: item.topic,
      difficulty: item.difficulty,
      totalModules: item.totalModules,
      totalLessons: item.totalLessons,
      modules: item.modules,
      isPremium: item.isPremium,
      shareId: shareId,
      sharerTier: sharerTier,
      isShared: true
    };

    return NextResponse.json({ success: true, item: publicCourse });
  } catch (error) {
    console.error("Shared course fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/library/share
// Toggle sharing for a course
export async function POST(request) {
  let token = request.headers.get("authorization")?.split("Bearer ")[1];
  let userId;

  if (!token) {
    token = (await cookies()).get("token")?.value;
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
    userId = decoded.id;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    const { courseId, shareId, action } = body; // action: 'enable' | 'disable' | 'enroll'

    if (action === "enroll") {
      if (!shareId) {
        return NextResponse.json({ error: "shareId is required for enrollment" }, { status: 400 });
      }

      // Find the source course regardless of isActive initially to give a clear error
      const sourceCourse = await db.collection("library").findOne({ 
        $or: [
          { shareId: shareId },
          { "shareConfigs.shareId": shareId }
        ]
      });

      if (!sourceCourse) {
        return NextResponse.json({ error: "Shared course not found" }, { status: 404 });
      }

      // Check if active
      let isActive = false;
      if (sourceCourse.shareId === shareId && sourceCourse.isShared) isActive = true;
      else if (sourceCourse.shareConfigs) {
        const config = sourceCourse.shareConfigs.find(c => c.shareId === shareId);
        if (config?.isActive) isActive = true;
      }

      if (!isActive) {
        return NextResponse.json({ error: "This share link has been disabled by the sharer.", isDisabled: true }, { status: 403 });
      }

      // Add user to enrolled array with invitedBy metadata
      const userObjId = new ObjectId(userId);
      const enrollmentRecord = {
        userId: userObjId,
        invitedByShareId: shareId,
        joinedAt: new Date()
      };

      await db.collection("library").updateOne(
        { _id: sourceCourse._id },
        { 
          // Use $pull then $push to ensure we update the existing record if they re-enroll
          $pull: { enrolled: { userId: userObjId } }
        }
      );

      await db.collection("library").updateOne(
        { _id: sourceCourse._id },
        { 
          $push: { enrolled: enrollmentRecord },
          $set: { lastAccessed: new Date() } 
        }
      );

      // Add to user's courses list for dashboard visibility
      const itemId = `course_${sourceCourse._id}`;
      await db.collection("user_library").updateOne(
        { userId: userObjId },
        {
          $addToSet: { inProgressCourses: itemId },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      // Fetch sharer's name from the specific config if possible
      let sharerName = "Another User";
      try {
        let sharerId = sourceCourse.userId; // Default to owner for legacy
        if (sourceCourse.shareConfigs) {
          const config = sourceCourse.shareConfigs.find(c => c.shareId === shareId);
          if (config) sharerId = config.sharerId;
        }

        const sharer = await db.collection("users").findOne({ _id: new ObjectId(sharerId) });
        if (sharer) {
          sharerName = sharer.name || sharer.fullName || "A Fellow Learner";
        }
      } catch (e) {
        console.error("Failed to fetch sharer name:", e);
      }

      return NextResponse.json({ 
        success: true, 
        message: "Enrolled successfully", 
        courseId: sourceCourse._id,
        sharerName
      });
    }

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userTier = user.subscription?.tier || (user.isPremium ? TIERS.PRO : TIERS.FREE);

    // Find the course and check if user is owner or enrolled
    const course = await db.collection("library").findOne({ 
      _id: new ObjectId(courseId)
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const isOwner = course.userId.toString() === userId.toString();
    const isEnrolled = Array.isArray(course.enrolled) 
      ? course.enrolled.some(e => (e.userId || e).toString() === userId.toString())
      : false;

    if (!isOwner && !isEnrolled) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userObjId = new ObjectId(userId);
    const existingConfig = (course.shareConfigs || []).find(c => 
      c.sharerId?.toString() === userId.toString()
    );

    if (action === "disable") {
      // 1. Disable the specific config for the current user
      const updateResult = await db.collection("library").updateOne(
        { 
          _id: new ObjectId(courseId), 
          "shareConfigs.sharerId": userObjId 
        },
        { $set: { "shareConfigs.$.isActive": false } }
      );

      // 2. Fallback for string-based sharerId
      if (updateResult.matchedCount === 0 && existingConfig) {
        await db.collection("library").updateOne(
          { 
            _id: new ObjectId(courseId), 
            "shareConfigs.sharerId": userId 
          },
          { $set: { "shareConfigs.$.isActive": false } }
        );
      }

      // 3. If it's the owner disabling THEIR own share link, 
      // or if they are the owner and they just want to kill the legacy flag
      if (isOwner) {
        await db.collection("library").updateOne(
          { _id: new ObjectId(courseId) },
          { $set: { isShared: false } }
        );
      }

      return NextResponse.json({ 
        success: true, 
        isShared: false,
        shareId: existingConfig?.shareId 
      });
    }

    // Enable sharing - Generate/Update current user's specific config
    const generatedShareId = existingConfig?.shareId || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const newConfig = {
      shareId: generatedShareId,
      sharerId: new ObjectId(userId),
      tier: userTier,
      isActive: true,
      createdAt: existingConfig?.createdAt || new Date()
    };

    await db.collection("library").updateOne(
      { _id: new ObjectId(courseId) },
      { 
        $pull: { shareConfigs: { sharerId: new ObjectId(userId) } }
      }
    );

    await db.collection("library").updateOne(
      { _id: new ObjectId(courseId) },
      { 
        $push: { shareConfigs: newConfig },
        // Legacy support if owner is enabling
        ...(isOwner ? { 
          $set: { 
            isShared: true, 
            shareId: generatedShareId, 
            sharePlan: userTier 
          } 
        } : {})
      }
    );

    return NextResponse.json({ 
      success: true, 
      isShared: true, 
      shareId: generatedShareId,
      sharePlan: userTier
    });
  } catch (error) {
    console.error("Course share toggle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
