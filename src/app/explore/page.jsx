import { BookOpen, Users, Clock, Star, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function ExplorePage() {
  const categories = [
    {
      name: "Programming",
      count: 45,
      topics: ["JavaScript", "Python", "React", "Node.js"],
    },
    {
      name: "Data Science",
      count: 28,
      topics: ["Machine Learning", "Statistics", "Python", "R"],
    },
    {
      name: "Design",
      count: 32,
      topics: ["UI/UX", "Figma", "Adobe Creative", "Design Systems"],
    },
    {
      name: "Business",
      count: 21,
      topics: ["Marketing", "Management", "Finance", "Strategy"],
    },
    {
      name: "Languages",
      count: 15,
      topics: ["Spanish", "French", "German", "Japanese"],
    },
    {
      name: "Science",
      count: 19,
      topics: ["Physics", "Chemistry", "Biology", "Mathematics"],
    },
  ]

  const trendingTopics = [
    {
      title: "Artificial Intelligence Fundamentals",
      students: 2340,
      rating: 4.8,
      duration: "6 weeks",
      level: "Beginner",
    },
    {
      title: "Full Stack Web Development",
      students: 1890,
      rating: 4.9,
      duration: "12 weeks",
      level: "Intermediate",
    },
    {
      title: "Data Analysis with Python",
      students: 1560,
      rating: 4.7,
      duration: "8 weeks",
      level: "Beginner",
    },
    {
      title: "Mobile App Development",
      students: 1230,
      rating: 4.6,
      duration: "10 weeks",
      level: "Intermediate",
    },
  ]

  const featuredPaths = [
    {
      title: "Become a Frontend Developer",
      description: "Master HTML, CSS, JavaScript, and modern frameworks",
      modules: 8,
      duration: "16 weeks",
      students: 3200,
    },
    {
      title: "Data Science Career Path",
      description: "Learn statistics, Python, machine learning, and data visualization",
      modules: 12,
      duration: "24 weeks",
      students: 2100,
    },
    {
      title: "Digital Marketing Mastery",
      description: "Complete guide to SEO, social media, and online advertising",
      modules: 6,
      duration: "12 weeks",
      students: 1800,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Explore Learning Paths</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Discover curated learning paths and trending topics across various fields
        </p>
      </div>

      {/* Categories */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Browse by Category</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{category.count} courses</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {category.topics.map((topic, topicIndex) => (
                  <span
                    key={topicIndex}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="mb-16">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trending This Week</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trendingTopics.map((topic, index) => (
            <Link
              key={index}
              href={`/learn/${encodeURIComponent(topic.title)}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">{topic.title}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    topic.level === "Beginner"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {topic.level}
                </span>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{topic.students.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{topic.rating}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{topic.duration}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Learning Paths */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Featured Learning Paths</h2>

        <div className="space-y-6">
          {featuredPaths.map((path, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{path.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{path.description}</p>

                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{path.modules} modules</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{path.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{path.students.toLocaleString()} students</span>
                    </div>
                  </div>
                </div>

                <Link href={`/learn/${encodeURIComponent(path.title)}`} className="btn-primary ml-6">
                  Start Learning
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
