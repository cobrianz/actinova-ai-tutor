import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

async function seedIfEmpty(db) {
  const col = db.collection('premium_courses');
  const count = await col.countDocuments();
  if (count > 0) return;
  await col.insertMany([
    { 
      title: "Complete Full-Stack Development Bootcamp", 
      description: "Master both frontend and backend development with React and Node.js", 
      instructor: "Sarah Chen", 
      duration: "12 weeks", 
      students: 15420, 
      rating: 4.9, 
      difficulty: "Intermediate", 
      category: "Full-Stack Development", 
      thumbnail: "/placeholder.svg?height=400&width=600", 
      highlights: ["Build 5 real-world projects", "Learn industry best practices", "Get job-ready skills", "Lifetime access to updates"], 
      premiumNote: "This course perfectly balances theory and practice. Sarah's teaching style makes complex concepts accessible to everyone.", 
      featured: true, 
      price: 199, 
      originalPrice: 299, 
      isPremium: true,
      tags: ["React", "Node.js", "MongoDB", "Express", "JavaScript"],
      modules: 8,
      lessons: 45,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      title: "AI and Machine Learning Fundamentals", 
      description: "Dive into the world of artificial intelligence and machine learning with hands-on projects", 
      instructor: "Dr. Michael Rodriguez", 
      duration: "8 weeks", 
      students: 8930, 
      rating: 4.8, 
      difficulty: "Beginner", 
      category: "AI/ML", 
      thumbnail: "/placeholder.svg?height=200&width=300", 
      premiumNote: "Perfect introduction to AI concepts with hands-on projects that build real-world skills.", 
      badge: "Trending", 
      price: 149, 
      originalPrice: 199, 
      isPremium: true,
      tags: ["Python", "TensorFlow", "Scikit-learn", "Neural Networks", "Data Science"],
      modules: 6,
      lessons: 32,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      title: "Advanced React Patterns", 
      description: "Master advanced React concepts and design patterns used by senior developers", 
      instructor: "Emma Thompson", 
      duration: "6 weeks", 
      students: 5670, 
      rating: 4.9, 
      difficulty: "Advanced", 
      category: "Frontend", 
      thumbnail: "/placeholder.svg?height=200&width=300", 
      premiumNote: "Essential for React developers looking to level up their skills and write maintainable code.", 
      badge: "Expert Level", 
      price: 179, 
      originalPrice: 249, 
      isPremium: true,
      tags: ["React", "Hooks", "Context", "Performance", "Testing"],
      modules: 5,
      lessons: 28,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      title: "Cloud Architecture with AWS", 
      description: "Design and deploy scalable cloud solutions using Amazon Web Services", 
      instructor: "James Wilson", 
      duration: "10 weeks", 
      students: 7240, 
      rating: 4.7, 
      difficulty: "Intermediate", 
      category: "Cloud Computing", 
      thumbnail: "/placeholder.svg?height=200&width=300", 
      premiumNote: "Comprehensive coverage of AWS services with real-world scenarios and best practices.", 
      badge: "Industry Favorite", 
      price: 219, 
      originalPrice: 299, 
      isPremium: true,
      tags: ["AWS", "EC2", "S3", "Lambda", "Docker"],
      modules: 7,
      lessons: 38,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      title: "UX Research and Design Thinking", 
      description: "Learn user-centered design principles and research methods for creating better products", 
      instructor: "Lisa Park", 
      duration: "7 weeks", 
      students: 4580, 
      rating: 4.8, 
      difficulty: "Beginner", 
      category: "UX/UI Design", 
      thumbnail: "/placeholder.svg?height=200&width=300", 
      premiumNote: "Excellent foundation for anyone interested in UX design and creating user-friendly interfaces.", 
      badge: "Creative Choice", 
      price: 159, 
      originalPrice: 219, 
      isPremium: true,
      tags: ["Figma", "User Research", "Prototyping", "Usability Testing", "Design Systems"],
      modules: 6,
      lessons: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      title: "Cybersecurity Essentials", 
      description: "Protect systems and data with modern security practices and threat mitigation", 
      instructor: "Robert Kim", 
      duration: "9 weeks", 
      students: 6120, 
      rating: 4.6, 
      difficulty: "Intermediate", 
      category: "Security", 
      thumbnail: "/placeholder.svg?height=200&width=300", 
      premiumNote: "Critical knowledge for today's digital landscape with hands-on security labs.", 
      badge: "High Demand", 
      price: 189, 
      originalPrice: 259, 
      isPremium: true,
      tags: ["Network Security", "Penetration Testing", "Cryptography", "Risk Assessment", "Compliance"],
      modules: 8,
      lessons: 42,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      title: "Data Visualization with D3.js", 
      description: "Create stunning interactive data visualizations that tell compelling stories", 
      instructor: "Anna Martinez", 
      duration: "5 weeks", 
      students: 3890, 
      rating: 4.9, 
      difficulty: "Intermediate", 
      category: "Data Science", 
      thumbnail: "/placeholder.svg?height=200&width=300", 
      premiumNote: "Beautiful course that makes data come alive with interactive visualizations.", 
      badge: "Visual Excellence", 
      price: 139, 
      originalPrice: 189, 
      isPremium: true,
      tags: ["D3.js", "JavaScript", "SVG", "Data Analysis", "Interactive Charts"],
      modules: 4,
      lessons: 24,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { 
      title: "DevOps and CI/CD Pipeline", 
      description: "Master modern DevOps practices and build robust deployment pipelines", 
      instructor: "David Chen", 
      duration: "8 weeks", 
      students: 5230, 
      rating: 4.7, 
      difficulty: "Intermediate", 
      category: "DevOps", 
      thumbnail: "/placeholder.svg?height=200&width=300", 
      premiumNote: "Comprehensive guide to modern DevOps practices with real-world project experience.", 
      badge: "Industry Standard", 
      price: 199, 
      originalPrice: 279, 
      isPremium: true,
      tags: ["Docker", "Kubernetes", "Jenkins", "GitLab", "Monitoring"],
      modules: 6,
      lessons: 35,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
}

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    await seedIfEmpty(db);
    const col = db.collection('premium_courses');
    const [featured] = await col.find({ featured: true }).limit(1).toArray();
    const courses = await col.find({ featured: { $ne: true } }).toArray();
    return NextResponse.json({ featured, courses });
  } catch (e) {
    console.error('Error fetching premium courses:', e);
    return NextResponse.json({ error: 'Failed to fetch premium courses' }, { status: 500 });
  }
}


