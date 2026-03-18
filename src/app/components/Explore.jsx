"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Users,
  Clock,
  Star,
  TrendingUp,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { apiClient } from "@/lib/csrfClient";

const staticCategories = [
  {
    name: "Technology",
    count: 67,
    topics: [
      "Programming & Development",
      "AI & Machine Learning",
      "Game Development",
      "Web Development",
      "Mobile Apps",
      "Cloud Computing",
      "Cybersecurity",
      "Blockchain",
    ],
    description: "Master cutting-edge technology skills",
    icon: "code",
    color: "blue",
  },
  {
    name: "Design",
    count: 32,
    topics: [
      "UI/UX Design",
      "Graphic Design",
      "Design Systems",
      "Figma",
      "Adobe Creative",
      "3D Modeling",
      "Animation",
      "Branding",
    ],
    description: "Create beautiful and functional designs",
    icon: "palette",
    color: "purple",
  },
  {
    name: "Business",
    count: 41,
    topics: [
      "Entrepreneurship",
      "Marketing",
      "Finance",
      "Management",
      "Strategy",
      "Sales",
      "Project Management",
      "Leadership",
      "E-commerce",
    ],
    description: "Build and grow successful businesses",
    icon: "briefcase",
    color: "orange",
  },
  {
    name: "Data Science",
    count: 28,
    topics: [
      "Data Analysis",
      "Machine Learning",
      "Statistics",
      "Python",
      "R",
      "SQL",
      "Visualization",
      "Big Data",
      "AI Ethics",
    ],
    description: "Analyze data and build intelligent systems",
    icon: "chart",
    color: "green",
  },
  {
    name: "AI & ML",
    count: 24,
    topics: [
      "Neural Networks",
      "Deep Learning",
      "Computer Vision",
      "NLP",
      "Reinforcement Learning",
      "AutoML",
      "AI Ethics",
      "Model Deployment",
    ],
    description: "Explore artificial intelligence and machine learning",
    icon: "brain",
    color: "indigo",
  },
  {
    name: "Creative",
    count: 29,
    topics: [
      "Photography",
      "Videography",
      "Music Production",
      "Digital Art",
      "Animation",
      "Content Creation",
      "Video Editing",
      "Sound Design",
    ],
    description: "Express creativity through digital media",
    icon: "camera",
    color: "pink",
  },
  {
    name: "Humanities",
    count: 22,
    topics: [
      "Writing",
      "Literature",
      "History",
      "Philosophy",
      "Psychology",
      "Sociology",
      "Cultural Studies",
      "Ethics",
      "Critical Thinking",
    ],
    description: "Explore human culture and society",
    icon: "book",
    color: "red",
  },
  {
    name: "Languages",
    count: 15,
    topics: [
      "Spanish",
      "French",
      "German",
      "Japanese",
      "Chinese",
      "Portuguese",
      "Italian",
      "Korean",
      "Arabic",
      "Russian",
    ],
    description: "Learn new languages and cultures",
    icon: "globe",
    color: "cyan",
  },
  {
    name: "Science",
    count: 19,
    topics: [
      "Physics",
      "Chemistry",
      "Biology",
      "Astronomy",
      "Geology",
      "Environmental Science",
      "Neuroscience",
      "Engineering",
      "Research Methods",
    ],
    description: "Explore the wonders of science",
    icon: "microscope",
    color: "teal",
  },
  {
    name: "Mathematics",
    count: 16,
    topics: [
      "Calculus",
      "Statistics",
      "Algebra",
      "Geometry",
      "Discrete Math",
      "Linear Algebra",
      "Probability",
      "Number Theory",
    ],
    description: "Master mathematical concepts and applications",
    icon: "calculator",
    color: "yellow",
  },
  {
    name: "Health",
    count: 18,
    topics: [
      "Nutrition",
      "Fitness",
      "Mental Health",
      "Wellness",
      "Anatomy",
      "Physiology",
      "Healthcare",
      "Preventive Medicine",
    ],
    description: "Promote health and wellness",
    icon: "heart",
    color: "rose",
  },
  {
    name: "Lifestyle",
    count: 14,
    topics: [
      "Cooking",
      "Baking",
      "Home Organization",
      "Gardening",
      "DIY Crafts",
      "Sustainable Living",
      "Personal Finance",
      "Time Management",
    ],
    description: "Enhance daily life and personal growth",
    icon: "home",
    color: "emerald",
  },
  {
    name: "Music & Audio",
    count: 21,
    topics: [
      "Music Production",
      "Audio Engineering",
      "Sound Design",
      "Music Theory",
      "Digital Audio Workstations",
      "Mixing & Mastering",
      "Recording Techniques",
      "Music Composition",
      "Podcast Production",
      "Voice Acting",
    ],
    description: "Create and produce music and audio content",
    icon: "music",
    color: "violet",
  },
  {
    name: "Cybersecurity",
    count: 18,
    topics: [
      "Network Security",
      "Ethical Hacking",
      "Cryptography",
      "Cyber Threats",
      "Security Protocols",
      "Penetration Testing",
      "Digital Forensics",
      "Security Auditing",
    ],
    description: "Protect systems and data from cyber threats",
    icon: "shield",
    color: "red",
  },
  {
    name: "Leadership",
    count: 15,
    topics: [
      "Leadership Skills",
      "Team Management",
      "Communication",
      "Negotiation",
      "Conflict Resolution",
      "Motivation",
      "Decision Making",
      "Strategic Planning",
    ],
    description: "Develop leadership and management skills",
    icon: "users",
    color: "blue",
  },
  {
    name: "Sales & Marketing",
    count: 20,
    topics: [
      "Digital Marketing",
      "SEO",
      "Social Media Marketing",
      "Content Marketing",
      "Email Marketing",
      "Sales Techniques",
      "Customer Relationship",
      "Market Research",
    ],
    description: "Master sales and marketing strategies",
    icon: "trending-up",
    color: "green",
  },
  {
    name: "Visual Arts",
    count: 16,
    topics: [
      "Drawing",
      "Painting",
      "Digital Art",
      "Graphic Design",
      "Photography",
      "Sculpture",
      "Art History",
      "Color Theory",
    ],
    description: "Explore visual creativity and artistic expression",
    icon: "palette",
    color: "purple",
  },
  {
    name: "Writing",
    count: 14,
    topics: [
      "Creative Writing",
      "Screenwriting",
      "Copywriting",
      "Technical Writing",
      "Journalism",
      "Poetry",
      "Fiction Writing",
      "Non-fiction Writing",
    ],
    description: "Master the art of written communication",
    icon: "pen",
    color: "indigo",
  },
  {
    name: "Fitness",
    count: 12,
    topics: [
      "Exercise Science",
      "Personal Training",
      "Yoga",
      "Pilates",
      "Strength Training",
      "Cardio Fitness",
      "Nutrition",
      "Sports Performance",
    ],
    description: "Achieve peak physical fitness and health",
    icon: "activity",
    color: "orange",
  },
  {
    name: "Mental Health",
    count: 10,
    topics: [
      "Mindfulness",
      "Stress Management",
      "Emotional Intelligence",
      "Therapy Techniques",
      "Mental Wellness",
      "Coping Strategies",
      "Self-Care",
      "Psychology Basics",
    ],
    description: "Promote mental well-being and emotional health",
    icon: "brain",
    color: "teal",
  },
  {
    name: "Engineering",
    count: 19,
    topics: [
      "Mechanical Engineering",
      "Electrical Engineering",
      "Civil Engineering",
      "Software Engineering",
      "Chemical Engineering",
      "Biomedical Engineering",
      "Aerospace Engineering",
      "Environmental Engineering",
    ],
    description: "Learn engineering principles and applications",
    icon: "cog",
    color: "gray",
  },
  {
    name: "Finance",
    count: 17,
    topics: [
      "Personal Finance",
      "Investment Analysis",
      "Financial Modeling",
      "Cryptocurrency",
      "Banking",
      "Financial Planning",
      "Risk Management",
      "Accounting Principles",
    ],
    description: "Master financial concepts and money management",
    icon: "dollar-sign",
    color: "yellow",
  },
  {
    name: "Law",
    count: 13,
    topics: [
      "Constitutional Law",
      "Contract Law",
      "Criminal Law",
      "Business Law",
      "International Law",
      "Legal Research",
      "Legal Writing",
      "Ethics in Law",
    ],
    description: "Understand legal systems and principles",
    icon: "scale",
    color: "slate",
  },
  {
    name: "Blockchain",
    count: 11,
    topics: [
      "Cryptocurrency",
      "Smart Contracts",
      "Decentralized Applications",
      "Blockchain Technology",
      "Web3",
      "NFTs",
      "DeFi",
      "Blockchain Security",
    ],
    description: "Explore blockchain and decentralized technologies",
    icon: "link",
    color: "emerald",
  },
  {
    name: "Test Preparation",
    count: 15,
    topics: [
      "SAT",
      "ACT",
      "GRE",
      "GMAT",
      "LSAT",
      "MCAT",
      "TOEFL",
      "IELTS",
      "DELE",
      "HSK",
    ],
    description: "Prepare for standardized tests and certifications",
    icon: "clipboard-check",
    color: "cyan",
  },
  {
    name: "Language Arts",
    count: 12,
    topics: [
      "Reading Comprehension",
      "Writing",
      "Grammar",
      "Literature",
      "Creative Writing",
      "Poetry",
      "Essay Writing",
      "Journalism",
    ],
    description: "Master reading, writing, and literary analysis",
    icon: "book-open",
    color: "purple",
  },
  {
    name: "Social Studies",
    count: 14,
    topics: [
      "History",
      "Geography",
      "Economics",
      "Government",
      "Sociology",
      "Psychology",
      "World History",
      "Civics",
    ],
    description: "Explore human societies and civilizations",
    icon: "globe",
    color: "blue",
  },
  {
    name: "Web Development",
    count: 18,
    topics: [
      "Frontend Development",
      "Backend Development",
      "Full Stack Development",
      "HTML/CSS",
      "JavaScript",
      "React",
      "Node.js",
      "Database Design",
    ],
    description: "Build modern web applications",
    icon: "code",
    color: "green",
  },
  {
    name: "Project Management",
    count: 16,
    topics: [
      "Agile Methodology",
      "Scrum",
      "Risk Management",
      "Time Management",
      "Project Planning",
      "Team Leadership",
      "Budgeting",
      "Quality Assurance",
    ],
    description: "Master project planning and execution",
    icon: "clipboard-list",
    color: "orange",
  },
  {
    name: "Sign Language",
    count: 8,
    topics: [
      "American Sign Language",
      "British Sign Language",
      "Fingerspelling",
      "Sign Language Grammar",
      "Cultural Aspects",
      "Basic Communication",
      "Advanced Signs",
    ],
    description: "Learn sign languages for communication",
    icon: "hand",
    color: "indigo",
  },
  {
    name: "Health Sciences",
    count: 13,
    topics: [
      "Anatomy",
      "Physiology",
      "Nutrition",
      "First Aid",
      "Medical Terminology",
      "Pathology",
      "Pharmacology",
      "Medical Ethics",
    ],
    description: "Study human health and medical sciences",
    icon: "stethoscope",
    color: "red",
  },
  {
    name: "IT Skills",
    count: 15,
    topics: [
      "Cloud Computing",
      "Network Administration",
      "Database Management",
      "System Administration",
      "IT Security",
      "DevOps",
      "Virtualization",
      "IT Support",
    ],
    description: "Develop essential IT and technical skills",
    icon: "server",
    color: "gray",
  },
  {
    name: "Technical Trades",
    count: 12,
    topics: [
      "Automotive Repair",
      "HVAC Systems",
      "Plumbing",
      "Electrical Work",
      "Welding",
      "Carpentry",
      "Construction",
      "Maintenance",
    ],
    description: "Learn hands-on technical trade skills",
    icon: "wrench",
    color: "slate",
  },
  {
    name: "Advanced Math",
    count: 10,
    topics: [
      "Linear Algebra",
      "Differential Equations",
      "Discrete Mathematics",
      "Abstract Algebra",
      "Real Analysis",
      "Complex Analysis",
      "Topology",
    ],
    description: "Explore advanced mathematical concepts",
    icon: "calculator",
    color: "yellow",
  },
  {
    name: "Advanced Science",
    count: 11,
    topics: [
      "Quantum Physics",
      "Organic Chemistry",
      "Genetics",
      "Neuroscience",
      "Biochemistry",
      "Astrophysics",
      "Microbiology",
    ],
    description: "Dive into advanced scientific fields",
    icon: "microscope",
    color: "teal",
  },
  {
    name: "Personal Finance",
    count: 14,
    topics: [
      "Budgeting",
      "Investing",
      "Retirement Planning",
      "Tax Preparation",
      "Debt Management",
      "Financial Planning",
      "Insurance",
      "Estate Planning",
    ],
    description: "Manage personal finances effectively",
    icon: "dollar-sign",
    color: "emerald",
  },
  {
    name: "Career Development",
    count: 13,
    topics: [
      "Resume Writing",
      "Interview Skills",
      "Career Planning",
      "Networking",
      "Job Search",
      "Professional Development",
      "Mentorship",
      "Workplace Skills",
    ],
    description: "Advance your career and professional growth",
    icon: "briefcase",
    color: "cyan",
  },
  {
    name: "Soft Skills",
    count: 12,
    topics: [
      "Time Management",
      "Public Speaking",
      "Critical Thinking",
      "Problem Solving",
      "Communication",
      "Emotional Intelligence",
      "Adaptability",
      "Teamwork",
    ],
    description: "Develop essential interpersonal skills",
    icon: "users",
    color: "pink",
  },
  {
    name: "Study Skills",
    count: 10,
    topics: [
      "Learning Strategies",
      "Note-taking",
      "Exam Preparation",
      "Memory Techniques",
      "Research Skills",
      "Academic Writing",
      "Test Strategies",
    ],
    description: "Master effective learning and study techniques",
    icon: "graduation-cap",
    color: "violet",
  },
  {
    name: "Robotics",
    count: 9,
    topics: [
      "Robot Programming",
      "Automation",
      "Mechatronics",
      "Control Systems",
      "Sensors",
      "Actuators",
      "AI in Robotics",
    ],
    description: "Learn robotics and automation technologies",
    icon: "cpu",
    color: "orange",
  },
  {
    name: "Sustainability",
    count: 11,
    topics: [
      "Renewable Energy",
      "Sustainable Architecture",
      "Climate Science",
      "Environmental Policy",
      "Green Technology",
      "Conservation",
      "Sustainable Business",
    ],
    description: "Explore sustainable practices and technologies",
    icon: "leaf",
    color: "green",
  },
  {
    name: "Gaming",
    count: 10,
    topics: [
      "Game Strategy",
      "Game Design",
      "Esports Training",
      "Game Development",
      "Gaming Psychology",
      "Virtual Reality",
      "Game Theory",
    ],
    description: "Master gaming skills and game development",
    icon: "gamepad-2",
    color: "purple",
  },
  {
    name: "Cooking",
    count: 12,
    topics: [
      "Culinary Arts",
      "Baking",
      "International Cuisine",
      "Nutrition Cooking",
      "Food Safety",
      "Recipe Development",
      "Kitchen Management",
    ],
    description: "Learn cooking and culinary techniques",
    icon: "chef-hat",
    color: "red",
  },
  {
    name: "Crafts",
    count: 10,
    topics: [
      "Woodworking",
      "Knitting",
      "Sewing",
      "Jewelry Making",
      "Paper Crafts",
      "Pottery",
      "Leatherwork",
      "Metalwork",
    ],
    description: "Explore creative crafting and handmade arts",
    icon: "scissors",
    color: "pink",
  },
  {
    name: "Outdoor Skills",
    count: 11,
    topics: [
      "Survival Skills",
      "Camping",
      "Hiking",
      "Fishing",
      "Navigation",
      "Wilderness First Aid",
      "Outdoor Cooking",
      "Environmental Awareness",
    ],
    description: "Develop outdoor survival and recreational skills",
    icon: "mountain",
    color: "brown",
  },
  {
    name: "Standardized Tests",
    count: 8,
    topics: ["SAT", "ACT", "GRE", "GMAT", "LSAT", "MCAT", "SAT Subject Tests"],
    description: "Prepare for college entrance exams",
    icon: "clipboard-check",
    color: "blue",
  },
  {
    name: "Professional Certifications",
    count: 12,
    topics: [
      "AWS Certification",
      "Google Cloud",
      "CompTIA",
      "Microsoft Certifications",
      "Cisco Certifications",
      "Project Management Certs",
      "IT Certifications",
    ],
    description: "Earn professional certifications for career advancement",
    icon: "award",
    color: "gold",
  },
  {
    name: "Language Tests",
    count: 6,
    topics: ["TOEFL", "IELTS", "DELE", "HSK", "JLPT", "TestDaF"],
    description: "Prepare for language proficiency exams",
    icon: "message-square",
    color: "indigo",
  },
];

const getButtonColorStyles = () => {
  return "bg-violet-600 hover:bg-violet-700 text-white border-violet-600";
};

export default function Explore() {
  const router = useRouter();
  const { user, refreshToken } = useAuth();
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingCourse, setGeneratingCourse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [isPremium, setIsPremium] = useState("");
  const [pagination, setPagination] = useState({});
  const [generatedCourses, setGeneratedCourses] = useState([]);
  const [exploringCategory, setExploringCategory] = useState(null);
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [minimizedSections, setMinimizedSections] = useState(new Set());
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(9);
  const [selectedCategoryForModal, setSelectedCategoryForModal] =
    useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalData, setLimitModalData] = useState(null);
  const coursesPerPage = 12;

  // Check if user is premium using consistent logic - use tier (set by billing)
  const userIsPremium =
    !!(
      (user?.subscription?.tier === "pro" || user?.subscription?.tier === "enterprise") &&
      user?.subscription?.status === "active"
    ) || !!user?.isPremium;

  const atLimit = !!(
    user?.usage?.isAtLimit ||
    (!userIsPremium && user?.usage?.remaining === 0)
  );

  // Filtered categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return staticCategories;
    const query = searchQuery.toLowerCase();
    return staticCategories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query) ||
        category.topics.some((topic) => topic.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Reset visible categories count when search changes
  useEffect(() => {
    setVisibleCategoriesCount(9);
  }, [searchQuery]);

  // Filtered trending topics based on search query
  const filteredTrendingTopics = useMemo(() => {
    if (!searchQuery.trim()) return trendingTopics;
    const query = searchQuery.toLowerCase();
    return trendingTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query) ||
        topic.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        topic.category.toLowerCase().includes(query)
    );
  }, [trendingTopics, searchQuery]);

  useEffect(() => {
    fetchExploreData();
    loadPersistedCourses();
  }, []);

  const loadPersistedCourses = async () => {
    try {
      // First check localStorage
      const localData = localStorage.getItem("exploredCourses");
      let courses = [];

      if (localData) {
        const parsed = JSON.parse(localData);
        const now = new Date();
        const validCourses = parsed.filter((course) => {
          const generatedAt = new Date(course.generatedAt);
          const hoursDiff = (now - generatedAt) / (1000 * 60 * 60);
          return hoursDiff < 24; // Keep courses generated within 24 hours
        });
        courses = validCourses;
      }

      // If no valid courses in localStorage, check database (server reads auth from HttpOnly cookie)
      if (courses.length === 0) {
        try {
          const response = await apiClient.get("/api/explore/persisted-courses");

          if (response.ok) {
            const dbData = await response.json();
            const now = new Date();
            const validDbCourses = (dbData.courses || []).filter((course) => {
              const generatedAt = new Date(course.generatedAt);
              const hoursDiff = (now - generatedAt) / (1000 * 60 * 60);
              return hoursDiff < 24;
            });

            if (validDbCourses.length > 0) {
              courses = validDbCourses;
              // Save to localStorage for faster future access
              localStorage.setItem(
                "exploredCourses",
                JSON.stringify(validDbCourses)
              );
            }
          }
        } catch (error) {
          console.error("Error loading courses from database:", error);
        }
      }

      if (courses.length > 0) {
        setGeneratedCourses(courses);
      }
    } catch (error) {
      console.error("Error loading persisted courses:", error);
    }
  };

  const saveCoursesToStorage = (courses) => {
    try {
      localStorage.setItem("exploredCourses", JSON.stringify(courses));
    } catch (error) {
      console.error("Error saving courses to storage:", error);
    }
  };

  const saveCoursesToDatabase = async (courses) => {
    try {
      await apiClient.post("/api/explore/persisted-courses", { courses });
    } catch (error) {
      console.error("Error saving courses to database:", error);
    }
  };

  useEffect(() => {
    if (
      searchQuery ||
      selectedCategory ||
      selectedDifficulty ||
      isPremium !== ""
    ) {
      fetchCourses();
    }
  }, [
    currentPage,
    searchQuery,
    selectedCategory,
    selectedDifficulty,
    isPremium,
  ]);

  const fetchExploreData = async () => {
    try {
      setLoading(true);
      // Fetch AI-generated trending topics (auth via HttpOnly cookie)
      const trendingResponse = await apiClient.get("/api/explore/trending-topics");
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingTopics((trendingData.topics || []).slice(0, 12));
      }
    } catch (error) {
      console.error("Error fetching explore data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: coursesPerPage.toString(),
        search: searchQuery,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        isPremium: isPremium,
      });

      const response = await apiClient.get(`/api/courses?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPagination(data.pagination || {});
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const handleGenerateCourse = async (topic) => {
    if (generatingCourse) return;

    if (atLimit) {
      setShowLimitModal(true);
      setLimitModalData({
        used: user?.usage?.used || 0,
        limit: user?.usage?.limit || 5, // fallback
        isPremium: userIsPremium,
        topic: topic.title,
      });
      return;
    }

    // Plan enforcement for difficulty levels (Intermediate/Advanced require Pro)
    const topicDifficulty = (topic.difficulty || "beginner").toLowerCase();
    if (!userIsPremium && (topicDifficulty === "intermediate" || topicDifficulty === "advanced")) {
      toast.error("Intermediate and Advanced levels require a Pro subscription. Redirecting to upgrade...");
      setTimeout(() => router.push("/pricing"), 2000);
      return;
    }

    setGeneratingCourse(topic.title);
    toast.loading(`Generating course: ${topic.title}...`, { id: "generating" });

    try {
      // 1. Determine difficulty (already checked for premium, but safe to force beginner for UI consistency)
      let difficulty = topicDifficulty;
      if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
        difficulty = "beginner";
      }

      if (!userIsPremium) {
        difficulty = "beginner";
      }

      // Generate the course (server reads cookie for auth)
      const response = await apiClient.post("/api/generate-course", {
        topic: topic.title,
        format: "course",
        difficulty,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle monthly limit reached error
        if (response.status === 429) {
          toast.dismiss("generating");
          setShowLimitModal(true);
          setLimitModalData({
            used: errorData.used || 0,
            limit: errorData.limit || 5,
            isPremium: errorData.isPremium || false,
            topic: topic.title,
          });
          return;
        }

        throw new Error(errorData.error || "Failed to generate course");
      }

      const responseData = await response.json();

      toast.success(`Course "${topic.title}" generated successfully!`, {
        id: "generating",
      });

      // Navigate to the learning page with safer URL encoding
      if (responseData.courseId || responseData.success) {
        const safeTopic = topic.title
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-");
        router.push(
          `/learn/${encodeURIComponent(safeTopic)}?format=course&difficulty=${topic.difficulty || "beginner"}&originalTopic=${encodeURIComponent(topic.title)}`
        );
      }
    } catch (error) {
      console.error("Error generating course:", error);
      toast.error(error.message || "Failed to generate course", {
        id: "generating",
      });
    } finally {
      setGeneratingCourse(null);
    }
  };

  const handleExploreCategory = async (category, retryAfterRefresh = true) => {
    // Check if user is premium
    if (!userIsPremium) {
      setSelectedCategoryForModal(category);
      setShowPremiumModal(true);
      return;
    }

    if (atLimit) {
      setShowLimitModal(true);
      setLimitModalData({
        used: user?.usage?.used || 0,
        limit: user?.usage?.limit || 5, // fallback
        isPremium: userIsPremium,
        topic: category.name,
      });
      return;
    }

    // Generate a unique ID for this category exploration
    const categoryId = `category-${category.name}-${Date.now()}`;

    setExploringCategory(category.name);

    try {
      const response = await apiClient.get(
        `/api/explore/category-courses?category=${encodeURIComponent(category.name)}`
      );

      if (response.status === 401 && retryAfterRefresh) {
        // Try to refresh token and retry

        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          return handleExploreCategory(category, false);
        } else {
          toast.error("Session expired. Please log in again.");
          setExploringCategory(null);
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        const newGeneratedSet = {
          category: category.name,
          courses: data.courses || [],
          generatedAt: new Date(),
          id: categoryId, // Use the unique ID
          cached: data.cached || false, // Flag to indicate if from cache
        };

        // Add new courses at the beginning (newest first)
        setGeneratedCourses((prev) => {
          const updated = [newGeneratedSet, ...prev];
          saveCoursesToStorage(updated);
          saveCoursesToDatabase(updated);
          return updated;
        });

        // Scroll to the newly added section after a brief delay to ensure DOM update
        setTimeout(() => {
          const newSection = document.getElementById(categoryId);
          if (newSection) {
            // Use smooth scrolling and ensure it's visible
            newSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "nearest",
            });
            // Additional offset for better visibility
            setTimeout(() => {
              window.scrollBy(0, -20);
            }, 300);
          }
        }, 200);

        toast.success(
          `${data.cached ? "Loaded" : "Generated"} ${data.courses?.length || 0} courses for ${category.name}`
        );
      } else if (response.status === 403) {
        const errorData = await response.json();
        toast.error(errorData.message || "Premium subscription required");
      } else {
        toast.error("Failed to generate category courses");
      }
    } catch (error) {
      console.error("Error generating category courses:", error);
      toast.error("Failed to generate category courses");
    } finally {
      setExploringCategory(null);
    }
  };

  const handleBookmark = async (itemId, type, itemData) => {
    try {
      const response = await apiClient.post("/api/library", {
        action: "bookmark",
        courseId: itemId,
        courseData: itemData,
      }, {
        headers: { "x-user-id": user?._id || user?.id || "" }
      });

      if (response.ok) {
        setBookmarkedItems((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(itemId)) {
            newSet.delete(itemId);
            toast.success("Removed from bookmarks");
          } else {
            newSet.add(itemId);
            toast.success("Added to bookmarks");
          }
          return newSet;
        });
      } else {
        toast.error("Failed to bookmark");
      }
    } catch (error) {
      console.error("Error bookmarking item:", error);
      toast.error("Failed to bookmark");
    }
  };

  const handleSeeMoreCategories = () => {
    setVisibleCategoriesCount((prev) =>
      Math.min(prev + 9, filteredCategories.length)
    );
  };

  const toggleSectionMinimized = (sectionId) => {
    setMinimizedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Explore Courses</h1>
          <p className="text-violet-100 text-lg">Discover categories and trending AI-generated courses tailored to your learning goals</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search courses, topics, categories..."
                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-base" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ val: selectedCategory, set: setSelectedCategory, opts: [{ v: '', l: 'All Categories' }, ...staticCategories.map(c => ({ v: c.name, l: c.name }))] },
              { val: selectedDifficulty, set: setSelectedDifficulty, opts: [{ v: '', l: 'All Levels' }, { v: 'beginner', l: 'Beginner' }, { v: 'intermediate', l: 'Intermediate' }, { v: 'advanced', l: 'Advanced' }] },
              { val: isPremium, set: setIsPremium, opts: [{ v: '', l: 'All Courses' }, { v: 'true', l: 'Premium' }, { v: 'false', l: 'Free' }] }].map((s, i) => (
                <select key={i} value={s.val} onChange={e => s.set(e.target.value)}
                  className="px-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                  {s.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Topics */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trending This Week</h2>
              <p className="text-sm text-slate-500">Hot topics gaining popularity</p>
            </div>
          </div>
          <button onClick={() => toggleSectionMinimized("trending-topics")} className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            {minimizedSections.has("trending-topics") ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>

        {!minimizedSections.has("trending-topics") && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />)}
              </div>
            ) : filteredTrendingTopics.length === 0 && searchQuery ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No trending topics match your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrendingTopics.map((topic, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 group cursor-pointer" onClick={() => handleGenerateCourse(topic)}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex-1 group-hover:text-violet-600 transition-colors">{topic.title}</h3>
                      <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${topic.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        topic.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>{topic.difficulty || 'Beginner'}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-2">{topic.description}</p>
                    {topic.whyTrending && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2 mb-4 flex items-center gap-1.5"><span className="text-base">🔥</span> {topic.whyTrending}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {topic.tags?.slice(0, 3).map((tag, j) => (
                        <span key={j} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg">{tag}</span>
                      ))}
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleGenerateCourse(topic); }}
                      disabled={generatingCourse === topic.title}
                      className={`w-full ${getButtonColorStyles()} disabled:opacity-50 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border-none`}>
                      {generatingCourse === topic.title ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate course</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Categories */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Browse by Category</h2>
              <p className="text-sm text-slate-500">Explore our diverse course categories</p>
            </div>
          </div>
          <button onClick={() => toggleSectionMinimized("categories")} className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            {minimizedSections.has("categories") ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>

        {!minimizedSections.has("categories") && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => <div key={i} className="h-56 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />)}
              </div>
            ) : filteredCategories.length === 0 && searchQuery ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No categories match your search</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCategories.slice(0, visibleCategoriesCount).map((category, i) => (
                    <div key={i} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden relative">
                      {!userIsPremium && (
                        <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><span className="text-xs">⭐</span> Premium</div>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center group-hover:from-violet-500 group-hover:to-purple-600 group-hover:scale-110 transition-all duration-300">
                          <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{category.name}</h3>
                          <p className="text-xs text-slate-500 font-medium">{category.count || 0} specializations</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mb-4 leading-relaxed">{category.description}</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {category.topics.slice(0, 4).map((topic, j) => (
                          <span key={j} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg">{topic}</span>
                        ))}
                        {category.topics.length > 4 && (
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs rounded-lg">+{category.topics.length - 4}</span>
                        )}
                      </div>
                      <button onClick={() => handleExploreCategory(category)} disabled={exploringCategory === category.name}
                        className={`w-full ${getButtonColorStyles()} py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border-none disabled:opacity-50`}>
                        {exploringCategory === category.name ? <><div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Exploring...</> : <><Sparkles className="w-4 h-4" /> Explore curriculum</>}
                      </button>
                    </div>
                  ))}
                </div>

                {visibleCategoriesCount < filteredCategories.length && (
                  <div className="text-center mt-8">
                    <button onClick={handleSeeMoreCategories}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-8 py-3 rounded-xl text-sm font-semibold hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-400 transition-all inline-flex items-center gap-2">
                      Show More ({filteredCategories.length - visibleCategoriesCount} remaining)
                    </button>
                  </div>
                )}

                {visibleCategoriesCount >= filteredCategories.length && filteredCategories.length > 9 && (
                  <div className="text-center mt-10">
                    <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-100 dark:border-violet-800 rounded-2xl p-8 inline-block max-w-md">
                      <Sparkles className="w-10 h-10 text-violet-500 mx-auto mb-4" />
                      <p className="text-violet-700 dark:text-violet-300 font-bold text-lg mb-2">Can't find what you're looking for?</p>
                      <p className="text-violet-500 text-sm mb-5">Generate a custom course with AI</p>
                      <button onClick={() => router.push("/dashboard?tab=generate")}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto transition-all hover:shadow-lg hover:shadow-violet-500/25">
                        <Sparkles className="w-4 h-4" /> Generate Custom Course
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Generated Courses */}
      <div id="generated-courses-section" className="mb-16">
        {exploringCategory && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {exploringCategory} Courses
                </h2>
                <p className="text-sm text-slate-500">Generating curriculum...</p>
              </div>
              <div className="ml-auto">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500 border-t-transparent"></div>
              </div>
            </div>

            {/* Fading Cards Loader */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 animate-pulse"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded flex-1 mr-4"></div>
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  </div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-6 w-3/4"></div>
                  <div className="flex items-center gap-4 text-sm mb-5">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  </div>
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {generatedCourses.map((generatedSet, setIndex) => (
          <div key={generatedSet.id} id={generatedSet.id} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {generatedSet.category} Courses
                  </h2>
                  <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium">
                    {generatedSet.cached ? "📦 From Cache" : "✨ Generated"} • {new Date(generatedSet.generatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => toggleSectionMinimized(generatedSet.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  title={
                    minimizedSections.has(generatedSet.id)
                      ? "Expand section"
                      : "Minimize section"
                  }
                >
                  {minimizedSections.has(generatedSet.id) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {!minimizedSections.has(generatedSet.id) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedSet.courses.map((course, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 relative group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex-1 group-hover:text-violet-600 transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${course.difficulty === "beginner"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : course.difficulty === "intermediate"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            }`}
                        >
                          {course.difficulty || "Beginner"}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{course.estimatedDuration || "6 weeks"}</span>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 mb-5">
                      {course.tags?.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateCourse(course);
                        }}
                        disabled={generatingCourse === course.title}
                        className={`w-full ${getButtonColorStyles()} py-3 px-4 rounded-xl transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none`}
                      >
                        {generatingCourse === course.title ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generate course</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrev}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-violet-300 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {Array.from(
            { length: Math.min(pagination.totalPages, 5) },
            (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[44px] h-11 px-4 rounded-xl text-sm font-semibold transition-all ${currentPage === page
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                    : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-400"
                    }`}
                >
                  {page}
                </button>
              );
            }
          )}

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, pagination.totalPages)
              )
            }
            disabled={!pagination.hasNext}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-violet-300 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      {showPremiumModal && selectedCategoryForModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/25">
                  <span className="text-3xl">⭐</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Unlock Premium {selectedCategoryForModal.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Get access to personalized course recommendations and 10+ curated courses tailored to your learning goals in the <strong className="text-slate-700 dark:text-slate-300">{selectedCategoryForModal.name}</strong> category.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPremiumModal(false);
                    setSelectedCategoryForModal(null);
                  }}
                  className="flex-1 px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowPremiumModal(false);
                    setSelectedCategoryForModal(null);
                    router.push("/pricing");
                  }}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Limit Reached Modal */}
      {showLimitModal && limitModalData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-500/25">
                  <Clock className="text-white w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Monthly Limit Reached
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-5">
                  You've used <strong className="text-orange-600 dark:text-orange-400">{limitModalData.used}</strong> out of <strong className="text-slate-700 dark:text-slate-300">{limitModalData.limit}</strong> free course generations this month.
                </p>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5 mb-5 text-left">
                  <p className="text-orange-700 dark:text-orange-300 font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Upgrade to Pro for unlimited generations!
                  </p>
                  <ul className="text-sm text-orange-600 dark:text-orange-400 space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500" /> 15 course generations per month</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500" /> Premium course content</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500" /> Advanced AI features</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500" /> Priority support</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLimitModal(false);
                    setLimitModalData(null);
                  }}
                  className="flex-1 px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowLimitModal(false);
                    setLimitModalData(null);
                    router.push("/pricing");
                  }}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
