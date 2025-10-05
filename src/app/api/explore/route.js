import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

async function seedIfEmpty(db) {
  const categoriesCol = db.collection("explore_categories");
  const trendingCol = db.collection("explore_trending");
  const featuredCol = db.collection("explore_featured");

  const [catCount, trCount, feCount] = await Promise.all([
    categoriesCol.countDocuments(),
    trendingCol.countDocuments(),
    featuredCol.countDocuments(),
  ]);

  if (catCount === 0) {
    await categoriesCol.insertMany([
      { 
        name: "Programming", 
        count: 45, 
        topics: ["JavaScript", "Python", "React", "Node.js", "TypeScript", "Vue.js", "Angular", "Java", "C++", "Go"], 
        description: "Master programming languages and frameworks",
        icon: "code",
        color: "blue"
      },
      { 
        name: "Data Science", 
        count: 28, 
        topics: ["Machine Learning", "Statistics", "Python", "R", "SQL", "Pandas", "NumPy", "TensorFlow", "PyTorch", "Jupyter"], 
        description: "Analyze data and build intelligent systems",
        icon: "chart",
        color: "green"
      },
      { 
        name: "Design", 
        count: 32, 
        topics: ["UI/UX", "Figma", "Adobe Creative", "Design Systems", "Sketch", "InVision", "Principle", "Framer", "Webflow", "Canva"], 
        description: "Create beautiful and functional designs",
        icon: "palette",
        color: "purple"
      },
      { 
        name: "Business", 
        count: 21, 
        topics: ["Marketing", "Management", "Finance", "Strategy", "Entrepreneurship", "Sales", "Project Management", "Leadership", "Analytics", "E-commerce"], 
        description: "Build and grow successful businesses",
        icon: "briefcase",
        color: "orange"
      },
      { 
        name: "Languages", 
        count: 15, 
        topics: ["Spanish", "French", "German", "Japanese", "Chinese", "Portuguese", "Italian", "Korean", "Arabic", "Russian"], 
        description: "Learn new languages and cultures",
        icon: "globe",
        color: "red"
      },
      { 
        name: "Science", 
        count: 19, 
        topics: ["Physics", "Chemistry", "Biology", "Mathematics", "Astronomy", "Geology", "Environmental Science", "Psychology", "Neuroscience", "Engineering"], 
        description: "Explore the wonders of science",
        icon: "microscope",
        color: "indigo"
      },
      { 
        name: "Cloud & DevOps", 
        count: 18, 
        topics: ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "Monitoring", "CI/CD"], 
        description: "Master cloud infrastructure and deployment",
        icon: "cloud",
        color: "cyan"
      },
      { 
        name: "Mobile Development", 
        count: 22, 
        topics: ["React Native", "Flutter", "iOS", "Android", "Swift", "Kotlin", "Xamarin", "Ionic", "Cordova", "Progressive Web Apps"], 
        description: "Build mobile applications for all platforms",
        icon: "smartphone",
        color: "pink"
      }
    ]);
  }

  if (trCount === 0) {
    await trendingCol.insertMany([
      { 
        title: "Artificial Intelligence Fundamentals", 
        students: 2340, 
        rating: 4.8, 
        duration: "6 weeks", 
        level: "Beginner",
        category: "AI/ML",
        instructor: "Dr. Sarah Johnson",
        thumbnail: "/placeholder.svg?height=200&width=300",
        description: "Learn the basics of AI and machine learning with hands-on projects",
        tags: ["Python", "TensorFlow", "Neural Networks", "Data Science"],
        price: 99,
        isPremium: false,
        createdAt: new Date()
      },
      { 
        title: "Full Stack Web Development", 
        students: 1890, 
        rating: 4.9, 
        duration: "12 weeks", 
        level: "Intermediate",
        category: "Programming",
        instructor: "Mike Chen",
        thumbnail: "/placeholder.svg?height=200&width=300",
        description: "Master both frontend and backend development with modern technologies",
        tags: ["React", "Node.js", "MongoDB", "Express"],
        price: 149,
        isPremium: true,
        createdAt: new Date()
      },
      { 
        title: "Data Analysis with Python", 
        students: 1560, 
        rating: 4.7, 
        duration: "8 weeks", 
        level: "Beginner",
        category: "Data Science",
        instructor: "Emily Rodriguez",
        thumbnail: "/placeholder.svg?height=200&width=300",
        description: "Analyze data and create visualizations using Python and popular libraries",
        tags: ["Python", "Pandas", "Matplotlib", "Seaborn"],
        price: 79,
        isPremium: false,
        createdAt: new Date()
      },
      { 
        title: "Mobile App Development with React Native", 
        students: 1230, 
        rating: 4.6, 
        duration: "10 weeks", 
        level: "Intermediate",
        category: "Mobile Development",
        instructor: "Alex Kim",
        thumbnail: "/placeholder.svg?height=200&width=300",
        description: "Build cross-platform mobile apps using React Native",
        tags: ["React Native", "JavaScript", "iOS", "Android"],
        price: 129,
        isPremium: true,
        createdAt: new Date()
      },
      { 
        title: "Cloud Architecture with AWS", 
        students: 980, 
        rating: 4.8, 
        duration: "9 weeks", 
        level: "Intermediate",
        category: "Cloud & DevOps",
        instructor: "David Wilson",
        thumbnail: "/placeholder.svg?height=200&width=300",
        description: "Design and deploy scalable applications on Amazon Web Services",
        tags: ["AWS", "EC2", "S3", "Lambda", "Docker"],
        price: 179,
        isPremium: true,
        createdAt: new Date()
      },
      { 
        title: "UI/UX Design Masterclass", 
        students: 1450, 
        rating: 4.9, 
        duration: "7 weeks", 
        level: "Beginner",
        category: "Design",
        instructor: "Lisa Park",
        thumbnail: "/placeholder.svg?height=200&width=300",
        description: "Create beautiful and user-friendly interfaces with modern design principles",
        tags: ["Figma", "User Research", "Prototyping", "Design Systems"],
        price: 119,
        isPremium: true,
        createdAt: new Date()
      }
    ]);
  }

  if (feCount === 0) {
    await featuredCol.insertMany([
      { 
        title: "Become a Frontend Developer", 
        description: "Master HTML, CSS, JavaScript, and modern frameworks to build responsive web applications", 
        modules: 8, 
        duration: "16 weeks", 
        students: 3200,
        category: "Programming",
        difficulty: "Beginner",
        rating: 4.8,
        instructor: "Sarah Chen",
        thumbnail: "/placeholder.svg?height=300&width=400",
        tags: ["HTML", "CSS", "JavaScript", "React", "Vue.js"],
        price: 199,
        isPremium: true,
        createdAt: new Date()
      },
      { 
        title: "Data Science Career Path", 
        description: "Learn statistics, Python, machine learning, and data visualization to become a data scientist", 
        modules: 12, 
        duration: "24 weeks", 
        students: 2100,
        category: "Data Science",
        difficulty: "Intermediate",
        rating: 4.9,
        instructor: "Dr. Michael Rodriguez",
        thumbnail: "/placeholder.svg?height=300&width=400",
        tags: ["Python", "Statistics", "Machine Learning", "Pandas", "Matplotlib"],
        price: 299,
        isPremium: true,
        createdAt: new Date()
      },
      { 
        title: "Digital Marketing Mastery", 
        description: "Complete guide to SEO, social media, and online advertising for modern marketers", 
        modules: 6, 
        duration: "12 weeks", 
        students: 1800,
        category: "Business",
        difficulty: "Beginner",
        rating: 4.7,
        instructor: "Jessica Martinez",
        thumbnail: "/placeholder.svg?height=300&width=400",
        tags: ["SEO", "Social Media", "Google Ads", "Analytics", "Content Marketing"],
        price: 149,
        isPremium: true,
        createdAt: new Date()
      },
      { 
        title: "Full-Stack Web Development Bootcamp", 
        description: "Complete bootcamp covering frontend, backend, databases, and deployment", 
        modules: 10, 
        duration: "20 weeks", 
        students: 2500,
        category: "Programming",
        difficulty: "Intermediate",
        rating: 4.9,
        instructor: "Alex Thompson",
        thumbnail: "/placeholder.svg?height=300&width=400",
        tags: ["React", "Node.js", "MongoDB", "Express", "Docker"],
        price: 399,
        isPremium: true,
        createdAt: new Date()
      },
      { 
        title: "Mobile App Development with Flutter", 
        description: "Build beautiful native mobile apps for iOS and Android using Flutter", 
        modules: 7, 
        duration: "14 weeks", 
        students: 1650,
        category: "Mobile Development",
        difficulty: "Intermediate",
        rating: 4.8,
        instructor: "David Kim",
        thumbnail: "/placeholder.svg?height=300&width=400",
        tags: ["Flutter", "Dart", "iOS", "Android", "Firebase"],
        price: 229,
        isPremium: true,
        createdAt: new Date()
      }
    ]);
  }
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    await seedIfEmpty(db);

    const [categories, trendingTopics, featuredPaths] = await Promise.all([
      db.collection("explore_categories").find({}).toArray(),
      db.collection("explore_trending").find({}).toArray(),
      db.collection("explore_featured").find({}).toArray(),
    ]);

    return NextResponse.json({ categories, trendingTopics, featuredPaths });
  } catch (error) {
    console.error("Error fetching explore data:", error);
    return NextResponse.json({ error: "Failed to fetch explore data" }, { status: 500 });
  }
}


