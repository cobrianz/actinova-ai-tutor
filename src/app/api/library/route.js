import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

async function seedLibraryData(db, userId) {
  const libraryCol = db.collection('user_library');
  const existingLibrary = await libraryCol.findOne({ userId });
  
  if (existingLibrary) return existingLibrary;

  const libraryData = {
    userId,
    courses: [
      {
        id: 1,
        title: "JavaScript Fundamentals",
        description: "Master the core concepts of JavaScript programming",
        progress: 75,
        totalLessons: 24,
        completedLessons: 18,
        lastAccessed: "2 hours ago",
        estimatedTime: "3 weeks",
        difficulty: "beginner",
        category: "Programming",
        isBookmarked: true,
        thumbnail: "/placeholder.svg?height=200&width=300",
        instructor: "John Smith",
        rating: 4.8,
        price: 99,
        isPremium: false,
        enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        lastProgressUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        tags: ["JavaScript", "Programming", "Web Development"],
        modules: 6,
        currentModule: 4,
        notes: ["Great explanation of closures", "Need to review async/await"],
        achievements: ["First Module Complete", "50% Progress"]
      },
      {
        id: 2,
        title: "React Development",
        description: "Build modern web applications with React",
        progress: 40,
        totalLessons: 32,
        completedLessons: 13,
        lastAccessed: "1 day ago",
        estimatedTime: "5 weeks",
        difficulty: "intermediate",
        category: "Frontend",
        isBookmarked: false,
        thumbnail: "/placeholder.svg?height=200&width=300",
        instructor: "Sarah Johnson",
        rating: 4.9,
        price: 149,
        isPremium: true,
        enrolledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        lastProgressUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        tags: ["React", "JavaScript", "Frontend", "Components"],
        modules: 8,
        currentModule: 3,
        notes: ["Hooks are tricky but powerful", "State management concepts"],
        achievements: ["Component Master", "Hooks Explorer"]
      },
      {
        id: 3,
        title: "Node.js Backend",
        description: "Create scalable backend applications",
        progress: 10,
        totalLessons: 28,
        completedLessons: 3,
        lastAccessed: "3 days ago",
        estimatedTime: "4 weeks",
        difficulty: "intermediate",
        category: "Backend",
        isBookmarked: true,
        thumbnail: "/placeholder.svg?height=200&width=300",
        instructor: "Mike Chen",
        rating: 4.7,
        price: 179,
        isPremium: true,
        enrolledAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        lastProgressUpdate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        tags: ["Node.js", "Express", "Backend", "API"],
        modules: 7,
        currentModule: 1,
        notes: ["Express routing is straightforward", "Need to understand middleware better"],
        achievements: ["First API Endpoint"]
      },
      {
        id: 4,
        title: "Python for Data Science",
        description: "Analyze data and build ML models with Python",
        progress: 100,
        totalLessons: 36,
        completedLessons: 36,
        lastAccessed: "1 week ago",
        estimatedTime: "6 weeks",
        difficulty: "beginner",
        category: "Data Science",
        isBookmarked: false,
        thumbnail: "/placeholder.svg?height=200&width=300",
        instructor: "Dr. Emily Rodriguez",
        rating: 4.9,
        price: 199,
        isPremium: true,
        enrolledAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        lastProgressUpdate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        tags: ["Python", "Data Science", "Pandas", "Machine Learning"],
        modules: 9,
        currentModule: 9,
        notes: ["Excellent course", "Great practical examples", "Ready for advanced topics"],
        achievements: ["Course Complete", "Data Analysis Expert", "ML Enthusiast", "Perfect Score"]
      },
      {
        id: 5,
        title: "UI/UX Design Principles",
        description: "Create beautiful and functional user interfaces",
        progress: 60,
        totalLessons: 20,
        completedLessons: 12,
        lastAccessed: "2 days ago",
        estimatedTime: "4 weeks",
        difficulty: "beginner",
        category: "Design",
        isBookmarked: true,
        thumbnail: "/placeholder.svg?height=200&width=300",
        instructor: "Alex Kim",
        rating: 4.6,
        price: 129,
        isPremium: true,
        enrolledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        lastProgressUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        tags: ["UI/UX", "Design", "Figma", "User Research"],
        modules: 5,
        currentModule: 3,
        notes: ["Color theory is fascinating", "Typography makes a huge difference"],
        achievements: ["Design Thinking", "Color Theory Master"]
      },
      {
        id: 6,
        title: "Advanced React Patterns",
        description: "Master advanced React concepts and design patterns",
        progress: 25,
        totalLessons: 28,
        completedLessons: 7,
        lastAccessed: "5 days ago",
        estimatedTime: "6 weeks",
        difficulty: "advanced",
        category: "Frontend",
        isBookmarked: true,
        thumbnail: "/placeholder.svg?height=200&width=300",
        instructor: "Emma Thompson",
        rating: 4.9,
        price: 179,
        isPremium: true,
        enrolledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        lastProgressUpdate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        tags: ["React", "Advanced", "Hooks", "Performance"],
        modules: 5,
        currentModule: 2,
        notes: ["Complex patterns but very useful", "Need more practice with custom hooks"],
        achievements: ["Advanced Learner"]
      }
    ],
    bookmarks: [1, 3, 5, 6], // Course IDs that are bookmarked
    completedCourses: [4], // Course IDs that are completed
    inProgressCourses: [1, 2, 3, 5, 6], // Course IDs that are in progress
    totalLearningTime: 45, // hours
    streak: 7, // days
    achievements: [
      {
        id: 1,
        title: "First Course Complete",
        description: "Completed your first course",
        icon: "trophy",
        earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        title: "Week Streak",
        description: "Learned for 7 days in a row",
        icon: "fire",
        earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        title: "Bookmark Master",
        description: "Bookmarked 5 courses",
        icon: "bookmark",
        earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await libraryCol.insertOne(libraryData);
  return libraryData;
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 6;
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    const libraryData = await seedLibraryData(db, decoded.id);
    
    // Get generated courses from courses collection
    const coursesCol = db.collection('courses');
    const generatedCourses = await coursesCol.find({ 
      createdBy: decoded.id 
    }).sort({ createdAt: -1 }).toArray();
    
    // Convert generated courses to library format
    const libraryGeneratedCourses = generatedCourses.map((course, index) => ({
      id: `generated_${course._id}`,
      title: course.title,
      description: course.description || `A ${course.level} level course on ${course.title}`,
      progress: 0,
      totalLessons: course.totalLessons || (course.modules ? course.modules.reduce((acc, module) => acc + module.lessons.length, 0) : 0),
      completedLessons: 0,
      lastAccessed: "Never",
      estimatedTime: "Self-paced",
      difficulty: course.level || "beginner",
      category: "Generated",
      isBookmarked: false,
      thumbnail: null, // No thumbnail for generated courses
      instructor: "AI Tutor",
      rating: 0,
      price: 0,
      isPremium: false,
      isGenerated: true,
      enrolledAt: course.createdAt,
      lastProgressUpdate: course.createdAt,
      tags: course.tags || [],
      modules: course.totalModules || (course.modules ? course.modules.length : 0),
      currentModule: 1,
      notes: [],
      achievements: []
    }));
    
    // Combine library courses with generated courses
    const allCourses = [...libraryData.courses, ...libraryGeneratedCourses];
    
    let filteredCourses = allCourses;

    // Apply search filter
    if (search) {
      filteredCourses = filteredCourses.filter(course =>
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase()) ||
        course.instructor.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply category filter
    if (filter !== 'all') {
      switch (filter) {
        case 'completed':
          filteredCourses = filteredCourses.filter(course => course.progress === 100);
          break;
        case 'in-progress':
          filteredCourses = filteredCourses.filter(course => course.progress > 0 && course.progress < 100);
          break;
        case 'bookmarked':
          filteredCourses = filteredCourses.filter(course => course.isBookmarked);
          break;
        default:
          // Filter by category name
          filteredCourses = filteredCourses.filter(course => 
            course.category.toLowerCase() === filter.toLowerCase()
          );
      }
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedCourses = filteredCourses.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(filteredCourses.length / limit);

    return NextResponse.json({
      courses: paginatedCourses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCourses: filteredCourses.length,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        totalCourses: allCourses.length,
        completedCourses: allCourses.filter(c => c.progress === 100).length,
        inProgressCourses: allCourses.filter(c => c.progress > 0 && c.progress < 100).length,
        bookmarkedCourses: allCourses.filter(c => c.isBookmarked).length,
        totalLearningTime: libraryData.totalLearningTime,
        streak: libraryData.streak
      },
      achievements: libraryData.achievements
    });
  } catch (error) {
    console.error('Error fetching library data:', error);
    return NextResponse.json({ error: 'Failed to fetch library data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, courseId } = await request.json();
    const { db } = await connectToDatabase();
    const libraryCol = db.collection('user_library');

    const libraryData = await libraryCol.findOne({ userId: decoded.id });
    if (!libraryData) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 });
    }

    switch (action) {
      case 'bookmark':
        const course = libraryData.courses.find(c => c.id === courseId);
        if (course) {
          course.isBookmarked = !course.isBookmarked;
          if (course.isBookmarked) {
            libraryData.bookmarks.push(courseId);
          } else {
            libraryData.bookmarks = libraryData.bookmarks.filter(id => id !== courseId);
          }
        }
        break;
      
      case 'delete':
        libraryData.courses = libraryData.courses.filter(c => c.id !== courseId);
        libraryData.bookmarks = libraryData.bookmarks.filter(id => id !== courseId);
        libraryData.completedCourses = libraryData.completedCourses.filter(id => id !== courseId);
        libraryData.inProgressCourses = libraryData.inProgressCourses.filter(id => id !== courseId);
        break;
      
      case 'update_progress':
        const { progress, completedLessons } = await request.json();
        const courseToUpdate = libraryData.courses.find(c => c.id === courseId);
        if (courseToUpdate) {
          courseToUpdate.progress = progress;
          courseToUpdate.completedLessons = completedLessons;
          courseToUpdate.lastProgressUpdate = new Date();
          
          if (progress === 100 && !libraryData.completedCourses.includes(courseId)) {
            libraryData.completedCourses.push(courseId);
            libraryData.inProgressCourses = libraryData.inProgressCourses.filter(id => id !== courseId);
          } else if (progress > 0 && progress < 100 && !libraryData.inProgressCourses.includes(courseId)) {
            libraryData.inProgressCourses.push(courseId);
          }
        }
        break;
    }

    libraryData.updatedAt = new Date();
    await libraryCol.updateOne(
      { userId: decoded.id },
      { $set: libraryData }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating library:', error);
    return NextResponse.json({ error: 'Failed to update library' }, { status: 500 });
  }
}
